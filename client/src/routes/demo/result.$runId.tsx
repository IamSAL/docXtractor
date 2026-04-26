import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { demoApi } from "@/lib/demo-api";
import { ResultCard } from "./-result-card";

export const Route = createFileRoute("/demo/result/$runId")({
	component: SharedResult,
});

function SharedResult() {
	const { runId } = Route.useParams();

	const { data: result, isLoading, error } = useQuery({
		queryKey: ["demo-result", runId],
		queryFn: () => demoApi.getResult(runId),
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (!status || status === "done" || status === "failed") return false;
			return 2000;
		},
	});

	return (
		<div
			className="min-h-screen bg-white"
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

			<div className="max-w-2xl mx-auto px-4 py-10">
				{/* Shared result banner */}
				<div className="mb-6 bg-primary border-2 border-black px-4 py-3 flex items-center gap-3 shadow-hard-sm">
					<span className="material-symbols-outlined text-xl">share</span>
					<p className="font-bold text-sm">
						Someone shared this extraction result with you.
					</p>
				</div>

				<Card className="p-6 sm:p-8 shadow-hard">
					{isLoading && (
						<div className="flex flex-col items-center gap-4 py-12">
							<div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
							<p className="font-bold text-lg">Loading result...</p>
						</div>
					)}

					{error && (
						<div className="text-center py-8">
							<p className="font-bold text-red-600 mb-4">
								This result could not be loaded. It may have expired or the link
								is invalid.
							</p>
							<Link to="/demo/">
								<Button>Try DocXtractor</Button>
							</Link>
						</div>
					)}

					{result && <ResultCard result={result} />}
				</Card>

				{/* CTA */}
				<div className="mt-6 text-center">
					<Link to="/demo/">
						<Button size="lg" className="mx-auto">
							<span className="material-symbols-outlined mr-2">
								arrow_forward
							</span>
							Try DocXtractor with Your Own Document
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
