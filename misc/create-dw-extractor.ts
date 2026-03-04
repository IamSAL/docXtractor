/**
 * Script to create the Thai Derivative Warrants Extractor
 * Based on: docs/Excel to JSON Schema for PDFs.md
 *
 * Usage:
 *   npx ts-node misc/create-dw-extractor.ts
 *   # or
 *   npx tsx misc/create-dw-extractor.ts
 *
 * Environment variables:
 *   API_URL   - Base URL of the docXtractor server (default: http://localhost:3000)
 *   API_TOKEN - JWT Bearer token for authentication (required)
 */

const API_URL = process.env.API_URL || "http://localhost:3000";
const API_TOKEN =
  process.env.API_TOKEN ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZWMyNDY2MC1lYjg2LTQxMTgtODU0OC0xOTRmNmE3MDdiN2UiLCJlbWFpbCI6ImRlbW9AZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImhhc1Byb2ZpbGUiOmZhbHNlLCJmdWxsTmFtZSI6IiIsImlhdCI6MTc3MTc0NjcyOSwiZXhwIjoxNzcxNzQ3NjI5fQ.HSRLKvMwzTiqIpryPRGzTERhO1vXJjkrfKXE3fgd2ls";

const schema = {
  type: "object",
  properties: {
    // ── Core Identifiers ──────────────────────────────────────────
    number: {
      type: ["integer", "null"],
      description:
        "Assign a sequential integer identifier if generating a batch, or default to null if extracting a single standalone record.",
    },
    global_identifier: {
      type: "string",
      description:
        "Extract the unique alphanumeric symbol of the derivative warrant. In the Thai term sheet, this is denoted as 'ชื่อย่อ' (e.g., 'ADVANC01P2607A' or 'COM701C2607B').",
    },
    date_filed: {
      type: ["string", "null"],
      description:
        "The date the prospectus was filed with the SEC. If not explicitly stated in the abbreviated term sheet, return null. Do not hallucinate filing dates.",
    },
    cusip: {
      type: ["string", "null"],
      description:
        "The Committee on Uniform Securities Identification Procedures 9-character alphanumeric code. As Thai domestic DWs typically do not utilize CUSIPs, this must structurally default to null.",
    },
    isin: {
      type: ["string", "null"],
      description:
        "The International Securities Identification Number. Extract if available; otherwise, return null.",
    },
    issuer: {
      type: "string",
      description:
        "Extract the full legal name of the issuing entity and translate to English. For the provided documents, this maps to 'ผู้ออกใบสำคัญแสดงสิทธิอนุพันธ์ฯ' and must be output exactly as 'Bualuang Securities Public Company Limited'.",
    },
    distributor: {
      type: "string",
      description:
        "Default to the identical value extracted for the 'issuer' parameter, as the issuer acts as its own direct listing distributor on the SET.",
    },
    underlying_ticker: {
      type: "string",
      description:
        "Identify the underlying asset ('หลักทรัพย์อ้างอิง'). Determine its standard SET symbol and append ' TB Equity' to format it as a valid Bloomberg ticker (e.g., 'COM7 TB Equity', 'CPF TB Equity').",
    },
    multiple_underlyings: {
      type: ["boolean", "null"],
      description:
        "Determine if the instrument is linked to a basket of assets. For vanilla single-stock DWs, this must be false or null.",
    },
    product_description: {
      type: "string",
      description:
        "Synthesize a highly standardized string strictly adhering to the historical formula: 'DERIVATIVE WARRANTS ON <UNDERLYING_TICKER> ISSUED BY <ISSUER> LAST TRADING IN <MONTH> #<TRANCHE>'. Construct by combining underlying ticker, issuer name, maturity month, and tranche identifier.",
    },
    pricing_supplement_url: {
      type: ["string", "null"],
      description:
        "Extract the hyperlink to the final pricing document if present in the text. For flat PDF ingestion lacking embedded URIs, return null.",
    },
    created_at: {
      type: "string",
      format: "date-time",
      description:
        "Generate the current ISO 8601 timestamp representing the exact moment of AI extraction.",
    },
    updated_at: {
      type: "string",
      format: "date-time",
      description:
        "Generate the current ISO 8601 timestamp, identical to created_at.",
    },

    // ── Chronological Milestones ──────────────────────────────────
    initial_valuation_date: {
      type: ["string", "null"],
      description:
        "Extract the date used to determine the initial reference price. If not explicitly isolated from the issue date, return null. Format as DD/MM/YYYY.",
    },
    issue_date: {
      type: "string",
      description:
        "Extract the issuance date ('วันออกใบสำคัญแสดงสิทธิอนุพันธ์ฯ'). Convert Thai BE dates to Gregorian DD/MM/YYYY (e.g., '6 กุมภาพันธ์ 2569' becomes '06/02/2026').",
    },
    trade_date: {
      type: "string",
      description:
        "Identical to issue_date for Direct Listing SET DWs, representing the first day of exchange trading. Format as DD/MM/YYYY.",
    },
    offering_closes: {
      type: ["string", "null"],
      description:
        "The date the subscription period ends. For direct market listings lacking a discrete subscription window, return null.",
    },
    strike_date: {
      type: ["string", "null"],
      description:
        "The date the strike price was finalized. Often mirrors the date the Black-Scholes pricing was run (e.g., 4 February 2026). Format as DD/MM/YYYY or null if ambiguous.",
    },
    final_valuation_date: {
      type: "string",
      description:
        "Extract the last trading day ('วันทำการซื้อขายสุดท้าย'). Format as DD/MM/YYYY.",
    },
    maturity_date: {
      type: "string",
      description:
        "Extract the maturity date ('วันครบกำหนดอายุ'). Format as DD/MM/YYYY.",
    },
    expiry_observation_date: {
      type: "string",
      description:
        "Mirror the final_valuation_date, as European DWs observe the underlying price strictly on the final trading day. Format as DD/MM/YYYY.",
    },
    expiry_payment_date: {
      type: "string",
      description:
        "Mirror the maturity_date, as settlement occurs precisely upon expiration. Format as DD/MM/YYYY.",
    },
    multiple_initial_valuation_dates_style: {
      type: ["string", "null"],
      description:
        "Set strictly to null. Vanilla DWs do not utilize multiple initial valuation averaging styles.",
    },
    multiple_initial_valuation_dates_interval: {
      type: ["string", "null"],
      description: "Set strictly to null.",
    },
    multiple_initial_valuation_dates_first_date: {
      type: ["string", "null"],
      description:
        "Set strictly to null. Do not populate with 1899-12-31 epoch artifacts.",
    },
    multiple_initial_valuation_dates_last_date: {
      type: ["string", "null"],
      description: "Set strictly to null.",
    },
    multiple_final_valuation_dates_style: {
      type: ["string", "null"],
      description:
        "Set strictly to null. European exercise prohibits multiple final valuation averaging (Asian option style).",
    },
    multiple_final_valuation_dates_interval: {
      type: ["string", "null"],
      description: "Set strictly to null.",
    },
    multiple_final_valuation_dates_first_date: {
      type: ["string", "null"],
      description: "Set strictly to null.",
    },
    multiple_final_valuation_dates_last_date: {
      type: ["string", "null"],
      description: "Set strictly to null.",
    },
    all_filing_dates: {
      type: ["string", "null"],
      description:
        "Set strictly to null unless multiple regulatory filing timestamps are explicitly present.",
    },

    // ── Typology and Classification Metrics ───────────────────────
    document_type: {
      type: "string",
      description:
        "Hardcode as 'Final' to indicate these are finalized, non-draft pricing term sheets.",
    },
    product_type: {
      type: "string",
      description: "Hardcode as 'Warrant'.",
    },
    product_subtype: {
      type: "string",
      description:
        "Determine the option directionality. If the document states 'สิทธิในการซื้อ' (Right to buy), output 'Call Warrant'. If it states 'สิทธิในการขาย' (Right to sell), output 'Put Warrant'.",
    },
    asset_class: {
      type: "string",
      description: "Hardcode as 'Cash'.",
    },
    investment_or_leveraged: {
      type: "string",
      description:
        "Hardcode as 'Leveraged Product', indicating the derivative nature of the warrant.",
    },
    investment_type: {
      type: "string",
      description:
        "Hardcode as 'Growth', indicating the product is engineered for capital appreciation rather than income generation.",
    },
    settlement_type: {
      type: "string",
      description:
        "Extract the settlement method. This should map from 'ชำระเงินตามส่วนต่างของราคา' to the English string 'Cash' or 'Cash Settlement'.",
    },
    trading_jurisdiction: {
      type: "string",
      description:
        "Extract the exchange locale. Hardcode as 'TH' (Thailand) based on the SET regulatory framework.",
    },
    distribution_category: {
      type: ["string", "null"],
      description:
        "Set to null unless a specific client segmentation (e.g., Retail, Institutional) is defined.",
    },
    provider_type: {
      type: ["string", "null"],
      description: "Set to null.",
    },
    live_or_not: {
      type: ["string", "null"],
      description:
        "Extract the status of the listing, or default to null if it cannot be determined exclusively from the static term sheet.",
    },
    underlying_sector: {
      type: ["string", "null"],
      description:
        "Set to null. The sector classification is handled downstream by the Bloomberg terminal ticker linkage.",
    },

    // ── Quantitative Mechanics and Pricing Execution ──────────────
    principal_amount: {
      type: "number",
      description:
        "Extract the absolute total offering value ('มูลค่ารวมที่เสนอขาย') without currency symbols (e.g., 40000000.00 for the ADVANC Put).",
    },
    aggregate_principal_amount_type: {
      type: ["string", "null"],
      description: "Set to null.",
    },
    proportional_principal_amount: {
      type: ["number", "null"],
      description:
        "Set to null or a default integer if required by the legacy schema (e.g., 1 or 10).",
    },
    issue_price_absolute: {
      type: "number",
      description:
        "Extract the theoretical issue price per unit used for calculation (e.g., 1.00 Baht based on the Black & Scholes Model).",
    },
    call_strike_level: {
      type: ["string", "null"],
      description:
        "CRITICAL LOGIC: If product_subtype is 'Call Warrant', construct a mathematical string formatted exactly as '[Quantity]*[Issue Price]' (e.g., '100000000*1.00'). Do NOT input the actual financial strike price. If 'Put Warrant', return null.",
    },
    put_strike_level: {
      type: ["string", "null"],
      description:
        "CRITICAL LOGIC: If product_subtype is 'Put Warrant', construct a mathematical string formatted exactly as '[Quantity]*[Issue Price]' (e.g., '40000000*1.00'). Do NOT input the actual financial strike price. If 'Call Warrant', return null.",
    },
    call_strike_level_absolute: {
      type: ["number", "null"],
      description:
        "If product_subtype is 'Call Warrant', extract the actual numerical exercise price ('ราคาใช้สิทธิ') without currency markers (e.g., 31.00 for the COM7 Call). If 'Put Warrant', return null.",
    },
    put_strike_level_absolute: {
      type: ["number", "null"],
      description:
        "If product_subtype is 'Put Warrant', extract the actual numerical exercise price ('ราคาใช้สิทธิ') without currency markers (e.g., 272.00 for the ADVANC Put). If 'Call Warrant', return null.",
    },
    leveraged_product_multiplier: {
      type: "number",
      description:
        "Extract the decimal exercise ratio ('อัตราการใช้สิทธิต่อหน่วย'). For example, extract 0.06256 for the ADVANC Put.",
    },
    issue_ratio: {
      type: "number",
      description:
        "Extract the fractional exercise ratio if required downstream (e.g., the 15.98439 units per 1 share equivalent).",
    },
    leveraged_product_exercise_style: {
      type: "string",
      description:
        "Extract the exercise architecture. Expected to perfectly map from 'แบบยุโรป' to the string 'European'.",
    },
    leveraged_product_automatic_exercise: {
      type: "boolean",
      description:
        "Set to true. European derivative warrants feature automatic exercise ('วันใช้สิทธิอัตโนมัติ') if the Net Cash Settlement Amount exceeds zero.",
    },
    leveraged_product_target_leverage_factor: {
      type: ["number", "null"],
      description:
        "Set strictly to null. This parameter is used for constant leverage certificates, not vanilla DWs. Do not populate with 1899-12-31.",
    },
    currency: {
      type: "string",
      description:
        "Hardcode as 'THB' based on the Thai Baht denomination of the SET.",
    },
    day_count: {
      type: "string",
      description:
        "Extract the day count convention. Commonly 'Actual' or 'Actual/365' for localized instruments.",
    },
    structuring_fee: {
      type: ["number", "null"],
      description:
        "Set to null. Standard DW term sheets do not explicitly separate structuring fees in the headline data.",
    },
    sales_concession: {
      type: ["number", "null"],
      description: "Set to null.",
    },
    estimated_value: {
      type: ["number", "null"],
      description:
        "Set to null unless explicitly provided outside of the Black-Scholes issue price proxy.",
    },

    // ── Yield and Autocall Infrastructure (Structural Nullification) ──
    coupon_applies: {
      type: ["boolean", "null"],
      description: "Set strictly to false or null. DWs do not pay coupons.",
    },
    contingent_coupon_applies: {
      type: ["boolean", "null"],
      description: "Set strictly to false or null.",
    },
    memory_coupon_applies: {
      type: ["boolean", "null"],
      description: "Set strictly to false or null.",
    },
    coupon_interval: {
      type: ["string", "null"],
      description: "Set strictly to null.",
    },
    coupon_rate: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    coupon_barrier: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    initial_guaranteed_fixed_coupon_applies: {
      type: ["boolean", "null"],
      description: "Set strictly to false or null.",
    },
    base_rate: {
      type: ["string", "null"],
      description:
        "Set strictly to null. Floating rate benchmarks are inapplicable to DW equity derivatives.",
    },
    issuer_call_applies: {
      type: ["boolean", "null"],
      description:
        "Set strictly to false or null. The issuer cannot recall these specific European warrants prior to maturity.",
    },
    autocall_applies: {
      type: ["boolean", "null"],
      description: "Set strictly to false or null.",
    },
    autocall_barrier: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    coupon_schedule: {
      type: ["string", "null"],
      description: "Set strictly to null. DWs do not have coupon schedules.",
    },
    coupon_step_up_down_initial_amount: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    interest_cap: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    autocall_interval: {
      type: ["string", "null"],
      description: "Set strictly to null.",
    },
    autocall_step_up_down_barrier_initial_amount: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },

    // ── Barrier, Credit-Linked, and Complex Matrix Arrays ─────────
    knock_in_barrier: {
      type: ["number", "null"],
      description:
        "Set strictly to null. Vanilla DWs lack knock-in activation events.",
    },
    knock_out_barrier_level: {
      type: ["number", "null"],
      description:
        "Set strictly to null for standard DWs. Do not populate unless the product is explicitly a CBBC.",
    },
    buffer_level: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    digital_amount: {
      type: ["number", "null"],
      description:
        "Set strictly to null. Settlement is linear based on the cash difference, not a fixed digital payout.",
    },
    cap: {
      type: ["number", "null"],
      description:
        "Set strictly to null. Upside is theoretically unlimited for Call DWs.",
    },
    floor: {
      type: ["number", "null"],
      description:
        "Set strictly to null. Downside is limited to the premium paid, but a specific payout floor is not hardcoded in the settlement formula.",
    },
    cln_recovery_type: {
      type: ["string", "null"],
      description: "Set strictly to null. Not a Credit-Linked Note.",
    },
    cln_reference_obligation_isin: {
      type: ["string", "null"],
      description: "Set strictly to null.",
    },
    cln_credit_events: {
      type: ["string", "null"],
      description: "Set strictly to null.",
    },
    dropback_trigger_event_type: {
      type: ["string", "null"],
      description:
        "Set strictly to null. Dropback reallocation mechanics are inapplicable.",
    },
    multi_range_results_1: {
      type: ["string", "null"],
      description:
        "Set strictly to null. Complex digital corridor pricing is structurally irrelevant.",
    },
    multi_range_barrier_level_1: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    multi_range_digital_amount_1: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    multi_range_barrier_level_2: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    multi_range_digital_amount_2: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    multi_range_barrier_level_3: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    multi_range_digital_amount_3: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    multi_range_barrier_level_4: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    multi_range_digital_amount_4: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    multi_range_barrier_level_5: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    multi_range_digital_amount_5: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    range_accrual_lower_barrier: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    range_accrual_upper_barrier: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    range_accrual_observation_interval: {
      type: ["string", "null"],
      description: "Set strictly to null.",
    },
    inflation_determination_base_cpi: {
      type: ["number", "null"],
      description: "Set strictly to null.",
    },
    inflation_determination_reference_lag: {
      type: ["string", "null"],
      description: "Set strictly to null.",
    },

    // ── Additional Exotic Nullification Fields ────────────────────
    put_strike_reference_asset_type: {
      type: ["string", "null"],
      description:
        "Set strictly to null. Do not populate with 1899-12-31 epoch artifacts.",
    },
    call_strike_reference_asset_type: {
      type: ["string", "null"],
      description:
        "Set strictly to null. Do not populate with 1899-12-31 epoch artifacts.",
    },
  },
  required: [
    "global_identifier",
    "issuer",
    "distributor",
    "underlying_ticker",
    "product_description",
    "created_at",
    "updated_at",
    "issue_date",
    "trade_date",
    "final_valuation_date",
    "maturity_date",
    "expiry_observation_date",
    "expiry_payment_date",
    "document_type",
    "product_type",
    "product_subtype",
    "asset_class",
    "investment_or_leveraged",
    "investment_type",
    "settlement_type",
    "trading_jurisdiction",
    "principal_amount",
    "issue_price_absolute",
    "leveraged_product_multiplier",
    "issue_ratio",
    "leveraged_product_exercise_style",
    "leveraged_product_automatic_exercise",
    "currency",
    "day_count",
  ],
  additionalProperties: false,
};

