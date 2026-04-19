import * as z from "zod";

export const SourceSchema = z.object({
	id: z.string(),
	type: z.enum(["file", "url", "text"]),
	name: z.string(),
	description: z.string().optional(),
	content: z.string(), // URL or text content
	sizeBytes: z.number().optional(),
	status: z.enum(["ready", "uploading", "error"]).optional(),
});

export type ExtractionSource = z.infer<typeof SourceSchema>;

export const RunExtractorFormSchema = z.object({
	sources: z
		.array(SourceSchema)
		.min(1, "At least one input source is required"),
	processingMode: z.enum(["unified", "per_document"]),
	extractionProvider: z.enum(["doclo", "langextract", "freellm"]),
	consensusVoting: z.boolean(),
	citationTracking: z.boolean(),
	variantId: z.string().optional(),
	skippedFields: z.array(z.string()),
});

export type RunExtractorFormData = z.infer<typeof RunExtractorFormSchema>;

export const defaultRunExtractorValues: RunExtractorFormData = {
	sources: [],
	processingMode: "per_document",
	extractionProvider: "freellm",
	consensusVoting: false,
	citationTracking: true,
	variantId: undefined,
	skippedFields: [],
};
