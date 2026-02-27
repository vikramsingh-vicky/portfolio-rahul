import { useRef, useEffect, Suspense, Component } from "react";
import type { ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Torus, Svg, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

/** Error boundary for skill icons (used when the skill icons block below is uncommented). Exported so the symbol is in use. */
export class SkillIconErrorBoundary extends Component<{ children: ReactNode }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(): void {
    // Swallow so one failed SVG doesn't crash the Canvas
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Simple Icons (single-color SVGs) via jsDelivr */
const ICON_BASE = "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons";

/** Map cv skill names to icon: Simple Icons slug OR full SVG URL */
const SKILL_ICON_MAP: Record<string, string> = {
  "Google Apps Script": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_Apps_Script.svg",
  "React.js": "react",
  "Node.js": "nodedotjs",
  JavaScript: "javascript",
  Express: "express",
  MySQL: "mysql",
  HTML: "html5",
  CSS: "css3",
  Python: "python",
  VBA: "microsoft",
  "Google Workspace": "https://upload.wikimedia.org/wikipedia/commons/c/c9/G_Suite_Markplace_icon.svg",
  Excel: "microsoftexcel",
  "Looker Studio": "looker",
  AppSheet: "google",
  Git: "git",
  GitHub: "github",
  "Google Cloud": "googlecloud",
  AWS: "amazonaws",
};

const DEFAULT_ICON = "google";

/** Brand colors for Simple Icons (by slug). For full-URL icons we use skill name. */
const ICON_COLORS: Record<string, string> = {
  google: "#4285F4",
  react: "#61DAFB",
  nodedotjs: "#339933",
  javascript: "#F7DF1E",
  express: "#000000",
  mysql: "#4479A1",
  html5: "#E34F26",
  css3: "#1572B6",
  python: "#3776AB",
  microsoft: "#5E5E5E",
  microsoftexcel: "#217346",
  looker: "#4285F4",
  git: "#F05032",
  github: "#181717",
  googlecloud: "#4285F4",
  amazonaws: "#FF9900",
};

const DEFAULT_ICON_COLOR = "#ffffff";

function getIconPath(skill: string): string {
  return SKILL_ICON_MAP[skill] ?? DEFAULT_ICON;
}

/** Full URL for the icon: either the map value (if URL) or ICON_BASE + slug + .svg */
function getIconUrl(skill: string): string {
  const path = getIconPath(skill);
  return path.startsWith("http") ? path : `${ICON_BASE}/${path}.svg`;
}

function getIconColor(iconPath: string): string {
  if (iconPath.startsWith("http")) return DEFAULT_ICON_COLOR; // not used; URL icons keep SVG original colors
  return ICON_COLORS[iconPath] ?? DEFAULT_ICON_COLOR;
}

function CameraParallax({ section }: { section?: string }) {
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const targetZ = useRef(4.5);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Slight camera pull per section for a "journey" feel
  const sectionZ: Record<string, number> = {
    home: 4.2,
    about: 5,
    projects: 5.5,
    experience: 5,
    tools: 5.2,
    education: 5,
    contact: 4.8,
  };

  useFrame((state) => {
    targetZ.current = sectionZ[section ?? "home"] ?? 4.5;
    const camera = state.camera;
    mouse.current.x += (target.current.x * 0.35 - mouse.current.x) * 0.04;
    mouse.current.y += (target.current.y * 0.2 - mouse.current.y) * 0.04;
    camera.position.x = mouse.current.x;
    camera.position.y = mouse.current.y;
    camera.position.z += (targetZ.current - camera.position.z) * 0.03;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });
  return null;
}

function FloatingShape({
  position,
  scale = 1,
  color,
  speed = 1,
  shape = "sphere",
}: {
  position: [number, number, number];
  scale?: number;
  color: string;
  speed?: number;
  shape?: "sphere" | "torus" | "box";
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.3 * speed;
      ref.current.rotation.x += delta * 0.15 * speed;
    }
  });

  const common = { ref, position };
  if (shape === "torus") {
    return (
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.5}>
        <Torus args={[0.4 * scale, 0.15 * scale, 16, 32]} scale={scale} {...common}>
          <meshStandardMaterial color={color} wireframe roughness={0.8} metalness={0.2} />
        </Torus>
      </Float>
    );
  }
  if (shape === "box") {
    return (
      <Float speed={2.5} rotationIntensity={0.3} floatIntensity={0.6}>
        <mesh scale={scale} {...common}>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial color={color} wireframe roughness={0.8} metalness={0.2} />
        </mesh>
      </Float>
    );
  }
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.4}>
      <Sphere ref={ref} args={[0.5 * scale, 32, 32]} position={position}>
        <MeshDistortMaterial
          color={color}
          distort={0.3}
          speed={1.5 * speed}
          roughness={0.4}
          metalness={0.3}
        />
      </Sphere>
    </Float>
  );
}

