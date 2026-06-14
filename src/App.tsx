import { useState } from "react";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import SemesterSection from "./components/SemesterSection";
import { Toaster } from "sonner";

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <>
      {/* Sonner Toast notification provider */}
      <Toaster theme="dark" richColors position="top-right" />

      {/* Main Container */}
      <div className="relative min-h-screen text-ink-50 selection:bg-accent/40 overflow-x-hidden">
        {/* Ambient Grid Layout Background */}
        <div className="absolute inset-0 bg-grid-fade opacity-40 pointer-events-none z-0" />

        {started ? (
          <main className="relative z-10 animate-fade-in">
            <SemesterSection onBack={() => setStarted(false)} />
          </main>
        ) : (
          <div className="relative z-10 animate-fade-in">
            <Hero onStart={() => setStarted(true)} />
            <Stats />
            <Features />
            <HowItWorks />
            <CTA onStart={() => setStarted(true)} />
            <Footer />
          </div>
        )}
      </div>
    </>
  );
}
