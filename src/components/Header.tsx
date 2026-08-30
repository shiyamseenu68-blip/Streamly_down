import React from "react";
import { Download, Sparkles, Youtube, Instagram } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
              <Download className="w-5 h-5 text-cyan-400 stroke-[2.5]" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              STREAMLY
            </span>
            <span className="text-[10px] text-cyan-400 font-bold tracking-wide uppercase flex items-center gap-1">
              <span>Created by Shiyam S</span>
            </span>
          </div>
        </div>

        {/* Supported Platforms & Status Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-400">
            <span className="flex items-center gap-1 text-red-400 font-medium">
              <Youtube className="w-3.5 h-3.5" /> YouTube
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1 text-pink-400 font-medium">
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 shadow-sm shadow-cyan-950/40">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>v1.0 Ready</span>
          </span>
        </div>
      </div>
    </header>
  );
}
