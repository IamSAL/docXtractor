import { useRef, useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { demoApi, type DemoUploadResult } from "@/lib/demo-api";

interface Step1UploadProps {
	onUploadComplete: (result: DemoUploadResult) => void;
	runsUsed: number;
}

const ACCEPTED_TYPES = [
	"application/pdf",
	"image/png",
	"image/jpeg",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".docx"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

function isAcceptedType(file: File): boolean {
	if (ACCEPTED_TYPES.includes(file.type)) return true;
	const lower = file.name.toLowerCase();
	return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function Step1Upload({ onUploadComplete }: Step1UploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	async function handleFile(file: File) {
		setError(null);

		if (!isAcceptedType(file)) {
			setError(
				"Unsupported file type. Please upload a PDF, PNG, JPEG, or DOCX file.",
			);
			return;
		}
		if (file.size > MAX_SIZE_BYTES) {
			setError(
				`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 20 MB.`,
			);
			return;
		}

		setUploading(true);
		try {
			const result = await demoApi.upload(file);
			onUploadComplete(result);
		} catch {
			setError("Upload failed. Please try again.");
		} finally {
			setUploading(false);
		}
	}

	function onDragOver(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(true);
	}

	function onDragLeave(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(false);
	}

	function onDrop(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) handleFile(file);
	}

	function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) handleFile(file);
		// reset so same file can be re-selected
		e.target.value = "";
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="text-2xl font-black uppercase tracking-tight mb-1">
					Upload Your Document
				</h2>
				<p className="text-gray-600 font-medium">
					Upload your document to see DocXtractor extract structured data from
					it. Supports PDF, PNG, JPEG, and DOCX files up to 20 MB.
				</p>
			</div>

			{/* Drop zone */}
			<div
				className={`relative border-4 border-dashed rounded-lg p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
					isDragging
						? "border-black bg-primary/20 scale-[1.01]"
						: "border-black/40 bg-white hover:border-black hover:bg-gray-50"
				}`}
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				onClick={() => !uploading && inputRef.current?.click()}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						if (!uploading) inputRef.current?.click();
					}
				}}
			>
				<input
					ref={inputRef}
					type="file"
					accept=".pdf,.png,.jpg,.jpeg,.docx"
					className="hidden"
					onChange={onInputChange}
					disabled={uploading}
				/>

				{uploading ? (
					<>
						<div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
						<p className="font-bold text-lg">Uploading...</p>
					</>
				) : (
					<>
						<span className="material-symbols-outlined text-5xl text-black/60">
							upload_file
						</span>
						<div className="text-center">
							<p className="font-black text-xl uppercase">
								{isDragging ? "Drop it here" : "Drag & drop your file"}
							</p>
							<p className="text-gray-500 font-medium mt-1">
								or{" "}
								<span className="underline font-bold text-black">
									click to browse
								</span>
							</p>
						</div>
						<div className="flex gap-2 flex-wrap justify-center">
							{["PDF", "PNG", "JPEG", "DOCX"].map((ext) => (
								<span
									key={ext}
									className="bg-black text-white text-xs font-bold px-2 py-0.5 uppercase"
								>
									{ext}
								</span>
							))}
						</div>
						<p className="text-xs text-gray-400 font-medium">Max 20 MB</p>
					</>
				)}
			</div>

			{/* Error */}
			{error && (
				<Card className="border-red-500 bg-red-50 p-4">
					<p className="text-red-700 font-bold text-sm">{error}</p>
				</Card>
			)}

			{/* Alternate CTA */}
			<div className="flex justify-center">
				<Button
					variant="outline"
					className="text-sm"
					onClick={() => inputRef.current?.click()}
					disabled={uploading}
				>
					<span className="material-symbols-outlined text-base mr-2">
						folder_open
					</span>
					Choose File
				</Button>
			</div>
		</div>
	);
}
