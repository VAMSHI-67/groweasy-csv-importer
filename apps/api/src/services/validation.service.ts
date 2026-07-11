import {
  CrmStatus,
  DataSource,
  type CrmRecord,
  type ExtractionResult,
  type SkippedRow,
} from "@groweasy/shared";

/**
 * Post-AI validation and guardrails.
 * These are deterministic rules run on EVERY AI-returned record
 * to ensure data quality regardless of what the model returned.
 * Defense-in-depth: never trust the LLM alone for validation.
 */

const VALID_CRM_STATUSES = new Set(CrmStatus.options);
const VALID_DATA_SOURCES = new Set(DataSource.options);

/**
 * Coerce crm_status to null if it's not exactly one of the 4 allowed values.
 */
function coerceCrmStatus(status: unknown): CrmRecord["crm_status"] {
  if (typeof status === "string" && VALID_CRM_STATUSES.has(status as never)) {
    return status as CrmRecord["crm_status"];
  }
  return null;
}

/**
 * Coerce data_source to "" if it's not exactly one of the 5 allowed values.
 */
function coerceDataSource(source: unknown): CrmRecord["data_source"] {
  if (source === "" || source === null) return "";
  if (typeof source === "string" && VALID_DATA_SOURCES.has(source as never)) {
    return source as CrmRecord["data_source"];
  }
  return "";
}

/**
 * Validate created_at actually parses with new Date().
 * Nulls it out if it produces an Invalid Date.
 */
function coerceCreatedAt(dateStr: unknown): string | null {
  if (dateStr === null || dateStr === undefined) return null;
  if (typeof dateStr !== "string" || dateStr.trim() === "") return null;

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null;
  return dateStr.trim();
}

/**
 * Trim and normalize whitespace on all string fields.
 * Converts empty strings to null (except data_source which uses "").
 */
function trimField(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Check if a record has at least an email or phone number.
 * This is the skip rule: if neither is present, the record must be skipped.
 */
function hasContactInfo(record: CrmRecord): boolean {
  const hasEmail = record.email !== null && record.email.trim() !== "";
  const hasPhone =
    record.mobile_without_country_code !== null &&
    record.mobile_without_country_code.trim() !== "";
  return hasEmail || hasPhone;
}

/**
 * Apply all validation guardrails to a single CRM record.
 */
export function validateRecord(record: CrmRecord): CrmRecord {
  return {
    created_at: coerceCreatedAt(record.created_at),
    name: trimField(record.name),
    email: trimField(record.email),
    country_code: trimField(record.country_code),
    mobile_without_country_code: trimField(record.mobile_without_country_code),
    company: trimField(record.company),
    city: trimField(record.city),
    state: trimField(record.state),
    country: trimField(record.country),
    lead_owner: trimField(record.lead_owner),
    crm_status: coerceCrmStatus(record.crm_status),
    crm_note: trimField(record.crm_note),
    data_source: coerceDataSource(record.data_source),
    possession_time: trimField(record.possession_time),
    description: trimField(record.description),
  };
}

/**
 * Apply validation to all records in an extraction result.
 * Re-checks the skip rule even on records the AI marked as "imported"
 * and moves invalid ones to skipped.
 */
export function validateExtractionResult(
  result: ExtractionResult
): ExtractionResult {
  const validated: CrmRecord[] = [];
  const skipped: SkippedRow[] = [...result.skipped];

  for (const record of result.imported) {
    const validatedRecord = validateRecord(record);

    if (!hasContactInfo(validatedRecord)) {
      skipped.push({
        original_row: record as unknown as Record<string, unknown>,
        reason:
          "No usable email or phone number after validation",
      });
    } else {
      validated.push(validatedRecord);
    }
  }

  return {
    imported: validated,
    skipped,
    total_input_rows: result.total_input_rows,
    total_imported: validated.length,
    total_skipped: skipped.length,
  };
}
