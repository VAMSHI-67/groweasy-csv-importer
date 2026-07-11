import { describe, it, expect } from "vitest";
import {
  validateRecord,
  validateExtractionResult,
} from "../src/services/validation.service";
import type { CrmRecord, ExtractionResult } from "@groweasy/shared";

function makeRecord(overrides: Partial<CrmRecord> = {}): CrmRecord {
  return {
    created_at: "2024-01-15 10:30:00",
    name: "Test User",
    email: "test@example.com",
    country_code: "+91",
    mobile_without_country_code: "9876543210",
    company: null,
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    lead_owner: null,
    crm_status: "GOOD_LEAD_FOLLOW_UP",
    crm_note: null,
    data_source: "eden_park",
    possession_time: null,
    description: null,
    ...overrides,
  };
}

describe("validation.service", () => {
  describe("validateRecord", () => {
    it("should pass through valid records unchanged", () => {
      const record = makeRecord();
      const result = validateRecord(record);

      expect(result.name).toBe("Test User");
      expect(result.email).toBe("test@example.com");
      expect(result.crm_status).toBe("GOOD_LEAD_FOLLOW_UP");
      expect(result.data_source).toBe("eden_park");
    });

    it("should coerce invalid crm_status to null", () => {
      const record = makeRecord({
        crm_status: "INVALID_STATUS" as never,
      });
      const result = validateRecord(record);
      expect(result.crm_status).toBeNull();
    });

    it("should coerce invalid data_source to empty string", () => {
      const record = makeRecord({
        data_source: "some_random_source" as never,
      });
      const result = validateRecord(record);
      expect(result.data_source).toBe("");
    });

    it("should null out invalid dates", () => {
      const record = makeRecord({ created_at: "not-a-date" });
      const result = validateRecord(record);
      expect(result.created_at).toBeNull();
    });

    it("should keep valid ISO dates", () => {
      const record = makeRecord({ created_at: "2024-03-15T10:30:00" });
      const result = validateRecord(record);
      expect(result.created_at).toBe("2024-03-15T10:30:00");
    });

    it("should trim whitespace from string fields", () => {
      const record = makeRecord({
        name: "  John Doe  ",
        email: " john@example.com ",
        city: "  Mumbai  ",
      });
      const result = validateRecord(record);

      expect(result.name).toBe("John Doe");
      expect(result.email).toBe("john@example.com");
      expect(result.city).toBe("Mumbai");
    });

    it("should convert empty strings to null", () => {
      const record = makeRecord({ name: "", company: "  " });
      const result = validateRecord(record);

      expect(result.name).toBeNull();
      expect(result.company).toBeNull();
    });

    it("should accept all valid CRM statuses", () => {
      const statuses = [
        "GOOD_LEAD_FOLLOW_UP",
        "DID_NOT_CONNECT",
        "BAD_LEAD",
        "SALE_DONE",
      ] as const;

      for (const status of statuses) {
        const result = validateRecord(makeRecord({ crm_status: status }));
        expect(result.crm_status).toBe(status);
      }
    });

    it("should accept all valid data sources", () => {
      const sources = [
        "leads_on_demand",
        "meridian_tower",
        "eden_park",
        "varah_swamy",
        "sarjapur_plots",
      ] as const;

      for (const source of sources) {
        const result = validateRecord(makeRecord({ data_source: source }));
        expect(result.data_source).toBe(source);
      }
    });
  });

  describe("validateExtractionResult", () => {
    it("should move records without email/phone to skipped", () => {
      const result: ExtractionResult = {
        imported: [
          makeRecord({ email: null, mobile_without_country_code: null }),
          makeRecord(), // valid
        ],
        skipped: [],
        total_input_rows: 2,
        total_imported: 2,
        total_skipped: 0,
      };

      const validated = validateExtractionResult(result);
      expect(validated.total_imported).toBe(1);
      expect(validated.total_skipped).toBe(1);
      expect(validated.skipped[0].reason).toContain("No usable email or phone");
    });

    it("should keep records with only email", () => {
      const result: ExtractionResult = {
        imported: [
          makeRecord({
            email: "test@test.com",
            mobile_without_country_code: null,
          }),
        ],
        skipped: [],
        total_input_rows: 1,
        total_imported: 1,
        total_skipped: 0,
      };

      const validated = validateExtractionResult(result);
      expect(validated.total_imported).toBe(1);
    });

    it("should keep records with only phone", () => {
      const result: ExtractionResult = {
        imported: [
          makeRecord({ email: null, mobile_without_country_code: "9876543210" }),
        ],
        skipped: [],
        total_input_rows: 1,
        total_imported: 1,
        total_skipped: 0,
      };

      const validated = validateExtractionResult(result);
      expect(validated.total_imported).toBe(1);
    });

    it("should preserve existing skipped rows", () => {
      const result: ExtractionResult = {
        imported: [makeRecord()],
        skipped: [
          {
            original_row: { name: "Bad Row" },
            reason: "no email or phone",
          },
        ],
        total_input_rows: 2,
        total_imported: 1,
        total_skipped: 1,
      };

      const validated = validateExtractionResult(result);
      expect(validated.total_skipped).toBe(1);
      expect(validated.skipped[0].reason).toBe("no email or phone");
    });
  });
});
