import { AXIOS_INSTANCE } from "./axios";

interface DemoClassification {
  suggestedType: string;
  method: "heuristic" | "llm";
  suggestedExtractorId: string | null;
  availableExtractors: { id: string; name: string; description: string }[];
}

export interface DemoUploadResult {
  id: string;
  url: string;
  storageKey: string;
  originalName: string;
  classification: { suggestedType: string; method: "heuristic" | "llm" };
  suggestedExtractorId: string | null;
}

interface DemoRunResult {
  runId: string;
  status: string;
  demoToken: string;
}

export interface DemoResult {
  id: string;
  status: string;
  results: Record<string, unknown> | null;
  sources: unknown[];
  confidence: number | null;
  metrics: Record<string, unknown> | null;
  createdAt: string;
}

interface DemoSession {
  runsUsed: number;
  email: string | null;
}

export const demoApi = {
  upload: async (file: File): Promise<DemoUploadResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await AXIOS_INSTANCE.post("/demo/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  classify: async (filename: string): Promise<DemoClassification> => {
    const { data } = await AXIOS_INSTANCE.post("/demo/classify", { filename });
    return data;
  },

  createRun: async (
    fingerprint: string,
    extractorId: string,
    sources: { fileId: string; name: string }[],
  ): Promise<DemoRunResult> => {
    const { data } = await AXIOS_INSTANCE.post("/demo/run", {
      fingerprint,
      extractorId,
      sources,
    });
    return data;
  },

  captureEmail: async (
    fingerprint: string,
    email: string,
  ): Promise<{ runsUsed: number; email: string }> => {
    const { data } = await AXIOS_INSTANCE.post("/demo/capture-email", {
      fingerprint,
      email,
    });
    return data;
  },

  getResult: async (runId: string): Promise<DemoResult> => {
    const { data } = await AXIOS_INSTANCE.get(`/demo/result/${runId}`);
    return data;
  },

  getSession: async (fingerprint: string): Promise<DemoSession> => {
    const { data } = await AXIOS_INSTANCE.get("/demo/session", {
      params: { fingerprint },
    });
    return data;
  },
};
