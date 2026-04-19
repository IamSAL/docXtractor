export type FieldType =
	| "string"
	| "number"
	| "integer"
	| "boolean"
	| "array"
	| "object";

export interface FieldRow {
	name: string;
	type: FieldType;
	required: boolean;
	description: string;
}

const SNAKE_CASE_RE = /^[a-z][a-z0-9_]*$/;

/**
 * Fix LLM output where property keys are human-readable sentences and
 * description values are snake_case identifiers (they got swapped).
 * Also converts keys with spaces to snake_case.
 */
export function normalizeGeneratedSchema(
	schema: Record<string, unknown>,
): Record<string, unknown> {
	const properties = (schema?.properties as Record<string, unknown>) ?? {};
	const required = (schema?.required as string[]) ?? [];
	const normalized: Record<string, unknown> = {};
	const keyMap: Map<string, string> = new Map();

	for (const [key, value] of Object.entries(properties)) {
		const prop = value as Record<string, unknown>;
		const desc = ((prop?.description as string) ?? "").trim();
		const keyHasSpaces = key.includes(" ");
		const descIsIdentifier =
			desc.length > 0 && SNAKE_CASE_RE.test(desc) && desc.length <= 50;

		let newKey: string;
		let newDesc: string;

		if (keyHasSpaces && descIsIdentifier) {
			// Swapped: description is actually the field name
			newKey = desc;
			newDesc = key;
		} else if (keyHasSpaces) {
			newKey = key.trim().replace(/\s+/g, "_").toLowerCase();
			newDesc = desc;
		} else {
			newKey = key;
			newDesc = desc;
		}

		keyMap.set(key, newKey);
		normalized[newKey] = { ...prop, description: newDesc };
	}

	const newRequired = required
		.map((r) => keyMap.get(r) ?? r)
		.filter((r) => r in normalized);

	return { ...schema, properties: normalized, required: newRequired };
}

/**
 * Convert a JSON Schema to a flat array of FieldRow for display in the UI.
 * Top-level properties only. Complex nested types shown as 'object' or 'array'.
 */
export function schemaToFields(schema: Record<string, unknown>): FieldRow[] {
	const properties = (schema?.properties as Record<string, unknown>) ?? {};
	const required: string[] = (schema?.required as string[]) ?? [];

	return Object.entries(properties).map(([name, prop]) => {
		const propObj = prop as Record<string, unknown>;
		return {
			name,
			type: (propObj?.type as FieldType) ?? "string",
			required: required.includes(name),
			description: (propObj?.description as string) ?? "",
		};
	});
}

/**
 * Merge field list edits back into the original schema.
 * Lossless: properties not in the field list are preserved verbatim.
 * Only modifies top-level properties that appear in fields.
 */
export function fieldsToSchema(
	fields: FieldRow[],
	originalSchema: Record<string, unknown>,
): Record<string, unknown> {
	const originalProperties =
		(originalSchema?.properties as Record<string, unknown>) ?? {};
	const newProperties: Record<string, unknown> = {};

	for (const field of fields) {
		const original =
			(originalProperties[field.name] as Record<string, unknown>) ?? {};
		newProperties[field.name] = {
			...original, // preserve nested structure (items, properties, etc.)
			type: field.type,
			description: field.description,
		};
	}

	// Preserve any properties not shown in the field list (e.g. $schema, definitions)
	const shownNames = new Set(fields.map((f) => f.name));
	for (const [key, val] of Object.entries(originalProperties)) {
		if (!shownNames.has(key)) {
			newProperties[key] = val;
		}
	}

	return {
		...originalSchema,
		properties: newProperties,
		required: fields.filter((f) => f.required).map((f) => f.name),
	};
}
