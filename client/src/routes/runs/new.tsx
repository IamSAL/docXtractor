import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "../../components/AppLayout";
import { RunExtractorForm } from "../../components/RunExtractorForm";

// Define search params schema
type RunsNewSearch = {
  extractorId?: string;
};

export const Route = createFileRoute("/runs/new")({
  component: RunsNewComponent,
  validateSearch: (search: Record<string, unknown>): RunsNewSearch => {
    return {
      extractorId: search.extractorId as string | undefined,
    };
  },
});

function RunsNewComponent() {
  const navigate = useNavigate();
  const { extractorId: urlExtractorId } = Route.useSearch();

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-white">
        <RunExtractorForm
          extractorId={urlExtractorId}
          onSuccess={(runId) => navigate({ to: "/runs/$id", params: { id: runId } })}
          onClose={() => navigate({ to: "/runs" })}
          gridClassName="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto w-full"
          footerClassName="px-12 py-5 border-t-4 border-black bg-gray-50 shrink-0 flex flex-col gap-4"
          submitClassName="w-full h-12 bg-primary border-2 border-black rounded text-black font-bold text-base uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-primary-hover transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:pointer-events-none"
        />
      </div>
    </AppLayout>
  );
}
