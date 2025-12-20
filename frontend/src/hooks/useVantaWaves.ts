import { useEffect, useRef } from "react";

declare global {
  interface Window {
    VANTA: any;
    THREE: any;
  }
}

export function useVantaWaves() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let effect: any;

    const load = (src: string) =>
      new Promise<void>((res) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => res();
        document.body.appendChild(s);
      });

    const init = async () => {
      if (!window.THREE) {
        await load("https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js");
      }
      if (!window.VANTA) {
        await load("https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js");
      }

      effect = window.VANTA.WAVES({
        el: ref.current,
        color: 0x341c42,
        shininess: 10,
        waveHeight: 4,
        waveSpeed: 1.4,
        zoom: 1.02,
      });
    };

    init();
    return () => effect?.destroy();
  }, []);

  return ref;
}
