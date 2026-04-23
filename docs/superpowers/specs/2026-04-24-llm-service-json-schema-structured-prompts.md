# LLM Service: JSON Schema Mode, Truncation Detection, Structured Prompts

## Problem

The LLM service (`server/src/shared/llm/llm.service.ts`) has three issues:

1. **Basic JSON mode** — uses `response_format: { type: 'json_object' }` which only tells the model "return JSON" without specifying structure. FreeLLM supports `json_schema` mode that forwards the actual schema to providers.
2. **No truncation detection** — FreeLLM sends `X-FreeLLM-Warning: json-possibly-truncated` when output hits max_tokens, but we ignore it and try to parse broken JSON.
3. **Flat prompt** — instructions, schema, examples, and document content are concatenated into one string. Models can confuse example content with actual input.

## Scope

Two files modified:
- `server/src/shared/llm/llm.service.ts` — main changes
- `server/src/shared/llm/llm.service.spec.ts` — test updates

No caller changes needed. Method signatures and return types unchanged.

## Design

### 1. Truncation Detection

Export `TruncatedResponseError` class. Add private `callWithTruncationCheck(params)` method:

- Calls `this.client.chat.completions.create(params).withResponse()` (OpenAI SDK v6.34.0 feature)
- Checks `response.headers.get('x-freellm-warning')` for `json-possibly-truncated`
- Throws `TruncatedResponseError` if truncated, returns `ChatCompletion` data otherwise

All 3 existing `create()` calls replaced with this helper:
- `extract()` main call (line 107)
- `extract()` correction retry call (line 142)
- `generate()` call (line 190)

`TruncatedResponseError` caught by existing retry loops — counts as normal retry attempt against `maxRetries`.

### 2. JSON Schema Response Format

Switch `extract()` from `json_object` to `json_schema`:

```typescript
const responseFormat = schema.properties
  ? { type: 'json_schema', json_schema: { name: 'extraction_result', schema } }
  : { type: 'json_object' };  // fallback for legacy { fields: [...] } format
```

- No `strict: true` — avoids requiring `additionalProperties: false` and full `required` arrays in user-defined schemas
- `jsonrepair` kept as safety net
- `generate()` stays on `json_object` (varied output structures, no fixed schema)

### 3. Structured Prompt with XML Sections

Replace flat string concatenation with XML-delimited sections split across system/user messages.

**System message** (static context):
```xml
<instructions>
{systemPrompt or default}
Return a valid JSON object matching the output schema exactly.
</instructions>

<output_schema>
Fields to extract:
- fieldName (type): description
...

JSON Schema:
{JSON.stringify(schema.properties)}
</output_schema>

<examples>
<example>
<input>...source content...</input>
<expected_output>...JSON output...</expected_output>
</example>
</examples>
```

**User message** (document only):
```xml
<document>
{content}
</document>
```

Messages: `[{ role: 'system', content: systemContent }, { role: 'user', content: userContent }]`

### 4. Multi-turn Correction Retries

When schema validation fails, correction retries use multi-turn conversation:

```
messages: [
  { role: 'system', content: systemContent },
  { role: 'user', content: '<document>...</document>' },
  { role: 'assistant', content: '{previous bad JSON}' },
  { role: 'user', content: 'Your previous response failed validation: {errors}. Fix the JSON.' }
]
```

Model sees its own output in context for better self-correction. If `callWithTruncationCheck` throws `TruncatedResponseError` during correction, treat as failed validation attempt and continue inner loop.

### 5. Test Updates

**Mock changes**: `mockCreate` wrapped so return value has `.withResponse()` that returns `{ data, response: { headers: { get: () => '' } } }`.

**Assertion updates**:
- `extract()` tests: assert `response_format.type === 'json_schema'`, `messages[0].role === 'system'`, `messages[1].role === 'user'` with `<document>`
- Legacy schema test: assert `json_object` fallback
- `generate()` tests: assert `json_object` (unchanged)
- New test: truncation header triggers retry

## Verification

1. `pnpm run test -- --testPathPattern=llm.service` — unit tests pass
2. `pnpm run build` — compiles
3. Manual: docker-compose extraction, check logs show structured prompt and `json_schema` format
