import { useEffect, useState } from "react";
import { Card } from "@/components/retroui/Card";
import { demoApi, type DemoResult } from "@/lib/demo-api";
import { ResultCard } from "./-result-card";

interface Step3ResultProps {
	runId: string;
	runsUsed: number;
	fingerprint: string;
}

export function Step3Result({ runId, runsUsed }: Step3ResultProps) {
	const [result, setResult] = useState<DemoResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		let timerId: ReturnType<typeof setTimeout> | null = null;

		async function fetchResult() {
			try {
				const data = await demoApi.getResult(runId);
				if (cancelled) return;
				setResult(data);

				// Poll while not terminal
				if (data.status !== "done" && data.status !== "failed") {
					timerId = setTimeout(fetchResult, 2000);
				}
			} catch {
				if (!cancelled) {
					setError("Failed to load extraction result. Please try again.");
				}
			}
		}

		fetchResult();

		return () => {
			cancelled = true;
			if (timerId) clearTimeout(timerId);
		};
	}, [runId]);

	if (error) {
		return (
			<Card className="border-red-500 bg-red-50 p-6">
				<p className="text-red-700 font-bold">{error}</p>
			</Card>
		);
	}

	if (!result) {
		return (
			<div className="flex flex-col items-center gap-4 py-12">
				<div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
				<p className="font-bold text-lg">Loading results...</p>
			</div>
		);
	}

	return <ResultCard result={result} runsUsed={runsUsed} />;
}
