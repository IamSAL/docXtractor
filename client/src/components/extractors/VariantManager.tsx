import { useState } from "react";
import { AXIOS_INSTANCE } from "@/lib/axios";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getExtractorsControllerFindOneQueryKey } from "@/api/endpoints/extractors/extractors";

interface SchemaVariant {
	id: string;
	name: string;
	description?: string;
	schema: Record<string, any>;
	isDefault: boolean;
	createdAt: string;
}

interface VariantManagerProps {
	extractorId: string;
	variants: SchemaVariant[];
	baseSchema: Record<string, any>;
}

export function VariantManager({
	extractorId,
	variants,
	baseSchema,
}: VariantManagerProps) {
	const queryClient = useQueryClient();
	const [isCreating, setIsCreating] = useState(false);
	const [newName, setNewName] = useState("");
	const [newDescription, setNewDescription] = useState("");
	const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
	const [saving, setSaving] = useState(false);

	const baseFields = Object.keys(baseSchema?.properties || {});

	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: getExtractorsControllerFindOneQueryKey(extractorId),
		});

	const startCreating = () => {
		setIsCreating(true);
		setNewName("");
		setNewDescription("");
		setSelectedFields(new Set(baseFields));
	};

	const cancelCreating = () => {
		setIsCreating(false);
	};

	const toggleField = (field: string) => {
		setSelectedFields((prev) => {
			const next = new Set(prev);
			if (next.has(field)) next.delete(field);
			else next.add(field);
			return next;
		});
	};

	const handleCreate = async () => {
		if (!newName.trim()) {
			toast.error("Variant name is required");
			return;
		}
		if (selectedFields.size === 0) {
			toast.error("Select at least one field");
			return;
		}

		const variantSchema: Record<string, any> = {
			type: "object",
			properties: {} as Record<string, any>,
			required: [] as string[],
		};

		for (const field of selectedFields) {
			if (baseSchema.properties?.[field]) {
				variantSchema.properties[field] = baseSchema.properties[field];
			}
		}

		if (Array.isArray(baseSchema.required)) {
			variantSchema.required = baseSchema.required.filter((f: string) =>
				selectedFields.has(f),
			);
		}

		setSaving(true);
		try {
			await AXIOS_INSTANCE.post(`/extractors/${extractorId}/variants`, {
				name: newName.trim(),
				description: newDescription.trim() || undefined,
				schema: variantSchema,
				isDefault: variants.length === 0,
			});
			toast.success("Variant created");
			setIsCreating(false);
			await invalidate();
		} catch {
			toast.error("Failed to create variant");
		} finally {
			setSaving(false);
		}
	};

	const handleSetDefault = async (variantId: string) => {
		try {
			await AXIOS_INSTANCE.patch(
				`/extractors/${extractorId}/variants/${variantId}`,
				{ isDefault: true },
			);
			toast.success("Default variant updated");
			await invalidate();
		} catch {
			toast.error("Failed to update default variant");
		}
	};

	const handleDelete = async (variantId: string) => {
		try {
			await AXIOS_INSTANCE.delete(
				`/extractors/${extractorId}/variants/${variantId}`,
			);
			toast.success("Variant deleted");
			await invalidate();
		} catch {
			toast.error("Failed to delete variant");
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-sm font-bold uppercase tracking-wider text-text-main-light">
						Schema Variants
					</h3>
					<p className="text-xs text-gray-500 mt-0.5">
						Define alternate field sets for different document formats. Most users don't need this.
					</p>
				</div>
				{!isCreating && (
					<Button type="button" size="sm" onClick={startCreating}>
						<span className="material-symbols-outlined text-[16px] mr-1">
							add
						</span>
						New Variant
					</Button>
				)}
			</div>

			{/* Existing Variants */}
			{variants.length > 0 && (
				<div className="flex flex-col gap-2">
					{variants.map((v) => {
						const fieldCount = Object.keys(
							v.schema?.properties || {},
						).length;
						return (
							<div
								key={v.id}
								className="flex items-center justify-between border-2 border-black rounded px-4 py-3 bg-white"
							>
								<div className="flex items-center gap-3">
									<span className="material-symbols-outlined text-lg text-gray-600">
										schema
									</span>
									<div>
										<div className="flex items-center gap-2">
											<span className="font-bold text-sm">{v.name}</span>
											{v.isDefault && (
												<span className="text-[9px] px-1.5 py-0.5 bg-primary/20 border border-primary/40 rounded font-bold text-primary-dark uppercase">
													Default
												</span>
											)}
											<span className="text-[10px] font-mono text-gray-400">
												{fieldCount} fields
											</span>
										</div>
										{v.description && (
											<p className="text-xs text-gray-500 mt-0.5">
												{v.description}
											</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-1">
									{!v.isDefault && (
										<button
											type="button"
											className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-black transition-colors"
											onClick={() => handleSetDefault(v.id)}
											title="Set as default"
										>
											<span className="material-symbols-outlined text-[18px]">
												star
											</span>
										</button>
									)}
									<button
										type="button"
										className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-600 transition-colors"
										onClick={() => handleDelete(v.id)}
										title="Delete variant"
									>
										<span className="material-symbols-outlined text-[18px]">
											delete
										</span>
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Create New Variant */}
			{isCreating && (
				<div className="border-2 border-dashed border-black rounded p-4 bg-gray-50 flex flex-col gap-4">
					<div className="flex flex-col gap-3">
						<div>
							<label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
								Variant Name
							</label>
							<Input
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								placeholder="e.g. Quick Invoice, Essential Fields"
							/>
						</div>
						<div>
							<label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
								Description (optional)
							</label>
							<Input
								value={newDescription}
								onChange={(e) => setNewDescription(e.target.value)}
								placeholder="What is this variant for?"
							/>
						</div>
					</div>

					<div>
						<div className="flex items-center justify-between mb-2">
							<label className="text-xs font-bold uppercase tracking-wider text-gray-500">
								Select Fields from Base Schema
							</label>
							<span className="text-[10px] font-mono text-gray-400">
								{selectedFields.size}/{baseFields.length} selected
							</span>
						</div>
						<div className="border-2 border-black rounded bg-white max-h-48 overflow-y-auto custom-scrollbar">
							{baseFields.map((field) => {
								const def = (baseSchema.properties as any)?.[field] || {};
								const isRequired = Array.isArray(baseSchema.required)
									? baseSchema.required.includes(field)
									: false;
								return (
									<label
										key={field}
										className="flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
									>
										<div className="relative flex items-center shrink-0">
											<input
												type="checkbox"
												className="peer h-4 w-4 cursor-pointer appearance-none border-2 border-black bg-white transition-all checked:bg-black"
												checked={selectedFields.has(field)}
												onChange={() => toggleField(field)}
											/>
											<span className="material-symbols-outlined absolute opacity-0 peer-checked:opacity-100 text-white text-xs left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
												check
											</span>
										</div>
										<div className="flex items-center gap-1.5 flex-1 min-w-0">
											<span className="font-mono text-xs font-semibold truncate">
												{field}
											</span>
											<span className="text-[9px] px-1 py-0 bg-gray-200 border border-gray-300 rounded text-gray-600 font-mono shrink-0">
												{def.type || "string"}
											</span>
											{isRequired && (
												<span className="text-[9px] px-1 py-0 bg-red-100 border border-red-300 rounded text-red-600 font-bold shrink-0">
													REQ
												</span>
											)}
										</div>
									</label>
								);
							})}
						</div>
					</div>

					<div className="flex items-center gap-2 justify-end">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={cancelCreating}
						>
							Cancel
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={handleCreate}
							disabled={saving}
						>
							{saving ? "Creating..." : "Create Variant"}
						</Button>
					</div>
				</div>
			)}

			{variants.length === 0 && !isCreating && (
				<div className="border-2 border-dashed border-gray-300 rounded p-6 text-center">
					<span className="material-symbols-outlined text-3xl text-gray-300 mb-2 block">
						schema
					</span>
					<p className="text-xs text-gray-400">
						No variants yet. Create one to define alternative field sets.
					</p>
				</div>
			)}
		</div>
	);
}
