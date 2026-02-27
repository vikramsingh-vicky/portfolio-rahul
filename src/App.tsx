import { Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import { UI } from "./components/UI";
import { SECTIONS } from "./components/UI";
import "./App.css";

const THEME_KEY = "portfolio-theme";
type Theme = "dark" | "light";

function Fallback() {
  return null;
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return (stored === "light" || stored === "dark" ? stored : "dark") as Theme;
  });
  const [section, setSection] = useState<string>("home");
  const wheelLock = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const canvasBg = theme === "dark" ? "#0c0e12" : "#e8eaef";

  useEffect(() => {
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelLock.current) return;
      const idx = SECTIONS.indexOf(section as (typeof SECTIONS)[number]);
      if (idx < 0) return;
      if (e.deltaY > 0 && idx < SECTIONS.length - 1) {
        wheelLock.current = true;
        setSection(SECTIONS[idx + 1]);
        setTimeout(() => {
          wheelLock.current = false;
        }, 600);
      } else if (e.deltaY < 0 && idx > 0) {
        wheelLock.current = true;
        setSection(SECTIONS[idx - 1]);
        setTimeout(() => {
          wheelLock.current = false;
        }, 600);
      }
    };
    window.addEventListener("wheel", handler, { passive: false });
    return () => window.removeEventListener("wheel", handler);
  }, [section]);

  return (
    <div className="app" data-section={section}>
      <div className="canvas-wrap">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <color attach="background" args={[canvasBg]} />
          <Suspense fallback={<Fallback />}>
            <Scene section={section} theme={theme} />
          </Suspense>
        </Canvas>
      </div>
      <UI theme={theme} onToggleTheme={toggleTheme} activeSection={section} onSectionChange={setSection} />
    </div>
  );
}

export default App;
