import { useEffect, useState } from "react";
import "./styles/Loading.css";
import { useLoading } from "../context/LoadingProvider";
import { config } from "../config";

import Marquee from "react-fast-marquee";

const Loading = ({ percent }: { percent: number }) => {
  const { setIsLoading } = useLoading();
  const [loaded, setLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (percent >= 100 && !loaded) {
      let timer2: ReturnType<typeof setTimeout>;
      const timer1 = setTimeout(() => {
        setLoaded(true);
        timer2 = setTimeout(() => {
          setIsLoaded(true);
        }, 1000);
      }, 600);
      return () => {
        clearTimeout(timer1);
        if (timer2) clearTimeout(timer2);
      };
    }
  }, [percent, loaded]);

  useEffect(() => {
    import("./utils/initialFX").then((module) => {
      if (isLoaded) {
        setClicked(true);
        setTimeout(() => {
          if (module.initialFX) {
            module.initialFX();
          }
          setIsLoading(false);
        }, 900);
      }
    });
  }, [isLoaded]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <>
      <div className="loading-header">
        <a href="/#" className="loader-title" data-cursor="disable">
          {config.developer.fullName}
        </a>
        <div className={`loaderGame ${clicked && "loader-out"}`}>
          <div className="loaderGame-container">
            <div className="loaderGame-in">
              {[...Array(27)].map((_, index) => (
                <div className="loaderGame-line" key={index}></div>
              ))}
            </div>
            <div className="loaderGame-ball"></div>
          </div>
        </div>
      </div>
      <div className="loading-screen">
        <div className="loading-marquee">
          <Marquee>
            <span>&nbsp; Mobile Developer &nbsp;</span> <span>&nbsp; Web Developer &nbsp;</span>
            <span>&nbsp; Mobile Developer &nbsp;</span> <span>&nbsp; Web Developer &nbsp;</span>
          </Marquee>
        </div>
        <div
          className={`loading-wrap ${clicked && "loading-clicked"}`}
          onMouseMove={(e) => handleMouseMove(e)}
        >
          <div className="loading-hover"></div>
          <div className={`loading-button ${loaded && "loading-complete"}`}>
            <div className="loading-container">
              <div className="loading-content">
                <div className="loading-content-in">
                  Loading <span>{percent}%</span>
                </div>
              </div>
              <div className="loading-box"></div>
            </div>
            <div className="loading-content2">
              <span>Welcome</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Loading;

export const setProgress = (setLoading: (value: number) => void) => {
  let currentPercent = 0;
  let targetPercent = 0;
  let isDone = false;
  let animId: number | null = null;
  let activeInterval: ReturnType<typeof setInterval> | null = null;

  activeInterval = setInterval(() => {
    if (!isDone && targetPercent < 90) {
      targetPercent += Math.floor(Math.random() * 5) + 2;
      if (targetPercent > 90) targetPercent = 90;
    }
  }, 50);

  const tick = () => {
    if (currentPercent < targetPercent) {
      currentPercent = Math.min(targetPercent, currentPercent + 1);
      setLoading(currentPercent);
    }
    if (currentPercent < 100 || !isDone) {
      animId = requestAnimationFrame(tick);
    }
  };
  animId = requestAnimationFrame(tick);

  function clear() {
    if (activeInterval) clearInterval(activeInterval);
    if (animId) cancelAnimationFrame(animId);
    isDone = true;
    targetPercent = 100;
    currentPercent = 100;
    setLoading(100);
  }

  function loaded() {
    return new Promise<number>((resolve) => {
      if (activeInterval) clearInterval(activeInterval);
      targetPercent = 100;
      isDone = true;

      const checkLoaded = () => {
        if (currentPercent >= 100) {
          if (animId) cancelAnimationFrame(animId);
          setLoading(100);
          resolve(100);
        } else {
          targetPercent = 100;
          requestAnimationFrame(checkLoaded);
        }
      };
      requestAnimationFrame(checkLoaded);
    });
  }
  return { loaded, percent: currentPercent, clear };
};
