import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "http://localhost:3002/api/swagger.json",
    output: {
      mode: "tags-split",
      target: "src/api/endpoints",
      schemas: "src/api/models",
      client: "react-query",
      mock: false,
      override: {
        mutator: {
          path: "./src/lib/axios.ts",
          name: "HttpClient",
        },
      },
    },
    hooks: {
      afterAllFilesWrite: "biome format --write",
    },
  },
  schema: {
    input: {
      target: "http://localhost:3002/api/swagger.json",
    },
    output: {
      mode: "tags-split",
      client: "zod",
      target: "src/api/schemas",
      fileExtension: ".zod.ts",
    },
  },
});
