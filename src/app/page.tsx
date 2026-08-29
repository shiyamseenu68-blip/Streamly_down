"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UrlForm } from "@/components/UrlForm";
import { MediaCard } from "@/components/MediaCard";
import { ValidationResult, MediaMetadata } from "@/lib/types/media";
import { Youtube, Instagram, Smartphone, Sparkles, AlertCircle, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
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
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center justify-start gap-8 sm:gap-10">
        {/* Stage 8 Hero Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold shadow-lg shadow-cyan-950/30 animate-fade-in">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Stage 8 Active — Premium Responsive UI/UX System</span>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-2xl animate-fade-in">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15]">
            Modern Media Downloader for{" "}
            <span className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              YouTube
            </span>{" "}
            &{" "}
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Instagram
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
            Paste any public YouTube or Instagram link to analyze media, inspect genuine bitrates, and download MP3 or MP4 files instantly.
          </p>
        </div>

        {/* Interactive URL Form */}
        <div className="w-full">
          <UrlForm
            onValidate={handleAnalyze}
            result={validationResult}
            isLoading={isLoading}
            onClear={handleClear}
          />
        </div>

        {/* Extraction Error Alert Banner */}
        {errorMsg && (
          <div className="w-full max-w-2xl p-4 sm:p-5 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs sm:text-sm flex items-center gap-3 shadow-xl shadow-rose-950/20 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-rose-200">Extraction Error</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Real Extracted YouTube / Instagram Metadata Card */}
        {metadata && <MediaCard metadata={metadata} />}

        {/* Premium Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col items-start gap-2.5 hover:border-zinc-700 transition-colors">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Youtube className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-200">YouTube MP3 & MP4 HD</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Extracts 128-320kbps MP3 audio & merges 720p/1080p/4K MP4 video streams via FFmpeg.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col items-start gap-2.5 hover:border-zinc-700 transition-colors">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Instagram className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-200">Instagram Reels & Posts</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Extracts public Instagram Reels and video posts directly into playable MP4 files.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col items-start gap-2.5 hover:border-zinc-700 transition-colors">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-200">100% Mobile Ready</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Native touch targets ($\ge 44$px) and zero horizontal scroll across 320px to 1440px+ screens.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
