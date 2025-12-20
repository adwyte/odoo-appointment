import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    VANTA: any;
    THREE: any;
  }
}

export default function Landing() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
        el: vantaRef.current,
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

  return (
    <div
      ref={vantaRef}
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
    >
      {/* subtle dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-semibold text-white mb-6">
          UrbanCare
        </h1>

        <p className="text-lg md:text-xl text-gray-200 mb-10 leading-relaxed">
          A professional appointment management platform for customers,
          organisers, and administrators.
        </p>

        <div className="flex justify-center gap-6 text-sm text-gray-300 mb-12">
          <span>Real-time booking</span>
          <span>•</span>
          <span>Availability management</span>
          <span>•</span>
          <span>Calendar integration</span>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="px-8 py-3 rounded-lg bg-white text-black font-medium hover:bg-gray-100 transition"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
