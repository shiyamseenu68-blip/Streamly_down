import React from "react";
import { ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800/60 bg-zinc-950/80 py-8 mt-auto backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>No login or authentication required • Safe & Private</span>
        </div>

        <div className="flex items-center gap-4 text-zinc-500">
          <span>© {new Date().getFullYear()} STREAMLY</span>
          <span>•</span>
          <span>YouTube & Instagram Downloader</span>
        </div>
      </div>
    </footer>
  );
}
