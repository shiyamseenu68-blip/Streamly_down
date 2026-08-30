"use client";

import React, { useState } from "react";
import {
  Film,
  Music,
  Zap,
  Sparkles,
  CheckCircle2,
  Sliders,
  ArrowRight,
  Layers,
  Activity,
  Play,
  Cpu,
  Download
} from "lucide-react";

export function StreamMergeIntro() {
  const [activeStep, setActiveStep] = useState<"video" | "audio" | "merge">("merge");

  return (
    <div className="w-full max-w-3xl mx-auto rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 border border-zinc-800/90 p-6 sm:p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl animate-fade-in relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Intro Badge */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-500/30 text-cyan-300 shadow-md">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              FFmpeg Stream Merging Engine
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-[10px] uppercase font-mono font-extrabold shadow-sm">
                Pro Tech
              </span>
            </h2>
            <p className="text-xs text-zinc-400">High-speed independent video & audio stream unification</p>
          </div>
        </div>

        {/* Step Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950/80 border border-zinc-800 shadow-inner">
          <button
            onClick={() => setActiveStep("video")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeStep === "video"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video</span>
          </button>
          <button
            onClick={() => setActiveStep("audio")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeStep === "audio"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Audio</span>
          </button>
          <button
            onClick={() => setActiveStep("merge")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeStep === "merge"
                ? "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-md shadow-purple-600/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Merged Result</span>
          </button>
        </div>
      </div>

      {/* Interactive Visual Merge Pipeline Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center my-4 relative z-10">
        {/* Left: Video Stream Box */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 ${
            activeStep === "video" || activeStep === "merge"
              ? "bg-gradient-to-b from-cyan-950/60 to-zinc-900 border-cyan-500/50 shadow-xl shadow-cyan-950/30 scale-[1.02]"
              : "bg-zinc-950/60 border-zinc-800 opacity-60"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Video Channel</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
              1080p / 4K
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] font-mono text-zinc-400">
            <div className="flex justify-between">
              <span>Codec:</span>
              <span className="text-zinc-200 font-bold">H.264 / AV1</span>
            </div>
            <div className="flex justify-between">
              <span>Frame Rate:</span>
              <span className="text-zinc-200 font-bold">60 FPS</span>
            </div>
            <div className="flex justify-between">
              <span>Resolution:</span>
              <span className="text-cyan-400 font-bold">3840 x 2160</span>
            </div>
          </div>
        </div>

        {/* Center: FFmpeg Active Processing Core */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-950/80 border border-purple-500/40 shadow-inner text-center relative group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 animate-pulse mb-2">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            FFmpeg Processing
          </span>
          <span className="text-[10px] text-purple-300 font-mono mt-0.5">
            Ultra-fast lossy stream joining
          </span>
          {/* Pulse Connector Beams */}
          <div className="hidden md:block absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse" />
          <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
        </div>

        {/* Right: Audio Stream Box */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 ${
            activeStep === "audio" || activeStep === "merge"
              ? "bg-gradient-to-b from-purple-950/60 to-zinc-900 border-purple-500/50 shadow-xl shadow-purple-950/30 scale-[1.02]"
              : "bg-zinc-950/60 border-zinc-800 opacity-60"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-purple-300 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-purple-400" />
              <span>Audio Channel</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
              320 kbps
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] font-mono text-zinc-400">
            <div className="flex justify-between">
              <span>Codec:</span>
              <span className="text-zinc-200 font-bold">Opus / MP3</span>
            </div>
            <div className="flex justify-between">
              <span>Sample Rate:</span>
              <span className="text-zinc-200 font-bold">48,000 Hz</span>
            </div>
            <div className="flex justify-between">
              <span>Bitrate:</span>
              <span className="text-purple-400 font-bold">320 kbps Stereo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Output Master Preview Card */}
      <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-zinc-950 to-purple-950/60 border border-emerald-500/40 flex items-center justify-between gap-4 flex-wrap shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-white flex items-center gap-2">
              Playable Master Media Output
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                Ready
              </span>
            </span>
            <span className="text-[11px] text-zinc-400 font-mono mt-0.5">
              Single unified MP4 or MP3 file • 100% device compatible
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Automatic Codec Alignment</span>
        </div>
      </div>
    </div>
  );
}
