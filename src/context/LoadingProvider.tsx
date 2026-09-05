import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Loading from "../components/Loading";

interface LoadingType {
  isLoading: boolean;
  setIsLoading: (state: boolean) => void;
  setLoading: (percent: number) => void;
}

/** Jaring pengaman: kalau scene hero gagal total, jangan kunci halaman. */
const LOADER_TIMEOUT_MS = 12000;

export const LoadingContext = createContext<LoadingType | null>(null);

export const LoadingProvider = ({ children }: PropsWithChildren) => {
  // Hanya lewati loading jika user kembali dari /myworks dalam sesi navigasi ini
  const isBackFromMyWorks = useRef(sessionStorage.getItem("fromMyWorks") === "true");
  
  const [isLoading, setIsLoading] = useState(!isBackFromMyWorks.current);
  const [loading, setLoading] = useState(isBackFromMyWorks.current ? 100 : 0);
  const releasedRef = useRef(isBackFromMyWorks.current);

  const releaseLoader = () => {
    releasedRef.current = true;
    setIsLoading(false);
    // Hapus flag setelah digunakan agar refresh/halaman baru tetap ada loading
    sessionStorage.removeItem("fromMyWorks");
  };

  const updateLoading = (percent: number) => {
    setLoading((prev) => Math.max(prev, percent));
  };

  const value = {
    isLoading,
    setIsLoading: (state: boolean) => {
      if (!state) releaseLoader();
      else setIsLoading(state);
    },
    setLoading: updateLoading,
  };

  useEffect(() => {
    // Kalau setelah LOADER_TIMEOUT_MS loader belum dilepas (WebGL gagal, foto
    // stuck, dll), paksa masuk ke halaman + jalankan initialFX sendiri supaya
    // body tidak tertinggal `overflow: hidden`.
    const timer = window.setTimeout(() => {
      if (releasedRef.current) return;
      console.warn("[hero] Loader timeout, melanjutkan tanpa animasi intro.");
      import("../components/utils/initialFX").then((module) => {
        module.initialFX?.();
        releaseLoader();
      });
    }, LOADER_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <LoadingContext.Provider value={value as LoadingType}>
      {isLoading && <Loading percent={loading} />}
      <main className="main-body">{children}</main>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
