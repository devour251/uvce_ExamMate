"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, Sparkles, Trail } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";

/**
 * The animated 3D backdrop.
 * - Stars + sparkles for depth
 * - Floating 3D cards (notes / books) that drift around
 * - A giant glowing "UVCE" wordmark that rotates slowly
 * - All on a dark ink-950 gradient (handled by CSS body bg)
 *
 * Inspired by the Death Note reference: cinematic, dark, gold accent, depth.
 */

function FloatingBook({
  position,
  color = "#f5b800",
  rotation,
  scale = 1,
}: {
  position: [number, number, number];
  color?: string;
  rotation?: [number, number, number];
  scale?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y =
      (rotation?.[1] ?? 0) + Math.sin(clock.elapsedTime * 0.3) * 0.15;
    ref.current.position.y =
      position[1] + Math.sin(clock.elapsedTime * 0.6) * 0.1;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.2}>
      <group ref={ref} position={position} rotation={rotation} scale={scale}>
        {/* Book base */}
        <mesh>
          <boxGeometry args={[1.2, 0.18, 1.6]} />
          <meshStandardMaterial
            color={color}
            metalness={0.4}
            roughness={0.3}
            emissive={color}
            emissiveIntensity={0.18}
          />
        </mesh>
        {/* Spine */}
        <mesh position={[-0.61, 0, 0]}>
          <boxGeometry args={[0.04, 0.22, 1.6]} />
          <meshStandardMaterial
            color="#0a0a0b"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Circuit() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.05;
  });
  return (
    <group ref={ref}>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const r = 3.2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}
            rotation={[0, -angle, 0]}
          >
            <torusGeometry args={[0.18, 0.04, 16, 32]} />
            <meshStandardMaterial
              color="#f5b800"
              emissive="#f5b800"
              emissiveIntensity={0.6}
              metalness={0.6}
              roughness={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function MouseOrb() {
  const ref = useRef<THREE.Mesh>(null);
  const mouse = useRef({ x: 0, y: 0 });
  // capture mouse
  if (typeof window !== "undefined") {
    window.onmousemove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
  }
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.x += (mouse.current.x * 1.2 - ref.current.position.x) * 0.05;
    ref.current.position.y += (mouse.current.y * 0.8 - ref.current.position.y) * 0.05;
  });
  return (
    <Trail width={0.4} length={6} color={"#f5b800"} attenuation={(t) => t * t}>
      <mesh ref={ref} position={[0, 0, 0]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshBasicMaterial color="#ffd24a" />
      </mesh>
    </Trail>
  );
}

function GlowWordmark() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.15;
  });
  return (
    <group ref={ref} position={[0, 0, -2.5]}>
      {/* CSS-rendered wordmark via drei <Text> (no font asset needed) */}
      <Text
        fontSize={1.6}
        color="#ffd24a"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#f5b800"
        font={undefined}
      >
        UVCE
      </Text>
    </group>
  );
}

export default function Scene3D() {
  // Memoize a stable seed for sparkles to avoid re-renders.
  const sparklesCount = useMemo(() => 80, []);
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5], fov: 55 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffd24a" />
        <directionalLight position={[-5, -2, -5]} intensity={0.6} color="#dc2626" />
        <pointLight position={[0, 0, 3]} intensity={1.5} color="#f5b800" />

        <Stars
          radius={50}
          depth={50}
          count={1500}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        <Sparkles
          count={sparklesCount}
          scale={[10, 6, 6]}
          size={2}
          speed={0.3}
          color="#f5b800"
        />

        <GlowWordmark />
        <Circuit />

        <FloatingBook position={[-2.6, 0.6, -1]} color="#f5b800" />
        <FloatingBook position={[2.4, -0.4, -1.5]} color="#dc2626" scale={0.8} />
        <FloatingBook position={[1.8, 1.4, -2]} color="#ffffff" scale={0.6} />
        <FloatingBook position={[-2.2, -1.2, -2]} color="#f5b800" scale={0.7} />

        <MouseOrb />
      </Suspense>
    </Canvas>
  );
}
