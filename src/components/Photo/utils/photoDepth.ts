import * as THREE from "three";

/**
 * Pra-proses foto hero jadi dua tekstur:
 *
 *  1. `color` — foto yang latarnya sudah dipotong (transparan) dan sudah
 *     di-crop pas ke siluet subjek.
 *  2. `depth` — peta kedalaman abu-abu, 0 = jauh, 1 = dekat. Dipakai vertex
 *     shader untuk menggeser plane di sumbu Z, jadi foto 2D punya relief nyata
 *     dan ikut ber-parallax saat plane dimiringkan pointer / diputar timeline.
 *
 * Semua dihitung di CPU sekali saat load (~80 ms untuk 532x800), tanpa
 * dependensi baru dan tanpa model AI.
 */
export interface PhotoDepthMaps {
  color: THREE.Texture;
  depth: THREE.Texture;
  /** Aspek (w/h) hasil crop ke siluet — pakai ini, bukan aspek foto asli. */
  aspect: number;
  /** Rasio piksel yang terpotong sebagai latar (0..1). */
  keyedRatio: number;
  dispose: () => void;
}

/** Peta kedalaman dihitung di resolusi kecil: bentuknya low-frequency. */
const DEPTH_MAX_SIDE = 320;

/** Piksel dianggap backdrop kalau merahnya jauh melebihi hijau/biru. */
const RED_MIN = 120;
const RED_SPILL_HARD = 140;
const RED_SPILL_SOFT = 55;

/** Baris masih dianggap "ada backdrop" kalau segini bagiannya merah. */
const ROW_RED_MIN = 0.15;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const clampIndex = (v: number, max: number) => (v < 0 ? 0 : v > max ? max : v);

/**
 * Box blur separabel. Dipanggil berulang untuk meniru distance transform:
 * mask siluet yang di-blur berkali-kali menghasilkan "gundukan" halus yang
 * puncaknya ada di bagian badan paling lebar.
 */
const boxBlur = (
  src: Float32Array,
  w: number,
  h: number,
  radius: number
): Float32Array => {
  if (radius < 1) return src;

  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const norm = 1 / (radius * 2 + 1);

  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let i = -radius; i <= radius; i++) sum += src[row + clampIndex(i, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum * norm;
      sum -= src[row + clampIndex(x - radius, w - 1)];
      sum += src[row + clampIndex(x + radius + 1, w - 1)];
    }
  }

  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let i = -radius; i <= radius; i++) sum += tmp[clampIndex(i, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum * norm;
      sum -= tmp[clampIndex(y - radius, h - 1) * w + x];
      sum += tmp[clampIndex(y + radius + 1, h - 1) * w + x];
    }
  }

  return out;
};

/** Tekstur 1x1 abu-abu netral: dipakai kalau peta kedalaman tidak tersedia. */
export const createFlatDepthTexture = (): THREE.Texture => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
};

/**
 * Cari baris terakhir yang masih punya backdrop merah.
 *
 * Foto ini cuma ber-backdrop sampai ~66% tingginya; di bawah itu ada meja dan
 * lantai gelap. Warna gelap TIDAK bisa dipakai sebagai penanda latar, karena
 * wajah dan rambut subjeknya sendiri gelap (luminance 0.07 dan 0.12) — kalau
 * dipaksa, kepalanya yang malah terpotong. Jadi bagian bawah tidak di-key,
 * tapi langsung dipangkas: hasilnya potret setengah badan.
 */
const findBackdropBottom = (px: Uint8ClampedArray, w: number, h: number) => {
  const minCount = w * ROW_RED_MIN;
  let bottom = -1;

  for (let y = 0; y < h; y++) {
    let count = 0;
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      if (px[p] > RED_MIN && px[p] - Math.max(px[p + 1], px[p + 2]) > RED_SPILL_HARD) {
        count++;
      }
    }
    if (count > minCount) bottom = y;
  }

  if (bottom < 0) return -1;
  // Sisakan sedikit margin: baris peralihan ke meja bikin siluet melebar.
  return Math.max(0, bottom - Math.round(h * 0.02));
};