const systemPrompt = `You are an expert financial data extraction engine specialized in Thai derivative warrant (DW) term sheets issued by Bualuang Securities Public Company Limited on the Stock Exchange of Thailand (SET).

## Core Behavioral Directives

1. **Non-Linear Reading Comprehension**: Ingest the ENTIRE document before constructing any output. Critical parameters are scattered across tables, footnotes, and legal disclaimers. Synthesize interrelated parameters simultaneously — for example, product_description requires combining the underlying ticker, instrument type, issuer name, and maturity date in a single concatenated string.

2. **Structural Hallucination Immunization**: The JSON Schema enforces additionalProperties: false. Output ONLY the exact keys defined in the schema. NEVER invent new JSON keys from Thai legal phrases not found in the schema. Fields designated as null MUST remain null — do not infer values from unrelated boilerplate text.

3. **Epoch Date Artifact Neutralization**: Under NO circumstances should missing, blank, or structurally inapplicable data be substituted with epoch timestamps (1899-12-31), default integers (0), or any placeholder values. Omitted fields MUST be returned as strictly null.

4. **Thai Buddhist Era (BE) Date Conversion**: All Thai dates use Buddhist Era (BE = Gregorian + 543). Convert all dates:
   - Thai month mapping: มกราคม=Jan, กุมภาพันธ์=Feb, มีนาคม=Mar, เมษายน=Apr, พฤษภาคม=May, มิถุนายน=Jun, กรกฎาคม=Jul, สิงหาคม=Aug, กันยายน=Sep, ตุลาคม=Oct, พฤศจิกายน=Nov, ธันวาคม=Dec
   - Convert BE year to Gregorian: subtract 543
   - Output all dates as DD/MM/YYYY format

5. **Cross-Lingual Semantic Mapping**: Translate Thai financial terms to their English schema equivalents:
   - สิทธิในการซื้อ → Call Warrant
   - สิทธิในการขาย → Put Warrant
   - ชำระเงินตามส่วนต่างของราคา → Cash Settlement
   - แบบยุโรป → European
   - ผู้ออกใบสำคัญแสดงสิทธิอนุพันธ์ฯ → Issuer entity name
   - ชื่อย่อ → global_identifier (warrant ticker symbol)
   - หลักทรัพย์อ้างอิง → underlying asset
   - ราคาใช้สิทธิ → exercise/strike price
   - อัตราการใช้สิทธิต่อหน่วย → exercise ratio
   - จำนวนที่เสนอขาย → offering quantity
   - ราคาเสนอขายต่อหน่วย → issue price per unit
   - มูลค่ารวมที่เสนอขาย → total offering value
   - วันออกใบสำคัญแสดงสิทธิอนุพันธ์ฯ → issue date
   - วันทำการซื้อขายสุดท้าย → last trading day
   - วันครบกำหนดอายุ → maturity date

6. **Bloomberg Ticker Construction**: For underlying_ticker, identify the corporate entity from the Thai text, deduce its official SET trading symbol, and append " TB Equity" (e.g., "ADVANC TB Equity", "COM7 TB Equity", "CPF TB Equity").

7. **Logic-Gated Mathematical String Building for Strike Level Fields**:
   - Determine the option directionality (Call or Put)
   - If Call: populate call_strike_level with the EXACT string concatenation of '[Quantity]*[Issue Price]' and leave put_strike_level null
   - If Put: populate put_strike_level with the EXACT string concatenation of '[Quantity]*[Issue Price]' and leave call_strike_level null
   - Do NOT execute the mathematical operation
   - Do NOT insert the actual financial strike price into these fields
   - The actual strike price goes into call_strike_level_absolute or put_strike_level_absolute respectively

8. **Structural Nullification**: This schema represents a universal 238-column global model. The vast majority of fields are structurally inapplicable to vanilla Thai DWs. All coupon, autocall, barrier, CLN, digital, dropback, multi-range, range accrual, and inflation fields MUST be null or false. These instruments are pure-play leveraged derivatives with no yield generation, no early autocall, no knock-in/knock-out barriers, and no credit linkage.

## Output Format
Return valid JSON matching the schema exactly. All values must conform to the declared types.`;

