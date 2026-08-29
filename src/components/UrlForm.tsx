"use client";

import React, { useState } from "react";
import { Search, Clipboard, X, Loader2, CheckCircle2, AlertCircle, Youtube, Instagram } from "lucide-react";
import { ValidationResult } from "@/lib/types/media";

interface UrlFormProps {
  onValidate: (url: string) => Promise<ValidationResult>;
  result: ValidationResult | null;
  isLoading: boolean;
  onClear: () => void;
}

export function UrlForm({ onValidate, result, isLoading, onClear }: UrlFormProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    await onValidate(url);
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text);
          await onValidate(text);
        }
      }
    } catch {
      // Ignore permission errors gracefully
    }
  };

  const handleClearInput = () => {
    setUrl("");
    onClear();
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 animate-fade-in">
      {/* Input Container */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex flex-col sm:flex-row gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl focus-within:border-cyan-500/60 focus-within:shadow-cyan-500/10 transition-all duration-300">
          <div className="relative flex-1 flex items-center min-h-[48px]">
            <Search className="absolute left-3.5 w-5 h-5 text-zinc-500 pointer-events-none" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube or Instagram link here..."
              className="w-full h-12 pl-11 pr-12 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-zinc-100 placeholder:text-zinc-500 text-sm focus:outline-none focus:border-cyan-500/80 transition-all"
              disabled={isLoading}
              autoComplete="off"
            />
            {url ? (
              <button
                type="button"
                onClick={handleClearInput}
                className="absolute right-3.5 w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-colors min-h-[32px] min-w-[32px]"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-3 px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors border border-zinc-700/60 min-h-[36px]"
                title="Paste link from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Paste Link</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="h-12 px-7 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 font-bold text-sm text-white shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all min-w-[130px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing...</span>
              </>
            ) : (
              <span>Analyze</span>
            )}
          </button>
        </div>
      </form>

      {/* Validation Result Display Card */}
      {result && (
        <div
          className={`w-full p-4 sm:p-5 rounded-2xl border backdrop-blur-md transition-all animate-fade-in ${
            result.isValid
              ? "bg-zinc-900/90 border-emerald-500/40 shadow-xl shadow-emerald-950/20"
              : "bg-zinc-900/90 border-rose-500/40 shadow-xl shadow-rose-950/20"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {result.isValid ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              )}

              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">
                    {result.isValid ? "Valid Media Link Confirmed" : "Link Validation Error"}
                  </span>

                  {result.isValid && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        result.platform === "youtube"
                          ? "bg-red-500/15 text-red-400 border border-red-500/30"
                          : "bg-pink-500/15 text-pink-400 border border-pink-500/30"
                      }`}
                    >
                      {result.platform === "youtube" ? (
                        <>
                          <Youtube className="w-3.5 h-3.5" />
                          <span>YouTube ({result.contentType})</span>
                        </>
                      ) : (
                        <>
                          <Instagram className="w-3.5 h-3.5" />
                          <span>Instagram ({result.contentType})</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">{result.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
