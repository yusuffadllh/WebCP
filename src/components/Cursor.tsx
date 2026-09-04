import { useEffect, useRef } from "react";
import "./styles/Cursor.css";
import gsap from "gsap";

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Disable custom cursor on touch devices or small screens to prevent lag
    const isTouchOrMobile =
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth < 768 ||
      "ontouchstart" in window;

    if (isTouchOrMobile || !cursorRef.current) return;

    const cursor = cursorRef.current;
    let hover = false;

    // Use gsap.quickTo for high-performance direct property updates on mouse move
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.15, ease: "power2.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.15, ease: "power2.out" });

    const handleMouseMove = (e: MouseEvent) => {
      if (!hover) {
        xTo(e.clientX);
        yTo(e.clientY);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);

    const dataCursorElements = document.querySelectorAll("[data-cursor]");
    const cleanups: Array<() => void> = [];

    dataCursorElements.forEach((item) => {
      const element = item as HTMLElement;
      const handleMouseOver = (e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        if (element.dataset.cursor === "icons") {
          cursor.classList.add("cursor-icons");
          xTo(rect.left);
          yTo(rect.top);
          cursor.style.setProperty("--cursorH", `${rect.height}px`);
          hover = true;
        }
        if (element.dataset.cursor === "disable") {
          cursor.classList.add("cursor-disable");
        }
      };

      const handleMouseOut = () => {
        cursor.classList.remove("cursor-disable", "cursor-icons");
        hover = false;
      };

      element.addEventListener("mouseover", handleMouseOver);
      element.addEventListener("mouseout", handleMouseOut);

      cleanups.push(() => {
        element.removeEventListener("mouseover", handleMouseOver);
        element.removeEventListener("mouseout", handleMouseOut);
      });
    });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return <div className="cursor-main" ref={cursorRef}></div>;
};

export default Cursor;
