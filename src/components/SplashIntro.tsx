"use client";

import React, { useState, useEffect } from "react";
import { Zap, Film, Music, Sparkles, Cpu, ArrowRight, Heart } from "lucide-react";

interface SplashIntroProps {
  onComplete?: () => void;
}

export function SplashIntro({ onComplete }: SplashIntroProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Loading Video Codec Modules...");

  useEffect(() => {
    // 1. Progress Bar Animation Ticker (0% -> 100%)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 45);

    // 2. Dynamic Status Text Ticks
    const timer1 = setTimeout(() => {
      setStatusText("Initializing Audio Bitrate Processors...");
    }, 800);

    const timer2 = setTimeout(() => {
      setStatusText("Connecting FFmpeg Stream Engine...");
    }, 1700);

    const timer3 = setTimeout(() => {
      setStatusText("Streamly Engine 100% Ready!");
    }, 2300);

    // 3. Trigger Fade Out & Unmount
    const finishTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 600);
    }, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-6 select-none transition-all duration-700 ${
        isFadingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-cyan-600/25 via-purple-600/30 to-pink-600/25 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-cyan-600/20 blur-[110px] rounded-full pointer-events-none" />

      {/* Skip Intro Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 px-4 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-xs font-extrabold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all shadow-xl backdrop-blur-md group"
      >
        <span>Skip Intro</span>
        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Center Animated Core */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Animated Multi-Ring Glowing Logo Icon with Equalizer Waves */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Outer Pulsing Glowing Ring */}
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 animate-spin opacity-50 blur-md" />
          
          {/* Inner Glowing Box */}
          <div className="absolute w-24 h-24 rounded-2xl bg-zinc-900 border border-cyan-500/60 flex flex-col items-center justify-center shadow-2xl shadow-cyan-500/40">
            <div className="relative flex items-center justify-center">
              <Film className="w-9 h-9 text-cyan-400 animate-pulse absolute -translate-x-2.5 -translate-y-1 opacity-80" />
              <Music className="w-9 h-9 text-purple-400 animate-pulse absolute translate-x-2.5 translate-y-1 opacity-80" />
              <Sparkles className="w-7 h-7 text-pink-400 animate-spin absolute" />
            </div>
            
            {/* Animated Equalizer Wave Bars */}
            <div className="flex items-end gap-1 mt-10 h-3">
              <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-2" style={{ animationDelay: "0ms" }} />
              <span className="w-1 bg-purple-400 rounded-full animate-bounce h-3" style={{ animationDelay: "150ms" }} />
              <span className="w-1 bg-pink-400 rounded-full animate-bounce h-2.5" style={{ animationDelay: "300ms" }} />
              <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-3.5" style={{ animationDelay: "450ms" }} />
            </div>
          </div>
        </div>

        {/* Website Branding Title with Glowing Gradient */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-wider text-white mb-2">
          STREAM<span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">LY</span>
        </h1>

        <p className="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-8 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>High-Speed Media & Stream Engine</span>
        </p>

        {/* Dynamic Loading Status Ticker */}
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
            <span className="flex items-center gap-2 truncate max-w-[280px]">
              <Cpu className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" />
              <span className="text-cyan-300 font-bold truncate">{statusText}</span>
            </span>
            <span className="font-extrabold text-cyan-400 text-sm">{progress}%</span>
          </div>

          {/* Glowing Animated Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-zinc-900 border border-zinc-800 p-0.5 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full transition-all duration-150 shadow-md shadow-purple-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Feature Badges Footer */}
        <div className="mt-8 flex items-center gap-3 text-[11px] font-mono text-zinc-400 flex-wrap justify-center">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">1080p / 4K MP4</span>
          <span>•</span>
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">320kbps MP3</span>
          <span>•</span>
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">FFmpeg Ready</span>
        </div>

        {/* Small Watermark Badge */}
        <div className="mt-8 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-cyan-500/30 text-[11px] font-semibold text-cyan-300 shadow-md shadow-cyan-950/40 backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Created by Shiyam S</span>
        </div>
      </div>
    </div>
  );
}
