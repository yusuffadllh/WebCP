import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type * as THREE from "three";
import type { PhotoUniforms } from "./photoShader";
import { setAllTimeline } from "../../utils/GsapScroll";

gsap.registerPlugin(ScrollTrigger);

export const PHOTO_TIMELINE_DESKTOP_MIN_WIDTH = 1024;

interface PhotoTimelineArgs {
  /**
   * Node root plane foto. Skala dasarnya 1 (ukuran sebenarnya ada di mesh anak),
   * jadi tween skala di sini aman dan tidak menimpa hasil `fit()`.
   */
  root: THREE.Object3D;
  uniforms: PhotoUniforms;
}

/**
 * Timeline scroll untuk hero foto.
 *
 * Beda dengan versi robot lama, mobile TIDAK di-skip: di layar kecil canvas ikut
 * mengalir bersama halaman, jadi kita cukup menggerakkan uniform shader (murah
 * di GPU) dan tetap memunculkan `.what-box-in`.
 */
export function setPhotoTimeline({ root, uniforms }: PhotoTimelineArgs) {
  const isDesktop = window.innerWidth > PHOTO_TIMELINE_DESKTOP_MIN_WIDTH;

  if (!isDesktop) {
    // Desaturasi ringan saat hero digeser ke atas.
    gsap.timeline({
      scrollTrigger: {
        trigger: ".landing-section",
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      },
    })
      .fromTo(uniforms.uScroll, { value: 0 }, { value: 1, duration: 1 }, 0)
      .to(".landing-container", { opacity: 0.15, duration: 1 }, 0);

    gsap
      .timeline({
        scrollTrigger: {
          trigger: ".what-box-in",
          start: "top 70%",
          end: "bottom top",
        },
      })
      .to(".what-box-in", { display: "flex", duration: 0.1, delay: 0 }, 0);

    return;
  }

  const tl1 = gsap.timeline({
    scrollTrigger: {
      trigger: ".landing-section",
      start: "top top",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  const tl2 = gsap.timeline({
    scrollTrigger: {
      trigger: ".about-section",
      start: "center 55%",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  const tl3 = gsap.timeline({
    scrollTrigger: {
      trigger: ".whatIDO",
      start: "top top",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  tl1
    .fromTo(root.rotation, { y: 0 }, { y: -0.28, duration: 1 }, 0)
    .fromTo(".character-model", { x: 0 }, { x: "-16%", duration: 1 }, 0)
    .to(".landing-container", { opacity: 0, duration: 0.4 }, 0)
    .to(".landing-container", { y: "40%", duration: 0.8 }, 0)
    .fromTo(".about-me", { y: "-50%" }, { y: "0%" }, 0);

  tl2
    .to(".about-section", { y: "30%", duration: 6 }, 0)
    .to(".about-section", { opacity: 0, delay: 3, duration: 2 }, 0)
    .fromTo(
      ".character-model",
      { pointerEvents: "inherit" },
      { pointerEvents: "none", x: "-8%", delay: 2, duration: 5 },
      0
    )
    .to(uniforms.uScroll, { value: 1, duration: 5, delay: 1 }, 0)
    .to(root.rotation, { y: -0.5, x: 0.08, delay: 3, duration: 3 }, 0)
    .to(root.scale, { x: 0.82, y: 0.82, delay: 2, duration: 4 }, 0)
    .fromTo(
      ".what-box-in",
      { display: "none" },
      { display: "flex", duration: 0.1, delay: 6 },
      0
    )
    .fromTo(
      ".character-rim",
      { opacity: 1, scaleX: 1.4 },
      { opacity: 0, scale: 0, y: "-70%", duration: 5, delay: 2 },
      0.3
    );

  tl3
    .fromTo(
      ".character-model",
      { y: "0%" },
      { y: "-100%", duration: 4, ease: "none", delay: 1 },
      0
    )
    .fromTo(".whatIDO", { y: 0 }, { y: "15%", duration: 2 }, 0)
    .to(uniforms.uFade, { value: 1, duration: 2, delay: 1 }, 0);
}

/** Bangun ulang semua timeline (dipakai setelah resize yang mengubah layout). */
export function rebuildPhotoTimelines(args: PhotoTimelineArgs) {
  const workTrigger = ScrollTrigger.getById("work");
  ScrollTrigger.getAll().forEach((trigger) => {
    if (trigger !== workTrigger) trigger.kill();
  });
  setPhotoTimeline(args);
  setAllTimeline();
}
