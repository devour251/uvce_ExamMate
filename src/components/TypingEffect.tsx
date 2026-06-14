import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function TypingEffect({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">(
    "typing"
  );

  useEffect(() => {
    const full = texts[idx];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (displayed.length < full.length) {
        timeout = setTimeout(
          () => setDisplayed(full.slice(0, displayed.length + 1)),
          28
        );
      } else {
        timeout = setTimeout(() => setPhase("deleting"), 2200);
      }
    } else if (phase === "deleting") {
      if (displayed.length > 0) {
        timeout = setTimeout(
          () => setDisplayed(displayed.slice(0, -1)),
          14
        );
      } else {
        setIdx((i) => (i + 1) % texts.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, phase, idx, texts]);

  return (
    <div className="glass rounded-2xl p-5 text-left">
      <div className="flex items-center gap-2 mb-3">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span className="h-2 w-2 rounded-full bg-yellow-400" />
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span className="ml-2 text-xs uppercase tracking-widest text-ink-300/60">
          exammate.ai
        </span>
      </div>
      <div className="font-mono text-sm sm:text-base text-ink-100/90 min-h-[3.5rem]">
        <AnimatePresence mode="wait">
          <motion.span
            key={displayed.length}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            className="inline-block text-balance"
          >
            {displayed}
            <span className="inline-block w-[2px] h-[1.1em] align-middle bg-accent ml-1 animate-cursor-blink" />
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
