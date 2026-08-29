"use client";

import React, { useState } from "react";
import { MediaMetadata } from "@/lib/types/media";
import { Clock, User, Video, Music, ExternalLink, Youtube, Instagram, Sparkles, Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface MediaCardProps {
  metadata: MediaMetadata;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "Reel / Video";
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
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const videoFormats = metadata.formats.video || [];
  const audioFormats = metadata.formats.audio || [];

  const handleMediaDownload = async (type: "mp3" | "mp4", qualityLabel: string) => {
    setDownloadingQuality(qualityLabel);
    setDownloadError(null);
    setDownloadSuccess(null);

    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(metadata.url)}&type=${type}&quality=${encodeURIComponent(qualityLabel)}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const typeLabel = type.toUpperCase();
      setDownloadSuccess(`Started downloading ${metadata.platform === "instagram" ? "Instagram Video" : typeLabel} (${qualityLabel})!`);
      setTimeout(() => setDownloadingQuality(null), 4000);
    } catch (err: any) {
      setDownloadError(`Failed to initiate download. Please try again.`);
      setDownloadingQuality(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-zinc-900/90 border border-zinc-800/90 shadow-2xl shadow-cyan-950/20 overflow-hidden backdrop-blur-xl animate-fade-in">
      {/* Top Banner Header */}
      <div className="px-5 py-3.5 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-xl ${isInstagram ? "bg-pink-500/15 text-pink-400 border border-pink-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
            {isInstagram ? <Instagram className="w-4 h-4" /> : <Youtube className="w-4 h-4" />}
          </span>
          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
            {isInstagram ? "Instagram Media Details" : "YouTube Media Details"}
          </span>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-3 py-1 rounded-full font-semibold">
          ID: {metadata.id}
        </span>
      </div>

      {/* Main Preview Grid: Thumbnail + Title & Uploader */}
      <div className="p-5 sm:p-6 flex flex-col md:flex-row gap-5 items-start">
        {/* Responsive Thumbnail Container */}
        <div className="relative w-full md:w-64 aspect-video rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 group shadow-md">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
              <Instagram className="w-8 h-8" />
            </div>
          )}
          {/* Duration Overlay Badge */}
          <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-zinc-950/85 backdrop-blur-md text-zinc-200 text-xs font-mono font-medium flex items-center gap-1.5 border border-zinc-800 shadow-lg">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formatDuration(metadata.duration)}</span>
          </div>
        </div>

        {/* Info Column */}
        <div className="flex-1 flex flex-col justify-between w-full">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white leading-snug line-clamp-2 hover:line-clamp-none transition-all">
              {metadata.title}
            </h2>

            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-zinc-200 font-semibold">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate max-w-[180px] sm:max-w-[240px]">
                  {metadata.uploader}
                </span>
              </div>

              <a
                href={metadata.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-zinc-400 hover:text-cyan-400 hover:border-cyan-800/80 transition-colors font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Original Post</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Real Formats Download Section */}
      <div className="p-5 sm:p-6 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-zinc-200">
              Download Media Options
            </h3>
          </div>

          {/* Format Selector Tab Pills */}
          {!isInstagram && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
              <button
                onClick={() => setActiveTab("video")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all min-h-[36px] ${
                  activeTab === "video"
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video MP4 ({videoFormats.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("audio")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all min-h-[36px] ${
                  activeTab === "audio"
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Audio MP3 ({audioFormats.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Download Feedback Banners */}
        {downloadSuccess && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}
        {downloadError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{downloadError}</span>
          </div>
        )}

        {/* Video MP4 Options Grid */}
        {activeTab === "video" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {videoFormats.length > 0 ? (
              videoFormats.map((fmt, idx) => {
                const isDownloading = downloadingQuality === fmt.quality;
                return (
                  <div
                    key={`${fmt.quality}-${idx}`}
                    className="p-3.5 rounded-2xl border bg-zinc-900/90 border-zinc-800 flex items-center justify-between gap-3 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-950/20 transition-all group"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{fmt.quality}</span>
                        {fmt.height && fmt.height >= 1080 && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 uppercase">
                            HD
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-1 font-mono">
                        Playable Video Stream • MP4
                      </span>
                    </div>

                    <button
                      onClick={() => handleMediaDownload("mp4", fmt.quality)}
                      disabled={!!downloadingQuality}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 min-h-[44px]"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Processing...</span>
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
              <div className="col-span-full p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-400">
                No video formats available.
              </div>
            )}
          </div>
        )}

        {/* Audio MP3 Options Grid (YouTube Only) */}
        {!isInstagram && activeTab === "audio" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {audioFormats.length > 0 ? (
              audioFormats.map((fmt, idx) => {
                const isDownloading = downloadingQuality === fmt.quality;
                return (
                  <div
                    key={`${fmt.quality}-${idx}`}
                    className="p-3.5 rounded-2xl border bg-zinc-900/90 border-zinc-800 flex items-center justify-between gap-3 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-950/20 transition-all group"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-cyan-400" />
                        <span>MP3 Audio ({fmt.quality})</span>
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-1 font-mono">
                        High Quality Audio • MP3
                      </span>
                    </div>

                    <button
                      onClick={() => handleMediaDownload("mp3", fmt.quality)}
                      disabled={!!downloadingQuality}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 min-h-[44px]"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Preparing...</span>
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
              <div className="col-span-full p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-400">
                No audio formats available.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
