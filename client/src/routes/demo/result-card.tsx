import { useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Badge } from "@/components/retroui/Badge";
import type { DemoResult } from "@/lib/demo-api";

interface ResultCardProps {
	result: DemoResult;
	runsUsed?: number;
}

function toTitleCase(key: string): string {
	// Handle camelCase and snake_case
	return key
		.replace(/_/g, " ")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function ResultValue({ value }: { value: unknown }) {
	if (Array.isArray(value)) {
		return (
			<ol className="list-decimal list-inside space-y-1 mt-1">
				{value.map((item, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static list
					<li key={i} className="text-sm font-medium text-gray-800 pl-2">
						{typeof item === "object" ? (
							<ResultObject obj={item as Record<string, unknown>} indent />
						) : (
							String(item)
						)}
					</li>
				))}
			</ol>
		);
	}
	if (value !== null && typeof value === "object") {
		return (
			<div className="mt-1 pl-3 border-l-2 border-black/20">
				<ResultObject obj={value as Record<string, unknown>} indent />
			</div>
		);
	}
	if (value === null || value === undefined || value === "") {
		return <span className="text-gray-400 italic text-sm">—</span>;
	}
	return (
		<span className="text-sm font-semibold text-gray-900">{String(value)}</span>
	);
}

function ResultObject({
	obj,
	indent = false,
}: {
	obj: Record<string, unknown>;
	indent?: boolean;
}) {
	return (
		<div className={`flex flex-col gap-1 ${indent ? "py-1" : ""}`}>
			{Object.entries(obj).map(([k, v]) => (
				<div key={k} className="flex flex-col">
					<span className="text-xs font-black uppercase tracking-wide text-gray-500">
						{toTitleCase(k)}
					</span>
					<ResultValue value={v} />
				</div>
			))}
		</div>
	);
}

export function ResultCard({ result, runsUsed = 0 }: ResultCardProps) {
	const [copiedJson, setCopiedJson] = useState(false);
	const [copiedLink, setCopiedLink] = useState(false);

	function copyJson() {
		navigator.clipboard.writeText(
			JSON.stringify(result.results, null, 2),
		);
		setCopiedJson(true);
		setTimeout(() => setCopiedJson(false), 2000);
	}

	function copyLink() {
		navigator.clipboard.writeText(
			`${window.location.origin}/demo/result/${result.id}`,
		);
		setCopiedLink(true);
		setTimeout(() => setCopiedLink(false), 2000);
	}

	const hasResults = result.results && Object.keys(result.results).length > 0;

	return (
		<div className="flex flex-col gap-4">
			{/* Header */}
			<div className="flex items-start justify-between gap-4 flex-wrap">
				<div>
					<h2 className="text-2xl font-black uppercase tracking-tight">
						Extraction Results
					</h2>
					<p className="text-gray-500 font-medium text-sm mt-0.5">
						Structured data extracted from your document
					</p>
				</div>
				<div className="flex items-center gap-2 flex-wrap">
					<Badge variant={runsUsed >= 5 ? "destructive" : "outline"}>
						Run {runsUsed} of 5
					</Badge>
					{result.confidence !== null && result.confidence !== undefined && (
						<Badge variant="success">
							{Math.round(result.confidence * 100)}% confidence
						</Badge>
					)}
					<Badge
						variant={result.status === "done" ? "success" : "destructive"}
					>
						{result.status}
					</Badge>
				</div>
			</div>

			{/* Result data */}
			{hasResults ? (
				<Card className="p-5">
					<div className="flex flex-col gap-4">
						{Object.entries(result.results as Record<string, unknown>).map(
							([key, value]) => (
								<div
									key={key}
									className="flex flex-col gap-1 pb-3 border-b border-black/10 last:border-0 last:pb-0"
								>
									<span className="font-black text-xs uppercase tracking-widest text-black">
										{toTitleCase(key)}
									</span>
									<ResultValue value={value} />
								</div>
							),
						)}
					</div>
				</Card>
			) : (
				<Card className="p-6 text-center">
					<p className="text-gray-500 font-medium">
						{result.status === "failed"
							? "Extraction failed. No data was produced."
							: "No results available yet."}
					</p>
				</Card>
			)}

			{/* Actions */}
			<div className="flex gap-3 flex-wrap">
				<Button
					variant="secondary"
					size="sm"
					onClick={copyJson}
					disabled={!hasResults}
				>
					<span className="material-symbols-outlined text-base mr-1">
						{copiedJson ? "check" : "content_copy"}
					</span>
					{copiedJson ? "Copied!" : "Copy JSON"}
				</Button>
				<Button variant="outline" size="sm" onClick={copyLink}>
					<span className="material-symbols-outlined text-base mr-1">
						{copiedLink ? "check" : "share"}
					</span>
					{copiedLink ? "Link Copied!" : "Share Result"}
				</Button>
			</div>

			{/* Self-host CTA when limit reached */}
			{runsUsed >= 5 && (
				<Card className="border-2 border-black bg-black text-white p-6 shadow-hard">
					<div className="flex flex-col gap-3">
						<h3 className="font-black text-xl uppercase">
							You've used all 5 free runs
						</h3>
						<p className="font-medium text-white/80">
							Self-host DocXtractor for unlimited extractions on your own
							infrastructure — completely free and open source.
						</p>
						<a
							href="https://github.com/IamSAL/docXtractor"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 bg-primary text-black border-2 border-white px-4 py-2 font-black uppercase text-sm shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all w-fit"
						>
							<img
								src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
								alt="GitHub"
								className="w-4 h-4"
							/>
							View on GitHub
						</a>
					</div>
				</Card>
			)}
		</div>
	);
}
