import type { AIProvider } from "./AIProvider";
import type { ExtractionResult } from "@groweasy/shared";

/**
 * Mock AI provider for testing.
 * Returns deterministic responses based on simple heuristic field matching.
 * This allows the test suite to run offline without any API keys.
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async extract(
    _headers: string[],
    rows: Record<string, unknown>[]
  ): Promise<ExtractionResult> {
    const imported: ExtractionResult["imported"] = [];
    const skipped: ExtractionResult["skipped"] = [];

    for (const row of rows) {
      const email = this.findField(row, [
        "email",
        "email_address",
        "e-mail",
        "Email Address",
        "Email",
      ]);
      const phone = this.findField(row, [
        "phone",
        "phone_number",
        "mobile",
        "Phone",
        "Phone Number",
        "Mobile",
        "Contact Number",
      ]);

      if (!email && !phone) {
        skipped.push({
          original_row: row,
          reason: "no email or phone number",
        });
        continue;
      }

      const name =
        this.findField(row, ["name", "full_name", "Name", "Full Name", "Lead Name"]) ??
        this.combineNames(row);

      const { countryCode, phoneClean } = this.parsePhone(phone);

      imported.push({
        created_at: this.findField(row, [
          "created_at",
          "created_time",
          "Created Date",
          "Submission Date",
          "date",
          "Date",
          "Created At",
        ]),
        name: name || null,
        email: email || null,
        country_code: countryCode,
        mobile_without_country_code: phoneClean,
        company: this.findField(row, [
          "company",
          "Company",
          "organization",
          "Organisation",
        ]),
        city: this.findField(row, ["city", "City"]),
        state: this.findField(row, ["state", "State"]),
        country: this.findField(row, ["country", "Country"]),
        lead_owner: this.findField(row, [
          "lead_owner",
          "Lead Owner",
          "owner",
          "agent",
          "Assigned To",
        ]),
        crm_status: this.mapStatus(
          this.findField(row, [
            "status",
            "Status",
            "lead_status",
            "Lead Status",
            "Remarks",
          ])
        ),
        crm_note: this.findField(row, [
          "notes",
          "Notes",
          "remarks",
          "Remarks",
          "crm_note",
          "Comments",
        ]),
        data_source: this.mapDataSource(
          this.findField(row, [
            "data_source",
            "source",
            "Source",
            "campaign_name",
            "Project",
          ])
        ),
        possession_time: this.findField(row, [
          "possession_time",
          "Possession Time",
          "when do you plan to buy?",
        ]),
        description: this.findField(row, [
          "description",
          "Description",
          "Additional Info",
        ]),
      });
    }

    return {
      imported,
      skipped,
      total_input_rows: rows.length,
      total_imported: imported.length,
      total_skipped: skipped.length,
    };
  }

  private findField(
    row: Record<string, unknown>,
    candidates: string[]
  ): string | null {
    for (const key of candidates) {
      const val = row[key];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return String(val).trim();
      }
    }
    return null;
  }

  private combineNames(row: Record<string, unknown>): string | null {
    const first = this.findField(row, [
      "first_name",
      "First Name",
      "firstName",
    ]);
    const last = this.findField(row, ["last_name", "Last Name", "lastName"]);
    if (first && last) return `${first} ${last}`;
    return first || last || null;
  }

  private parsePhone(phone: string | null): {
    countryCode: string | null;
    phoneClean: string | null;
  } {
    if (!phone) return { countryCode: null, phoneClean: null };

    let cleaned = phone.replace(/[\s\-()]/g, "");

    // Handle multiple phone numbers (take first)
    if (cleaned.includes(",")) {
      cleaned = cleaned.split(",")[0].trim();
    }
    if (cleaned.includes("/")) {
      cleaned = cleaned.split("/")[0].trim();
    }

    // Extract country code
    if (cleaned.startsWith("+91")) {
      return {
        countryCode: "+91",
        phoneClean: cleaned.slice(3),
      };
    }
    if (cleaned.startsWith("91") && cleaned.length > 10) {
      return {
        countryCode: "+91",
        phoneClean: cleaned.slice(2),
      };
    }
    if (cleaned.startsWith("+")) {
      const digits = cleaned.replace(/\D/g, "");
      // Assume first 1-3 digits are country code
      return {
        countryCode: "+" + digits.slice(0, cleaned.indexOf(" ") > 0 ? 2 : 2),
        phoneClean: digits.slice(2),
      };
    }

    return { countryCode: null, phoneClean: cleaned.replace(/\D/g, "") };
  }

  private mapStatus(
    status: string | null
  ): ExtractionResult["imported"][0]["crm_status"] {
    if (!status) return null;
    const lower = status.toLowerCase();
    if (
      lower.includes("not interested") ||
      lower.includes("junk") ||
      lower.includes("invalid") ||
      lower.includes("bad") ||
      lower.includes("wrong number")
    ) {
      return "BAD_LEAD";
    }
    if (
      lower.includes("interested") ||
      lower.includes("follow up") ||
      lower.includes("callback") ||
      lower.includes("hot") ||
      lower.includes("warm")
    ) {
      return "GOOD_LEAD_FOLLOW_UP";
    }
    if (
      lower.includes("no response") ||
      lower.includes("unreachable") ||
      lower.includes("did not connect") ||
      lower.includes("not reachable")
    ) {
      return "DID_NOT_CONNECT";
    }
    if (
      lower.includes("closed won") ||
      lower.includes("converted") ||
      lower.includes("sale done") ||
      lower.includes("purchased")
    ) {
      return "SALE_DONE";
    }
    return null;
  }

  private mapDataSource(
    source: string | null
  ): ExtractionResult["imported"][0]["data_source"] {
    if (!source) return "";
    const lower = source.toLowerCase().replace(/[\s\-_]/g, "");
    const mapping: Record<string, ExtractionResult["imported"][0]["data_source"]> = {
      leadsondemand: "leads_on_demand",
      meridiantower: "meridian_tower",
      edenpark: "eden_park",
      varahswamy: "varah_swamy",
      sarjapurplots: "sarjapur_plots",
    };

    for (const [key, value] of Object.entries(mapping)) {
      if (lower.includes(key)) return value;
    }
    return "";
  }
}
