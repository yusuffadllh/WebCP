/**
 * Pelacak pointer terpadu (mouse + touch + pen) untuk hero foto.
 *
 * Sengaja memakai Pointer Events, bukan mousemove/touchmove terpisah seperti
 * versi robot lama: satu jalur kode yang sama jalan di desktop dan Android,
 * dan tidak perlu debounce 200 ms yang dulu bikin sentuhan pertama telat.
 */
export interface PointerTarget {
  /** Target posisi di ruang lokal plane (-1..1). */
  x: number;
  y: number;
  /** 0..1 target keaktifan interaksi. */
  active: number;
}

export interface PointerTracker {
  target: PointerTarget;
  detach: () => void;
}

interface Options {
  /** Elemen yang menerima event (biasanya #landingDiv). */
  hitArea: HTMLElement;
  /** Ubah koordinat viewport jadi koordinat lokal plane (-1..1). */
  toLocal: (clientX: number, clientY: number) => { x: number; y: number };
  /** Berapa lama (ms) efek tetap aktif setelah jari diangkat. */
  releaseDelay?: number;
}

export const createPointerTracker = ({
  hitArea,
  toLocal,
  releaseDelay = 900,
}: Options): PointerTracker => {
  const target: PointerTarget = { x: 0, y: 0, active: 0 };
  let releaseTimer: number | undefined;

  const setFrom = (clientX: number, clientY: number) => {
    const local = toLocal(clientX, clientY);
    target.x = local.x;
    target.y = local.y;
  };

  const onPointerMove = (event: PointerEvent) => {
    setFrom(event.clientX, event.clientY);
    if (event.pointerType === "mouse") {
      target.active = 1;
      return;
    }
    // Sentuhan: aktif selama jari menempel, lalu mereda sendiri.
    window.clearTimeout(releaseTimer);
    target.active = 1;
  };

  const onPointerDown = (event: PointerEvent) => {
    window.clearTimeout(releaseTimer);
    setFrom(event.clientX, event.clientY);
    target.active = 1;
  };

  const release = () => {
    window.clearTimeout(releaseTimer);
    releaseTimer = window.setTimeout(() => {
      target.active = 0;
      target.x = 0;
      target.y = 0;
    }, releaseDelay);
  };

  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === "mouse") {
      target.active = 0;
      target.x = 0;
      target.y = 0;
      return;
    }
    release();
  };

  // `passive` supaya scroll di Android tetap mulus (kita tidak preventDefault).
  const moveOptions: AddEventListenerOptions = { passive: true };

  hitArea.addEventListener("pointermove", onPointerMove, moveOptions);
  hitArea.addEventListener("pointerdown", onPointerDown, moveOptions);
  hitArea.addEventListener("pointerup", onPointerLeave, moveOptions);
  hitArea.addEventListener("pointercancel", onPointerLeave, moveOptions);
  hitArea.addEventListener("pointerleave", onPointerLeave, moveOptions);

  return {
    target,
    detach: () => {
      window.clearTimeout(releaseTimer);
      hitArea.removeEventListener("pointermove", onPointerMove);
      hitArea.removeEventListener("pointerdown", onPointerDown);
      hitArea.removeEventListener("pointerup", onPointerLeave);
      hitArea.removeEventListener("pointercancel", onPointerLeave);
      hitArea.removeEventListener("pointerleave", onPointerLeave);
    },
  };
};

/** Hormati `prefers-reduced-motion` milik OS/browser. */
export const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
