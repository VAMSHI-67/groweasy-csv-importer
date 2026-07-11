"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import type { SkippedRow } from "@groweasy/shared";
import { cn } from "@/lib/utils";

interface SkippedRowsPanelProps {
  skippedRows: SkippedRow[];
}

export function SkippedRowsPanel({ skippedRows }: SkippedRowsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (skippedRows.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-amber-300 hover:bg-amber-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>
            {skippedRows.length} Skipped Row{skippedRows.length !== 1 ? "s" : ""}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-amber-500/20 max-h-[300px] overflow-auto">
          {skippedRows.map((row, index) => (
            <div
              key={index}
              className={cn(
                "px-4 py-3 border-b border-amber-500/10 last:border-0",
                index % 2 === 0 ? "bg-transparent" : "bg-amber-500/5"
              )}
            >
              <p className="text-xs font-medium text-amber-300 mb-1">
                Reason: {row.reason}
              </p>
              <p className="text-xs text-white/40 font-mono break-all">
                {JSON.stringify(row.original_row, null, 0).slice(0, 300)}
                {JSON.stringify(row.original_row).length > 300 ? "…" : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
