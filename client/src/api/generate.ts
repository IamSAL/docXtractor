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
): Promise<GenerateExtractorResponse> {
	const { data } = await AXIOS_INSTANCE.post<GenerateExtractorResponse>(
		"/extractors/generate-extractor",
		{ description },
	);
	return data;
}
