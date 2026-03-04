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
    name: "BNP Paribas KID Extractor",
    description:
      "Expert-level extractor for BNP Paribas PRIIPs Key Information Documents (KIDs) — Autocallable Barrier Reverse Convertible certificates issued by BNP Paribas Issuance B.V. with BNP Paribas S.A. guarantee. Handles both directly extractable fields and derived/inferred fields requiring financial domain reasoning.",
    thumbnailUrl: "",
    schema: {
      type: "object",
      required: [],
      properties: {
        // ══════════════════════════════════════════════════════════════
        // IDENTIFICATION — Directly extractable from document header
        // ══════════════════════════════════════════════════════════════
        global_identifier: {
          type: "string",
          description:
            "DIRECTLY EXTRACTABLE. The Internal Reference code. Found next to 'Internal Ref.:' in the top-right header (e.g. 'CE4130AET', 'CE4475CLV', 'CE4515CLV', 'CE14812LBH'). This is the issuer's internal product code — NOT the ISIN. Starts with 'CE' followed by digits and optional suffix letters. Also appears embedded in the URL (e.g. 'http://kid.bnpparibas.com/CE4130AET-B83B6-EN.pdf').",
        },
        isin: {
          type: "string",
          description:
            "DIRECTLY EXTRACTABLE. Found in the PRODUCT section table row labeled 'ISIN'. A 12-character International Securities Identification Number. BNP Paribas certificates typically use 'XS' prefix (cross-border Euroclear/Clearstream settled). Validate: must be exactly 12 alphanumeric characters, starting with a 2-letter country/system code (XS, DE, FR, etc.).",
        },
        issuer: {
          type: "string",
          description:
            "DIRECTLY EXTRACTABLE but REQUIRES CAREFUL DISTINCTION. Found after 'Issuer:' in the Manufacturer row. CRITICAL: BNP Paribas KIDs list THREE entities — (1) 'Manufacturer' = BNP Paribas S.A. (the parent/arranger), (2) 'Issuer' = BNP Paribas Issuance B.V. (the Dutch SPV that legally issues the notes), (3) 'Guarantor' = BNP Paribas S.A. Extract ONLY the Issuer entity. The Issuer is the legal obligor on the certificates. BNP Paribas Issuance B.V. is a special purpose vehicle (SPV) incorporated in the Netherlands solely for issuance purposes, with BNP Paribas S.A. providing an unconditional and irrevocable guarantee.",
        },
        distributor: {
          type: "string",
          description:
            "REQUIRES INFERENCE. BNP Paribas KIDs do NOT name a specific distributor. They generically reference 'the person advising on or selling you this product'. HOWEVER, clues may exist: (1) If the KID URL contains a distributor code suffix, note it. (2) If Entry Costs section mentions 'We may share part of the costs with the person selling you the product', this confirms a distributor exists but is unnamed. (3) In some jurisdictions, the competent authority or complaint address may hint at the distribution channel. Return null unless a specific entity name is explicitly stated in the document.",
        },

        // ══════════════════════════════════════════════════════════════
        // DATES — Mix of directly extractable and derived
        // ══════════════════════════════════════════════════════════════
        initial_valuation_date: {
          type: "string",
          format: "date",
          description:
            "DERIVED FROM STRIKE DATE. In autocallable structured products, the Initial Reference Price (the benchmark against which all barriers are measured) is fixed on the Strike Date. Therefore initial_valuation_date = strike_date. Look for 'Strike Date' in PRODUCT DATA. The document defines: 'The Initial Reference Price of an Underlying is the closing price of that Underlying on the Strike Date.' This confirms Strike Date IS the initial valuation date. Convert to yyyy-mm-ddThh:mm:ssZ.",
        },
        issue_date: {
          type: "string",
          format: "date",
          description:
            "DIRECTLY EXTRACTABLE. Found in PRODUCT DATA row 'Issue Date'. This is the date certificates are created and delivered to initial investors, typically T+5 to T+10 business days after the Strike Date. This gap exists because the product needs to be priced (on Strike Date), then settled and delivered. Convert to yyyy-mm-ddThh:mm:ssZ.",
        },
        trade_date: {
          type: "string",
          format: "date",
          description:
            "REQUIRES INFERENCE. Not explicitly labeled in BNP KIDs. In structured product conventions, the Trade Date is when the transaction terms are agreed — it is typically the same as or 1 day before the Strike Date. HOWEVER, since BNP KIDs do not provide this explicitly, return null unless a 'Trade Date' label is found. Do NOT assume it equals Strike Date without explicit evidence.",
        },
        offering_closes: {
          type: "string",
          format: "date",
          description:
            "REQUIRES INFERENCE. BNP KIDs do not state an offering close date. For listed certificates, the offering typically closes on or just before the Issue Date. However, since this is not explicitly stated, return null. In practice, the subscription period for retail certificates often ends 1-2 business days before Issue Date to allow settlement.",
        },
        strike_date: {
          type: "string",
          format: "date",
          description:
            "DIRECTLY EXTRACTABLE. Found in PRODUCT DATA row 'Strike Date'. This is the most critical date in the product — it is the date when ALL Initial Reference Prices are fixed at closing levels. Every barrier, coupon condition, and autocall condition references back to the Initial Reference Price determined on this date. The Strike Date is typically BEFORE the Issue Date. Convert to yyyy-mm-ddThh:mm:ssZ.",
        },
        final_valuation_date: {
          type: "string",
          format: "date",
          description:
            "DIRECTLY EXTRACTABLE but LABELED DIFFERENTLY. BNP Paribas labels this as 'Redemption Valuation Date' in PRODUCT DATA — NOT 'Final Valuation Date'. This is the date on which the Final Reference Price is determined (closing price of each underlying). The document states: 'The Final Reference Price of an Underlying is the closing price of that Underlying on the Redemption Valuation Date.' This date drives whether the investor receives cash (notional) or physical shares. Convert to yyyy-mm-ddThh:mm:ssZ.",
        },
        maturity_date: {
          type: "string",
          format: "date",
          description:
            "DIRECTLY EXTRACTABLE. Found in PRODUCT DATA row 'Redemption Date (maturity)'. This is the payment/settlement date — typically 5-10 business days AFTER the Redemption Valuation Date. The gap allows the issuer to calculate payoffs, arrange share delivery if needed, and settle through Euroclear/Clearstream. VALIDATION: maturity_date should always be AFTER final_valuation_date. Convert to yyyy-mm-ddThh:mm:ssZ.",
        },

        // ══════════════════════════════════════════════════════════════
        // FINANCIAL TERMS — Mix of direct and derived
        // ══════════════════════════════════════════════════════════════
        principal_amount: {
          type: "number",
          description:
            "DIRECTLY EXTRACTABLE. Found in PRODUCT DATA row 'Notional Amount (per certificate)'. Strip currency code and formatting. E.g. 'EUR 1,000' → 1000, 'CHF 1,000' → 1000. This is the face value per certificate — the amount used to calculate ALL payoffs. Coupon payments = coupon_rate% × principal_amount. Autocall redemption = 100% × principal_amount. Share delivery calculation also references this amount.",
        },
        aggregate_principal_amount_type: {
          type: "string",
          description:
            "REQUIRES INFERENCE. BNP KIDs do not explicitly state this. However, for standard autocallable certificates: the total program size is typically variable (the issuer can increase the series). Since individual KIDs cover a single series with a fixed notional per certificate but no stated total size, infer 'Fixed' if a total issue size is mentioned, otherwise return null.",
        },
        proportional_principal_amount: {
          type: "number",
          description:
            "REQUIRES INFERENCE. Not applicable for standard BNP autocallable certificates — each certificate represents the full notional amount (there is no proportional sharing). Return null.",
        },
        investment_type: {
          type: "string",
          description:
            "DERIVED FROM PRODUCT STRUCTURE. This is NOT directly stated but must be inferred from the product mechanics: (1) The product pays conditional coupons (income generation), (2) No upside participation beyond coupons (no capital growth exposure), (3) The INTENDED RETAIL INVESTOR section says 'seek to invest in an income paying product'. These characteristics classify the product as 'Yield Enhancement' — a category in the Swiss Structured Products Association (SSPA) and European Structured Investment Products Association (EUSIPA) taxonomies. Autocallable barrier reverse convertibles are universally classified as yield enhancement products because the investor sacrifices upside participation in exchange for enhanced coupon income.",
        },

        // ══════════════════════════════════════════════════════════════
        // PRODUCT CLASSIFICATION — Mix of direct and derived
        // ══════════════════════════════════════════════════════════════
        document_type: {
          type: "string",
          description:
            "DIRECTLY EXTRACTABLE. The title 'KEY INFORMATION DOCUMENT' confirms this is a PRIIPs KID (Packaged Retail and Insurance-based Investment Products Key Information Document), mandated by EU Regulation 1286/2014. Return 'KID'.",
        },
        product_type: {
          type: "string",
          description:
            "DIRECTLY EXTRACTABLE. Found in TYPE section: 'This product is a certificate, a transferable debt instrument.' Return 'certificate'. In structured product taxonomy, certificates are securitized derivatives listed on exchanges, distinct from OTC notes or bonds. They are senior unsecured debt obligations of the issuer.",
        },
        product_subtype: {
          type: "string",
          description:
            "DIRECTLY EXTRACTABLE. The large centered heading in the PRODUCT section (e.g. 'Autocall'). DEEPER CLASSIFICATION: These BNP products are specifically 'Autocallable Barrier Reverse Convertibles' — they combine (1) autocall feature (early redemption if underlying ≥ barrier), (2) conditional coupon with memory, (3) European barrier at maturity, (4) worst-of basket mechanics, (5) physical delivery on barrier breach. However, extract the exact label from the document (usually 'Autocall').",
        },
        underlying_ticker: {
          type: "string",
          description:
            "DIRECTLY EXTRACTABLE. Found in the 'Underlying' table. Extract the 'Bloomberg Code' column values. For MULTIPLE underlyings, join with ' / '. The Bloomberg ticker format is: [TICKER] [EXCHANGE CODE] (e.g. 'SAF FP' = Safran on Euronext Paris, 'DTE GY' = Deutsche Telekom on Xetra, 'BP/ LN' = BP on London Stock Exchange, 'SLB UN' = SLB on NYSE). NOTE: Some tickers include a slash as part of the name (e.g. 'BP/ LN') — preserve these exactly. FINANCIAL CONTEXT: For worst-of baskets, the underlying with the worst performance (lowest Final/Initial ratio) determines the downside payoff.",
        },
        basket_weightings_unequal: {
          type: "boolean",
          description:
            "DERIVED FROM PRODUCT MECHANICS. BNP autocallable KIDs use 'worst-of' mechanics, NOT weighted basket averaging. In a worst-of structure, each underlying is evaluated independently — the Worst-Performing Underlying (lowest Final/Initial ratio) determines the payoff. There are NO explicit weightings assigned. RULE: If the document mentions 'Worst-Performing Underlying' → the basket is worst-of with NO weightings → return false. If only ONE underlying → return null (not a basket). If the document mentions specific percentage weights for each underlying → return true.",
        },

        // ══════════════════════════════════════════════════════════════
        // COUPON — Mix of direct extraction and financial reasoning
        // ══════════════════════════════════════════════════════════════
        coupon_applies: {
          type: "boolean",
          description:
            "DIRECTLY EXTRACTABLE. Look for 'Coupon:' paragraph in OBJECTIVES AND 'Conditional Coupon Rate(s)' in PRODUCT DATA. If any coupon mechanism exists → true. FINANCIAL CONTEXT: In autocallable BRCs, the coupon is the primary return mechanism for investors — they sacrifice upside equity participation in exchange for these enhanced coupons. The coupon rate is typically much higher than risk-free rates because the investor is implicitly short a put option on the underlying(s).",
        },
        contingent_coupon_applies: {
          type: "boolean",
          description:
            "DERIVED FROM COUPON CONDITION LANGUAGE. Look for 'A conditional coupon is due for payment... each time the following condition (Coupon Condition) is met: if, on a Coupon Valuation Date, the closing price of each underlying is greater than or equal to the relevant Conditional Coupon Barrier.' If coupon payment depends on underlying performance → true. CONTRAST: An unconditional/guaranteed coupon would say 'a fixed coupon of X% will be paid regardless of performance' — in that case → false. ALL BNP autocallable KIDs in the sample set have contingent coupons.",
        },
        memory_coupon_applies: {
          type: "boolean",
          description:
            "DERIVED FROM SPECIFIC LEGAL LANGUAGE. The memory feature is a critical product feature. Search for: 'the coupon is missed but not lost definitely. All missed coupons will accumulate and become payable only if the Coupon Condition is subsequently satisfied.' FINANCIAL SIGNIFICANCE: With memory, if the barrier is breached on observation dates 1, 2, 3 but met on date 4, the investor receives FOUR coupons on date 4 (the three missed + current). Without memory, missed coupons are permanently lost. Memory significantly increases product value and investor appeal. If this accumulation language is present → true. If the document says coupons are 'missed and lost' or no accumulation is mentioned → false.",
        },
        coupon_interval: {
          type: "string",
          description:
            "DERIVED BY CALCULATION. Count the Coupon Valuation Dates listed in PRODUCT DATA and calculate the spacing: (1) Compute months between consecutive dates, (2) If ~3 months apart → 'Quarterly', (3) If ~6 months apart → 'Semi-Annual', (4) If ~12 months apart → 'Annual', (5) If ~1 month apart → 'Monthly'. ALTERNATIVE METHOD: Count total coupon dates (N) and total product life in years (Y = maturity_date - strike_date). Frequency ≈ N/Y per year: 4/year = Quarterly, 2/year = Semi-Annual, 1/year = Annual, 12/year = Monthly. VALIDATION: coupon_interval should be consistent with the number of Coupon Payment Dates listed.",
        },
        coupon_first_observation_date: {
          type: "string",
          format: "date",
          description:
            "DIRECTLY EXTRACTABLE. The FIRST date in 'Coupon Valuation Date(s)' list in PRODUCT DATA. FINANCIAL CONTEXT: This is the first date on which the Coupon Condition is tested. The time between strike_date and this date represents the first coupon accrual period. Typically equals one coupon_interval period after the strike_date. Convert to yyyy-mm-ddThh:mm:ssZ.",
        },
        coupon_last_observation_date: {
          type: "string",
          format: "date",
          description:
            "DIRECTLY EXTRACTABLE. The LAST date in 'Coupon Valuation Date(s)' list. RELATIONSHIP: This should equal or be very close to the final_valuation_date (Redemption Valuation Date), because the last coupon observation typically coincides with the final product valuation. Convert to yyyy-mm-ddThh:mm:ssZ.",
        },
        coupon_first_date: {
          type: "string",
          format: "date",
          description:
            "DIRECTLY EXTRACTABLE. The FIRST date in 'Coupon Payment Date(s)' list. RELATIONSHIP: This is typically autocall_settlement_date_offset business days AFTER coupon_first_observation_date. The gap allows for calculation and settlement. Convert to yyyy-mm-ddThh:mm:ssZ.",
        },
        coupon_last_date: {
          type: "string",
          format: "date",
          description:
            "DIRECTLY EXTRACTABLE. The LAST date in 'Coupon Payment Date(s)' list. RELATIONSHIP: This should equal or be very close to the maturity_date, because the final coupon payment occurs at maturity alongside principal redemption. Convert to yyyy-mm-ddThh:mm:ssZ.",
        },
        coupon_barrier: {
          type: "number",
          description:
            "DIRECTLY EXTRACTABLE. Found in PRODUCT DATA row 'Conditional Coupon Barrier(s)'. Extract percentage number ONLY. E.g. '70% of the Initial Reference Price' → 70. FINANCIAL CONTEXT: This is the threshold that each underlying's closing price must meet or exceed (on the observation date) for the coupon to be paid. For worst-of baskets, ALL underlyings must be ≥ this barrier simultaneously. RELATIONSHIP TO knock_in_barrier: The coupon barrier and the knock-in (downside protection) barrier are OFTEN the same level (e.g. both 70%) but CAN differ. Always extract them independently. IMPORTANT: If multiple barrier levels are listed for different dates, extract the most common one or the first one.",
        },
        coupon_rate: {
          type: "number",
          description:
            "DIRECTLY EXTRACTABLE. Found in 'Conditional Coupon Rate(s)'. E.g. '5% of the Notional Amount' → 5. FINANCIAL CONTEXT: This is the coupon per observation PERIOD (not annualized). To calculate the annualized coupon: multiply by the number of periods per year. E.g. 5% semi-annual = 10% p.a. yield, 1.75% quarterly = 7% p.a. yield, 4.875% semi-annual = 9.75% p.a. yield, 1.5% quarterly = 6% p.a. yield. These rates are significantly above risk-free rates because the investor is implicitly selling downside put options.",
        },

        // ══════════════════════════════════════════════════════════════
        // ISSUER CALL
        // ══════════════════════════════════════════════════════════════
        issuer_call_applies: {
          type: "boolean",
          description:
            "DERIVED FROM PRODUCT MECHANICS. CRITICAL DISTINCTION: 'Issuer Call' = discretionary right of the issuer to redeem early at its own choosing. 'Autocall' = AUTOMATIC early redemption triggered by market conditions (underlying ≥ barrier). These are fundamentally different. In BNP autocallable KIDs, early redemption is ONLY automatic (contingent on underlying performance), NOT at issuer discretion. Look for language like 'at the option of the Issuer' or 'Issuer may elect to redeem' — if absent → false. The EXCEPTIONAL EVENTS clause (adjustments/early termination for corporate events) is NOT an issuer call — it's a disruption clause. Return false for standard autocallables.",
        },

        // ══════════════════════════════════════════════════════════════
        // AUTOCALL — Mix of direct and heavily derived fields
        // ══════════════════════════════════════════════════════════════
        autocall_applies: {
          type: "boolean",
          description:
            "DIRECTLY EXTRACTABLE. Look for 'Automatic Early Redemption:' paragraph in OBJECTIVES AND 'Autocall Valuation Date(s)' in PRODUCT DATA. If present → true. FINANCIAL CONTEXT: The autocall feature benefits the issuer by capping the product's life when the underlying performs well (reducing hedging costs). For investors, autocall returns principal early (reinvestment risk) but confirms the product performed well enough to trigger.",
        },
        autocall_interval: {
          type: "string",
          description:
            "DERIVED BY CALCULATION. Same methodology as coupon_interval but using Autocall Valuation Dates. IMPORTANT: autocall_interval may DIFFER from coupon_interval. E.g. CE4130AET has semi-annual coupons AND semi-annual autocall, but CE4475CLV starts autocall observations 9 months in (not from month 3 like coupons). Count spacing between consecutive Autocall Valuation Dates: ~3 months → 'Quarterly', ~6 months → 'Semi-Annual'. NOTE: The first autocall date is often LATER than the first coupon date (providing a 'no-call period'), but the interval between subsequent dates should be regular.",
        },
        autocall_first_payment_date: {
          type: "string",
          format: "date",
          description:
            "DIRECTLY EXTRACTABLE. First date in 'Early Redemption Date(s)' list. FINANCIAL CONTEXT: If autocall triggers at the FIRST observation, this is when the investor receives 100% of Notional Amount + any accumulated coupons. RELATIONSHIP: autocall_first_payment_date should be approximately autocall_settlement_date_offset business days after autocall_first_date.",
        },
        autocall_last_payment_date: {
          type: "string",
          format: "date",
          description:
            "DIRECTLY EXTRACTABLE. Last date in 'Early Redemption Date(s)' list. IMPORTANT: This is the last EARLY redemption date — NOT the maturity date. If autocall triggers at the last observation, this is the payment date. The maturity_date is the payment date if autocall NEVER triggers.",
        },
        autocall_first_date: {
          type: "string",
          format: "date",
          description:
            "DIRECTLY EXTRACTABLE. First date in 'Autocall Valuation Date(s)' list. FINANCIAL CONTEXT: The gap between strike_date and autocall_first_date is the 'non-call period' (also called 'soft protection period'). During this time, the product cannot be called even if underlyings are above the barrier. This protects the investor's coupon stream for at least one period. E.g. CE4130AET: ~12 months non-call; CE4475CLV: ~9 months non-call; CE4515CLV: ~6 months non-call; CE14812LBH: ~3 months non-call.",
        },
        autocall_last_date: {
          type: "string",
          format: "date",
          description:
            "DIRECTLY EXTRACTABLE. Last date in 'Autocall Valuation Date(s)' list. IMPORTANT: This is NOT the same as final_valuation_date. The last autocall observation typically occurs BEFORE the Redemption Valuation Date (because if autocall triggers at the very last observation, it would effectively be the same as maturity — so the last autocall date is usually one period before maturity).",
        },
        autocall_settlement_date_offset: {
          type: "integer",
          description:
            "DERIVED BY CALCULATION. Calculate the number of BUSINESS days between any Autocall Valuation Date and its corresponding Early Redemption Date. Use the first pair for calculation. Method: count weekdays (excluding weekends) between the two dates, then subtract estimated public holidays (typically 1-2 for a 10-day period). BNP standard is approximately 10 business days (T+10). EXAMPLES: CE4130AET: 19 Nov 2026 → 03 Dec 2026 = ~10 biz days. CE14812LBH: 20 Feb 2026 → 06 Mar 2026 = ~10 biz days. VALIDATION: All date pairs in the same product should yield the same offset.",
        },
        autocall_barrier: {
          type: "number",
          description:
            "DIRECTLY EXTRACTABLE but REQUIRES INTERPRETATION for step-down barriers. Found in PRODUCT DATA row 'Autocall Barrier(s)'. TWO PATTERNS: (1) FLAT BARRIER: '100% of the Initial Reference Price' → 100. All observations use the same barrier. (2) STEP-DOWN BARRIER: '95%, 90%, 85%, 80%, 75% and 70%' — barriers decrease over time, making autocall progressively easier to trigger. For step-down, extract the FIRST (highest/initial) barrier value. FINANCIAL RATIONALE: Step-down barriers increase the probability of autocall over time, reducing the product's expected life. This is beneficial for the issuer's hedging book and attractive to investors who want a higher probability of early return of principal.",
        },
        call_schedule: {
          type: "string",
          description:
            "DERIVED BY PAIRING dates with barriers. Construct a structured string by pairing each Autocall Valuation Date with its corresponding barrier level. FORMAT: 'yyyy-mm-ddThh:mm:ssZ:XX%; yyyy-mm-ddThh:mm:ssZ:XX%; ...' RULES FOR PAIRING: (1) For FLAT barriers (single value like '100%'), repeat the same barrier for every date. (2) For STEP-DOWN barriers, match barriers to dates IN ORDER (first barrier with first date, second with second, etc.). The number of barriers MUST equal the number of autocall dates. (3) VALIDATION: barriers should be monotonically non-increasing (step-down) or constant (flat). EXAMPLE: CE14812LBH with 7 dates and barriers '100%, 95%, 90%, 85%, 80%, 75%, 70%' → '2026-02-20:100%; 2026-05-20:95%; 2026-08-20:90%; 2026-11-20:85%; 2027-02-22:80%; 2027-05-20:75%; 2027-08-20:70%'.",
        },
        autocall_step_up_down_initial_amount: {
          type: "number",
          description:
            "DERIVED FROM autocall_barrier for step-down products. This is the FIRST barrier in the step-down sequence. E.g. '95%, 90%, 85%...' → 95. '100%, 95%, 90%...' → 100. For FLAT barriers (single value) → return that value. FINANCIAL CONTEXT: The initial autocall barrier determines how much the underlying must recover for early redemption at the first opportunity. A 100% barrier means the underlying must be at or above its initial level. A 95% barrier is more lenient (allows a 5% decline).",
        },
        autocall_step_up_down_step_amount: {
          type: "number",
          description:
            "DERIVED BY CALCULATION. Compute the difference between consecutive barrier levels. E.g. 95%, 90%, 85% → step = 5 (constant decrement of 5 percentage points per period). 100%, 95%, 90%, 85%, 80%, 75%, 70% → step = 5. Return as a POSITIVE number representing the absolute step size. Return null if barriers are flat (no step-down). VALIDATION: Verify all steps are equal — BNP products typically use constant step-down increments.",
        },
        autocall_step_up_down_frequency: {
          type: "string",
          description:
            "DERIVED — equals autocall_interval. The step-down in barriers occurs at each autocall observation. E.g. if autocall observations are quarterly and barriers step down at each observation → 'Quarterly'. If semi-annual → 'Semi-Annual'. Return null if barriers are flat.",
        },

        // ══════════════════════════════════════════════════════════════
        // STRIKE & BARRIER — Heavily derived from payoff mechanics
        // ══════════════════════════════════════════════════════════════
        call_strike_level: {
          type: "string",
          description:
            "REQUIRES FINANCIAL REASONING. Standard BNP autocallable certificates are NOT warrants — they do not have explicit call/put strike levels in the options trading sense. HOWEVER, from a derivatives decomposition perspective, the investor is implicitly LONG a zero-coupon bond + SHORT a down-and-in put option at the barrier level + LONG a series of digital call options (coupons). If the schema requires a call strike for the autocall feature, it would be 100% (the autocall triggers when underlying ≥ autocall barrier, effectively a digital call). For standard autocallables → return null unless the document explicitly states a call strike level.",
        },
        digital_strike_level: {
          type: "number",
          description:
            "REQUIRES FINANCIAL REASONING. The conditional coupon is economically equivalent to a digital (binary) call option — it pays a fixed amount if the underlying is above a threshold, zero otherwise. The 'strike' of this digital option is the Conditional Coupon Barrier. DERIVATION: digital_strike_level = coupon_barrier. E.g. if coupon_barrier = 70 → digital_strike_level = 70. This represents the level above which the digital coupon option is 'in the money'. Return null if no contingent coupon exists.",
        },
        put_strike_level: {
          type: "string",
          description:
            "REQUIRES FINANCIAL REASONING. In the derivatives decomposition of a BRC: the investor is SHORT a put option. The strike of this put depends on the share delivery formula: (1) CE4130AET & CE4475CLV: 'Notional Amount / (Barrier% × Initial Reference Price)' — the effective put strike is at the BARRIER level (e.g. 70% or 78%). The investor starts losing money from the barrier downward, with GEARED exposure. (2) CE4515CLV & CE14812LBH: 'Notional Amount / Initial Reference Price' — the effective put strike is at 100% (Initial Reference Price). The barrier only determines IF the put activates (down-and-in), but losses are 1:1 from 100% down. For this field, return the barrier percentage as a string (e.g. '70' or '78') or null if not determinable.",
        },
        buffer_level: {
          type: "number",
          description:
            "REQUIRES FINANCIAL REASONING. CRITICAL DISTINCTION between 'buffer' and 'barrier': (1) BUFFER = absorbs losses up to a certain percentage (e.g. 10% buffer means first 10% of losses are absorbed, investor only loses beyond that). (2) BARRIER = provides FULL protection above the barrier level, but if breached, ALL protection disappears (cliff risk). BNP autocallable KIDs use BARRIERS, not buffers. The barrier provides contingent (not continuous) protection. If the Final Reference Price is ≥ barrier → full principal return. If < barrier → protection evaporates entirely and investor bears losses from a potentially higher level. Since these are barrier products → return null for buffer_level.",
        },
        knock_in_barrier: {
          type: "number",
          description:
            "REQUIRES CAREFUL EXTRACTION FROM MULTIPLE LOCATIONS. This is the downside protection barrier level as a percentage. EXTRACTION LOGIC (check in order): (1) FIRST: Look for a dedicated 'Barrier' row in PRODUCT DATA (e.g. '70% of the Initial Reference Price' → 70). Products like CE4515CLV and CE14812LBH have this explicit row. (2) SECOND: If no 'Barrier' row exists, extract from the REDEMPTION PAYOFF TEXT in OBJECTIVES. Look for: 'If the Final Reference Price... is greater than or equal to X% of its Initial Reference Price: a payment in cash of the Notional Amount.' The X% is the barrier. CE4130AET: '70%' from text. CE4475CLV: '78%' from text. (3) THIRD: For products using 'Barrier Event' language, find: 'A Barrier Event shall be deemed to occur if the Final Reference Price... is below the Barrier. Barrier = X% of the Initial Reference Price.' FINANCIAL SIGNIFICANCE: This barrier is the single most important risk metric — it determines the investor's maximum 'safe zone'. A 70% barrier means the underlying can fall up to 30% without capital loss.",
        },
        knock_in_barrier_event_type: {
          type: "string",
          description:
            "DERIVED FROM PAYOFF MECHANICS. Analyze HOW the barrier is evaluated: (1) 'European' / 'At Expiry': Barrier checked ONLY at maturity (on Redemption Valuation Date). BNP KIDs that reference 'the Final Reference Price' vs barrier → European. This includes BOTH formats: (a) direct Final Price vs barrier comparison, and (b) 'Barrier Event' language where the event is based on Final Reference Price. (2) 'American' / 'Continuous': Barrier monitored throughout the product life. Look for 'at any time during the term' or 'if the closing price has ever been below'. (3) 'Discrete': Barrier checked on specific dates (not just maturity). ALL four BNP sample KIDs use European-style barriers (checked only at Redemption Valuation Date) → 'At Expiry'. FINANCIAL IMPACT: European barriers provide significantly MORE protection than American barriers because temporary intraday dips don't trigger the knock-in.",
        },
        knock_in_barrier_event_observation_type: {
          type: "string",
          description:
            "DERIVED — complementary to knock_in_barrier_event_type. Specifies observation frequency: 'At Expiry Only' (single date observation = European), 'Daily Close' (checked at each trading day close), 'Continuous' (real-time intraday monitoring). For BNP autocallable KIDs where the barrier is only evaluated on the Redemption Valuation Date → 'At Expiry Only'. VALIDATION: Must be consistent with knock_in_barrier_event_type.",
        },

        // ══════════════════════════════════════════════════════════════
        // PRODUCT DESCRIPTION & PRICING
        // ══════════════════════════════════════════════════════════════
        product_description: {
          type: "string",
          description:
            "FULLY SYNTHESIZED — not directly in document. Construct by combining extracted fields into a standardized format: '[product_subtype] [memory coupon flag] [coupon_interval] [coupon_rate]% Conditional Coupon on [underlying names] | [ISIN] | Barrier: [knock_in_barrier]% | Autocall: [autocall_barrier]%[step-down flag] | Maturity: [maturity_date] | Currency: [currency] | Issuer: [issuer]'. EXAMPLE: 'Autocall Memory Semi-Annual 5% Conditional Coupon on Safran SA / Schneider Electric SE / Airbus SE / Air Liquide SA | XS3191964041 | Barrier: 70% European | Autocall: 95%-70% Step-Down | Maturity: 2029-12-03 | EUR | BNP Paribas Issuance B.V.' Include 'Memory' if memory_coupon_applies=true. Include 'Step-Down' if autocall barriers decrease. Include 'European' for barrier type.",
        },
        sales_concession: {
          type: "number",
          description:
            "DERIVED FROM COSTS SECTION. In BNP KIDs, sales concession is not labeled as such but can be inferred from the 'Entry costs' percentage in COMPOSITION OF COSTS. The entry cost represents what the investor pays upfront, which typically includes the distributor's selling commission. E.g. CE4130AET: 'Entry costs 1.58%' → sales_concession = 1.58. CE4475CLV: 'Entry costs 0%' → sales_concession = 0. CE4515CLV: 'Entry costs 0%' → sales_concession = 0. CE14812LBH: 'Entry costs 2.27%' → sales_concession = 2.27. FINANCIAL CONTEXT: The statement 'We may share part of the costs with the person selling you the product' confirms the entry cost includes distributor compensation. If entry costs = 0%, the product may be sold at a discount to par (issue_price < 100%) instead.",
        },
        proceeds_to_issuer: {
          type: "number",
          description:
            "DERIVED BY CALCULATION. proceeds_to_issuer = issue_price - sales_concession (approximately). E.g. CE4130AET: 100% - 1.58% = 98.42%. CE4475CLV: 99.50% - 0% = 99.50%. CE14812LBH: 100% - 2.27% = 97.73%. NUANCE: The actual proceeds may differ because the entry cost percentage shown in the KID may be calculated on a different basis. If you cannot calculate with confidence, return null. FINANCIAL CONTEXT: The difference between issue price and fair value represents the issuer's margin (covering hedging costs, structuring fees, and profit).",
        },
        issue_price: {
          type: "number",
          description:
            "DIRECTLY EXTRACTABLE. Found in PRODUCT DATA row 'Issue Price'. Strip '%'. E.g. '100%' → 100, '99.50%' → 99.5, '99%' → 99. FINANCIAL SIGNIFICANCE: When issue_price < 100%, the product is issued at a DISCOUNT. This means the investor pays less than par, and the discount effectively acts as a built-in margin or fee (instead of separate entry costs). CROSS-VALIDATION: Products with 0% entry costs often have issue_price < 100% (e.g. CE4475CLV: 0% entry cost + 99.50% issue price = 0.50% implicit fee through discount). Products with entry costs > 0% often have 100% issue price.",
        },
        currency: {
          type: "string",
          description:
            "DIRECTLY EXTRACTABLE. Found in PRODUCT DATA row 'Product Currency'. Return ISO 4217 code exactly. CROSS-VALIDATION: Must match the currency prefix in 'Notional Amount' (e.g. 'EUR 1,000' → 'EUR', 'CHF 1,000' → 'CHF'). FINANCIAL CONTEXT: For worst-of baskets with underlyings in different currencies (e.g. CE14812LBH: BP/LN in GBP, TTE/FP in EUR, SLB/UN in USD, but product currency is CHF), the KID states 'converted, if necessary, into the Product Currency using the applicable exchange rate'. This means the investor also bears implicit FX risk if the worst-performer is in a different currency.",
        },

        // ══════════════════════════════════════════════════════════════
        // UPSIDE FEATURES — Entirely derived from financial reasoning
        // ══════════════════════════════════════════════════════════════
        upside_style: {
          type: "string",
          description:
            "DERIVED FROM PAYOFF ANALYSIS. BNP autocallable BRCs have NO upside participation in the underlying's appreciation. The maximum return is Notional Amount (100% of principal) + accumulated coupons. This is a DIGITAL payoff: either you receive notional (if above barrier) or you receive physical shares (if below). There is no linear participation in upside. → Return 'Digital'. CONTRAST: A 'Participation' product would say 'you receive 100% + X% of the underlying's performance'. A 'Capped' product would provide partial upside up to a limit. These BNP products provide ZERO underlying upside beyond the fixed coupon.",
        },
        additional_upside_style: {
          type: "string",
          description:
            "DERIVED. No secondary upside mechanism exists in standard BNP autocallables. The only upside is the conditional coupon stream (captured in coupon fields). Return null.",
        },
        upside_participation_rate: {
          type: "number",
          description:
            "DERIVED. Since there is NO upside participation in the underlying's price appreciation (payoff is digital, not linear), the participation rate is effectively 0%. However, since the field typically represents a multiplier on underlying returns and this product has no such feature, return null. Do NOT return 0 — null is more accurate because the concept doesn't apply.",
        },
        digital_amount: {
          type: "number",
          description:
            "DERIVED FROM COUPON MECHANICS. The 'digital amount' in structured product taxonomy is the fixed payment received when the digital condition (underlying ≥ barrier) is met. For BNP autocallable KIDs, this maps to the conditional coupon rate per period (coupon_rate). E.g. CE4130AET: 5%, CE4475CLV: 1.75%. ALTERNATIVELY, if this field represents the TOTAL maximum digital payout over the product life: calculate coupon_rate × total_number_of_coupon_periods. Return the per-period coupon rate as the digital amount.",
        },

        // ══════════════════════════════════════════════════════════════
        // DOWNSIDE — Heavily derived from payoff formula analysis
        // ══════════════════════════════════════════════════════════════
        downside_style: {
          type: "string",
          description:
            "DERIVED FROM BARRIER MECHANICS. The downside is 'Barrier' (also called 'contingent protection' or 'European knock-in put'). EXPLANATION: Above the barrier → FULL principal protection (100% return). Below the barrier → protection disappears entirely (cliff risk). This is fundamentally different from a 'Buffer' (which absorbs X% of losses continuously). → Return 'Barrier'. FINANCIAL SIGNIFICANCE: Barrier products have 'cliff risk' — an investor can go from full protection to significant losses if the underlying drops just below the barrier at maturity. This is the key risk disclosed in the KID.",
        },
        downside_participation_rate: {
          type: "number",
          description:
            "DERIVED FROM SHARE DELIVERY FORMULA — COMPLEX. Two different formulas exist in BNP KIDs, each implying a different downside participation rate: TYPE A (GEARED): 'Notional Amount / (Barrier% × Initial Reference Price)' → used in CE4130AET (70%) and CE4475CLV (78%). The investor receives MORE shares than would correspond to 100% strike, meaning losses are GEARED/LEVERAGED below the barrier. Effective participation = 100/Barrier × 100. E.g. 70% barrier → 100/70 × 100 = 142.86% geared participation. 78% barrier → 100/78 × 100 = 128.21%. TYPE B (1-FOR-1): 'Notional Amount / Initial Reference Price' → used in CE4515CLV and CE14812LBH. The investor receives shares at the initial reference price, so losses are 1:1 from the initial level downward (100% participation). DETECTION: Look at the denominator of the share delivery formula. If it includes the barrier percentage → geared (return 100/barrier × 100, rounded). If it uses Initial Reference Price directly → 1:1 (return 100).",
        },
        floor: {
          type: "number",
          description:
            "DERIVED FROM RISK DISCLOSURE. The KID explicitly states: 'There is no minimum guaranteed return. You could lose some or all of your Investment.' AND 'This product does not include any protection from future market performance.' This confirms there is NO floor — the investor can lose up to 100% of principal. Return null (no floor exists). FINANCIAL CONTEXT: In the worst case, if the worst-performing underlying falls to 0, the delivered shares are worthless and the investor loses the entire investment.",
        },
        cap: {
          type: "number",
          description:
            "DERIVED BY CALCULATION. The maximum return is CAPPED at: principal (100%) + total accumulated coupons. Calculate total max coupon = coupon_rate × number_of_coupon_periods. The cap as a percentage of notional = 100 + (coupon_rate × periods). CE4130AET: 100 + (5 × 8) = 140. CE4475CLV: 100 + (1.75 × 8) = 114. CE4515CLV: 100 + (4.875 × 2) = 109.75. CE14812LBH: 100 + (1.5 × 8) = 112. HOWEVER, this is the TOTAL return cap, not an upside participation cap. If this field represents an upside cap on price participation (like a call spread), return null since these products have no such feature.",
        },
        minimum_payout: {
          type: "number",
          description:
            "DERIVED. The KID states 'There is no minimum guaranteed return.' In the worst scenario (underlying falls to zero), the investor receives worthless shares → payout = 0. → Return null (no guaranteed minimum). NOTE: Even the coupons are not guaranteed (they are conditional). If all coupon conditions are missed AND the barrier is breached, the investor receives only shares with potentially zero value.",
        },
        maximumpayout: {
          type: "number",
          description:
            "DERIVED BY CALCULATION. Maximum possible payout = 100% (notional) + ALL coupons (if every coupon condition is met). Formula: 100 + (coupon_rate × total_number_of_coupon_periods). This assumes the product runs to maturity AND every coupon is paid. If autocall occurs early, the max would be lower (100% + coupons earned up to that point). Return the FULL LIFE maximum. E.g. CE4130AET: 100 + (5 × 8) = 140. CE4475CLV: 100 + (1.75 × 8) = 114. IMPORTANT: The Performance Scenarios section in the KID shows the Favourable scenario payout, which can serve as a VALIDATION cross-check. CE4130AET favorable: EUR 12,500 on EUR 10,000 = 125% (autocalled at year 2.5 with some coupons).",
        },

        // ══════════════════════════════════════════════════════════════
        // SETTLEMENT & JURISDICTION — Derived from multiple sections
        // ══════════════════════════════════════════════════════════════
        settlement_type: {
          type: "string",
          description:
            "DERIVED FROM REDEMPTION MECHANICS. BNP autocallable KIDs describe TWO settlement scenarios: (1) CASH: If above barrier at maturity → 'a payment in cash of the Notional Amount'. Also, if autocall triggers → 'a payment in cash equal to the Notional Amount'. (2) PHYSICAL: If below barrier at maturity → 'delivery of the number of shares of the Worst-Performing Underlying... plus a payment in cash in respect of any fraction of a share.' Since BOTH outcomes are possible depending on market conditions → return 'Cash or Physical'. NOTE: The physical delivery is to the WORST-performing underlying only (not all underlyings in the basket). Fractional shares are cash-settled.",
        },
        trading_jurisdiction: {
          type: "string",
          description:
            "DERIVED FROM REGULATORY AND LEGAL DISCLOSURES. Multiple jurisdictions are mentioned: (1) REGULATORY: 'Autorité des marchés financiers (AMF)' = French financial regulator supervising BNP Paribas S.A. → France. (2) ISSUER: BNP Paribas Issuance B.V. is incorporated in Netherlands. (3) COMPLAINTS: Address in Lisboa, Portugal. (4) RESTRICTION: 'This product may not be offered or sold... in the United States of America or to U.S. persons.' DERIVATION: The primary regulatory/supervisory jurisdiction is FRANCE (AMF). However, the product is likely listed on a European exchange (e.g. Euronext, Börse Frankfurt, SIX). If the KID doesn't specify a listing exchange, return the regulatory jurisdiction 'France' or the broader 'EEA' (European Economic Area). For CHF-denominated products (CE14812LBH), it may be listed on SIX Swiss Exchange → check for any exchange mention.",
        },
      },
      additionalProperties: false,
    },

    systemPrompt: `You are an expert financial analyst specializing in structured product data extraction from BNP Paribas PRIIPs Key Information Documents (KIDs). You understand autocallable barrier reverse convertible (BRC) certificate mechanics at the level of a derivatives structurer.

DOCUMENT CONTEXT:
These are PRIIPs KIDs (EU Regulation 1286/2014) for autocallable certificates issued by BNP Paribas Issuance B.V. (Dutch SPV) with BNP Paribas S.A. (French parent) as guarantor. The products are yield enhancement structured products — economically equivalent to: (1) Long zero-coupon bond at par, (2) Short a European down-and-in put option on the worst-performing underlying, (3) Long a series of digital call options (conditional coupons) with memory feature, (4) Short a series of binary up-and-out options (autocall feature).

DOCUMENT LAYOUT (BNP standard):
Page 1: Header (Internal Ref, URL) → PURPOSE → PRODUCT section (heading e.g. 'Autocall', ISIN, Manufacturer/Issuer/Guarantor, KID Production Date) → WHAT IS THIS PRODUCT? (TYPE, TERM, OBJECTIVES with payoff mechanics) → PRODUCT DATA table → Underlying table
Page 2: INTENDED RETAIL INVESTOR → RISK INDICATOR (SRI 1-7) → PERFORMANCE SCENARIOS → WHAT HAPPENS IF MANUFACTURER UNABLE TO PAY
Page 3: COSTS (Costs Over Time table, Composition of Costs table) → HOW LONG SHOULD I HOLD IT → HOW CAN I COMPLAIN → OTHER RELEVANT INFORMATION

EXTRACTION METHODOLOGY — THREE TIERS:

TIER 1 — DIRECTLY EXTRACTABLE (look for exact labels):
• global_identifier → 'Internal Ref.:' in header
• isin → 'ISIN' row in PRODUCT table
• issuer → 'Issuer:' label (NOT Manufacturer)
• strike_date → 'Strike Date' in PRODUCT DATA
• issue_date → 'Issue Date' in PRODUCT DATA
• final_valuation_date → 'Redemption Valuation Date' in PRODUCT DATA
• maturity_date → 'Redemption Date (maturity)' in PRODUCT DATA
• principal_amount → 'Notional Amount (per certificate)' (strip currency)
• issue_price → 'Issue Price' (strip %)
• currency → 'Product Currency'
• coupon_barrier → 'Conditional Coupon Barrier(s)' (extract number)
• coupon_rate → 'Conditional Coupon Rate(s)' (extract number)
• autocall_barrier → 'Autocall Barrier(s)' (first value if step-down)
• knock_in_barrier → 'Barrier' row in PRODUCT DATA, OR from redemption payoff text
• All date lists (coupon observation dates, coupon payment dates, autocall observation dates, early redemption dates) → first and last items

TIER 2 — DERIVED BY CALCULATION:
• initial_valuation_date = strike_date (Initial Reference Price is fixed on Strike Date)
• coupon_interval → count coupon dates, determine spacing
• autocall_interval → count autocall dates, determine spacing
• autocall_settlement_date_offset → business days between autocall observation date and corresponding early redemption date (~10 for BNP)
• autocall_step_up_down_step_amount → difference between consecutive barrier levels
• call_schedule → pair each autocall date with its barrier
• maximumpayout → 100 + (coupon_rate × number_of_coupon_periods)
• proceeds_to_issuer → issue_price - entry_cost_percentage (from Composition of Costs)
• sales_concession → Entry costs percentage from COMPOSITION OF COSTS
• downside_participation_rate → analyze share delivery formula denominator

TIER 3 — DERIVED FROM FINANCIAL DOMAIN KNOWLEDGE:
• investment_type → 'Yield Enhancement' (autocallable BRC = yield enhancement category per SSPA/EUSIPA)
• product_type → 'certificate' (from TYPE section)
• document_type → 'KID' (PRIIPs document)
• coupon_applies, contingent_coupon_applies, memory_coupon_applies → from specific language patterns
• autocall_applies → from 'Automatic Early Redemption' presence
• issuer_call_applies → false (autocall ≠ issuer discretionary call)
• basket_weightings_unequal → false for worst-of (no weights)
• knock_in_barrier_event_type → 'At Expiry' (European-style, checked only at Redemption Valuation Date)
• upside_style → 'Digital' (no participation in price appreciation)
• downside_style → 'Barrier' (cliff risk, not buffer/continuous protection)
• settlement_type → 'Cash or Physical' (cash if above barrier, share delivery if below)
• buffer_level → null (barrier ≠ buffer)
• floor → null (no minimum guaranteed return)

SHARE DELIVERY FORMULA ANALYSIS (for downside_participation_rate):
TWO BNP VARIANTS — examine the denominator carefully:
• GEARED (CE4130AET, CE4475CLV): 'Notional / (Barrier% × Initial Price)' → geared participation = 100/barrier_pct × 100
  - The investor receives more shares than would correspond to initial price, amplifying losses
  - 70% barrier → 142.86% geared downside, 78% barrier → 128.21%
• LINEAR (CE4515CLV, CE14812LBH): 'Notional / Initial Price' → 1:1 participation = 100%
  - The investor receives shares at initial price, losses are proportional

DATE CONVERSION: All BNP dates are in 'DD Month YYYY' format. Convert to yyyy-mm-ddThh:mm:ssZ. Handle UK/EU month names.

NULL HANDLING: Return null for absent fields. NEVER return epoch dates, empty strings, or placeholder values.

NUMERIC EXTRACTION: '5% of the Notional Amount' → 5. 'EUR 1,000' → 1000. '70% of the Initial Reference Price' → 70.

CROSS-VALIDATION RULES:
• maturity_date > final_valuation_date > strike_date > (any preceding dates)
• coupon_last_date ≈ maturity_date
• coupon_last_observation_date ≈ final_valuation_date
• autocall_last_date < final_valuation_date (last autocall is before final valuation)
• Number of Autocall Valuation Dates = Number of Early Redemption Dates = Number of Autocall Barriers (if step-down)
• Number of Coupon Valuation Dates = Number of Coupon Payment Dates

STRICTLY use the schema fields. Do not add extra keys (additionalProperties: false).`,

    fewShotExamples: [],
    consensusEnabled: false,
    confidenceThreshold: 85,
    conflictResolution: "majority",
    citationEnabled: true,
    citationIncludePdfPage: true,
    citationIncludeBbox: false,
    citationIncludeParagraphId: false,
    contextWindow: "128k",
    defaultModel: "gpt-4o",
  }),
});
