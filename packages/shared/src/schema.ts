import { z } from "zod";

// ─── CRM Status Enum ────────────────────────────────────────────────
export const CrmStatus = z.enum([
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
]);
export type CrmStatusType = z.infer<typeof CrmStatus>;

// ─── Data Source Enum ───────────────────────────────────────────────
export const DataSource = z.enum([
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
]);
export type DataSourceType = z.infer<typeof DataSource>;

// ─── Single CRM Record Schema ──────────────────────────────────────
export const CrmRecordSchema = z.object({
  created_at: z.string().nullable(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  country_code: z.string().nullable(),
  mobile_without_country_code: z.string().nullable(),
  company: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  lead_owner: z.string().nullable(),
  crm_status: CrmStatus.nullable(),
  crm_note: z.string().nullable(),
  data_source: DataSource.nullable().or(z.literal("")),
  possession_time: z.string().nullable(),
  description: z.string().nullable(),
});
export type CrmRecord = z.infer<typeof CrmRecordSchema>;

// ─── Skipped Row ────────────────────────────────────────────────────
export const SkippedRowSchema = z.object({
  original_row: z.record(z.string(), z.unknown()),
  reason: z.string(),
});
export type SkippedRow = z.infer<typeof SkippedRowSchema>;

// ─── Full Extraction Result ─────────────────────────────────────────
export const ExtractionResultSchema = z.object({
  imported: z.array(CrmRecordSchema),
  skipped: z.array(SkippedRowSchema),
  total_input_rows: z.number(),
  total_imported: z.number(),
  total_skipped: z.number(),
});
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// ─── API Request/Response Types ─────────────────────────────────────
export const ExtractRequestSchema = z.object({
  headers: z.array(z.string()),
  rows: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, "At least one row is required"),
});
export type ExtractRequest = z.infer<typeof ExtractRequestSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

// ─── CRM Field Definitions (for UI column rendering) ───────────────
export const CRM_FIELDS = [
  { key: "created_at", label: "Created At" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "country_code", label: "Country Code" },
  { key: "mobile_without_country_code", label: "Mobile" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "lead_owner", label: "Lead Owner" },
  { key: "crm_status", label: "CRM Status" },
  { key: "crm_note", label: "CRM Note" },
  { key: "data_source", label: "Data Source" },
  { key: "possession_time", label: "Possession Time" },
  { key: "description", label: "Description" },
] as const;
