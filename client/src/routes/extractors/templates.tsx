import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Input } from "@/components/retroui/Input";
import { PageHeader } from "@/components/retroui/PageHeader";
import { AXIOS_INSTANCE } from "@/lib/axios";

export const Route = createFileRoute("/extractors/templates")({
	component: TemplatesPage,
});

interface TemplateExtractor {
	id: string;
	name: string;
	description: string | null;
	schema: { properties?: Record<string, unknown> };
	isPublic: boolean;
	userId: string | null;
	createdAt: string;
}

const CATEGORIES = [
	"All",
	"Financial",
	"HR",
	"Legal",
	"Logistics",
	"Medical",
	"General",
] as const;

function getCategory(extractor: TemplateExtractor): string {
	const name = extractor.name.toLowerCase();
	const desc = (extractor.description ?? "").toLowerCase();
	const text = `${name} ${desc}`;
	if (
		text.match(/invoice|receipt|billing|financial|bank|payment|tax|accounting/)
	)
		return "Financial";
	if (text.match(/resume|cv|candidate|hr|employee|hiring|recruitment/))
		return "HR";
	if (text.match(/contract|legal|agreement|lease|nda|compliance/))
		return "Legal";
	if (text.match(/shipping|logistics|procurement|purchase|order|supply/))
		return "Logistics";
	if (text.match(/medical|prescription|patient|clinical|health/))
		return "Medical";
	return "General";
}

function TemplateCard({
	extractor,
	onImport,
	importing,
}: {
	extractor: TemplateExtractor;
	onImport: (id: string) => void;
	importing: boolean;
}) {
	const fieldCount = Object.keys(extractor.schema?.properties ?? {}).length;
	const category = getCategory(extractor);

	return (
		<Card
			className="flex flex-col bg-white border-2 border-black rounded-sm overflow-hidden h-full p-0"
			shadowsize="sm"
		>
			{/* Card header color strip */}
			<div className="h-2 bg-primary border-b-2 border-black" />
			<div className="p-5 flex-1 flex flex-col gap-3">
				<div className="flex items-start justify-between gap-2">
					<h3 className="text-base font-bold leading-tight">
						{extractor.name}
					</h3>
					<span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase border border-black bg-gray-100 text-gray-700">
						{category}
					</span>
				</div>
				<p className="text-xs text-gray-600 line-clamp-3 leading-relaxed flex-1">
					{extractor.description || "No description provided."}
				</p>
				<div className="flex items-center gap-2 text-gray-500">
					<span className="material-symbols-outlined text-sm">data_object</span>
					<span className="text-[11px] font-bold font-mono uppercase">
						{fieldCount} fields
					</span>
				</div>
			</div>
			<div className="border-t-2 border-black">
				<Button
					onClick={() => onImport(extractor.id)}
					disabled={importing}
					className="w-full py-2.5 bg-primary border-0 text-black font-bold text-xs uppercase tracking-wider hover:bg-primary-hover flex items-center justify-center gap-2 rounded-none disabled:opacity-50 disabled:pointer-events-none shadow-none"
				>
					<span className="material-symbols-outlined text-sm">
						{importing ? "hourglass_empty" : "download"}
					</span>
					{importing ? "Importing..." : "Import"}
				</Button>
			</div>
		</Card>
	);
}

