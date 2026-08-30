"use client";

import React, { useState, useEffect } from "react";
import { Zap, Film, Music, Sparkles, Cpu, ArrowRight } from "lucide-react";

interface SplashIntroProps {
  onComplete?: () => void;
}

export function SplashIntro({ onComplete }: SplashIntroProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Loading Video Codec Modules...");

  useEffect(() => {
    // 1. Progress Bar Animation Ticker
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    // 2. Dynamic Status Text Ticks
    const timer1 = setTimeout(() => {
      setStatusText("Initializing Audio Bitrate Processors...");
    }, 800);

    const timer2 = setTimeout(() => {
      setStatusText("Connecting FFmpeg Stream Engine...");
    }, 1600);

    const timer3 = setTimeout(() => {
      setStatusText("Streamly Media Downloader Ready!");
    }, 2200);

    // 3. Trigger Fade Out & Unmount
    const finishTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 600); // 600ms CSS fade out transition
    }, 2600);

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
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-cyan-600/20 via-purple-600/25 to-pink-600/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-cyan-600/15 blur-[100px] rounded-full pointer-events-none" />

      {/* Skip Intro Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 px-4 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs font-extrabold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all shadow-lg backdrop-blur-md group"
      >
        <span>Skip Intro</span>
        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Center Animated Core */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Animated Multi-Ring Glowing Logo Icon */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Outer Pulsing Ring */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 animate-spin opacity-40 blur-sm" />
          
          {/* Inner Glowing Box */}
          <div className="absolute w-20 h-20 rounded-2xl bg-zinc-900 border border-cyan-500/50 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
            <div className="relative flex items-center justify-center">
              <Film className="w-8 h-8 text-cyan-400 animate-pulse absolute -translate-x-2 -translate-y-1 opacity-80" />
              <Music className="w-8 h-8 text-purple-400 animate-pulse absolute translate-x-2 translate-y-1 opacity-80" />
              <Sparkles className="w-6 h-6 text-pink-400 animate-spin absolute" />
            </div>
          </div>
        </div>

        {/* Website Branding Title with Glowing Gradient */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-wider text-white mb-2">
          STREAM<span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">LY</span>
        </h1>

        <p className="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-8 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>High-Speed Video & Audio Engine</span>
        </p>

        {/* Dynamic Loading Status Ticker */}
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
            <span className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span className="text-cyan-300">{statusText}</span>
            </span>
            <span className="font-bold text-cyan-400">{progress}%</span>
          </div>

          {/* Glowing Animated Progress Bar */}
          <div className="w-full h-2 rounded-full bg-zinc-900 border border-zinc-800 p-0.5 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full transition-all duration-150 shadow-md shadow-purple-500/40"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Feature Badges Footer */}
        <div className="mt-8 flex items-center gap-3 text-[11px] font-mono text-zinc-400">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">1080p / 4K MP4</span>
          <span>•</span>
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">320kbps MP3</span>
          <span>•</span>
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">FFmpeg Ready</span>
        </div>
      </div>
    </div>
  );
}
