"use client";

import { useState, useCallback, useRef } from "react";
import type { ExtractionResult } from "@groweasy/shared";
import { parseCSVFile, type ParsedCSV } from "@/lib/csvParser";
import { extractCSV, ApiClientError } from "@/lib/apiClient";

export type ImportFlowStep =
  | "upload"
  | "previewing"
  | "processing"
  | "results"
  | "error";

export interface ImportFlowState {
  step: ImportFlowStep;
  file: File | null;
  parsedCSV: ParsedCSV | null;
  result: ExtractionResult | null;
  error: string | null;
  errorCode: string | null;
  isLoading: boolean;
  elapsedSeconds: number;
}

export interface ImportFlowActions {
  handleFileAccepted: (file: File) => Promise<void>;
  handleConfirmImport: () => Promise<void>;
  handleRetry: () => Promise<void>;
  handleReset: () => void;
  handleCancel: () => void;
}

/**
 * State machine hook for the CSV import flow.
 * Manages transitions: upload → previewing → processing → results | error
 */
export function useCsvImportFlow(): ImportFlowState & ImportFlowActions {
  const [step, setStep] = useState<ImportFlowStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleFileAccepted = useCallback(
    async (acceptedFile: File) => {
      setFile(acceptedFile);
      setError(null);
      setErrorCode(null);
      setIsLoading(true);
      setStep("upload");

      try {
        const parsed = await parseCSVFile(acceptedFile);
        if (parsed.totalRows === 0) {
          setError(
            "The CSV file appears to be empty or has no valid data rows."
          );
          setStep("error");
          return;
        }
        setParsedCSV(parsed);
        setStep("previewing");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse CSV file"
        );
        setStep("error");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleConfirmImport = useCallback(async () => {
    if (!parsedCSV) return;

    setStep("processing");
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    startTimer();

    abortControllerRef.current = new AbortController();

    try {
      const extractionResult = await extractCSV(
        parsedCSV.headers,
        parsedCSV.rows,
        abortControllerRef.current.signal
      );
      setResult(extractionResult);
      setStep("results");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setStep("previewing");
        return;
      }

      if (err instanceof ApiClientError) {
        setError(err.message);
        setErrorCode(err.code);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during extraction"
        );
        setErrorCode("UNKNOWN_ERROR");
      }
      setStep("error");
    } finally {
      setIsLoading(false);
      stopTimer();
      abortControllerRef.current = null;
    }
  }, [parsedCSV, startTimer, stopTimer]);

  const handleRetry = useCallback(async () => {
    await handleConfirmImport();
  }, [handleConfirmImport]);

  const handleReset = useCallback(() => {
    stopTimer();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStep("upload");
    setFile(null);
    setParsedCSV(null);
    setResult(null);
    setError(null);
    setErrorCode(null);
    setIsLoading(false);
    setElapsedSeconds(0);
  }, [stopTimer]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopTimer();
    setStep("previewing");
    setIsLoading(false);
  }, [stopTimer]);

  return {
    step,
    file,
    parsedCSV,
    result,
    error,
    errorCode,
    isLoading,
    elapsedSeconds,
    handleFileAccepted,
    handleConfirmImport,
    handleRetry,
    handleReset,
    handleCancel,
  };
}
