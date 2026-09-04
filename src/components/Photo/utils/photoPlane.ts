import * as THREE from "three";
import {
  fragmentShader,
  vertexShader,
  type PhotoUniforms,
} from "./photoShader";
import {
  buildPhotoDepth,
  createFlatDepthTexture,
  type PhotoDepthMaps,
} from "./photoDepth";

/**
 * Kandidat file foto hero, dicoba berurutan sampai ada yang berhasil.
 * Cukup drop SATU file bernama `profile.<ext>` di folder `public/images/`.
 */
export const PHOTO_SOURCES = [
  "/images/profile.png",
  "/images/profile.jpg",
  "/images/profile.jpeg",
  "/images/profile.webp",
] as const;

export interface PhotoPlane {
  /**
   * Node teratas. Ini yang di-`scene.add` dan yang dianimasikan timeline scroll
   * (rotasi + skala), skala dasarnya selalu 1 supaya tween GSAP bersifat relatif.
   */
  root: THREE.Group;
  /** Node tengah: khusus kemiringan mengikuti pointer/sentuhan. */
  tilt: THREE.Group;
  /** Plane fotonya sendiri; skalanya dipakai untuk ukuran dunia (lihat `fit`). */
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  uniforms: PhotoUniforms;
  /** Aspek gambar (w/h) hasil load. */
  imageAspect: number;
  /** true kalau relief 3D (chroma key + peta kedalaman) berhasil dibangun. */
  hasDepth: boolean;
  /** Sesuaikan ukuran plane dengan ukuran container. */
  fit: (containerWidth: number, containerHeight: number) => void;
  /** Pindah antara layout bertumpuk (≤1024px) dan desktop. */
  setStacked: (stacked: boolean) => void;
  dispose: () => void;
}

/** Kamera hero: fov kecil supaya distorsi perspektif foto minim. */
export const PHOTO_CAMERA = { fov: 30, distance: 6 };

/** Tinggi dunia yang terlihat kamera pada z = 0. */
export const visibleHeightAtOrigin = () =>
  2 * Math.tan((PHOTO_CAMERA.fov * Math.PI) / 360) * PHOTO_CAMERA.distance;

/**
 * Placeholder kalau foto belum ada: gradien aksen + inisial.
 * Dipakai supaya hero tidak pernah kosong walau file foto belum di-drop.
 */
const createFallbackTexture = (initials: string): THREE.Texture => {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = Math.round(size * 1.25);
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#c2a4ff");
    grad.addColorStop(0.55, "#7f40ff");
    grad.addColorStop(1, "#2b1a4a");

    const r = size * 0.09;
    const w = canvas.width;
    const h = canvas.height;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = "rgba(11, 8, 12, 0.85)";
    ctx.font = `600 ${size * 0.34}px Geist, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, w / 2, h / 2);

    ctx.fillStyle = "rgba(11, 8, 12, 0.6)";
    ctx.font = `400 ${size * 0.045}px Arial, sans-serif`;
    ctx.fillText("public/images/profile.png", w / 2, h * 0.72);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

/**
 * Coba tiap kandidat `sources` berurutan; kalau semua gagal pakai placeholder.
 * Tidak pernah reject supaya hero selalu tampil.
 */
export const loadPhotoTexture = (
  sources: readonly string[],
  initials: string
): Promise<THREE.Texture> => {
  const loader = new THREE.TextureLoader();

  const tryLoad = (index: number): Promise<THREE.Texture> => {
    const src = sources[index];

    if (!src) {
      console.warn(
        `[hero] Foto profil belum ada. Taruh file di "public${
          sources[0] ?? "/images/profile.png"
        }" (boleh juga .jpg/.jpeg/.webp) untuk mengganti placeholder.`
      );
      return Promise.resolve(createFallbackTexture(initials));
    }

    return new Promise<THREE.Texture>((resolve, reject) => {
      loader.load(src, resolve, undefined, () => reject(new Error(src)));
    })
      .then((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      })
      .catch(() => tryLoad(index + 1));
  };

  return tryLoad(0);
};

