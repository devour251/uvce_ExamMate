"use client";

import { Github, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 px-6">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ink-300/70">
        <div className="font-display">
          UVCE ExamMate AI · <span className="text-ink-400">v0.1 MVP</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="inline-flex items-center gap-1.5">
            made with <Heart className="h-3.5 w-3.5 text-crimson" /> at UVCE
          </span>
          <a
            href="https://github.com"
            className="inline-flex items-center gap-1.5 hover:text-white transition"
          >
            <Github className="h-4 w-4" /> source
          </a>
        </div>
      </div>
    </footer>
  );
}
