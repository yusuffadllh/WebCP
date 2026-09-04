import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useLoading } from "../../context/LoadingProvider";
import { setProgress } from "../Loading";
import { setAllTimeline } from "../utils/GsapScroll";
import {
  createPhotoPlane,
  loadPhotoTexture,
  PHOTO_CAMERA,
  PHOTO_SOURCES,
  visibleHeightAtOrigin,
  type PhotoPlane,
} from "./utils/photoPlane";
import {
  createPointerTracker,
  prefersReducedMotion,
} from "./utils/pointerUtils";
import { rebuildPhotoTimelines, setPhotoTimeline } from "./utils/photoTimeline";
import {
  isCoarsePointer,
  isMobileHero,
  isStackedHero,
} from "../../utils/breakpoints";
import { config } from "../../config";
import "./styles/PhotoScene.css";

const getInitials = () =>
  config.developer.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "YF";

const PhotoScene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const { setLoading } = useLoading();

  useEffect(() => {
    const mountEl = canvasDiv.current;
    if (!mountEl) return;

    const scene = new THREE.Scene();
    const reducedMotion = prefersReducedMotion();
    const lowPower = isMobileHero() || isCoarsePointer();
    let stacked = isStackedHero();

    let rect = mountEl.getBoundingClientRect();
    let container = {
      width: Math.max(rect.width, 1),
      height: Math.max(rect.height, 1),
    };

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio < 2,
      powerPreference: lowPower ? "default" : "high-performance",
    });
    renderer.setSize(container.width, container.height);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2)
    );
    // ShaderMaterial di photoShader.ts sudah encode sRGB sendiri, jadi jangan
    // biarkan renderer tone-map ulang (bikin foto pucat).
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.domElement.classList.add("hero-photo-canvas");
    mountEl.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(
      PHOTO_CAMERA.fov,
      container.width / container.height,
      0.1,
      100
    );
    camera.position.set(0, 0, PHOTO_CAMERA.distance);

    // `disposed` dibaca di dalam callback progress supaya tidak ada setState
    // setelah unmount (React StrictMode me-mount efek dua kali di dev).
    let disposed = false;
    const progress = setProgress((value) => {
      if (!disposed) setLoading(value);
    });

    let photo: PhotoPlane | null = null;
    let frameId = 0;
    let resizeTimer: number | undefined;
    let revealTimer: number | undefined;
    let lastWidth = container.width;
    // Dua kondisi terpisah: hero masuk viewport, dan tab sedang aktif. Kalau
    // digabung jadi satu flag, render bisa mati permanen begitu tab pernah
    // di-background (visibilitychange tidak punya "pasangan" IntersectionObserver).
    let inView = true;
    let tabActive = !document.hidden;

    const clock = new THREE.Clock();
    const pointer = { x: 0, y: 0, hover: 0 };
    // Batas kemiringan foto (radian). Meniru rotasi kepala robot lama yang
    // dibatasi PI/6, tapi lebih halus karena yang berputar seluruh bidang foto.
    const MAX_TILT_Y = Math.PI / 14;
    const MAX_TILT_X = Math.PI / 20;

    /** Koordinat viewport -> koordinat lokal plane (-1..1). */
    const toLocal = (clientX: number, clientY: number) => {
      const box = mountEl.getBoundingClientRect();
      const ndcX = ((clientX - box.left) / Math.max(box.width, 1)) * 2 - 1;
      const ndcY = -((clientY - box.top) / Math.max(box.height, 1)) * 2 + 1;

      const visibleHeight = visibleHeightAtOrigin();
      const worldX = ndcX * (visibleHeight / 2) * camera.aspect;
      const worldY = ndcY * (visibleHeight / 2);

      if (!photo) return { x: ndcX, y: ndcY };

      const { scale, position } = photo.mesh;
      return {
        x: (worldX - position.x) / Math.max(scale.x / 2, 0.0001),
        y: (worldY - position.y) / Math.max(scale.y / 2, 0.0001),
      };
    };

    const tracker = createPointerTracker({
      hitArea:
        (document.getElementById("landingDiv") as HTMLElement | null) ?? mountEl,
      toLocal,
      releaseDelay: isCoarsePointer() ? 1200 : 600,
    });

    const render = () => {
      frameId = requestAnimationFrame(render);
      const delta = Math.min(clock.getDelta(), 0.1);
      if (!inView || !tabActive || !photo) return;

      // Lerp manual: 1 - exp(-k*dt) supaya kecepatan tidak tergantung fps
      // (penting di Android yang sering 60 vs 120 Hz).
      const ease = 1 - Math.exp(-6 * delta);
      pointer.x += (tracker.target.x - pointer.x) * ease;
      pointer.y += (tracker.target.y - pointer.y) * ease;
      pointer.hover +=
        (tracker.target.active - pointer.hover) * (1 - Math.exp(-4 * delta));

      const { uniforms } = photo;
      uniforms.uPointer.value.set(pointer.x, pointer.y);
      uniforms.uHover.value = pointer.hover;
      uniforms.uTime.value += delta;

      // Miringkan bidang foto mengikuti pointer. Dipasang di node `tilt` yang
      // terpisah dari `root` (dipakai timeline scroll) supaya tidak saling rebut.
      // Ikut meredup bersama uScroll: begitu hero ditinggalkan, foto kembali datar.
      const tiltAmount =
        (0.35 + pointer.hover * 0.65) *
        (1 - uniforms.uScroll.value) *
        uniforms.uMotion.value;
      const idle = uniforms.uMotion.value
        ? Math.sin(uniforms.uTime.value * 0.45) * 0.16
        : 0;

      photo.tilt.rotation.y =
        (pointer.x * MAX_TILT_Y + idle * MAX_TILT_Y) * tiltAmount;
      photo.tilt.rotation.x = -pointer.y * MAX_TILT_X * tiltAmount;

      renderer.render(scene, camera);
    };

    const applySize = () => {
      const box = mountEl.getBoundingClientRect();
      container = {
        width: Math.max(box.width, 1),
        height: Math.max(box.height, 1),
      };
      renderer.setSize(container.width, container.height);
      camera.aspect = container.width / container.height;
      camera.updateProjectionMatrix();
      photo?.fit(container.width, container.height);
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (disposed) return;
        applySize();

        const nextStacked = isStackedHero();
        const layoutChanged = nextStacked !== stacked;
        if (layoutChanged) {
          stacked = nextStacked;
          photo?.setStacked(stacked);
        }

        // Di HP, munculnya address bar cuma mengubah tinggi. Rebuild ScrollTrigger
        // hanya kalau lebar/layout berubah, supaya scroll tidak tersendat.
        if (
          photo &&
          (layoutChanged || Math.abs(container.width - lastWidth) > 1)
        ) {
          lastWidth = container.width;
          rebuildPhotoTimelines({ root: photo.root, uniforms: photo.uniforms });
        }
      }, 220);
    };

    // Berhenti render kalau hero tidak kelihatan / tab di background: hemat
    // baterai HP secara signifikan.
    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
      },
      { rootMargin: "120px" }
    );
    observer.observe(mountEl);

    const onVisibilityChange = () => {
      tabActive = !document.hidden;
      // Buang delta besar yang menumpuk selama tab mati.
      if (tabActive) clock.getDelta();
    };

    loadPhotoTexture(PHOTO_SOURCES, getInitials())
      .then((texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }

        photo = createPhotoPlane(texture, {
          stacked,
          lowPower,
          accent: "#c2a4ff",
        });
        photo.uniforms.uMotion.value = reducedMotion ? 0 : 1;
        photo.fit(container.width, container.height);
        scene.add(photo.root);

        setPhotoTimeline({ root: photo.root, uniforms: photo.uniforms });
        setAllTimeline();

        progress.loaded().then(() => {
          revealTimer = window.setTimeout(() => {
            if (disposed || !photo) return;
            gsap.to(photo.uniforms.uReveal, {
              value: 1,
              duration: reducedMotion ? 0.3 : 1.6,
              ease: "power2.out",
            });
            gsap.to(".character-rim", {
              y: "55%",
              opacity: 1,
              delay: 0.2,
              duration: 2,
              ease: "power2.inOut",
            });
          }, 2500);
        });
      })
      .catch((error) => {
        console.error("Gagal menyiapkan hero foto:", error);
        progress.clear();
      });

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(resizeTimer);
      window.clearTimeout(revealTimer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
      tracker.detach();
      progress.clear();
      photo?.dispose();
      scene.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode === mountEl) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, [setLoading]);

  return (
    <div className="character-container hero-photo">
      <div className="character-model" ref={canvasDiv}>
        <div className="character-rim"></div>
      </div>
    </div>
  );
};

export default PhotoScene;
