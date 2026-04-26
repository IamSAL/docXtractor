import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/retroui/Card";
import { demoApi, type DemoUploadResult } from "@/lib/demo-api";
import { Step1Upload } from "./-step-1-upload";
import { Step2Extract } from "./-step-2-extract";
import { Step3Result } from "./-step-3-result";

export const Route = createFileRoute("/demo/")({ component: DemoWizard });

const STEPS = [
	{ number: 1, label: "Upload" },
	{ number: 2, label: "Extract" },
	{ number: 3, label: "Results" },
] as const;

function getOrCreateFingerprint(): string {
	const stored = localStorage.getItem("demo_fp");
	if (stored) return stored;
	const fp = crypto.randomUUID();
	localStorage.setItem("demo_fp", fp);
	return fp;
}

function StepCounter({ current }: { current: 1 | 2 | 3 }) {
	return (
		<div className="flex items-center justify-center gap-0 mb-8">
			{STEPS.map((step, idx) => (
				<div key={step.number} className="flex items-center">
					{/* Connector line before (except first) */}
					{idx > 0 && (
						<div
							className={`h-0.5 w-10 sm:w-16 transition-colors ${
								step.number <= current ? "bg-black" : "bg-black/20"
							}`}
						/>
					)}

					{/* Step circle + label */}
					<div className="flex flex-col items-center gap-1">
						<div
							className={`w-9 h-9 border-2 border-black flex items-center justify-center font-black text-sm transition-colors ${
								step.number < current
									? "bg-black text-white"
									: step.number === current
										? "bg-primary text-black"
										: "bg-white text-black/40"
							}`}
						>
							{step.number < current ? (
								<span className="material-symbols-outlined text-base">
									check
								</span>
							) : (
								step.number
							)}
						</div>
						<span
							className={`text-xs font-bold uppercase tracking-wide transition-colors ${
								step.number === current
									? "text-black"
									: step.number < current
										? "text-black/60"
										: "text-black/30"
							}`}
						>
							{step.label}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}

function DemoWizard() {
	const [step, setStep] = useState<1 | 2 | 3>(1);
	const [fingerprint] = useState<string>(getOrCreateFingerprint);
	const [runsUsed, setRunsUsed] = useState(0);
	const [uploadResult, setUploadResult] = useState<DemoUploadResult | null>(null);
	const [runId, setRunId] = useState<string | null>(null);

	// Fetch session on mount
	useEffect(() => {
		demoApi
			.getSession(fingerprint)
			.then((session) => setRunsUsed(session.runsUsed))
			.catch(() => {
				// ignore — default is 0
			});
	}, [fingerprint]);

	function handleUploadComplete(result: DemoUploadResult) {
		setUploadResult(result);
		setStep(2);
	}

	function handleRunComplete(rid: string, _token: string) {
		setRunId(rid);
		setRunsUsed((prev) => prev + 1);
		setStep(3);
	}

	return (
		<div
			className="w-full min-h-screen flex flex-col bg-white"
			style={{
				backgroundImage: "radial-gradient(#d4d4d4 1.5px, transparent 1.5px)",
				backgroundSize: "24px 24px",
			}}
		>
			{/* Nav */}
			<nav className="sticky top-0 z-50 bg-white border-b-4 border-black px-6 py-3 flex items-center justify-between">
				<Link
					to="/"
					className="flex items-center gap-2 font-black text-lg uppercase tracking-tight hover:opacity-80 transition-opacity"
				>
					<div className="bg-black text-white p-1">
						<span className="material-symbols-outlined font-bold block text-base">
							grid_view
						</span>
					</div>
					DocXtractor
				</Link>
				<Link to="/login" className="text-sm font-bold underline">
					Sign In
				</Link>
			</nav>

			{/* Wizard container */}
			<div className="flex-1 flex flex-col w-full max-w-3xl mx-auto px-4 py-10">
				{/* Title */}
				<div className="text-center mb-6">
					<h1 className="text-3xl font-black uppercase tracking-tighter">
						Try DocXtractor
					</h1>
					<p className="text-gray-600 font-medium mt-1">
						Step {step} of 3 — {STEPS[step - 1].label}
					</p>
				</div>

				<StepCounter current={step} />

				<Card className="p-6 sm:p-8 shadow-hard flex-1">
					{step === 1 && (
						<Step1Upload
							onUploadComplete={handleUploadComplete}
							runsUsed={runsUsed}
						/>
					)}
					{step === 2 && uploadResult && (
						<Step2Extract
							uploadResult={uploadResult}
							fingerprint={fingerprint}
							runsUsed={runsUsed}
							onRunComplete={handleRunComplete}
						/>
					)}
					{step === 3 && runId && (
						<Step3Result
							runId={runId}
							runsUsed={runsUsed}
							fingerprint={fingerprint}
						/>
					)}
				</Card>

				{/* Back navigation */}
				{step > 1 && step < 3 && (
					<button
						type="button"
						className="mt-4 text-sm font-bold underline text-gray-500 hover:text-black transition-colors block mx-auto"
						onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
					>
						← Go back
					</button>
				)}

				{/* Try again */}
				{step === 3 && (
					<button
						type="button"
						className="mt-4 text-sm font-bold underline text-gray-500 hover:text-black transition-colors block mx-auto"
						onClick={() => {
							setUploadResult(null);
							setRunId(null);
							setStep(1);
						}}
					>
						← Try another document
					</button>
				)}
			</div>
		</div>
	);
}
