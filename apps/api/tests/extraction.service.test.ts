import { describe, it, expect } from "vitest";
import { ExtractionService } from "../src/services/extraction.service";
import { MockAIProvider } from "../src/services/ai/MockAIProvider";

const mockProvider = new MockAIProvider();

describe("extraction.service (with MockAIProvider)", () => {
  it("should extract records from a clean CRM-like input", async () => {
    const service = new ExtractionService(mockProvider);
    const headers = ["Name", "Email", "Phone", "Status", "City"];
    const rows = [
      {
        Name: "Priya Sharma",
        Email: "priya@gmail.com",
        Phone: "+91 9876543210",
        Status: "Interested",
        City: "Bangalore",
      },
      {
        Name: "Rajesh Kumar",
        Email: "rajesh@outlook.com",
        Phone: "8765432109",
        Status: "Not interested",
        City: "Mumbai",
      },
    ];

    const result = await service.extract(headers, rows);

    expect(result.total_input_rows).toBe(2);
    expect(result.total_imported).toBe(2);
    expect(result.total_skipped).toBe(0);
    expect(result.imported[0].name).toBe("Priya Sharma");
    expect(result.imported[0].email).toBe("priya@gmail.com");
    expect(result.imported[0].city).toBe("Bangalore");
  });

  it("should skip rows with no email or phone", async () => {
    const service = new ExtractionService(mockProvider);
    const headers = ["Name", "Email", "Phone", "Remarks"];
    const rows = [
      { Name: "Valid Lead", Email: "valid@test.com", Phone: "9876543210", Remarks: "" },
      { Name: "No Contact", Email: "", Phone: "", Remarks: "No contact info" },
    ];

    const result = await service.extract(headers, rows);

    expect(result.total_imported).toBe(1);
    expect(result.total_skipped).toBe(1);
    expect(result.imported[0].name).toBe("Valid Lead");
    expect(result.skipped[0].reason).toContain("no email or phone");
  });

  it("should handle empty rows array", async () => {
    const service = new ExtractionService(mockProvider);
    const result = await service.extract([], []);

    expect(result.total_input_rows).toBe(0);
    expect(result.total_imported).toBe(0);
    expect(result.total_skipped).toBe(0);
  });

  it("should map Facebook-style column names", async () => {
    const service = new ExtractionService(mockProvider);
    const headers = ["full_name", "email", "phone_number", "campaign_name"];
    const rows = [
      {
        full_name: "Test User",
        email: "test@test.com",
        phone_number: "+91 9876543210",
        campaign_name: "Eden Park FB Campaign",
      },
    ];

    const result = await service.extract(headers, rows);

    expect(result.total_imported).toBe(1);
    expect(result.imported[0].email).toBe("test@test.com");
  });

  it("should handle large batches correctly", async () => {
    const service = new ExtractionService(mockProvider);
    const headers = ["Name", "Email"];
    const rows = Array.from({ length: 50 }, (_, i) => ({
      Name: `User ${i}`,
      Email: `user${i}@test.com`,
    }));

    const result = await service.extract(headers, rows);

    expect(result.total_input_rows).toBe(50);
    expect(result.total_imported).toBe(50);
  });

  it("should map status semantically via MockProvider", async () => {
    const service = new ExtractionService(mockProvider);
    const headers = ["Name", "Email", "Status"];
    const rows = [
      { Name: "Lead 1", Email: "a@test.com", Status: "Interested" },
      { Name: "Lead 2", Email: "b@test.com", Status: "Not interested" },
      { Name: "Lead 3", Email: "c@test.com", Status: "No response" },
      { Name: "Lead 4", Email: "d@test.com", Status: "Closed won" },
    ];

    const result = await service.extract(headers, rows);

    expect(result.imported[0].crm_status).toBe("GOOD_LEAD_FOLLOW_UP");
    expect(result.imported[1].crm_status).toBe("BAD_LEAD");
    expect(result.imported[2].crm_status).toBe("DID_NOT_CONNECT");
    expect(result.imported[3].crm_status).toBe("SALE_DONE");
  });
});
