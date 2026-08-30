"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UrlForm } from "@/components/UrlForm";
import { MediaCard } from "@/components/MediaCard";
import { StreamMergeIntro } from "@/components/StreamMergeIntro";
import { SplashIntro } from "@/components/SplashIntro";
import { ValidationResult, MediaMetadata } from "@/lib/types/media";
import {
  Youtube,
  Instagram,
  Smartphone,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Zap,
  Film,
  Music,
  ArrowDownCircle,
  CheckCircle2,
  Sliders,
  Layers,
  Heart
} from "lucide-react";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = async (url: string): Promise<ValidationResult> => {
    setIsLoading(true);
    setValidationResult(null);
    setMetadata(null);
    setErrorMsg(null);

    try {
      // 1. Stage 2 URL & SSRF Validation check
      const valResponse = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const valJson = await valResponse.json();
      const valResult: ValidationResult = valJson.success ? valJson.data : valJson.error;
      setValidationResult(valResult);

      if (!valResult.isValid) {
        setIsLoading(false);
        return valResult;
      }

      // 2. Stage 3/6 Media Metadata Analysis
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const analyzeJson = await analyzeResponse.json();

      if (!analyzeJson.success) {
        setErrorMsg(analyzeJson.error?.message || "Failed to extract media details.");
      } else {
        setMetadata(analyzeJson.data);
      }

      setIsLoading(false);
      return valResult;
    } catch (error) {
      setErrorMsg("An unexpected network error occurred. Please check your connection.");
      setIsLoading(false);
      return {
        isValid: false,
        code: "MALFORMED_URL",
        message: "Network error occurred.",
      };
    }
  };

  const handleClear = () => {
    setValidationResult(null);
    setMetadata(null);
    setErrorMsg(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      {/* 1. Cinematic Splash Intro Overlay (Plays Before Page Reveals) */}
      {showSplash && <SplashIntro onComplete={() => setShowSplash(false)} />}

      <Header />

      {/* Floating Watermark Badge - Created by Shiyam S */}
      <div className="fixed bottom-5 right-5 z-40 hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-xl shadow-cyan-950/40 backdrop-blur-md hover:scale-105 transition-all">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>Created by Shiyam S</span>
      </div>

      {/* Decorative Premium Background Glow Orbs */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-red-600/20 via-purple-600/20 to-cyan-600/20 blur-[140px] pointer-events-none -z-10 rounded-full" />
      <div className="fixed bottom-10 left-1/4 w-[450px] h-[280px] bg-cyan-600/15 blur-[120px] pointer-events-none -z-10 rounded-full" />
      <div className="fixed top-1/3 right-10 w-[350px] h-[250px] bg-pink-600/10 blur-[100px] pointer-events-none -z-10 rounded-full" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center justify-start gap-8 sm:gap-12">
        {/* Animated Intro Hero Section */}
        <section className="text-center max-w-3xl flex flex-col items-center gap-5 relative">
          {/* Glowing Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4.5 py-2 rounded-full bg-gradient-to-r from-cyan-950/90 via-zinc-900 to-purple-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-extrabold shadow-2xl shadow-cyan-950/50 animate-fade-in backdrop-blur-md">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Next-Gen Media Downloader & Stream Merging Engine</span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-[10px] uppercase font-mono text-cyan-200 border border-cyan-500/30">
              v1.0 Live
            </span>
          </div>

          {/* Hero Main Heading with Animated Premium Gradient Text */}
          <h1 className="text-3xl sm:text-6xl font-black tracking-tight leading-[1.12]">
            Download <span className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-400 bg-clip-text text-transparent">YouTube</span> &{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">Instagram</span> Media in{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">High Quality</span>
          </h1>

          {/* Intro Description */}
          <p className="text-sm sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Extract 720p, 1080p, 4K MP4 videos & 320kbps MP3 audio streams instantly with automatic FFmpeg stream merging.
          </p>

          {/* Interactive Feature Pills */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap pt-2 text-xs font-semibold text-zinc-300">
            <div className="px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800/90 flex items-center gap-2 shadow-sm backdrop-blur-sm">
              <Film className="w-4 h-4 text-cyan-400" />
              <span>4K / 1080p / 720p MP4</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800/90 flex items-center gap-2 shadow-sm backdrop-blur-sm">
              <Music className="w-4 h-4 text-purple-400" />
              <span>320kbps MP3 Audio</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800/90 flex items-center gap-2 shadow-sm backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>No Registration Required</span>
            </div>
          </div>
        </section>

        {/* Interactive URL Form Container */}
        <div className="w-full relative z-10">
          <UrlForm
            onValidate={handleAnalyze}
            result={validationResult}
            isLoading={isLoading}
            onClear={handleClear}
          />
        </div>

        {/* Extraction Error Alert Banner */}
        {errorMsg && (
          <div className="w-full max-w-2xl p-4 sm:p-5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs sm:text-sm flex items-center gap-3 shadow-xl shadow-rose-950/30 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-extrabold text-rose-200">Extraction Notice</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Real Extracted YouTube / Instagram Media Card */}
        {metadata && <MediaCard metadata={metadata} />}

        {/* Interactive Video + Music Merging Intro Showcase */}
        {!metadata && <StreamMergeIntro />}

        {/* Download Features & Quality Highlights Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-4">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 flex flex-col items-start gap-3 hover:border-red-500/40 transition-all group backdrop-blur-sm">
            <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 group-hover:scale-110 transition-transform">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-100 flex items-center gap-2">
                YouTube MP4 & MP3
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                Extracts 360p, 720p HD, 1080p Full HD & 4K video formats alongside 128kbps-320kbps MP3 audio.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 flex flex-col items-start gap-3 hover:border-pink-500/40 transition-all group backdrop-blur-sm">
            <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 group-hover:scale-110 transition-transform">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-100 flex items-center gap-2">
                Instagram Reels & Posts
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                Downloads public Instagram Reels and video posts straight to playable MP4 format.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 flex flex-col items-start gap-3 hover:border-cyan-500/40 transition-all group backdrop-blur-sm">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-100 flex items-center gap-2">
                FFmpeg Stream Merging
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                Serverless high-res video and audio stream merging guarantees clean, playable media files.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