export const createPhotoPlane = (
  texture: THREE.Texture,
  options: { stacked: boolean; lowPower: boolean; accent?: string }
): PhotoPlane => {
  const image = texture.image as { width?: number; height?: number } | undefined;

  // Coba bangun relief 3D dari fotonya sendiri (potong latar + peta kedalaman).
  // Kalau gagal (misal tekstur placeholder canvas), plane tetap jalan rata.
  let depthMaps: PhotoDepthMaps | null = null;
  try {
    const src = texture.image as HTMLImageElement | HTMLCanvasElement | undefined;
    if (src && (src as HTMLImageElement).width) {
      depthMaps = buildPhotoDepth(src);
    }
  } catch (error) {
    console.warn("[hero] Gagal menghitung relief foto, dipakai mode rata.", error);
    depthMaps = null;
  }

  const hasDepth = depthMaps !== null;
  const fallbackDepth = hasDepth ? null : createFlatDepthTexture();
  const colorTexture = depthMaps ? depthMaps.color : texture;
  const depthTexture = depthMaps
    ? depthMaps.depth
    : (fallbackDepth as THREE.Texture);
  const depthSide = depthMaps ? depthMaps.depth.image.width : 1;

  // Aspek diambil dari hasil crop siluet supaya plane tidak menyisakan area
  // transparan lebar di kiri/kanan.
  const imageAspect =
    depthMaps?.aspect ??
    (image?.width && image?.height ? image.width / image.height : 0.8);

  // Relief butuh tesselasi lebih padat daripada plane rata.
  const segments = options.lowPower ? 96 : 168;
  const geometry = new THREE.PlaneGeometry(1, 1, segments, segments);

  const uniforms: PhotoUniforms = {
    uTexture: { value: colorTexture },
    uDepth: { value: depthTexture },
    uDepthScale: { value: hasDepth ? (options.lowPower ? 0.34 : 0.46) : 0 },
    uHasDepth: { value: hasDepth ? 1 : 0 },
    uDepthTexel: { value: 1 / Math.max(8, depthSide) },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uHover: { value: 0 },
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uFade: { value: 0 },
    uReveal: { value: 0 },
    uMotion: { value: 1 },
    uAberration: { value: options.lowPower ? 0.5 : 1 },
    uCurve: { value: options.lowPower ? 0.6 : 1 },
    uAccent: {
      value: new THREE.Color(options.accent ?? "#c2a4ff").convertSRGBToLinear(),
    },
    uPlaneAspect: { value: imageAspect },
  };

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);

  // Hierarki bertingkat supaya dua sumber animasi tidak saling menimpa:
  //   root  -> timeline scroll (rotasi & skala, baseline 1)
  //   tilt  -> kemiringan mengikuti pointer (render loop)
  //   mesh  -> ukuran dunia hasil fit()
  const tilt = new THREE.Group();
  tilt.add(mesh);
  const root = new THREE.Group();
  root.add(tilt);

  let stacked = options.stacked;
  let lastSize = { width: 1, height: 1 };

  const fit = (containerWidth: number, containerHeight: number) => {
    lastSize = { width: containerWidth, height: containerHeight };
    const containerAspect = containerWidth / Math.max(containerHeight, 1);
    const visibleHeight = visibleHeightAtOrigin();
    const visibleWidth = visibleHeight * containerAspect;

    // Layout bertumpuk: containernya sudah dibatasi tingginya oleh CSS, jadi foto
    // boleh mengisi hampir penuh. Desktop: canvas selebar layar, batasi lebarnya.
    const heightRatio = stacked ? 0.9 : 0.92;
    const widthRatio = stacked ? 0.92 : 0.46;

    let height = visibleHeight * heightRatio;
    let width = height * imageAspect;

    const maxWidth = visibleWidth * widthRatio;
    if (width > maxWidth) {
      width = maxWidth;
      height = width / imageAspect;
    }

    mesh.scale.set(width, height, 1);
    root.position.y = stacked ? -visibleHeight * 0.02 : 0;
    uniforms.uPlaneAspect.value = width / height;
  };

  fit(1, 1);

  return {
    root,
    tilt,
    mesh,
    uniforms,
    imageAspect,
    hasDepth,
    fit,
    setStacked: (next: boolean) => {
      if (next === stacked) return;
      stacked = next;
      fit(lastSize.width, lastSize.height);
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
      depthMaps?.dispose();
      fallbackDepth?.dispose();
    },
  };
};