/** Renders a single skill as a 3D icon (used when the skill icons block below is uncommented). Exported so the symbol is in use. */
export function SkillIcon({
  position,
  skill,
  scale = 1,
}: {
  position: [number, number, number];
  skill: string;
  scale?: number;
}) {
  const iconPath = getIconPath(skill);
  const url = getIconUrl(skill);
  const isFullUrl = iconPath.startsWith("http");
  const color = getIconColor(iconPath);
  /* Full-URL SVGs (e.g. Google Apps Script, G Suite) are 512px; Simple Icons ~24px – scale down so they match */
  const sizeFactor = isFullUrl ? 24 / 512 : 1;
  const iconScale = 0.02 * scale * sizeFactor;
  const groupRef = useRef<THREE.Group>(null);
  const contentRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const spinSpeed = 0.4;
  const isReact = skill === "React.js";
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
      groupRef.current.rotateY(Math.PI);
    }
    if (contentRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.06;
      contentRef.current.scale.setScalar(pulse);
      if (isReact) {
        contentRef.current.rotation.z -= delta * spinSpeed;
      }
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.35} floatIntensity={0.4}>
      <group ref={groupRef} position={position} scale={[iconScale, iconScale, iconScale]} rotation={[-Math.PI / 2, 0, 0]}>
        <group scale={[-1, 1, 1]}>
          {/* Depth backing: dark panel behind icon for 3D pop */}
          <mesh position={[0, 0, -2]}>
            <circleGeometry args={[18, 32]} />
            <meshStandardMaterial
              color="#06080c"
              transparent
              opacity={0.85}
              roughness={0.9}
              metalness={0.1}
            />
          </mesh>
          <group ref={contentRef}>
            <Suspense fallback={null}>
              {isFullUrl ? (
                <Svg src={url} />
              ) : (
                <Svg src={url} fillMaterial={{ color }} />
              )}
            </Suspense>
          </group>
        </group>
      </group>
    </Float>
  );
}

/** Fixed scattered positions for skill icons (used when the skill icons block below is uncommented). */
const SKILL_POSITIONS: [number, number, number][] = [
  [-4.2, 2.2, -2.5], [-3.6, -1.5, -3.2], [-2.2, 2.6, -2], [3.8, 1.4, -2.8], [3.2, -2.2, -3],
  [0.2, 2.4, -3.6], [0.5, -2.2, -2.4], [-3.6, 0.4, -3.2], [3.6, -0.2, -2.6], [-1.8, 1.2, -3.8],
  [2.2, 1.6, -2.2], [-2.8, -2.4, -2.8], [1.4, -1.4, -3.4], [-4, -0.8, -2.8], [2.8, 0.2, -3.2],
  [-0.8, -1.8, -3.6], [4, -1.2, -2.4],
];

type SceneProps = { section?: string; theme?: "dark" | "light" };

export function Scene({ section = "home", theme = "dark" }: SceneProps) {
  void SKILL_POSITIONS; /* referenced so value is read; used in commented skill icons block */
  const fogColor = theme === "dark" ? "#0c0e12" : "#c8ccd4";
  const fogColorRef = useRef(fogColor);
  useEffect(() => {
    fogColorRef.current = fogColor;
  }, [fogColor]);
  const isDark = theme === "dark";

  useFrame((state) => {
    state.scene.fog = new THREE.FogExp2(fogColorRef.current, 0.04);
  });

  return (
    <>
      <CameraParallax section={section} />
      <ambientLight intensity={isDark ? 0.35 : 0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
      <pointLight position={[-10, -5, 5]} intensity={0.6} color="#ffaa66" />
      <pointLight position={[5, 10, -5]} intensity={0.4} color="#66aaff" />

      {/* Deep starfield for 3D depth */}
      <Stars radius={80} depth={60} count={3000} factor={4} saturation={0} fade speed={1} />

      {/* Scattered shapes: spheres, torus, box (enlarged) */}
      <FloatingShape position={[-4, 2, -2]} scale={0.62} color="#e8b86d" speed={0.8} shape="sphere" />
      <FloatingShape position={[-3.2, -1.8, -3.5]} scale={0.54} color="#6bb5c4" speed={1} shape="torus" />
      <FloatingShape position={[-2, 2.5, -1.8]} scale={0.47} color="#c46b9e" speed={1.2} shape="box" />
      <FloatingShape position={[4, 1.2, -2.5]} scale={0.7} color="#7bc46b" speed={0.7} shape="sphere" />
      <FloatingShape position={[3.5, -2, -3.2]} scale={0.62} color="#b86be8" speed={0.9} shape="torus" />
      <FloatingShape position={[0, 2.2, -3.8]} scale={0.5} color="#e8b86d" speed={0.85} shape="sphere" />
      <FloatingShape position={[0, -2.4, -2.2]} scale={0.59} color="#6bb5c4" speed={1.1} shape="torus" />
      <FloatingShape position={[-3.8, 0, -3]} scale={0.65} color="#c46b9e" speed={0.95} shape="box" />
      <FloatingShape position={[3.8, -0.5, -2.8]} scale={0.56} color="#7bc46b" speed={0.75} shape="sphere" />
      <FloatingShape position={[-1.5, 1, -4]} scale={0.44} color="#b86be8" speed={1} shape="torus" />
      <FloatingShape position={[2, 1.8, -1.6]} scale={0.78} color="#e8b86d" speed={0.8} shape="sphere" />
      <FloatingShape position={[-2.5, -2.2, -2.4]} scale={0.53} color="#6bb5c4" speed={1.05} shape="box" />
      <FloatingShape position={[1.2, -1.2, -3.6]} scale={0.47} color="#c46b9e" speed={0.9} shape="torus" />

      {/* Skill icons from cv.skills as 3D objects – uniform scale so all match */}
      {/* <Suspense fallback={null}>
        {cv.skills.map((skill, i) => {
          const pos = SKILL_POSITIONS[i % SKILL_POSITIONS.length];
          return (
            <SkillIconErrorBoundary key={skill}>
              <SkillIcon position={pos} skill={skill} scale={1} />
            </SkillIconErrorBoundary>
          );
        })}
      </Suspense> */}

      {/* Post-processing: bloom for a glowing 3D look */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.35} luminanceSmoothing={0.9} intensity={0.35} mipmapBlur />
      </EffectComposer>
    </>
  );
}
