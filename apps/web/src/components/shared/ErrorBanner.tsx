"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  code?: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({
  message,
  code,
  onRetry,
  onDismiss,
}: ErrorBannerProps) {
  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-300">{message}</p>
          {code && (
            <p className="mt-1 text-xs text-red-400/60 font-mono">
              Error code: {code}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400/60 hover:text-red-400 text-xs transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
