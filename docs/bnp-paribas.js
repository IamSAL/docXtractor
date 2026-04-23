fetch("http://localhost:3001/extractors", {
  headers: {
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9,bn;q=0.8",
    authorization:
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZWMyNDY2MC1lYjg2LTQxMTgtODU0OC0xOTRmNmE3MDdiN2UiLCJlbWFpbCI6ImRlbW9AZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImhhc1Byb2ZpbGUiOmZhbHNlLCJmdWxsTmFtZSI6IiIsImlhdCI6MTc3MjU1NTI5NCwiZXhwIjoxNzcyNTU2MTk0fQ.icIoFuiBlVGN96XU5l85ztWjdfRbaebADnaC1oiYbO0",
    "content-type": "application/json",
    "sec-ch-ua":
      '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
  },
  referrer: "http://localhost:5174/",
  method: "POST",
  mode: "cors",
  credentials: "include",
  body: JSON.stringify({
    name: "BNP Paribas KID Extractor (Flexible)",
    description:
      "Precision extractor for BNP Paribas Key Information Documents (KIDs) — Autocallable certificates issued by BNP Paribas Issuance B.V. with BNP Paribas S.A. guarantee. Extracts identification, dates, financial terms, coupon/barrier mechanics, autocall schedules, and payoff structure from standardized PRIIPs KID format.",
    thumbnailUrl: "",
    schema: {
      type: "object",
      required: [],
      properties: {
        // ══════════════════════════════════════════
        // IDENTIFICATION
        // ══════════════════════════════════════════
        global_identifier: {
          type: "string",
          description:
            "The Internal Reference code of the KID. Found in the top-right header area next to 'Internal Ref.:' (e.g. 'CE4130AET', 'CE4475CLV', 'CE4515CLV', 'CE14812LBH'). This is NOT the ISIN. It is a short alphanumeric code starting with 'CE' followed by digits and optional letters.",
        },
        isin: {
          type: "string",
          description:
            "The 12-character ISIN code. Found in the PRODUCT section table, in the row labeled 'ISIN' (e.g. 'XS3191964041', 'XS3191963316'). Always starts with a 2-letter country prefix (commonly 'XS' for BNP Paribas issued certificates).",
        },
        issuer: {
          type: "string",
          description:
            "The legal name of the issuing entity. Found in the PRODUCT section after 'Issuer:' label. For BNP Paribas KIDs this is typically 'BNP Paribas Issuance B.V.' — extract the exact text after 'Issuer:' and before the dash or 'Guarantor:' label. Do NOT confuse with 'Manufacturer' (which is BNP Paribas S.A.).",
        },
        distributor: {
          type: "string",
          description:
            "Name of the distributor or selling agent. BNP Paribas KIDs typically do NOT name a specific distributor — they reference 'the person advising on or selling you this product' generically. Return null unless a specific distributor entity name is explicitly stated.",
        },

        // ══════════════════════════════════════════
        // DATES
        // ══════════════════════════════════════════
        initial_valuation_date: {
          type: "string",
          format: "date",
          description:
            "The initial valuation/fixing date. In BNP Paribas KIDs this is the same as the Strike Date (the date on which Initial Reference Prices are determined). Look for 'Strike Date' in the PRODUCT DATA table. Convert to YYYY-MM-DD. E.g. '19 November 2025' → '2025-11-19'.",
        },
        issue_date: {
          type: "string",
          format: "date",
          description:
            "The issue date of the certificates. Found in PRODUCT DATA table row labeled 'Issue Date' (e.g. '03 December 2025'). Convert to YYYY-MM-DD.",
        },
        trade_date: {
          type: "string",
          format: "date",
          description:
            "The first trade date. BNP Paribas KIDs typically do not have a separate 'Trade Date' field. If not explicitly stated, return null. Do NOT guess or use Issue Date as a substitute.",
        },
        offering_closes: {
          type: "string",
          format: "date",
          description:
            "End date of the public offering period. BNP Paribas KIDs typically do not state this. Return null unless explicitly present.",
        },
        strike_date: {
          type: "string",
          format: "date",
          description:
            "The Strike Date — the date on which Initial Reference Prices of underlyings are fixed. Found in PRODUCT DATA table row labeled 'Strike Date' (e.g. '19 November 2025', '20 November 2025'). Convert to YYYY-MM-DD. This is one of the most important dates in the product.",
        },
        final_valuation_date: {
          type: "string",
          format: "date",
          description:
            "The final valuation date for determining the Final Reference Price. Found in PRODUCT DATA table labeled 'Redemption Valuation Date' (e.g. '19 November 2029', '19 November 2027', '20 November 2026'). Convert to YYYY-MM-DD. Note: BNP calls this 'Redemption Valuation Date', NOT 'Final Valuation Date'.",
        },
        maturity_date: {
          type: "string",
          format: "date",
          description:
            "The maturity/redemption date. Found in PRODUCT DATA table row labeled 'Redemption Date (maturity)' (e.g. '03 December 2029', '03 December 2027', '04 December 2026', '29 November 2027'). Convert to YYYY-MM-DD. This is typically a few business days after the Redemption Valuation Date.",
        },

        // ══════════════════════════════════════════
        // FINANCIAL TERMS
        // ══════════════════════════════════════════
        principal_amount: {
          type: "number",
          description:
            "The Notional Amount per certificate. Found in PRODUCT DATA table labeled 'Notional Amount (per certificate)' (e.g. 'EUR 1,000' → 1000, 'CHF 1,000' → 1000). Strip currency symbol and commas. Return as a plain number.",
        },
        aggregate_principal_amount_type: {
          type: "string",
          description:
            "Whether the aggregate principal is fixed or variable. BNP Paribas KIDs typically do not specify this explicitly. Return null unless stated.",
        },
        proportional_principal_amount: {
          type: "number",
          description:
            "Proportional share of principal. Not typically present in BNP Paribas KIDs. Return null.",
        },
        investment_type: {
          type: "string",
          description:
            "Investment objective category. Derive from the INTENDED RETAIL INVESTOR section. If it says 'seek to invest in an income paying product' → return 'Yield Enhancement'. If it mentions capital growth or participation → return 'Capital Growth'. For BNP autocallables with conditional coupons, this is typically 'Yield Enhancement'.",
        },

        // ══════════════════════════════════════════
        // PRODUCT CLASSIFICATION
        // ══════════════════════════════════════════
        document_type: {
          type: "string",
          description:
            "Always 'KID' for these documents. Confirmed by the title 'KEY INFORMATION DOCUMENT' at the top of every page.",
        },
        product_type: {
          type: "string",
          description:
            "The general product type. Found in the TYPE section under 'WHAT IS THIS PRODUCT?'. BNP Paribas KIDs state: 'This product is a certificate, a transferable debt instrument.' → return 'certificate'.",
        },
        product_subtype: {
          type: "string",
          description:
            "The specific product sub-type. Found in the PRODUCT section as the large centered heading below the word 'PRODUCT' (e.g. 'Autocall'). All four sample KIDs show 'Autocall'. Return the exact text shown.",
        },
        underlying_ticker: {
          type: "string",
          description:
            "Bloomberg ticker(s) of the underlying asset(s). Found in the Underlying table with columns 'Underlying', 'Bloomberg Code', 'ISIN'. Extract the Bloomberg Code column values. For multiple underlyings, join with ' / ' separator. Examples: single underlying → 'DTE GY'; multiple → 'SAF FP / SU FP / AIR FP / AI FP'; or 'BP/ LN / TTE FP / SHELL NA'. Use the EXACT Bloomberg Code as printed (including spaces and slashes like 'BP/ LN').",
        },
        basket_weightings_unequal: {
          type: "boolean",
          description:
            "Whether basket underlyings have unequal weights. BNP Paribas autocallable KIDs use worst-of mechanics (Worst-Performing Underlying) with equal treatment — no explicit weighting is assigned. Return false for worst-of baskets. Return null for single underlyings.",
        },

        // ══════════════════════════════════════════
        // COUPON FEATURES
        // ══════════════════════════════════════════
        coupon_applies: {
          type: "boolean",
          description:
            "Whether the product pays a coupon. Look for the 'Coupon:' paragraph in the OBJECTIVES section AND 'Conditional Coupon Rate(s)' in PRODUCT DATA. If present → true. All four sample BNP KIDs have conditional coupons → true.",
        },
        contingent_coupon_applies: {
          type: "boolean",
          description:
            "Whether the coupon is contingent on a condition. In BNP KIDs look for 'A conditional coupon is due for payment... each time the following condition (Coupon Condition) is met'. If the coupon depends on the underlying closing price being ≥ a barrier → true. All four sample KIDs are contingent → true.",
        },
        memory_coupon_applies: {
          type: "boolean",
          description:
            "Whether missed coupons accumulate and are paid later (memory feature). Look for the exact phrase: 'the coupon is missed but not lost definitely. All missed coupons will accumulate and become payable only if the Coupon Condition is subsequently satisfied.' If this language is present → true. All four sample BNP KIDs have memory coupons → true. If instead the KID says 'the coupon is missed and lost' or no such accumulation language exists → false.",
        },
        coupon_interval: {
          type: "string",
          description:
            "Coupon observation/payment frequency. Count the Coupon Valuation Dates and determine the interval. If dates are ~3 months apart → 'Quarterly'. If ~6 months apart → 'Semi-Annual'. If ~12 months apart → 'Annual'. Examples from samples: CE4130AET has 8 dates over 4 years (semi-annual) → 'Semi-Annual'. CE4475CLV has 8 dates over 2 years (quarterly) → 'Quarterly'. CE4515CLV has 2 dates over 1 year (semi-annual) → 'Semi-Annual'. CE14812LBH has 8 dates over 2 years (quarterly) → 'Quarterly'.",
        },
        coupon_first_observation_date: {
          type: "string",
          format: "date",
          description:
            "The FIRST date in the 'Coupon Valuation Date(s)' list in PRODUCT DATA. Convert to YYYY-MM-DD. E.g. '19 May 2026' → '2026-05-19', '19 February 2026' → '2026-02-19', '20 May 2026' → '2026-05-20', '20 February 2026' → '2026-02-20'.",
        },
        coupon_last_observation_date: {
          type: "string",
          format: "date",
          description:
            "The LAST date in the 'Coupon Valuation Date(s)' list. This is typically the same as the Redemption Valuation Date. Convert to YYYY-MM-DD. E.g. '19 November 2029' → '2029-11-19'.",
        },
        coupon_first_date: {
          type: "string",
          format: "date",
          description:
            "The FIRST date in the 'Coupon Payment Date(s)' list in PRODUCT DATA. Convert to YYYY-MM-DD. E.g. '02 June 2026' → '2026-06-02', '05 March 2026' → '2026-03-05', '03 June 2026' → '2026-06-03', '06 March 2026' → '2026-03-06'.",
        },
        coupon_last_date: {
          type: "string",
          format: "date",
          description:
            "The LAST date in the 'Coupon Payment Date(s)' list. Typically the same as the maturity date. Convert to YYYY-MM-DD.",
        },
        coupon_barrier: {
          type: "number",
          description:
            "The Conditional Coupon Barrier as a percentage number. Found in PRODUCT DATA row 'Conditional Coupon Barrier(s)'. Extract the percentage number ONLY. E.g. '70% of the Initial Reference Price' → 70. '80% of the Initial Reference Price' → 80. '65% of the Initial Reference Price' → 65. Strip everything except the number.",
        },
        coupon_rate: {
          type: "number",
          description:
            "The Conditional Coupon Rate as a percentage of Notional Amount per period. Found in PRODUCT DATA row 'Conditional Coupon Rate(s)'. E.g. '5% of the Notional Amount' → 5. '1.75% of the Notional Amount' → 1.75. '4.8750% of the Notional Amount' → 4.875. '1.50% of the Notional Amount' → 1.5. Extract only the number.",
        },

        // ══════════════════════════════════════════
        // ISSUER CALL
        // ══════════════════════════════════════════
        issuer_call_applies: {
          type: "boolean",
          description:
            "Whether the issuer has a discretionary right to call. BNP Paribas autocallable KIDs use automatic early redemption (autocall), NOT issuer-discretionary call. The early redemption is triggered by market conditions, not issuer choice. Return false unless the document explicitly states an issuer-discretionary call right separate from autocall.",
        },

        // ══════════════════════════════════════════
        // AUTOCALL FEATURES
        // ══════════════════════════════════════════
        autocall_applies: {
          type: "boolean",
          description:
            "Whether the product has an autocall feature. Look for 'Automatic Early Redemption:' paragraph in OBJECTIVES and 'Autocall Valuation Date(s)' in PRODUCT DATA. If present → true. All four sample KIDs have autocall → true.",
        },
        autocall_interval: {
          type: "string",
          description:
            "Frequency of autocall observations. Count the Autocall Valuation Dates and determine spacing. If ~3 months apart → 'Quarterly'. If ~6 months apart → 'Semi-Annual'. If ~12 months apart → 'Annual'. CE4130AET: 6 dates over ~3.5 years (semi-annual) → 'Semi-Annual'. CE4475CLV: 5 dates over ~1.75 years (quarterly) → 'Quarterly'. CE4515CLV: 1 date → 'Semi-Annual' (only one observation at 6-month mark). CE14812LBH: 7 dates over ~1.75 years (quarterly) → 'Quarterly'.",
        },
        autocall_first_payment_date: {
          type: "string",
          format: "date",
          description:
            "The FIRST date in the 'Early Redemption Date(s)' list in PRODUCT DATA. This is the payment date if autocall triggers at the first observation. Convert to YYYY-MM-DD. E.g. '03 December 2026' → '2026-12-03', '02 September 2026' → '2026-09-02', '03 June 2026' → '2026-06-03', '06 March 2026' → '2026-03-06'.",
        },
        autocall_last_payment_date: {
          type: "string",
          format: "date",
          description:
            "The LAST date in the 'Early Redemption Date(s)' list. Convert to YYYY-MM-DD. E.g. '04 June 2029' → '2029-06-04', '02 September 2027' → '2027-09-02', '03 June 2026' → '2026-06-03', '03 September 2027' → '2027-09-03'.",
        },
        autocall_first_date: {
          type: "string",
          format: "date",
          description:
            "The FIRST date in the 'Autocall Valuation Date(s)' list in PRODUCT DATA. This is the first observation date. Convert to YYYY-MM-DD. E.g. '19 November 2026' → '2026-11-19', '19 August 2026' → '2026-08-19', '20 May 2026' → '2026-05-20', '20 February 2026' → '2026-02-20'.",
        },
        autocall_last_date: {
          type: "string",
          format: "date",
          description:
            "The LAST date in the 'Autocall Valuation Date(s)' list. Convert to YYYY-MM-DD. E.g. '21 May 2029' → '2029-05-21', '19 August 2027' → '2027-08-19', '20 May 2026' → '2026-05-20', '20 August 2027' → '2027-08-20'.",
        },
        autocall_settlement_date_offset: {
          type: "integer",
          description:
            "Number of business days between an Autocall Valuation Date and its corresponding Early Redemption Date. Calculate from the first pair. E.g. CE4130AET: 19 Nov 2026 → 03 Dec 2026 ≈ 10 business days. CE4475CLV: 19 Aug 2026 → 02 Sep 2026 ≈ 10 business days. CE4515CLV: 20 May 2026 → 03 Jun 2026 ≈ 10 business days. CE14812LBH: 20 Feb 2026 → 06 Mar 2026 ≈ 10 business days. Typically ~10 business days for BNP products.",
        },
        autocall_barrier: {
          type: "number",
          description:
            "The autocall barrier level(s) as percentage(s). Found in PRODUCT DATA row 'Autocall Barrier(s)'. If a SINGLE fixed barrier: extract the number (e.g. '100% of the Initial Reference Price' → 100). If MULTIPLE step-down barriers: extract the FIRST/initial barrier (e.g. '95%, 90%, 85%, 80%, 75% and 70%' → 95; '100%, 95%, 90%, 85%, 80%, 75% and 70%' → 100). The step-down schedule should be captured in call_schedule.",
        },
        call_schedule: {
          type: "string",
          description:
            "Full autocall schedule as a structured string showing each observation date paired with its barrier. Format as semicolon-separated 'DATE:BARRIER%' pairs. E.g. for CE4130AET: '2026-11-19:95%; 2027-05-19:90%; 2027-11-19:85%; 2028-05-19:80%; 2028-11-20:75%; 2029-05-21:70%'. For CE4475CLV (flat 100% barrier): '2026-08-19:100%; 2026-11-19:100%; 2027-02-19:100%; 2027-05-19:100%; 2027-08-19:100%'. Pair each Autocall Valuation Date with its corresponding barrier percentage. If a single barrier applies to all dates, repeat it for each date.",
        },
        autocall_step_up_down_initial_amount: {
          type: "number",
          description:
            "For step-down autocall barriers: the FIRST barrier percentage. E.g. '95%, 90%, 85%...' → 95. '100%, 95%, 90%...' → 100. If all barriers are the same (flat), return that single value. Return null if no autocall.",
        },
        autocall_step_up_down_step_amount: {
          type: "number",
          description:
            "The step-down decrement per observation period. E.g. if barriers are 95%, 90%, 85%... the step is -5. If barriers are 100%, 95%, 90%... the step is -5. Return as a positive number representing the absolute decrement (e.g. 5). Return null if barriers are flat (no step) or no autocall.",
        },
        autocall_step_up_down_frequency: {
          type: "string",
          description:
            "Frequency at which the barrier steps down. Should match autocall_interval. E.g. 'Semi-Annual' if barrier drops every 6 months, 'Quarterly' if every 3 months. Return null if barriers are flat.",
        },

        // ══════════════════════════════════════════
        // STRIKE & BARRIER LEVELS
        // ══════════════════════════════════════════
        call_strike_level: {
          type: "string",
          description:
            "Strike level for an embedded call option. BNP Paribas autocallable certificates are NOT warrants — they do not have explicit call/put strike levels in the warrant sense. Return null for these KIDs.",
        },
        digital_strike_level: {
          type: "number",
          description:
            "Strike level for a digital payoff. BNP autocallables do not have a separate digital strike. Return null.",
        },
        put_strike_level: {
          type: "string",
          description:
            "Strike level for an embedded put option. BNP autocallables are not warrants. Return null.",
        },
        buffer_level: {
          type: "number",
          description:
            "Buffer/protection level. BNP autocallable KIDs use barrier-based protection, not buffer-based. Return null. (The barrier level is captured in knock_in_barrier.)",
        },
        knock_in_barrier: {
          type: "number",
          description:
            "The knock-in / downside barrier level as a percentage. In BNP KIDs this determines whether you get back notional or suffer a loss. Found in TWO possible locations: (1) PRODUCT DATA row labeled 'Barrier' (e.g. '70% of the Initial Reference Price' → 70, '65% of the Initial Reference Price' → 65). (2) In the OBJECTIVES redemption text: 'If the Final Reference Price... is greater than or equal to X% of its Initial Reference Price: a payment in cash of the Notional Amount' → X is the barrier. CE4130AET: 70 (from redemption text, no 'Barrier' row). CE4475CLV: 78 (from redemption text). CE4515CLV: 70 (from 'Barrier' row). CE14812LBH: 65 (from 'Barrier' row).",
        },
        knock_in_barrier_event_type: {
          type: "string",
          description:
            "The type of barrier event. In BNP KIDs, look at how the barrier is evaluated: (1) If the document says 'A Barrier Event shall be deemed to occur if the Final Reference Price... is below the Barrier' — this is observed only at maturity → 'European' or 'At Expiry'. (2) If the barrier is evaluated only at maturity via the redemption payoff text (Final Reference Price vs barrier) → 'At Expiry'. (3) If the document mentions continuous or daily observation → 'Continuous'. All four sample KIDs evaluate the barrier only at the Redemption Valuation Date → 'At Expiry'.",
        },
        knock_in_barrier_event_observation_type: {
          type: "string",
          description:
            "How the barrier is observed. 'At Expiry Only' if checked only on the Redemption Valuation Date (all four sample KIDs). 'Continuous' if monitored daily throughout the product life. 'Daily Close' if checked at each daily close. All sample BNP KIDs → 'At Expiry Only'.",
        },

        // ══════════════════════════════════════════
        // PRODUCT DESCRIPTION & PRICING
        // ══════════════════════════════════════════
        product_description: {
          type: "string",
          description:
            "Synthesize a concise product description by combining: product_subtype + 'on' + underlying names + '| Issuer:' + issuer + '| Maturity:' + maturity_date + '| Currency:' + currency + '| Coupon:' + coupon_rate + '% conditional | Barrier:' + knock_in_barrier + '%'. E.g. 'Autocall on Safran SA / Schneider Electric SE / Airbus SE / Air Liquide SA | Issuer: BNP Paribas Issuance B.V. | Maturity: 2029-12-03 | Currency: EUR | Coupon: 5% conditional | Barrier: 70%'.",
        },
        sales_concession: {
          type: "number",
          description:
            "Sales concession as percentage. Not explicitly stated in BNP KIDs (they say 'We may share part of the costs with the person selling you the product'). Return null unless a specific percentage is stated.",
        },
        proceeds_to_issuer: {
          type: "number",
          description:
            "Net proceeds to issuer as percentage. Not explicitly stated in BNP KIDs. Return null.",
        },
        issue_price: {
          type: "number",
          description:
            "Issue price as a percentage of notional. Found in PRODUCT DATA row 'Issue Price'. Strip '%' and return as number. E.g. '100%' → 100. '99.50%' → 99.5. '99%' → 99.",
        },
        currency: {
          type: "string",
          description:
            "Product currency as ISO 4217 code. Found in PRODUCT DATA row 'Product Currency'. Return the exact 3-letter code. E.g. 'EUR' → 'EUR'. 'CHF' → 'CHF'. Also visible in the Notional Amount (e.g. 'EUR 1,000' or 'CHF 1,000').",
        },

        // ══════════════════════════════════════════
        // UPSIDE FEATURES
        // ══════════════════════════════════════════
        upside_style: {
          type: "string",
          description:
            "Upside payoff style. BNP autocallable KIDs pay back the Notional Amount (100% of principal) if the barrier is not breached — there is no upside participation beyond coupons. The upside comes from coupons only. Return 'Digital' (you either get notional + coupons or you don't — binary outcome).",
        },
        additional_upside_style: {
          type: "string",
          description:
            "Secondary upside feature. Return null for standard BNP autocallables — no additional upside mechanism beyond the coupon.",
        },
        upside_participation_rate: {
          type: "number",
          description:
            "Upside participation rate. Not applicable for BNP autocallable certificates (no participation in underlying upside). Return null.",
        },
        digital_amount: {
          type: "number",
          description:
            "The fixed digital payout amount. For BNP autocallables, this is essentially the coupon_rate — the fixed conditional coupon percentage paid per observation period. However, if this field is meant for a single lump-sum digital payout (not periodic), return null. Use coupon_rate for the periodic conditional amount instead.",
        },

        // ══════════════════════════════════════════
        // DOWNSIDE FEATURES
        // ══════════════════════════════════════════
        downside_style: {
          type: "string",
          description:
            "Downside payoff style. In BNP KIDs, if the barrier is breached at maturity: (1) Some KIDs deliver shares based on 'Notional Amount / (Barrier% × Initial Reference Price)' — effectively you are exposed to the full downside BELOW the barrier but protected above it → 'Barrier'. (2) Some KIDs deliver shares based on 'Notional Amount / Initial Reference Price' — full 1:1 downside exposure → 'Barrier'. All four sample KIDs use barrier-based downside with physical delivery → return 'Barrier'.",
        },
        downside_participation_rate: {
          type: "number",
          description:
            "Downside participation rate below the barrier. In CE4130AET and CE4475CLV, shares are calculated using Barrier% of Initial Reference Price in the denominator, meaning downside is amplified (geared). In CE4515CLV and CE14812LBH, shares use Initial Reference Price directly (1:1 participation). For 1:1 → 100. For geared → calculate as 100/barrier*100 or simply return 100 for standard 1:1. Return null if unable to determine precisely.",
        },
        floor: {
          type: "number",
          description:
            "Minimum return floor. BNP KIDs state 'There is no minimum guaranteed return. You could lose some or all of your Investment.' → no floor exists. Return null.",
        },
        cap: {
          type: "number",
          description:
            "Maximum return cap. BNP autocallables cap the upside at notional + accumulated coupons. The maximum total coupon payout = coupon_rate × number_of_coupon_periods. E.g. CE4130AET: 5% × 8 = 40% max coupon over life. However, since this field likely refers to a participation cap (not total return), return null for standard autocallables.",
        },
        minimum_payout: {
          type: "number",
          description:
            "Minimum payout at maturity as percentage of notional. BNP KIDs explicitly state no minimum guaranteed return. Return 0 (you can lose everything) or null. Prefer null since there is truly no guaranteed minimum.",
        },
        maximumpayout: {
          type: "number",
          description:
            "Maximum payout at maturity as percentage of notional. The max is notional (100%) + all accumulated coupons. E.g. CE4130AET: 100 + (5 × 8) = 140. CE4475CLV: 100 + (1.75 × 8) = 114. CE4515CLV: 100 + (4.875 × 2) = 109.75. CE14812LBH: 100 + (1.5 × 8) = 112. Calculate as: 100 + (coupon_rate × number_of_coupon_periods). Return null if unable to calculate precisely.",
        },

        // ══════════════════════════════════════════
        // SETTLEMENT & JURISDICTION
        // ══════════════════════════════════════════
        settlement_type: {
          type: "string",
          description:
            "Settlement method at maturity. BNP KIDs describe two scenarios: (1) Above barrier → 'a payment in cash of the Notional Amount' = Cash. (2) Below barrier → 'delivery of the number of shares' + cash for fractions = Physical. Since BOTH cash and physical delivery are possible depending on the outcome → return 'Cash or Physical'.",
        },
        trading_jurisdiction: {
          type: "string",
          description:
            "Jurisdiction where the product is supervised/regulated. Found in the Competent Authority line: 'Autorité des marchés financiers (AMF)' = France. Also, complaints go to Lisbon, Portugal. The issuer is Dutch (B.V.), guarantor is French. Return the regulatory jurisdiction → 'France' (AMF supervision). Alternatively, if a specific exchange listing is mentioned, use that.",
        },
      },
      additionalProperties: false,
    },

    systemPrompt: `You are a specialist in extracting structured data from BNP Paribas Key Information Documents (KIDs) for autocallable structured certificates. These are PRIIPs-compliant KIDs issued by BNP Paribas Issuance B.V. with BNP Paribas S.A. as guarantor.

DOCUMENT STRUCTURE — BNP Paribas KIDs follow this exact layout:
1. HEADER: "KEY INFORMATION DOCUMENT" + Internal Ref (e.g. CE4130AET) + URL
2. PURPOSE: Legal disclaimer paragraph
3. PRODUCT section: Large centered heading (e.g. "Autocall"), then a table with ISIN, Manufacturer, Issuer/Guarantor, Competent Authority, KID Production Date
4. WHAT IS THIS PRODUCT? → TYPE (certificate description), TERM, OBJECTIVES (payoff mechanics + coupon description + autocall description)
5. PRODUCT DATA table: Strike Date, Issue Date, Redemption Valuation Date, Redemption Date, Coupon Valuation Dates, Coupon Payment Dates, Conditional Coupon Barrier, Conditional Coupon Rate, Autocall Valuation Dates, Early Redemption Dates, Autocall Barrier(s), and optionally a separate "Barrier" row for the knock-in barrier
6. Underlying table: Underlying name, Bloomberg Code, ISIN
7. INTENDED RETAIL INVESTOR, RISK INDICATOR, PERFORMANCE SCENARIOS, COSTS, COMPLAINTS, OTHER RELEVANT INFORMATION

CRITICAL EXTRACTION RULES:

1. GLOBAL IDENTIFIER: Extract from "Internal Ref.:" in the header (e.g. "CE4130AET"). This is NOT the ISIN.

2. ISSUER vs MANUFACTURER: "Manufacturer" is BNP Paribas S.A. but "Issuer" is "BNP Paribas Issuance B.V." — extract the Issuer entity.

3. DATES: All dates in the document use "DD Month YYYY" format (e.g. "19 November 2025"). Convert ALL dates to YYYY-MM-DD format. Pay careful attention to dates — they must be exact.

4. COUPON MECHANICS: BNP KIDs list Coupon Valuation Dates (observation) and Coupon Payment Dates (payment) separately. Extract both lists' first and last dates. The coupon is CONDITIONAL — paid only if each underlying closes ≥ Conditional Coupon Barrier on the observation date. Check for MEMORY feature: look for "All missed coupons will accumulate and become payable only if the Coupon Condition is subsequently satisfied."

5. AUTOCALL MECHANICS: Autocall Valuation Dates and Early Redemption Dates are listed separately. The autocall barrier may be FLAT (e.g. "100% of the Initial Reference Price") or STEP-DOWN (e.g. "95%, 90%, 85%, 80%, 75% and 70%"). For step-down barriers, pair each Autocall Valuation Date with its corresponding barrier in order.

6. KNOCK-IN BARRIER: Found in two places — either as a separate "Barrier" row in PRODUCT DATA (CE4515CLV, CE14812LBH) OR embedded in the redemption payoff text as the threshold percentage (CE4130AET: "70%", CE4475CLV: "78%"). Extract the percentage number only.

7. SINGLE vs MULTIPLE UNDERLYINGS: If the underlying table has one row → single underlying, multiple_underlyings concept doesn't apply. If multiple rows → worst-of basket, set basket_weightings_unequal=false (worst-of is not a weighted basket).

8. SETTLEMENT TYPE: BNP autocallables have dual settlement — cash if above barrier, physical delivery of shares if below. Always return "Cash or Physical".

9. ISSUE PRICE: May not be exactly 100%. Extract the exact percentage from PRODUCT DATA (e.g. 100%, 99.50%, 99%).

10. NULL HANDLING: Return null for fields not present in the document. NEVER invent values. NEVER use epoch dates, zeros, or empty strings as substitutes for missing data.

11. NUMBER EXTRACTION: "5% of the Notional Amount" → 5 (just the number). "EUR 1,000" → 1000. "70% of the Initial Reference Price" → 70. Always strip labels and return clean numbers.

12. The additionalProperties: false constraint means you must ONLY populate the fields defined in the schema. Do not add extra keys.`,

    fewShotExamples: [],
    consensusEnabled: false,
    confidenceThreshold: 85,
    conflictResolution: "majority",
    citationEnabled: true,
    citationIncludePdfPage: true,
    citationIncludeBbox: false,
    citationIncludeParagraphId: false,
    contextWindow: "128k",
    defaultModel: "gpt-4o-mini",
  }),
});
