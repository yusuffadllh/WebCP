import type * as THREE from "three";

/**
 * Uniform untuk plane foto hero.
 *
 * Catatan color management: material ini ShaderMaterial murni, jadi three TIDAK
 * menyuntikkan `tonemapping_fragment` / `colorspace_fragment`. Tekstur di-mark
 * `SRGBColorSpace` (GPU decode ke linear saat sampling), semua perhitungan
 * dilakukan di ruang linear, lalu di akhir kita encode sendiri ke sRGB via
 * `toSRGB()`. Renderer dipakai dengan `NoToneMapping` supaya foto tidak pucat.
 */
export interface PhotoUniforms {
  /** Tekstur foto (latar sudah dikunci jadi transparan bila memungkinkan). */
  uTexture: { value: THREE.Texture };
  /** Peta kedalaman abu-abu: 0 = jauh, 1 = dekat. */
  uDepth: { value: THREE.Texture };
  /** Amplitudo pergeseran Z dari peta kedalaman (satuan dunia). */
  uDepthScale: { value: number };
  /** 1 kalau peta kedalaman valid, 0 kalau foto dipakai rata. */
  uHasDepth: { value: number };
  /** Ukuran satu texel peta kedalaman, untuk hitung normal. */
  uDepthTexel: { value: number };
  /** Posisi pointer di ruang lokal plane (-1..1 di tepi foto). */
  uPointer: { value: THREE.Vector2 };
  /** 0..1, seberapa aktif interaksi pointer/sentuhan. */
  uHover: { value: number };
  /** Waktu berjalan (detik). */
  uTime: { value: number };
  /** 0..1, progres scroll menjauh dari hero (desaturasi + distorsi). */
  uScroll: { value: number };
  /** 0..1, fade-out terpisah dari uScroll supaya timeline tidak saling rebut. */
  uFade: { value: number };
  /** 0..1, reveal awal setelah layar loading selesai. */
  uReveal: { value: number };
  /** 0 kalau user minta reduced motion. */
  uMotion: { value: number };
  /** Kekuatan chromatic aberration. */
  uAberration: { value: number };
  /** Lengkung silinder plane (0 = rata). Bikin tilt terasa 3D. */
  uCurve: { value: number };
  /** Warna aksen (linear). */
  uAccent: { value: THREE.Color };
  /** width / height plane, untuk mengoreksi bentuk ripple. */
  uPlaneAspect: { value: number };
}

