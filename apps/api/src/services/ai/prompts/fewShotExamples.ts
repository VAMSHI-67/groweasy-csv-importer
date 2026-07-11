/**
 * Few-shot examples for the AI extraction prompt.
 * These examples teach the model how to handle:
 * 1. A clean row that maps almost 1:1
 * 2. A messy Facebook Lead Ads row with weird column names
 * 3. A row that should be skipped (no email/phone)
 */
export function getFewShotExamples(): { input: string; output: string }[] {
  return [
    {
      input: JSON.stringify({
        headers: ["Name", "Email", "Phone", "Created Date", "Status", "City"],
        rows: [
          {
            Name: "Priya Sharma",
            Email: "priya.sharma@gmail.com",
            Phone: "+91 9876543210",
            "Created Date": "2024-03-15",
            Status: "Interested",
            City: "Bangalore",
          },
        ],
      }),
      output: JSON.stringify({
        imported: [
          {
            created_at: "2024-03-15",
            name: "Priya Sharma",
            email: "priya.sharma@gmail.com",
            country_code: "+91",
            mobile_without_country_code: "9876543210",
            company: null,
            city: "Bangalore",
            state: null,
            country: "India",
            lead_owner: null,
            crm_status: "GOOD_LEAD_FOLLOW_UP",
            crm_note: null,
            data_source: "",
            possession_time: null,
            description: null,
          },
        ],
        skipped: [],
      }),
    },
    {
      input: JSON.stringify({
        headers: [
          "full_name",
          "email",
          "phone_number",
          "what's your budget?",
          "when do you plan to buy?",
          "campaign_name",
          "created_time",
          "alternate_email",
        ],
        rows: [
          {
            full_name: "Rajesh Kumar",
            email: "rajesh.k@outlook.com",
            phone_number: "918765432109",
            "what's your budget?": "50-70 Lakhs",
            "when do you plan to buy?": "Within 6 months",
            campaign_name: "Eden Park FB Campaign",
            created_time: "2024-06-22T14:30:00+0530",
            alternate_email: "rajesh.work@company.com",
          },
        ],
      }),
      output: JSON.stringify({
        imported: [
          {
            created_at: "2024-06-22 14:30:00",
            name: "Rajesh Kumar",
            email: "rajesh.k@outlook.com",
            country_code: "+91",
            mobile_without_country_code: "8765432109",
            company: null,
            city: null,
            state: null,
            country: null,
            lead_owner: null,
            crm_status: null,
            crm_note: "Additional emails: rajesh.work@company.com",
            data_source: "eden_park",
            possession_time: "Within 6 months",
            description: "Budget: 50-70 Lakhs",
          },
        ],
        skipped: [],
      }),
    },
    {
      input: JSON.stringify({
        headers: ["Name", "Email", "Phone", "Remarks"],
        rows: [
          {
            Name: "Unknown Lead",
            Email: "",
            Phone: "",
            Remarks: "Data entry error - no contact info available",
          },
          {
            Name: "Amit Patel",
            Email: "amit@test.com",
            Phone: "9123456789, 9876501234",
            Remarks: "Not interested. Wrong number on second attempt.",
          },
        ],
      }),
      output: JSON.stringify({
        imported: [
          {
            created_at: null,
            name: "Amit Patel",
            email: "amit@test.com",
            country_code: null,
            mobile_without_country_code: "9123456789",
            company: null,
            city: null,
            state: null,
            country: null,
            lead_owner: null,
            crm_status: "BAD_LEAD",
            crm_note:
              "Additional numbers: 9876501234. Wrong number on second attempt.",
            data_source: "",
            possession_time: null,
            description: null,
          },
        ],
        skipped: [
          {
            original_row: {
              Name: "Unknown Lead",
              Email: "",
              Phone: "",
              Remarks: "Data entry error - no contact info available",
            },
            reason: "no email or phone number",
          },
        ],
      }),
    },
  ];
}
