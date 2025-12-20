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
        shininess: 12,
        waveHeight: 4,
        waveSpeed: 1.5,
        zoom: 1.02,
      });
    };

    init();
    return () => effect?.destroy();
  }, []);

  return (
    <div ref={vantaRef} className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-12">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          UrbanCare Appointment Portal
        </h1>

        <p className="text-gray-600 mb-8">
          Manage services, bookings, availability, and customers from a single
          professional dashboard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            ["Appointments", "Real-time booking & confirmations"],
            ["Availability", "Flexible schedules & capacity rules"],
            ["Calendar Sync", "Google Calendar integration"],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="border rounded-lg p-4 text-sm text-gray-700"
            >
              <p className="font-medium mb-1">{title}</p>
              <p className="text-gray-500">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => navigate("/login")}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-900"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
