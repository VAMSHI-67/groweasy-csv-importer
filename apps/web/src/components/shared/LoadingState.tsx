"use client";

import { Loader2, X } from "lucide-react";

interface LoadingStateProps {
  elapsedSeconds: number;
  onCancel: () => void;
}

export function LoadingState({ elapsedSeconds, onCancel }: LoadingStateProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
      ? `${mins}m ${secs.toString().padStart(2, "0")}s`
      : `${secs}s`;
  };

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      {/* Animated loader */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-white/10" />
        <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-violet-500 border-r-fuchsia-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "3s" }} />
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-white/90">
          AI is extracting your data...
        </h3>
        <p className="mt-1 text-sm text-white/50">
          Mapping columns to CRM schema using semantic understanding
        </p>
      </div>

      {/* Progress bar animation */}
      <div className="w-full max-w-sm">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 rounded-full animate-pulse"
            style={{
              width: "100%",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-white/40 font-mono tabular-nums">
          Elapsed: {formatTime(elapsedSeconds)}
        </span>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
}
