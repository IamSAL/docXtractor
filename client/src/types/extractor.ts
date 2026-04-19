import type { FewShotExample } from "@/components/extractors/FewShotExamples";
import type { JSONSchema } from "@/components/jsonjoy/types/jsonSchema";

export interface ExtractorFormData {
	// Basic Information
	name: string;
	thumbnailUrl?: string;
	description: string;
	category?: string;
	icon?: string;
	tags?: string[];

	// Field Schema
	schema: JSONSchema;

	// Advanced Options
	systemPrompt: string;
	fewShotExamples: FewShotExample[];

	// Extraction Settings - Consensus Voting
	consensusEnabled: boolean;
	confidenceThreshold: number;
	conflictResolution:
		| "majority"
		| "highest_confidence"
		| "human_review"
		| "conservative";

	// Extraction Settings - Citation Tracking
	citationEnabled: boolean;
	citationIncludePdfPage: boolean;
	citationIncludeBbox: boolean;
	citationIncludeParagraphId: boolean;

	// Extraction Settings - Model Parameters
	contextWindow: string;
	defaultModel: string;

	// Parser Engine
	parserEngine: "docling" | "markitdown" | "pymupdf" | "opendataloader";

	// Visibility
	isPublic: boolean;
}

export const defaultExtractorFormValues: ExtractorFormData = {
	name: "",
	thumbnailUrl: "",
	description: "",
	category: "General",
	icon: "description",
	tags: [],
	schema: {
		type: "object",
		properties: {},
		required: [],
	},
	systemPrompt: "",
	fewShotExamples: [],
	consensusEnabled: false,
	confidenceThreshold: 85,
	conflictResolution: "majority",
	citationEnabled: false,
	citationIncludePdfPage: false,
	citationIncludeBbox: false,
	citationIncludeParagraphId: false,
	contextWindow: "128k",
	defaultModel: "gpt-oss:120b-cloud",
	parserEngine: "docling",
	isPublic: false,
};
