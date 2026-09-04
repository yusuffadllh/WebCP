/**
 * Breakpoint bersama untuk hero 3D.
 *
 * Progress loading digerakkan DARI DALAM scene 3D (`setProgress` dipanggil di
 * `PhotoScene`), jadi `MainContainer` (yang me-mount scene) dan `LoadingProvider`
 * (yang menampilkan layar loading) WAJIB memakai predikat yang sama. Kalau beda,
 * layar loading bisa muncul tanpa ada yang menggerakkan angkanya — situs macet
 * di 0%. Simpan di satu tempat supaya tidak melenceng lagi.
 *
 * Sejak hero memakai plane foto (bukan model robot berat), scene di-mount di
 * SEMUA lebar termasuk Android. Yang berbeda per lebar hanya layout dan beban
 * render, bukan ada/tidaknya canvas.
 */

/** Layout hero desktop: canvas `position: fixed`, teks di kiri & kanan. */
export const HERO_DESKTOP_MIN_WIDTH = 1024;

/** Di bawah/sama dengan ini hero bertumpuk (foto + teks) dan canvas mengalir. */
export const HERO_MOBILE_MAX_WIDTH = 768;

/** Dipertahankan untuk kompatibilitas: sekarang selalu true. */
export const isCharacterViewport = () => true;

/** True kalau hero pakai layout desktop (sinkron dengan `min-width: 1025px`). */
export const isDesktopHero = () => window.innerWidth > HERO_DESKTOP_MIN_WIDTH;

/** True kalau hero bertumpuk (foto di atas teks) — sinkron `max-width: 1024px`. */
export const isStackedHero = () => window.innerWidth <= HERO_DESKTOP_MIN_WIDTH;

/** True kalau hero pakai layout mobile (sinkron dengan `max-width: 768px`). */
export const isMobileHero = () => window.innerWidth <= HERO_MOBILE_MAX_WIDTH;

/** Perangkat sentuh (jari, bukan mouse) — dipakai untuk durasi efek pointer. */
export const isCoarsePointer = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(pointer: coarse)").matches;
