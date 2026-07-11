"use client";

import { useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CRM_FIELDS, type CrmRecord } from "@groweasy/shared";
import { cn } from "@/lib/utils";

interface ResultsTableProps {
  records: CrmRecord[];
}

const STATUS_COLORS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  DID_NOT_CONNECT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  BAD_LEAD: "text-red-400 bg-red-500/10 border-red-500/20",
  SALE_DONE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-white/30">—</span>;
  const colors = STATUS_COLORS[status] ?? "text-white/50 bg-white/5";
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border",
        colors
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function ResultsTable({ records }: ResultsTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo<ColumnDef<CrmRecord>[]>(
    () =>
      CRM_FIELDS.map((field) => ({
        accessorKey: field.key,
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {field.label}
          </span>
        ),
        cell: (info) => {
          const val = info.getValue();
          if (field.key === "crm_status") {
            return <StatusBadge status={val as string | null} />;
          }
          return (
            <span
              className="text-sm text-white/80 truncate block w-full"
              title={val !== null && val !== undefined ? String(val) : ""}
            >
              {val !== null && val !== undefined && String(val).trim() !== ""
                ? String(val)
                : "—"}
            </span>
          );
        },
        size:
          field.key === "crm_note" || field.key === "description"
            ? 250
            : field.key === "crm_status"
              ? 180
              : 150,
      })),
    []
  );

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows: tableRows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    estimateSize: () => 44,
    getScrollElement: () => tableContainerRef.current,
    overscan: 10,
  });

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
        style={{ maxHeight: "500px" }}
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
