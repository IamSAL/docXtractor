import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Badge } from "@/components/retroui/Badge";
import { Dialog } from "@/components/retroui/Dialog";
import { Select } from "@/components/retroui/Select";
import { demoApi, type DemoUploadResult } from "@/lib/demo-api";
import {
	disconnectDemoSocket,
	getDemoSocket,
	joinDemoRun,
	onDemoRunUpdated,
} from "@/lib/demo-socket";

interface Step2ExtractProps {
	uploadResult: DemoUploadResult;
	fingerprint: string;
	runsUsed: number;
	onRunComplete: (runId: string, demoToken: string) => void;
}

interface Extractor {
	id: string;
	name: string;
	description: string;
}

function statusMessage(status: string): string {
	switch (status) {
		case "pending":
		case "queued":
			return "Queued for processing...";
		case "parsing":
			return "Parsing document...";
		case "extracting":
			return "Extracting data...";
		case "review":
			return "Almost done...";
		case "done":
			return "Extraction complete!";
		case "failed":
			return "Extraction failed.";
		case "cancelled":
			return "Run cancelled.";
		default:
			return "Processing...";
	}
}

function statusBadgeVariant(
	status: string,
): "default" | "warning" | "success" | "destructive" | "secondary" {
	if (status === "done") return "success";
	if (status === "failed") return "destructive";
	if (status === "cancelled") return "secondary";
	return "warning";
}