function TemplatesPage() {
	const navigate = useNavigate();
	const [instanceTemplates, setInstanceTemplates] = useState<
		TemplateExtractor[]
	>([]);
	const [myPublicTemplates, setMyPublicTemplates] = useState<
		TemplateExtractor[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [importingId, setImportingId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string>("All");

	useEffect(() => {
		async function fetchTemplates() {
			setIsLoading(true);
			try {
				const [instanceRes, myRes] = await Promise.all([
					AXIOS_INSTANCE.get<{ data: TemplateExtractor[] }>(
						"/extractors?scope=instance",
					),
					AXIOS_INSTANCE.get<{ data: TemplateExtractor[] }>(
						"/extractors?scope=mine-public",
					),
				]);
				// Handle both array response and {data:[]} wrapped response
				// biome-ignore lint/suspicious/noExplicitAny: API response shape varies
				const toArray = (res: any) =>
					Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
				setInstanceTemplates(toArray(instanceRes));
				setMyPublicTemplates(toArray(myRes));
			} catch {
				toast.error("Failed to load templates");
			} finally {
				setIsLoading(false);
			}
		}
		fetchTemplates();
	}, []);

	const handleImport = async (id: string) => {
		setImportingId(id);
		try {
			const res = await AXIOS_INSTANCE.post<{ id: string }>(
				`/extractors/${id}/clone`,
			);
			// biome-ignore lint/suspicious/noExplicitAny: API response shape varies
			const newId = res.data?.id ?? (res.data as any)?.data?.id;
			toast.success("Extractor imported to your workspace");
			navigate({ to: `/extractors/${newId}` });
		} catch (err: unknown) {
			// biome-ignore lint/suspicious/noExplicitAny: error shape unknown
			const anyErr = err as any;
			toast.error("Failed to import", {
				description: anyErr?.response?.data?.message ?? anyErr?.message,
			});
		} finally {
			setImportingId(null);
		}
	};

	function filterExtractors(list: TemplateExtractor[]) {
		return list.filter((e) => {
			const matchSearch =
				!searchQuery ||
				e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(e.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
			const matchCategory =
				activeCategory === "All" || getCategory(e) === activeCategory;
			return matchSearch && matchCategory;
		});
	}

	const filteredInstance = filterExtractors(instanceTemplates);
	const filteredMine = filterExtractors(myPublicTemplates);

	return (
		<AppLayout>
			<div className="flex flex-col h-full p-4 lg:p-12">
				<PageHeader
					heading="Template Marketplace"
					description="Browse, import, and share extractor templates with your team."
					breadcrumb="/ HOME / EXTRACTORS / TEMPLATES"
				>
					<Button
						onClick={() => navigate({ to: "/extractors" })}
						variant="outline"
						className="gap-2 px-4 py-2 rounded-sm text-sm uppercase tracking-wide border-2 border-black"
					>
						<span className="material-symbols-outlined text-[18px]">
							arrow_back
						</span>
						My Extractors
					</Button>
				</PageHeader>

				{/* Filters */}
				<div className="bg-white border-2 border-black p-4 mb-8 flex flex-col md:flex-row gap-4">
					<div className="flex-1 relative">
						<Input
							className="w-full"
							placeholder="Search templates..."
							type="text"
							icon="search"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						{CATEGORIES.map((cat) => (
							<button
								key={cat}
								type="button"
								onClick={() => setActiveCategory(cat)}
								className={`px-3 py-2 text-xs font-bold uppercase border-2 border-black transition-colors ${
									activeCategory === cat
										? "bg-black text-white"
										: "bg-white text-black hover:bg-gray-100"
								}`}
							>
								{cat}
							</button>
						))}
					</div>
				</div>

				{isLoading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
						{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
							<div
								key={i}
								className="h-56 bg-gray-100 animate-pulse border-2 border-black"
							/>
						))}
					</div>
				) : (
					<>
						{/* My Public Templates */}
						{filteredMine.length > 0 && (
							<section className="mb-10">
								<h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
									<span className="material-symbols-outlined text-base">
										person
									</span>
									My Shared Templates
									<span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
										{filteredMine.length}
									</span>
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
									{filteredMine.map((ext) => (
										<TemplateCard
											key={ext.id}
											extractor={ext}
											onImport={handleImport}
											importing={importingId === ext.id}
										/>
									))}
								</div>
							</section>
						)}

						{/* Instance Templates */}
						<section>
							<h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
								<span className="material-symbols-outlined text-base">
									business
								</span>
								Instance Templates
								<span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
									{filteredInstance.length}
								</span>
							</h2>
							{filteredInstance.length === 0 ? (
								<div className="text-center py-16 text-gray-400">
									<span className="material-symbols-outlined text-4xl block mb-2">
										search_off
									</span>
									<p className="text-sm font-medium">
										No templates match your filters.
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-12">
									{filteredInstance.map((ext) => (
										<TemplateCard
											key={ext.id}
											extractor={ext}
											onImport={handleImport}
											importing={importingId === ext.id}
										/>
									))}
								</div>
							)}
						</section>
					</>
				)}
			</div>
		</AppLayout>
	);
}