const extractorPayload = {
  name: "Thai DW Term Sheet Extractor (SET / Bualuang Securities)",
  description:
    "Automated extraction pipeline for Thai-language derivative warrant (DW) term sheets issued by Bualuang Securities on the Stock Exchange of Thailand (SET). Extracts 100+ fields into a unified global 238-column data matrix, handling Thai BE date conversion, Bloomberg ticker normalization, cross-lingual semantic mapping, and legacy epoch artifact neutralization.",
  schema,
  systemPrompt,
  fewShotExamples: [],
  consensusEnabled: false,
  confidenceThreshold: 85,
  conflictResolution: "majority" as const,
  citationEnabled: true,
  citationIncludePdfPage: true,
  citationIncludeBbox: false,
  citationIncludeParagraphId: false,
  contextWindow: "128k",
  defaultModel: "gpt-4o",
};

async function main() {
  if (!API_TOKEN) {
    console.error(
      "Error: API_TOKEN environment variable is required.\n" +
        "Get a token by logging in: POST /auth/login with email & password.\n" +
        "Usage: API_TOKEN=<your-jwt> npx tsx misc/create-dw-extractor.ts",
    );
    process.exit(1);
  }

  console.log("Creating Thai DW Term Sheet Extractor...");
  console.log(`API URL: ${API_URL}`);
  console.log(
    `Schema fields: ${Object.keys(schema.properties).length} properties`,
  );
  console.log(`Required fields: ${schema.required.length} required\n`);

  const response = await fetch(`${API_URL}/extractors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify(extractorPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to create extractor: ${response.status}`);
    console.error(errorText);
    process.exit(1);
  }

  const extractor = await response.json();
  console.log("Extractor created successfully!");
  console.log(`  ID:   ${extractor.id}`);
  console.log(`  Name: ${extractor.name}`);
  console.log(`  Created: ${extractor.createdAt}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