export function Step2Extract({
	uploadResult,
	fingerprint,
	runsUsed,
	onRunComplete,
}: Step2ExtractProps) {
	const [extractors, setExtractors] = useState<Extractor[]>([]);
	const [selectedExtractorId, setSelectedExtractorId] = useState<string>(
		uploadResult.suggestedExtractorId ?? "",
	);
	const [extracting, setExtracting] = useState(false);
	const [runStatus, setRunStatus] = useState<string>("");
	const [showEmailGate, setShowEmailGate] = useState(false);
	const [email, setEmail] = useState("");
	const [emailError, setEmailError] = useState<string | null>(null);
	const [emailSubmitting, setEmailSubmitting] = useState(false);
	const [loadingExtractors, setLoadingExtractors] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const pendingRunRef = useRef(false);

	// Load extractors on mount via classify
	useEffect(() => {
		setLoadingExtractors(true);
		demoApi
			.classify(uploadResult.originalName)
			.then((classification) => {
				setExtractors(classification.availableExtractors ?? []);
				// Only override pre-selected if none was set from upload response
				if (!uploadResult.suggestedExtractorId && classification.suggestedExtractorId) {
					setSelectedExtractorId(classification.suggestedExtractorId);
				}
			})
			.catch(() => {
				// silently ignore — user can still pick an extractor if list is non-empty
			})
			.finally(() => setLoadingExtractors(false));
	}, []);

	async function startRun() {
		if (!selectedExtractorId) {
			setError("Please select an extractor type.");
			return;
		}
		setError(null);
		setExtracting(true);
		setRunStatus("queued");

		try {
			const runResult = await demoApi.createRun(fingerprint, selectedExtractorId, [
				{ fileId: uploadResult.id, name: uploadResult.originalName },
			]);

			const socket = getDemoSocket(runResult.demoToken);
			joinDemoRun(runResult.runId);

			const cleanup = onDemoRunUpdated((data) => {
				const status: string = data?.run?.status ?? data?.status ?? "";
				if (status) setRunStatus(status);

				if (status === "done" || status === "failed") {
					cleanup();
					disconnectDemoSocket();
					onRunComplete(runResult.runId, runResult.demoToken);
				}
			});

			// Fallback: also listen for socket connection errors
			socket.on("connect_error", () => {
				setError("Connection error. Please try again.");
				setExtracting(false);
			});
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : "Failed to start extraction.";
			setError(msg);
			setExtracting(false);
			setRunStatus("");
		}
	}

	function handleExtractClick() {
		if (runsUsed >= 1) {
			setShowEmailGate(true);
		} else {
			startRun();
		}
	}

	async function handleEmailSubmit() {
		if (!email.trim() || !email.includes("@")) {
			setEmailError("Please enter a valid email address.");
			return;
		}
		setEmailError(null);
		setEmailSubmitting(true);
		try {
			await demoApi.captureEmail(fingerprint, email.trim());
			setShowEmailGate(false);
			pendingRunRef.current = true;
			startRun();
		} catch {
			setEmailError("Failed to save email. Please try again.");
		} finally {
			setEmailSubmitting(false);
		}
	}

	const isTerminal = runStatus === "done" || runStatus === "failed" || runStatus === "cancelled";

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="text-2xl font-black uppercase tracking-tight mb-1">
					Choose Extractor & Extract
				</h2>
				<p className="text-gray-600 font-medium">
					Select how you'd like to extract data from your document, then click
					Extract.
				</p>
			</div>

			{/* Uploaded file info */}
			<Card className="p-4 flex items-center gap-3">
				<span className="material-symbols-outlined text-3xl text-black/60">
					description
				</span>
				<div className="flex-1 min-w-0">
					<p className="font-bold truncate">{uploadResult.originalName}</p>
					{uploadResult.classification?.suggestedType && (
						<p className="text-xs text-gray-500 capitalize">
							Detected:{" "}
							<span className="font-bold">
								{uploadResult.classification.suggestedType}
							</span>
						</p>
					)}
				</div>
				<Badge variant="outline" className="shrink-0">
					Ready
				</Badge>
			</Card>

			{/* Extractor selector */}
			<div className="flex flex-col gap-2">
				<label className="font-black text-sm uppercase tracking-wide">
					Extractor Type
				</label>
				{loadingExtractors ? (
					<div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
						<div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
						Loading extractors...
					</div>
				) : extractors.length > 0 ? (
					<Select
						value={selectedExtractorId}
						onValueChange={setSelectedExtractorId}
						disabled={extracting}
					>
						<Select.Trigger className="w-full">
							<Select.Value placeholder="Select an extractor..." />
						</Select.Trigger>
						<Select.Content>
							{extractors.map((ext) => (
								<Select.Item key={ext.id} value={ext.id}>
									{ext.name}
								</Select.Item>
							))}
						</Select.Content>
					</Select>
				) : (
					<p className="text-sm text-gray-500 font-medium">
						No extractors available. Please try a different document.
					</p>
				)}

				{/* Description of selected extractor */}
				{selectedExtractorId && extractors.length > 0 && (
					<p className="text-sm text-gray-500 font-medium">
						{extractors.find((e) => e.id === selectedExtractorId)?.description}
					</p>
				)}
			</div>

			{/* Error */}
			{error && (
				<Card className="border-red-500 bg-red-50 p-3">
					<p className="text-red-700 font-bold text-sm">{error}</p>
				</Card>
			)}

			{/* Status indicator when extracting */}
			{extracting && (
				<Card className="p-4 flex items-center gap-4">
					{!isTerminal && (
						<div className="w-6 h-6 border-[3px] border-black border-t-transparent rounded-full animate-spin shrink-0" />
					)}
					<div className="flex-1">
						<p className="font-bold">{statusMessage(runStatus)}</p>
						{runStatus && (
							<Badge
								variant={statusBadgeVariant(runStatus)}
								className="mt-1 text-xs"
							>
								{runStatus}
							</Badge>
						)}
					</div>
				</Card>
			)}

			{/* Extract button */}
			{!extracting && (
				<Button
					className="w-full"
					size="lg"
					onClick={handleExtractClick}
					disabled={!selectedExtractorId || extractors.length === 0}
				>
					<span className="material-symbols-outlined mr-2">smart_toy</span>
					Extract Data
				</Button>
			)}

			{/* Email gate dialog */}
			<Dialog open={showEmailGate} onOpenChange={setShowEmailGate}>
				<Dialog.Content size="sm" className="border-2 border-black">
					<Dialog.Header>
						<span className="font-black uppercase text-sm tracking-wide">
							One more thing
						</span>
					</Dialog.Header>
					<div className="p-6 flex flex-col gap-4">
						<p className="font-medium text-gray-700">
							You've used your free run. Enter your email to continue — no
							spam, ever.
						</p>
						<div className="flex flex-col gap-1">
							<label
								htmlFor="demo-email"
								className="font-black text-xs uppercase tracking-wide"
							>
								Email Address
							</label>
							<input
								id="demo-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleEmailSubmit();
								}}
								placeholder="you@example.com"
								className="border-2 border-black px-3 py-2 font-medium outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded"
								autoFocus
							/>
							{emailError && (
								<p className="text-red-600 font-bold text-xs">{emailError}</p>
							)}
						</div>
					</div>
					<Dialog.Footer>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowEmailGate(false)}
							disabled={emailSubmitting}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleEmailSubmit}
							disabled={emailSubmitting}
						>
							{emailSubmitting ? (
								<>
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
									Saving...
								</>
							) : (
								"Continue"
							)}
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog>
		</div>
	);
}
