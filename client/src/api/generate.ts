import { AXIOS_INSTANCE } from "@/lib/axios";

export interface GenerateSchemaResponse {
	schema: Record<string, unknown>;
}

export interface GenerateExtractorResponse {
	name: string;
	description: string;
	schema: Record<string, unknown>;
	systemPrompt: string;
}

export async function generateSchema(
	description: string,
): Promise<GenerateSchemaResponse> {
	const { data } = await AXIOS_INSTANCE.post<GenerateSchemaResponse>(
		"/extractors/generate-schema",
		{ description },
	);
	return data;
}

export async function generateExtractor(
	description: string,
	sampleText?: string,
): Promise<GenerateExtractorResponse> {
	const { data } = await AXIOS_INSTANCE.post<GenerateExtractorResponse>(
		"/extractors/generate-extractor",
		{ description, sampleText },
	);
	return data;
}

export async function parsePreviewFile(file: File): Promise<string> {
	const form = new FormData();
	form.append("file", file);
	const { data } = await AXIOS_INSTANCE.post<{ text: string }>(
		"/extractors/parse-preview",
		form,
	);
	return data.text ?? "";
}

export interface PreviewExtractionResponse {
	extractionResult: Record<string, unknown> | null;
	error?: string;
}

export async function previewExtraction(payload: {
	schema: Record<string, unknown>;
	systemPrompt: string;
	sampleText: string;
}): Promise<PreviewExtractionResponse> {
	const { data } = await AXIOS_INSTANCE.post<PreviewExtractionResponse>(
		"/extractors/preview-extraction",
		payload,
	);
	return data;
}
