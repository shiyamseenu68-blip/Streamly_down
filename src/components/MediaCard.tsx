"use client";

import React, { useState } from "react";
import { MediaMetadata } from "@/lib/types/media";
import {
  Clock,
  User,
  Video,
  Music,
  ExternalLink,
  Youtube,
  Instagram,
  Sparkles,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Film,
  ArrowDownCircle
} from "lucide-react";

interface MediaCardProps {
  metadata: MediaMetadata;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "Reel / Short";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MediaCard({ metadata }: MediaCardProps) {
  const isInstagram = metadata.platform === "instagram";
  const [activeTab, setActiveTab] = useState<"video" | "audio">("video");
  const [downloadingQuality, setDownloadingQuality] = useState<string | null>(null);
  const [downloadStep, setDownloadStep] = useState<string>("");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const videoFormats = metadata.formats.video || [];
  const audioFormats = metadata.formats.audio || [];

  const handleMediaDownload = async (type: "mp3" | "mp4", qualityLabel: string) => {
    setDownloadingQuality(qualityLabel);
    setDownloadError(null);
    setDownloadSuccess(null);
    setDownloadStep("Initializing high-speed stream...");

    // Simulated animated progress steps for visual feedback
    const stepTimer1 = setTimeout(() => {
      setDownloadStep("Processing media codecs with FFmpeg...");
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setDownloadStep("Finalizing stream file & starting download!");
    }, 2800);

    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(metadata.url)}&type=${type}&quality=${encodeURIComponent(qualityLabel)}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        const typeLabel = type.toUpperCase();
        setDownloadSuccess(`Successfully initiated ${typeLabel} download (${qualityLabel})! Check your browser downloads.`);
        setDownloadingQuality(null);
        setDownloadStep("");
      }, 3500);
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setDownloadError(`Failed to initiate download. Please try again.`);
      setDownloadingQuality(null);
      setDownloadStep("");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-3xl bg-zinc-900/90 border border-zinc-800/90 shadow-2xl shadow-cyan-950/30 overflow-hidden backdrop-blur-xl animate-fade-in transition-all">
      {/* Top Banner Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`p-2 rounded-xl shadow-md ${isInstagram ? "bg-pink-500/20 text-pink-400 border border-pink-500/30 shadow-pink-950/30" : "bg-red-500/20 text-red-400 border border-red-500/30 shadow-red-950/30"}`}>
            {isInstagram ? <Instagram className="w-4 h-4" /> : <Youtube className="w-4 h-4" />}
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
              {isInstagram ? "Instagram Media Extracted" : "YouTube Media Extracted"}
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="text-[10px] text-zinc-400">FFmpeg Ready • Genuine Formats</span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-700/60 px-3 py-1 rounded-full font-semibold shadow-inner">
          ID: {metadata.id}
        </span>
      </div>

      {/* Main Preview Grid: Thumbnail + Title & Uploader */}
      <div className="p-5 sm:p-7 flex flex-col md:flex-row gap-6 items-start">
        {/* Responsive Thumbnail Container with Glowing Effect */}
        <div className="relative w-full md:w-72 aspect-video rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/90 shrink-0 group shadow-xl shadow-black/50">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
              <Film className="w-10 h-10" />
            </div>
          )}
          
          {/* Platform Badge Overlay */}
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 border border-zinc-800 shadow-md">
            {isInstagram ? <Instagram className="w-3.5 h-3.5 text-pink-400" /> : <Youtube className="w-3.5 h-3.5 text-red-400" />}
            <span>{isInstagram ? "Instagram" : "YouTube"}</span>
          </div>

          {/* Duration Overlay Badge */}
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-zinc-950/90 backdrop-blur-md text-zinc-100 text-xs font-mono font-bold flex items-center gap-1.5 border border-zinc-800 shadow-lg">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formatDuration(metadata.duration)}</span>
          </div>
        </div>

        {/* Info Column */}
        <div className="flex-1 flex flex-col justify-between w-full">
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-white leading-snug tracking-tight">
              {metadata.title}
            </h2>

            <div className="mt-4 flex items-center gap-2.5 text-xs text-zinc-400 flex-wrap">
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-200 font-semibold shadow-inner">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate max-w-[200px] sm:max-w-[260px]">
                  {metadata.uploader}
                </span>
              </div>

              <a
                href={metadata.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:text-cyan-300 hover:border-cyan-700/80 transition-all font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Original Link</span>
              </a>
            </div>
          </div>

          {/* Quality Quick Indicator Pills */}
          <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Available Qualities:</span>
            {videoFormats.slice(0, 4).map((f) => (
              <span key={f.quality} className="px-2.5 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-mono text-[11px] font-semibold">
                {f.quality}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Real Formats Download Section */}
      <div className="p-5 sm:p-7 border-t border-zinc-800/80 bg-gradient-to-b from-zinc-950/40 to-zinc-950/90">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-100">
                Select Download Format & Quality
              </h3>
              <p className="text-[11px] text-zinc-400">High-speed serverless extraction with FFmpeg merging</p>
            </div>
          </div>

          {/* Format Selector Tab Pills */}
          {!isInstagram && (
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-inner">
              <button
                onClick={() => setActiveTab("video")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all min-h-[40px] ${
                  activeTab === "video"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>MP4 Video ({videoFormats.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("audio")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all min-h-[40px] ${
                  activeTab === "audio"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>MP3 Audio ({audioFormats.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Interactive Download Feedback Banners */}
        {downloadSuccess && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-3 shadow-lg shadow-emerald-950/30 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}
        {downloadError && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-3 shadow-lg shadow-rose-950/30 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{downloadError}</span>
          </div>
        )}

        {/* Global Active Download Animation Card */}
        {downloadingQuality && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-zinc-900 to-purple-950/80 border border-cyan-500/40 shadow-xl shadow-cyan-950/30 animate-pulse">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  <ArrowDownCircle className="w-5 h-5 text-cyan-400 absolute" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    Downloading {activeTab.toUpperCase()} ({downloadingQuality})
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] uppercase font-mono">
                      In Progress
                    </span>
                  </span>
                  <span className="text-[11px] text-cyan-300/90 font-mono mt-0.5">
                    {downloadStep || "Preparing stream transfer..."}
                  </span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Processing</span>
              </div>
            </div>
            {/* Animated Progress Bar */}
            <div className="w-full h-1.5 bg-zinc-950 rounded-full mt-3.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full animate-pulse transition-all duration-1000 w-full" />
            </div>
          </div>
        )}

        {/* Video MP4 Options Grid */}
        {activeTab === "video" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {videoFormats.length > 0 ? (
              videoFormats.map((fmt, idx) => {
                const isDownloading = downloadingQuality === fmt.quality;
                const isHD = fmt.height && fmt.height >= 720;
                const is4K = fmt.height && fmt.height >= 1440;
                return (
                  <div
                    key={`${fmt.quality}-${idx}`}
                    className="p-4 rounded-2xl border bg-zinc-900/90 border-zinc-800/90 flex items-center justify-between gap-3 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-950/30 transition-all group"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-white flex items-center gap-2">
                        <Video className="w-4 h-4 text-cyan-400" />
                        <span>{fmt.quality}</span>
                        {is4K ? (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-purple-500/20 text-purple-300 rounded-md border border-purple-500/40 uppercase">
                            4K Ultra
                          </span>
                        ) : isHD ? (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 rounded-md border border-cyan-500/40 uppercase">
                            HD Video
                          </span>
                        ) : null}
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-1 font-mono flex items-center gap-1.5">
                        <span>MP4 Format</span>
                        <span>•</span>
                        <span>{fmt.height ? `${fmt.height}p` : "720p HD"}</span>
                        {fmt.fps && <span>• {fmt.fps} FPS</span>}
                      </span>
                    </div>

                    <button
                      onClick={() => handleMediaDownload("mp4", fmt.quality)}
                      disabled={!!downloadingQuality}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 min-h-[44px]"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 text-white" />
                          <span>Download</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-400">
                No video formats available for this media.
              </div>
            )}
          </div>
        )}

        {/* Audio MP3 Options Grid (YouTube Only) */}
        {!isInstagram && activeTab === "audio" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {audioFormats.length > 0 ? (
              audioFormats.map((fmt, idx) => {
                const isDownloading = downloadingQuality === fmt.quality;
                const is320 = fmt.quality.includes("320");
                return (
                  <div
                    key={`${fmt.quality}-${idx}`}
                    className="p-4 rounded-2xl border bg-zinc-900/90 border-zinc-800/90 flex items-center justify-between gap-3 hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-950/30 transition-all group"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-white flex items-center gap-2">
                        <Music className="w-4 h-4 text-purple-400" />
                        <span>MP3 Audio ({fmt.quality})</span>
                        {is320 && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-purple-500/20 text-purple-300 rounded-md border border-purple-500/40 uppercase">
                            Max Quality
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-1 font-mono flex items-center gap-1.5">
                        <span>MP3 Format</span>
                        <span>•</span>
                        <span>Stereo Audio</span>
                        <span>•</span>
                        <span>{fmt.quality}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => handleMediaDownload("mp3", fmt.quality)}
                      disabled={!!downloadingQuality}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 min-h-[44px]"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 text-white" />
                          <span>Download MP3</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-400">
                No audio formats available for this media.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
