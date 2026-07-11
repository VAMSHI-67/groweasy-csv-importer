"use client";

import { FileSpreadsheet, Columns3, Rows3, Check, X } from "lucide-react";

interface ConfirmBarProps {
  fileName: string;
  totalRows: number;
  totalColumns: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function ConfirmBar({
  fileName,
  totalRows,
  totalColumns,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <FileSpreadsheet className="w-4 h-4 text-violet-400" />
          <span className="font-medium text-white/90 truncate max-w-[200px]">
            {fileName}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5">
            <Rows3 className="w-3.5 h-3.5" />
            {totalRows.toLocaleString()} rows
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5">
            <Columns3 className="w-3.5 h-3.5" />
            {totalColumns} columns
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl shadow-lg shadow-violet-500/20 transition-all duration-200 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          <Check className="w-4 h-4" />
          Confirm Import
        </button>
      </div>
    </div>
  );
}
