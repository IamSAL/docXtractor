#!/usr/bin/env node
/**
 * Parser Service Benchmark
 *
 * Usage:
 *   node test-parser.mjs <pdf-directory> [output-directory]
 *
 * Uploads PDFs to MinIO, enqueues them on BullMQ, collects parsed markdown
 * results, and writes per-file .md output + a stats.json summary.
 *
 * Requires: the parser-service, Redis, and MinIO to be running.
 *
 * Install deps (run once):
 *   npm install bullmq ioredis @aws-sdk/client-s3 --no-save
 */

import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { Queue, Worker } from "bullmq";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

// --- Config (matches docker-compose defaults) ---
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6381", 10);
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "http://localhost:9005";
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "minioadmin";
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "minioadmin";
const MINIO_BUCKET = process.env.MINIO_BUCKET || "docxtractor-documents";
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || "300000", 10); // 5 min per file

const QUEUE_UPLOADED = "uploaded-documents";
const QUEUE_PARSED = "parsed-documents";

const redisOpts = { host: REDIS_HOST, port: REDIS_PORT };

// --- Args ---
const pdfDir = process.argv[2];
const outDir = process.argv[3] || join(pdfDir || ".", "parser-output");

if (!pdfDir) {
  console.error(
    "Usage: node test-parser.mjs <pdf-directory> [output-directory]",
  );
  process.exit(1);
}

// --- MinIO client ---
const s3 = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function uploadToMinio(filePath, key) {
  const body = await readFile(filePath);
  await s3.send(
    new PutObjectCommand({ Bucket: MINIO_BUCKET, Key: key, Body: body }),
  );
  return body.length;
}

// --- Main ---
async function main() {
  // 1. Discover PDF files
  const entries = await readdir(pdfDir);
  const pdfFiles = entries.filter((f) => extname(f).toLowerCase() === ".pdf");
  if (pdfFiles.length === 0) {
    console.error(`No PDF files found in ${pdfDir}`);
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });
  console.log(`Found ${pdfFiles.length} PDF(s) in ${pdfDir}`);
  console.log(`Output directory: ${outDir}\n`);

  // 2. Set up BullMQ
  const uploadQueue = new Queue(QUEUE_UPLOADED, { connection: redisOpts });

  // Map documentId -> { name, resolve, reject, startTime, fileSize }
  const pending = new Map();

  // Worker that listens on the parsed-documents queue for results
  const resultWorker = new Worker(
    QUEUE_PARSED,
    async (job) => {
      const { document_id, status, markdown_content, token_count, error } =
        job.data;
      const entry = pending.get(document_id);
      if (!entry) return; // not one of ours
      entry.resolve({ status, markdown_content, token_count, error });
    },
    { connection: redisOpts, concurrency: 10 },
  );

  const results = [];

  // 3. Upload all files and enqueue all jobs upfront (parallel processing)
  const batchStart = Date.now();
  const allPromises = [];

  for (let idx = 0; idx < pdfFiles.length; idx++) {
    const file = pdfFiles[idx];
    const filePath = join(pdfDir, file);
    const documentId = randomUUID();
    const storageKey = `test-bench/${documentId}/${file}`;

    const fileSize = await uploadToMinio(filePath, storageKey);
    console.log(`[${idx + 1}/${pdfFiles.length}] Uploaded ${file} (${(fileSize / 1024).toFixed(0)} KB)`);

    const startTime = Date.now();

    // Create a promise that resolves when the parser sends back the result
    const resultPromise = new Promise((resolve, reject) => {
      pending.set(documentId, {
        name: file,
        resolve,
        reject,
        startTime,
        fileSize,
      });
      setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS);
    });

    // Enqueue job
    await uploadQueue.add("parse-document", {
      run_id: `bench-${randomUUID()}`,
      document_id: documentId,
      file_key: storageKey,
      name: file,
      type: "file",
    });

    allPromises.push(
      resultPromise
        .then(async (res) => {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
          if (res.status === "success") {
            const mdPath = join(outDir, file.replace(/\.pdf$/i, ".md"));
            await writeFile(mdPath, res.markdown_content, "utf-8");
            console.log(`  ✓ ${file}  ${elapsed}s  ${res.token_count} tokens`);
            results.push({
              file,
              status: "success",
              elapsed_s: parseFloat(elapsed),
              tokens: res.token_count,
              chars: res.markdown_content.length,
              file_size_kb: Math.round(fileSize / 1024),
            });
          } else {
            console.log(`  ✗ ${file}  ${elapsed}s  ${res.error}`);
            results.push({
              file,
              status: "failed",
              elapsed_s: parseFloat(elapsed),
              error: res.error,
              file_size_kb: Math.round(fileSize / 1024),
            });
          }
        })
        .catch((err) => {
          console.log(`  ✗ ${file}  ERROR  ${err.message}`);
          results.push({ file, status: "error", error: err.message });
        })
        .finally(() => pending.delete(documentId))
    );
  }

  console.log(`\nAll ${pdfFiles.length} jobs enqueued, waiting for results...\n`);
  await Promise.all(allPromises);

  const wallTime = ((Date.now() - batchStart) / 1000).toFixed(2);

  // 4. Write stats
  const succeeded = results.filter((r) => r.status === "success");
  const totalTime = succeeded.reduce((s, r) => s + r.elapsed_s, 0);
  const totalTokens = succeeded.reduce((s, r) => s + r.tokens, 0);
  const totalSizeKB = results.reduce((s, r) => s + (r.file_size_kb || 0), 0);

  const stats = {
    timestamp: new Date().toISOString(),
    total_files: pdfFiles.length,
    succeeded: succeeded.length,
    failed: results.length - succeeded.length,
    wall_time_s: parseFloat(wallTime),
    sum_of_individual_s: parseFloat(totalTime.toFixed(2)),
    avg_time_s: succeeded.length
      ? parseFloat((totalTime / succeeded.length).toFixed(2))
      : 0,
    total_tokens: totalTokens,
    total_input_size_kb: totalSizeKB,
    files: results,
  };

  const statsPath = join(outDir, "stats.json");
  await writeFile(statsPath, JSON.stringify(stats, null, 2), "utf-8");

  // 5. Print summary
  console.log("\n--- Summary ---");
  console.log(`Files:      ${stats.succeeded}/${stats.total_files} succeeded`);
  console.log(`Wall time:  ${stats.wall_time_s}s (all files in parallel)`);
  console.log(`Sum time:   ${stats.sum_of_individual_s}s (individual times added up)`);
  console.log(`Avg time:   ${stats.avg_time_s}s per file`);
  console.log(`Tokens:     ${stats.total_tokens.toLocaleString()}`);
  console.log(`Input size: ${stats.total_input_size_kb} KB`);
  console.log(`Stats:      ${statsPath}`);

  // Cleanup
  await resultWorker.close();
  await uploadQueue.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