export const buildPhotoDepth = (
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap
): PhotoDepthMaps | null => {
  const w = source.width;
  const h = source.height;
  if (!w || !h) return null;

  const full = document.createElement("canvas");
  full.width = w;
  full.height = h;
  const fullCtx = full.getContext("2d", { willReadFrequently: true });
  if (!fullCtx) return null;

  fullCtx.drawImage(source, 0, 0);
  const image = fullCtx.getImageData(0, 0, w, h);
  const px = image.data;

  // 1) Tentukan sampai baris mana backdrop-nya ada.
  const bottom = findBackdropBottom(px, w, h);
  if (bottom < h * 0.25) return null;

  // 2) Chroma key merah di area ber-backdrop; sisanya dianggap latar penuh.
  const mask = new Float32Array(w * h);
  let keyed = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (y > bottom) {
        keyed++;
        continue;
      }
      const p = i * 4;
      const spill = px[p] - Math.max(px[p + 1], px[p + 2]);
      const background =
        px[p] > RED_MIN ? smoothstep(RED_SPILL_SOFT, RED_SPILL_HARD, spill) : 0;
      mask[i] = 1 - background;
      if (background > 0.5) keyed++;
    }
  }

  // Terlalu sedikit / terlalu banyak yang terpotong -> hasilnya tidak dipercaya.
  const keyedRatio = keyed / (w * h);
  if (keyedRatio < 0.1 || keyedRatio > 0.95) return null;

  // 2) Rapikan tepi: blur tipis lalu pertegas -> feather 1-2 px, bukan gerigi.
  //    Sekaligus catat bounding box siluet untuk crop di langkah berikutnya.
  const featherRadius = Math.max(1, Math.round(Math.min(w, h) * 0.004));
  const soft = boxBlur(mask, w, h, featherRadius);
  let minX = w;
  let maxX = -1;
  let minY = h;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const p = i * 4;
      const alpha = y > bottom ? 0 : smoothstep(0.42, 0.88, soft[i]);
      mask[i] = alpha;
      px[p + 3] = Math.round(alpha * 255);

      if (alpha > 0.5) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }

      // Despill: buang sisa pantulan merah backdrop di pinggiran subjek.
      if (alpha < 0.995) {
        const cap = Math.max(px[p + 1], px[p + 2]) + 14;
        if (px[p] > cap) px[p] = cap;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) return null;
  fullCtx.putImageData(image, 0, 0);

  // 3) Crop ke siluet + sedikit padding, supaya subjek mengisi plane dan tidak
  //    ada area transparan luas yang bikin fotonya terlihat kecil.
  const padX = Math.round((maxX - minX) * 0.05);
  const padY = Math.round((maxY - minY) * 0.04);
  const cx = Math.max(0, minX - padX);
  const cy = Math.max(0, minY - padY);
  const cw = Math.min(w, maxX + padX + 1) - cx;
  const ch = Math.min(h, maxY + padY + 1) - cy;

  const cropped = document.createElement("canvas");
  cropped.width = cw;
  cropped.height = ch;
  const cropCtx = cropped.getContext("2d");
  if (!cropCtx) return null;
  cropCtx.drawImage(full, cx, cy, cw, ch, 0, 0, cw, ch);

  // 4) Turunkan resolusi untuk perhitungan kedalaman.
  const scale = Math.min(1, DEPTH_MAX_SIDE / Math.max(cw, ch));
  const dw = Math.max(8, Math.round(cw * scale));
  const dh = Math.max(8, Math.round(ch * scale));

  const small = document.createElement("canvas");
  small.width = dw;
  small.height = dh;
  const smallCtx = small.getContext("2d", { willReadFrequently: true });
  if (!smallCtx) return null;
  smallCtx.drawImage(cropped, 0, 0, dw, dh);
  const smallPx = smallCtx.getImageData(0, 0, dw, dh).data;

  const smallMask = new Float32Array(dw * dh);
  const lum = new Float32Array(dw * dh);
  let lumMin = 1;
  let lumMax = 0;
  for (let i = 0, p = 0; i < smallMask.length; i++, p += 4) {
    const alpha = smallPx[p + 3] / 255;
    smallMask[i] = alpha;
    if (alpha > 0.5) {
      const l =
        (0.299 * smallPx[p] + 0.587 * smallPx[p + 1] + 0.114 * smallPx[p + 2]) /
        255;
      lum[i] = l;
      if (l < lumMin) lumMin = l;
      if (l > lumMax) lumMax = l;
    }
  }

  const lumSpan = Math.max(1e-4, lumMax - lumMin);
  for (let i = 0; i < lum.length; i++) {
    lum[i] = smallMask[i] > 0.5 ? clamp01((lum[i] - lumMin) / lumSpan) : 0;
  }

  // 5) "Gundukan" badan: mask siluet di-blur bertahap (mirip distance transform).
  const bodyRadius = Math.max(2, Math.round(Math.min(dw, dh) * 0.07));
  let field = boxBlur(smallMask, dw, dh, bodyRadius);
  field = boxBlur(field, dw, dh, bodyRadius);
  field = boxBlur(field, dw, dh, Math.max(1, Math.round(bodyRadius * 0.5)));

  // Detail wajah/lipatan kain: terang = lebih dekat ke kamera.
  const shade = boxBlur(lum, dw, dh, Math.max(1, Math.round(bodyRadius * 0.3)));

  const raw = new Float32Array(dw * dh);
  for (let i = 0; i < raw.length; i++) {
    const core = Math.pow(clamp01(field[i] * 1.4), 0.75);
    raw[i] = core * (0.5 + 0.5 * shade[i]);
  }

  const depth = boxBlur(raw, dw, dh, 2);
  let depthMin = 1;
  let depthMax = 0;
  for (let i = 0; i < depth.length; i++) {
    if (smallMask[i] <= 0.5) continue;
    if (depth[i] < depthMin) depthMin = depth[i];
    if (depth[i] > depthMax) depthMax = depth[i];
  }
  const depthSpan = Math.max(1e-4, depthMax - depthMin);

  const depthCanvas = document.createElement("canvas");
  depthCanvas.width = dw;
  depthCanvas.height = dh;
  const depthCtx = depthCanvas.getContext("2d");
  if (!depthCtx) return null;
  const depthImage = depthCtx.createImageData(dw, dh);
  for (let i = 0, p = 0; i < depth.length; i++, p += 4) {
    // Piksel latar dipaksa 0 supaya tepi plane tidak ikut tertarik ke depan.
    const v =
      smallMask[i] <= 0.02
        ? 0
        : Math.round(clamp01((depth[i] - depthMin) / depthSpan) * 255);
    depthImage.data[p] = v;
    depthImage.data[p + 1] = v;
    depthImage.data[p + 2] = v;
    depthImage.data[p + 3] = 255;
  }
  depthCtx.putImageData(depthImage, 0, 0);

  const color = new THREE.CanvasTexture(cropped);
  color.colorSpace = THREE.SRGBColorSpace;
  color.needsUpdate = true;

  const depthTexture = new THREE.CanvasTexture(depthCanvas);
  depthTexture.colorSpace = THREE.NoColorSpace;
  depthTexture.minFilter = THREE.LinearFilter;
  depthTexture.magFilter = THREE.LinearFilter;
  depthTexture.generateMipmaps = false;
  depthTexture.wrapS = THREE.ClampToEdgeWrapping;
  depthTexture.wrapT = THREE.ClampToEdgeWrapping;
  depthTexture.needsUpdate = true;

  return {
    color,
    depth: depthTexture,
    aspect: cw / ch,
    keyedRatio,
    dispose: () => {
      color.dispose();
      depthTexture.dispose();
    },
  };
};