export const vertexShader = /* glsl */ `
uniform sampler2D uDepth;
uniform float uDepthScale;
uniform float uHasDepth;
uniform float uDepthTexel;
uniform vec2 uPointer;
uniform float uHover;
uniform float uTime;
uniform float uMotion;
uniform float uScroll;
uniform float uCurve;
uniform float uPlaneAspect;

varying vec2 vUv;
varying float vBulge;
varying float vDepth;
varying vec3 vRelief;

void main() {
  vUv = uv;

  vec3 pos = position;
  vec2 p = pos.xy * 2.0;

  // --- Relief dari peta kedalaman -------------------------------------------
  // Ini yang mengubah foto rata jadi "patung": tiap vertex digeser di Z sesuai
  // kedalaman, jadi kepala/badan benar-benar menonjol dan ikut ber-parallax
  // saat plane dimiringkan pointer atau diputar timeline scroll.
  float depth = texture2D(uDepth, uv).r;
  vDepth = depth;

  // Normal permukaan dari gradien kedalaman, dipakai fragment untuk pencahayaan.
  float dl = texture2D(uDepth, uv - vec2(uDepthTexel, 0.0)).r;
  float dr = texture2D(uDepth, uv + vec2(uDepthTexel, 0.0)).r;
  float dd = texture2D(uDepth, uv - vec2(0.0, uDepthTexel)).r;
  float du = texture2D(uDepth, uv + vec2(0.0, uDepthTexel)).r;
  vRelief = normalize(vec3((dl - dr) * 3.0, (dd - du) * 3.0, 0.55));

  pos.z += (depth - 0.5) * uDepthScale * uHasDepth;

  // Koreksi aspek supaya "gelembung" tetap bulat di layar, bukan lonjong.
  vec2 fix = vec2(uPlaneAspect, 1.0);
  float d = distance(p * fix, uPointer * fix);

  float bulge = exp(-d * d * 2.5) * uHover;
  float wave = sin(p.y * 5.0 - uTime * 1.1) * cos(p.x * 3.0 + uTime * 0.7);

  // Lengkung silinder halus: tepi kiri/kanan sedikit menjauh dari kamera, jadi
  // waktu plane dimiringkan hasilnya terasa punya volume (bukan kertas rata).
  // Kalau relief asli sudah aktif, lengkung palsu ini dikecilkan.
  pos.z -= p.x * p.x * 0.055 * uCurve * (1.0 - uHasDepth * 0.7);

  pos.z += bulge * 0.14;
  pos.z += wave * 0.012 * uMotion;
  pos.z -= uScroll * 0.22 * (1.0 - abs(p.y));

  vBulge = bulge;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
uniform sampler2D uTexture;
uniform float uHasDepth;
uniform vec2 uPointer;
uniform float uHover;
uniform float uTime;
uniform float uScroll;
uniform float uFade;
uniform float uReveal;
uniform float uMotion;
uniform float uAberration;
uniform vec3 uAccent;
uniform float uPlaneAspect;

varying vec2 vUv;
varying float vBulge;
varying float vDepth;
varying vec3 vRelief;

vec3 toSRGB(vec3 c) {
  return mix(
    pow(c, vec3(0.41666)) * 1.055 - vec3(0.055),
    c * 12.92,
    vec3(lessThanEqual(c, vec3(0.0031308)))
  );
}

void main() {
  vec2 st = vUv;
  vec2 p = (st - 0.5) * 2.0;

  vec2 toPointer = p - uPointer;
  vec2 fix = vec2(uPlaneAspect, 1.0);
  float d = length(toPointer * fix);
  vec2 dir = normalize(toPointer + vec2(0.0001));

  float ring = exp(-d * d * 2.5);
  float ripple = sin(d * 14.0 - uTime * 3.0) * ring * uHover * uMotion;

  // Geser UV: sedikit tertarik ke arah pointer + riak.
  vec2 offset = dir * (ripple * 0.02 + ring * uHover * 0.012);
  offset.x += sin(st.y * 8.0 + uTime * 0.6) * 0.005 * uScroll * uMotion;

  // Chromatic aberration: kuat di tepi riak dan saat di-scroll.
  float ab = uAberration * (0.25 + ring * uHover + uScroll * 0.6);
  vec2 shift = dir * 0.006 * ab;

  vec4 texR = texture2D(uTexture, st + offset + shift);
  vec4 texG = texture2D(uTexture, st + offset);
  vec4 texB = texture2D(uTexture, st + offset - shift);

  vec3 color = vec3(texR.r, texG.g, texB.b);
  float alpha = max(max(texR.a, texG.a), texB.a);

  // --- Pencahayaan relief ----------------------------------------------------
  // Lampu kunci mengikuti pointer: karena normal berasal dari peta kedalaman,
  // hasilnya kepala & badan tersorot terpisah dari latar -> terbaca sebagai
  // objek 3D, bukan foto yang dimiringkan.
  if (uHasDepth > 0.5) {
    vec3 lightDir = normalize(vec3(uPointer * vec2(0.9, 0.7), 1.25));
    float diffuse = clamp(dot(vRelief, lightDir), 0.0, 1.0);
    float ambient = 0.72 + vDepth * 0.16;
    color *= ambient + diffuse * (0.24 + uHover * 0.22);

    // Rim aksen di sisi yang menghadap menjauh dari lampu.
    float relief = pow(1.0 - clamp(vRelief.z, 0.0, 1.0), 1.6);
    color += uAccent * relief * (0.16 + uHover * 0.2);
  }

  // Rim aksen di puncak gelembung + tepi riak.
  float rim = smoothstep(0.35, 1.0, vBulge) + abs(ripple) * 1.4;
  color += uAccent * rim * 0.35;

  // Saat di-scroll: perlahan jadi monokrom & lebih gelap (mundur ke background).
  float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(color, vec3(lum) * 0.85, uScroll * 0.55);
  color *= 1.0 - uScroll * 0.25;

  // Mask tepi + fade bawah supaya foto menyatu dengan background gelap.
  // Kalau latar sudah dipotong (punya alpha sendiri), feather-nya dikecilkan
  // supaya siluet tidak ikut termakan.
  float feather = mix(0.06, 0.012, uHasDepth);
  float bottomFade = mix(0.22, 0.1, uHasDepth);
  float edge = smoothstep(0.0, feather, st.x)
             * smoothstep(0.0, feather, 1.0 - st.x)
             * smoothstep(0.0, feather, 1.0 - st.y);
  alpha *= edge * smoothstep(0.0, bottomFade, st.y);

  // Reveal: wipe naik dari bawah saat pertama kali muncul.
  alpha *= smoothstep(0.0, 0.55, uReveal * 1.45 - (1.0 - st.y) * 0.45);
  alpha *= (1.0 - uScroll * 0.35) * (1.0 - uFade);

  if (alpha <= 0.002) discard;

  gl_FragColor = vec4(toSRGB(clamp(color, 0.0, 1.0)), alpha);
}
`;
