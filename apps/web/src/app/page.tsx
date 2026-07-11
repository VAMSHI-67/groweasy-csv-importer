"use client";

import { useCallback } from "react";
import { useCsvImportFlow } from "@/hooks/useCsvImportFlow";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { PreviewTable } from "@/components/preview/PreviewTable";
import { ConfirmBar } from "@/components/preview/ConfirmBar";
import { ResultsTable } from "@/components/results/ResultsTable";
import { ImportSummaryCards } from "@/components/results/ImportSummaryCards";
import { SkippedRowsPanel } from "@/components/results/SkippedRowsPanel";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { CrmRecord } from "@groweasy/shared";
import {
  Download,
  FileJson,
  RotateCcw,
  Sparkles,
  Database,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const flow = useCsvImportFlow();

  const handleExportJSON = useCallback(() => {
    if (!flow.result) return;
    const blob = new Blob([JSON.stringify(flow.result.imported, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "groweasy_import.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [flow.result]);

  const handleExportCSV = useCallback(() => {
    if (!flow.result || flow.result.imported.length === 0) return;

    const headers = Object.keys(flow.result.imported[0]);
    const csvRows = [
      headers.join(","),
      ...flow.result.imported.map((record: CrmRecord) =>
        headers
          .map((h) => {
            const val = record[h as keyof CrmRecord];
            const str = val === null || val === undefined ? "" : String(val);
            // Escape commas and quotes
            return str.includes(",") || str.includes('"')
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "groweasy_import.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [flow.result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/30 to-slate-950">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
        <div className="absolute top-3/4 left-1/2 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                GrowEasy
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-violet-400/80 font-semibold">
                Lead Importer
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { step: "upload", label: "Upload" },
            { step: "preview", label: "Preview" },
            { step: "process", label: "Extract" },
            { step: "results", label: "Results" },
          ].map((s, i) => {
            const isActive =
              (s.step === "upload" && flow.step === "upload") ||
              (s.step === "preview" && flow.step === "previewing") ||
              (s.step === "process" && flow.step === "processing") ||
              (s.step === "results" && flow.step === "results");
            const isPast =
              (s.step === "upload" && flow.step !== "upload") ||
              (s.step === "preview" &&
                ["processing", "results"].includes(flow.step)) ||
              (s.step === "process" && flow.step === "results");

            return (
              <div key={s.step} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      : isPast
                        ? "bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20"
                        : "bg-white/5 text-white/30 border border-white/10"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? "bg-violet-500/30"
                        : isPast
                          ? "bg-emerald-500/20"
                          : "bg-white/10"
                    }`}
                  >
                    {isPast ? "✓" : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < 3 && (
                  <ArrowRight
                    className={`w-3 h-3 ${isPast ? "text-emerald-500/40" : "text-white/15"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Upload Step */}
        {flow.step === "upload" && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Extraction
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
                Import your leads in seconds
              </h2>
              <p className="text-white/50 max-w-lg mx-auto">
                Upload any CSV — Facebook Ads, Google Ads, Excel exports, CRM
                exports — and our AI will automatically map it to your CRM
                schema.
              </p>
            </div>
            <UploadDropzone
              onFileAccepted={flow.handleFileAccepted}
              isLoading={flow.isLoading}
            />
          </div>
        )}

        {/* Preview Step */}
        {flow.step === "previewing" && flow.parsedCSV && (
          <div className="space-y-4 animate-fade-in-up">
            <ConfirmBar
              fileName={flow.file?.name ?? "unknown.csv"}
              totalRows={flow.parsedCSV.totalRows}
              totalColumns={flow.parsedCSV.headers.length}
              onConfirm={flow.handleConfirmImport}
              onCancel={flow.handleReset}
              isLoading={flow.isLoading}
            />
            <PreviewTable
              headers={flow.parsedCSV.headers}
              rows={flow.parsedCSV.rows}
            />
          </div>
        )}

        {/* Processing Step */}
        {flow.step === "processing" && (
          <div className="animate-fade-in-up">
            <LoadingState
              elapsedSeconds={flow.elapsedSeconds}
              onCancel={flow.handleCancel}
            />
          </div>
        )}

        {/* Error Step */}
        {flow.step === "error" && (
          <div className="space-y-4 animate-fade-in-up">
            <ErrorBanner
              message={flow.error ?? "An unexpected error occurred"}
              code={flow.errorCode}
              onRetry={flow.parsedCSV ? flow.handleRetry : undefined}
              onDismiss={flow.handleReset}
            />
            {flow.parsedCSV && (
              <div className="text-center">
                <button
                  onClick={flow.handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Upload a different file
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Step */}
        {flow.step === "results" && flow.result && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Import Complete
                </h2>
                <p className="text-sm text-white/50">
                  Your CSV has been processed and mapped to the GrowEasy CRM
                  schema.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                >
                  <FileJson className="w-4 h-4" />
                  Export JSON
                </button>
                <button
                  onClick={flow.handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl shadow-lg shadow-violet-500/20 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Import
                </button>
              </div>
            </div>

            <ImportSummaryCards
              totalInputRows={flow.result.total_input_rows}
              totalImported={flow.result.total_imported}
              totalSkipped={flow.result.total_skipped}
            />

            {flow.result.imported.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
                  Imported Records
                </h3>
                <ResultsTable records={flow.result.imported} />
              </div>
            )}

            <SkippedRowsPanel skippedRows={flow.result.skipped} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <p className="text-xs text-white/30">
            © 2024 GrowEasy Lead Importer. AI-powered CRM data extraction.
          </p>
          <p className="text-xs text-white/20">
            Built with Next.js, Express, & Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
}
