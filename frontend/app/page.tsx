"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import LandingHero from "@/components/landing/Hero";
import LandingStats from "@/components/landing/Stats";
import LandingFeatures from "@/components/landing/Features";
import LandingHowItWorks from "@/components/landing/HowItWorks";
import LandingCTA from "@/components/landing/CTA";
import LandingFooter from "@/components/landing/Footer";
import SemesterSection from "@/components/semester/SemesterSection";

// Three.js scene is client-only — load with SSR off.
const Scene3D = dynamic(() => import("@/components/landing/Scene3D"), {
  ssr: false,
});

export default function HomePage() {
  const [started, setStarted] = useState(false);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* Fixed 3D background */}
      <div className="fixed inset-0 -z-10">
        <Scene3D />
      </div>
      <div className="fixed inset-0 -z-10 bg-grid-fade opacity-40 pointer-events-none" />
      <div className="fixed inset-0 -z-10 bg-noise opacity-[0.04] mix-blend-overlay pointer-events-none" />

      {!started ? (
        <>
          <LandingHero onStart={() => setStarted(true)} />
          <LandingStats />
          <LandingFeatures />
          <LandingHowItWorks />
          <LandingCTA onStart={() => setStarted(true)} />
          <LandingFooter />
        </>
      ) : (
        <SemesterSection onBack={() => setStarted(false)} />
      )}
    </main>
  );
}
