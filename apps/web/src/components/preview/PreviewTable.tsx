"use client";

import { useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

interface PreviewTableProps {
  headers: string[];
  rows: Record<string, unknown>[];
}

export function PreviewTable({ headers, rows }: PreviewTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // 1. Define columns with semantic width calculation
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      headers.map((header) => ({
        id: header,
        accessorKey: header,
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {header}
          </span>
        ),
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className="text-sm text-white/80 truncate block w-full">
              {val !== null && val !== undefined ? String(val) : "—"}
            </span>
          );
        },
        // Calculate size based on header length, min 150px, max 300px
        size: Math.max(150, Math.min(header.length * 10 + 60, 300)),
      })),
    [headers]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows: tableRows } = table.getRowModel();

  // 2. Setup virtualizer
  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    estimateSize: () => 40,
    getScrollElement: () => tableContainerRef.current,
    overscan: 10,
  });

  // 3. Compute grid widths and total table width for horizontal scroll
  const columnWidths = useMemo(() => {
    return columns.map((col) => `${col.size}px`);
  }, [columns]);

  const gridTemplateColumns = useMemo(() => {
    return `48px ${columnWidths.join(" ")}`;
  }, [columnWidths]);

  const totalWidth = useMemo(() => {
    const colSum = columns.reduce((acc, col) => acc + (col.size as number), 0);
    return 48 + colSum;
  }, [columns]);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Scrollable Container */}
      <div
        ref={tableContainerRef}
        className="w-full overflow-auto"
        style={{ maxHeight: "480px" }}
      >
        <div style={{ width: `${totalWidth}px`, minWidth: "100%" }}>
          
          {/* Header Row */}
          <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-xl border-b border-white/10">
            {table.getHeaderGroups().map((headerGroup) => (
              <div
                key={headerGroup.id}
                className="grid items-center divide-x divide-white/5"
                style={{ gridTemplateColumns }}
              >
                {/* Index Header */}
                <div className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/50">
                  #
                </div>
                {/* Columns Headers */}
                {headerGroup.headers.map((header) => (
                  <div
                    key={header.id}
                    className="px-3 py-3 text-left truncate"
                    style={{ width: `${header.getSize()}px` }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Body Rows */}
          <div
            className="relative w-full"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = tableRows[virtualRow.index];
              return (
                <div
                  key={row.id}
                  className={cn(
                    "absolute top-0 left-0 w-full grid items-center border-b border-white/5 hover:bg-white/5 transition-colors divide-x divide-white/5",
                    virtualRow.index % 2 === 0
                      ? "bg-transparent"
                      : "bg-white/[0.02]"
                  )}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    gridTemplateColumns,
                  }}
                >
                  {/* Row Number */}
                  <div className="px-3 py-2 text-xs text-white/30 font-mono">
                    {virtualRow.index + 1}
                  </div>
                  {/* Cells */}
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className="px-3 py-2 truncate h-full flex items-center min-w-0"
                      style={{ width: `${cell.column.getSize()}px` }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
