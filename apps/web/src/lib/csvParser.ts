import Papa from "papaparse";

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  errors: string[];
}

/**
 * Parse a CSV file client-side using PapaParse.
 * Returns headers + rows for preview. No AI processing.
 */
export function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, unknown>[] = [];
    const errors: string[] = [];

    let headers: string[] = [];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      // Use streaming for large files
      step: (result) => {
        if (headers.length === 0 && result.meta.fields) {
          headers = result.meta.fields;
        }
        if (result.errors.length > 0) {
          for (const err of result.errors) {
            if (errors.length < 10) {
              errors.push(`Row ${rows.length + 1}: ${err.message}`);
            }
          }
        }
        if (result.data && typeof result.data === "object") {
          rows.push(result.data as Record<string, unknown>);
        }
      },
      complete: () => {
        // Filter out completely empty rows
        const nonEmptyRows = rows.filter((row) =>
          Object.values(row).some(
            (v) => v !== null && v !== undefined && String(v).trim() !== ""
          )
        );

        // Sanitize headers: replace empty values and eliminate duplicates
        const seen = new Set<string>();
        const sanitizedHeaders = headers.map((h, i) => {
          const trimmed = h ? h.trim() : "";
          const baseName = trimmed !== "" ? trimmed : `Column ${i + 1}`;
          let name = baseName;
          let counter = 2;
          while (seen.has(name)) {
            name = `${baseName}_${counter}`;
            counter++;
          }
          seen.add(name);
          return name;
        });

        // Map original row keys to sanitized keys
        const sanitizedRows = nonEmptyRows.map((row) => {
          const newRow: Record<string, unknown> = {};
          headers.forEach((originalHeader, index) => {
            const sanitizedHeader = sanitizedHeaders[index];
            newRow[sanitizedHeader] = row[originalHeader];
          });
          return newRow;
        });

        resolve({
          headers: sanitizedHeaders,
          rows: sanitizedRows,
          totalRows: sanitizedRows.length,
          errors,
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}
