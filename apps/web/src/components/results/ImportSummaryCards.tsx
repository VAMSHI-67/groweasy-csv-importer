"use client";

import { CheckCircle2, XCircle, FileDown, ArrowRight } from "lucide-react";

interface ImportSummaryCardsProps {
  totalInputRows: number;
  totalImported: number;
  totalSkipped: number;
}

export function ImportSummaryCards({
  totalInputRows,
  totalImported,
  totalSkipped,
}: ImportSummaryCardsProps) {
  const successRate =
    totalInputRows > 0
      ? Math.round((totalImported / totalInputRows) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Input */}
      <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-5">
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl -translate-y-4 translate-x-4" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-1">
            <FileDown className="w-4 h-4" />
            Total Rows
          </div>
          <p className="text-3xl font-bold text-white tabular-nums">
            {totalInputRows.toLocaleString()}
          </p>
          <p className="text-xs text-white/40 mt-1">in source CSV</p>
        </div>
      </div>

      {/* Imported */}
      <div className="relative overflow-hidden rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-5">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl -translate-y-4 translate-x-4" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-emerald-400/70 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            Imported
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-emerald-400 tabular-nums">
              {totalImported.toLocaleString()}
            </p>
            <span className="text-sm text-emerald-400/50 font-medium">
              {successRate}%
            </span>
          </div>
          <p className="text-xs text-emerald-400/40 mt-1">
            successfully mapped
          </p>
        </div>
      </div>

      {/* Skipped */}
      <div className="relative overflow-hidden rounded-xl bg-amber-500/5 border border-amber-500/20 p-5">
        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl -translate-y-4 translate-x-4" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-amber-400/70 mb-1">
            <XCircle className="w-4 h-4" />
            Skipped
          </div>
          <p className="text-3xl font-bold text-amber-400 tabular-nums">
            {totalSkipped.toLocaleString()}
          </p>
          <p className="text-xs text-amber-400/40 mt-1">
            missing contact info
          </p>
        </div>
      </div>
    </div>
  );
}
