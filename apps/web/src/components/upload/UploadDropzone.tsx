"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFileAccepted: (file: File) => void;
  isLoading: boolean;
  maxSizeMB?: number;
}

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export function UploadDropzone({
  onFileAccepted,
  isLoading,
  maxSizeMB = 15,
}: UploadDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        "text/csv": [".csv"],
        "application/vnd.ms-excel": [".csv"],
      },
      maxSize: MAX_SIZE_BYTES,
      maxFiles: 1,
      disabled: isLoading,
    });

  const rejectionError = fileRejections[0]?.errors[0];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ease-out",
          isDragActive
            ? "border-violet-400 bg-violet-500/10 scale-[1.02] shadow-lg shadow-violet-500/20"
            : "border-white/20 bg-white/5 hover:border-violet-400/60 hover:bg-white/10 hover:shadow-lg hover:shadow-violet-500/10",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />

        {/* Animated gradient border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />

        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "p-4 rounded-2xl transition-all duration-300",
              isDragActive
                ? "bg-violet-500/20 text-violet-300"
                : "bg-white/10 text-white/60 group-hover:bg-violet-500/10 group-hover:text-violet-300"
            )}
          >
            {isDragActive ? (
              <FileSpreadsheet className="w-12 h-12 animate-bounce" />
            ) : (
              <Upload className="w-12 h-12 group-hover:scale-110 transition-transform" />
            )}
          </div>

          <div>
            <p className="text-lg font-semibold text-white/90">
              {isDragActive
                ? "Drop your CSV file here"
                : "Drag & drop your CSV file"}
            </p>
            <p className="mt-1 text-sm text-white/50">
              or{" "}
              <span className="text-violet-400 underline underline-offset-2">
                click to browse
              </span>{" "}
              · Max {maxSizeMB}MB
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/40">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Supports .csv files from any source</span>
          </div>
        </div>
      </div>

      {rejectionError && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            {rejectionError.code === "file-too-large"
              ? `File is too large. Maximum size is ${maxSizeMB}MB.`
              : rejectionError.code === "file-invalid-type"
                ? "Invalid file type. Please upload a .csv file."
                : rejectionError.message}
          </span>
        </div>
      )}
    </div>
  );
}
