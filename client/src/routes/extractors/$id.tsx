import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "../../components/AppLayout";
import { Button } from "../../components/retroui/Button";
import { Card } from "../../components/retroui/Card";
import {
  useExtractorsControllerFindOne,
  useExtractorsControllerRemove,
  getExtractorsControllerFindAllQueryKey,
} from "../../api/endpoints/extractors/extractors";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ExtractorFormData } from "@/types/extractor";
import NiceModal from "@ebay/nice-modal-react";
import { RunExtractorModal } from "@/components/modals/RunExtractorModal";

export const Route = createFileRoute("/extractors/$id")({
  component: ExtractorDetailComponent,
});

function ExtractorDetailComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    data: extractorData,
    isLoading,
    error,
  } = useExtractorsControllerFindOne(id);
  const extractor = extractorData?.data;

  const deleteMutation = useExtractorsControllerRemove();

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${extractor?.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Extractor deleted successfully");
      await queryClient.invalidateQueries({
        queryKey: getExtractorsControllerFindAllQueryKey(),
      });
      navigate({ to: "/extractors" });
    } catch (err) {
      toast.error("Failed to delete extractor");
      console.error(err);
    }
  };

  const handleDuplicate = () => {
    if (!extractor) return;

    const duplicateData: Partial<ExtractorFormData> = {
      name: `Copy of ${extractor.name}`,
      description: extractor.description,
      thumbnailUrl: extractor.thumbnailUrl,
      schema: extractor.schema as any,
      systemPrompt: extractor.systemPrompt,
      fewShotExamples: extractor.fewShotExamples as any,
      consensusEnabled: extractor.consensusEnabled,
      confidenceThreshold: extractor.confidenceThreshold,
      conflictResolution: extractor.conflictResolution as any,
      citationEnabled: extractor.citationEnabled,
      citationIncludePdfPage: extractor.citationIncludePdfPage,
      citationIncludeBbox: extractor.citationIncludeBbox,
      citationIncludeParagraphId: extractor.citationIncludeParagraphId,
      contextWindow: extractor.contextWindow,
      defaultModel: extractor.defaultModel,
    };

    navigate({
      to: "/extractors/new",
      state: { initialData: duplicateData } as any,
    });
  };

  const handleShare = () => {
    // Copy extractor ID to clipboard
    navigator.clipboard.writeText(id);
    toast.success("Extractor ID copied to clipboard!");
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded" />
            <div className="grid grid-cols-3 gap-8">
              <div className="h-96 bg-gray-200 rounded" />
              <div className="h-96 bg-gray-200 rounded" />
              <div className="h-96 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !extractor) {
    return (
      <AppLayout>
        <div className="p-8 max-w-[1600px] mx-auto">
          <Card className="p-8 text-center">
            <span className="material-symbols-outlined text-6xl text-red-500 mb-4 block">
              error
            </span>
            <h2 className="text-2xl font-bold mb-2">Extractor Not Found</h2>
            <p className="text-gray-600 mb-4">
              The extractor you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <Link to="/extractors">
              <Button>Back to Extractors</Button>
            </Link>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Parse schema to get fields
  const schemaFields = (extractor.schema as any)?.properties
    ? Object.entries((extractor.schema as any).properties).map(
        ([key, value]: [string, any]) => ({
          name: key,
          type: value.type || "string",
          required: (extractor.schema as any).required?.includes(key) || false,
          description: value.description,
        }),
      )
    : [];

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b-4 border-black flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center">
            <h1 className="font-display font-bold text-2xl truncate">
              {extractor.name}
            </h1>
            <span className="ml-4 px-2 py-0.5 text-xs font-bold border border-black bg-green-200 text-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              ACTIVE
            </span>
          </div>
          <div className="flex space-x-4">
            <Link to="/extractors/edit/$id" params={{ id }}>
              <button className="neu-btn bg-white px-4 py-1.5 font-bold text-sm rounded flex items-center border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                <span className="material-symbols-outlined text-lg mr-1">
                  edit
                </span>
                Edit
              </button>
            </Link>
          </div>
        </header>

        <div className="p-12 max-w-7xl mx-auto space-y-6">
          {/* Hero Section */}
          <div className="neu-card w-full bg-white p-8 rounded-xl relative overflow-hidden border-3 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200 rounded-full blur-3xl opacity-40 -mr-20 -mt-20 pointer-events-none"></div>
            <div className="flex flex-col lg:flex-row gap-10">
              <div className="flex-1 flex flex-col justify-between z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border border-black">
                      <span className="material-symbols-outlined text-sm text-gray-600">
                        folder_open
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Extractor
                      </span>
                    </div>
                    {extractor.consensusEnabled && (
                      <div className="flex items-center space-x-1 bg-blue-100 text-blue-900 px-3 py-1 rounded-full border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span
                          className="material-symbols-outlined text-sm"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                        <span className="text-xs font-bold uppercase">
                          Consensus
                        </span>
                      </div>
                    )}
                    {extractor.defaultModel && (
                      <div className="flex items-center space-x-1 bg-purple-100 text-purple-900 px-3 py-1 rounded-full border border-black">
                        <span className="material-symbols-outlined text-sm">
                          psychology
                        </span>
                        <span className="text-xs font-bold uppercase">
                          {extractor.defaultModel}
                        </span>
                      </div>
                    )}
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    {extractor.name}
                  </h2>
                  <p className="text-black mb-6 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
                    {extractor.description ||
                      "No description provided for this extractor."}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-6 items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      NiceModal.show(RunExtractorModal, {
                        extractorName: extractor.name,
                        extractorId: extractor.id,
                      });
                    }}
                    className="neu-btn bg-primary text-black px-6 py-3 font-bold text-lg rounded-lg flex items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-primary-dark transition-colors border-3 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
                  >
                    <span className="material-symbols-outlined mr-2 text-2xl">
                      rocket_launch
                    </span>
                    RUN EXTRACTOR
                  </button>
                  <Link to="/runs" search={{ extractorId: id }}>
                    <button className="neu-btn bg-white px-5 py-3 font-bold text-sm rounded flex items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-3 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
                      <span className="material-symbols-outlined mr-2 text-base">
                        history
                      </span>
                      Run History
                    </button>
                  </Link>
                  <div className="flex items-center ml-2 text-gray-500 text-sm font-mono">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Ready to process
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-1/3 flex flex-col justify-center">
                <div className="w-full aspect-[4/3] bg-gray-900 rounded-xl border-4 border-black relative overflow-hidden group cursor-pointer shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-1">
                  {extractor.thumbnailUrl ? (
                    <img
                      alt="Document Thumbnail"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                      src={extractor.thumbnailUrl}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <span className="material-symbols-outlined text-8xl text-gray-600">
                        description
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                  <div className="absolute hidden bottom-4 left-4 right-4">
                    <span className="bg-white text-black px-4 py-2 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm uppercase inline-block">
                      Preview Source
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three Column Section */}
          <div className="grid grid-cols-12 gap-8">
            {/* Schema Column */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="neu-card bg-white p-6 rounded-xl h-full border-3 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-black">
                  <h3 className="font-bold text-2xl font-display flex items-center">
                    <span className="material-symbols-outlined mr-3 text-3xl">
                      schema
                    </span>
                    Schema
                  </h3>
                  <span className="text-xs font-bold bg-black text-white px-3 py-1 rounded-full">
                    {schemaFields.length} Fields
                  </span>
                </div>
                <div className="space-y-4">
                  {schemaFields.length > 0 ? (
                    schemaFields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 xdark:bg-gray-800 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(200,200,200,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        <div className="flex items-center">
                          <span className="material-symbols-outlined text-gray-500 mr-3 text-2xl">
                            {field.type === "string"
                              ? "abc"
                              : field.type === "number"
                                ? "attach_money"
                                : field.type === "boolean"
                                  ? "check_box"
                                  : "data_object"}
                          </span>
                          <div>
                            <p className="font-bold text-lg">{field.name}</p>
                            <p className="text-xs text-gray-500 uppercase font-mono">
                              {field.type}
                            </p>
                          </div>
                        </div>
                        {field.required ? (
                          <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded border-2 border-red-200">
                            REQ
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded border-2 border-blue-200">
                            OPT
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <span className="material-symbols-outlined text-4xl mb-2 block">
                        inbox
                      </span>
                      <p className="font-bold">No schema fields defined</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Logic & Limits Column */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="neu-card bg-white xdark:bg-surface-dark p-6 rounded-xl h-full border-3 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-black xdark:border-gray-600">
                  <h3 className="font-bold text-2xl font-display flex items-center">
                    <span className="material-symbols-outlined mr-3 text-3xl">
                      psychology
                    </span>
                    Logic & Limits
                  </h3>
                </div>
                <div className="space-y-6">
                  {extractor.consensusEnabled && (
                    <div className="bg-purple-50 xdark:bg-gray-800 p-5 rounded-lg border-2 border-black relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <span className="absolute -top-3 -right-2 bg-primary text-black text-xs font-black px-3 py-1 border-2 border-black shadow-sm uppercase tracking-wider">
                        Active Strategy
                      </span>
                      <h4 className="font-bold text-lg mb-4 flex items-center">
                        <span className="material-symbols-outlined text-purple-600 mr-2">
                          how_to_vote
                        </span>
                        Consensus Voting
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white p-3 rounded border-2 border-purple-200">
                          <span className="block text-gray-500 text-xs uppercase font-bold mb-1">
                            Threshold
                          </span>
                          <span className="font-display font-bold text-2xl">
                            {extractor.confidenceThreshold || 85}%
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded border-2 border-purple-200">
                          <span className="block text-gray-500 text-xs uppercase font-bold mb-1">
                            Method
                          </span>
                          <span className="font-display font-bold text-lg">
                            {extractor.conflictResolution || "Majority"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white xdark:bg-surface-dark p-5 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-lg flex items-center">
                        <span className="material-symbols-outlined mr-2">
                          settings
                        </span>
                        Configuration
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-black">
                        <span className="text-sm font-bold">Model</span>
                        <span className="text-xs font-mono bg-purple-100 px-2 py-1 rounded border border-purple-300">
                          {extractor.defaultModel || "GPT-4"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-black">
                        <span className="text-sm font-bold">Citations</span>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded border ${
                            extractor.citationEnabled
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-gray-100 text-gray-600 border-gray-300"
                          }`}
                        >
                          {extractor.citationEnabled ? "ENABLED" : "DISABLED"}
                        </span>
                      </div>
                      {extractor.contextWindow && (
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-black">
                          <span className="text-sm font-bold">Context</span>
                          <span className="text-xs font-mono bg-blue-100 px-2 py-1 rounded border border-blue-300">
                            {extractor.contextWindow}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Management Column */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="neu-card bg-white xdark:bg-surface-dark p-6 rounded-xl h-full flex flex-col border-3 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-black xdark:border-gray-600">
                  <h3 className="font-bold text-2xl font-display flex items-center">
                    <span className="material-symbols-outlined mr-3 text-3xl">
                      admin_panel_settings
                    </span>
                    Management
                  </h3>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-6">
                    <Link to="/extractors/edit/$id" params={{ id }}>
                      <button className="w-full mb-6 neu-btn bg-primary text-black py-3 font-bold text-lg rounded-lg flex justify-center items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-primary-dark hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all border-3 border-black">
                        <span className="material-symbols-outlined mr-2 text-xl">
                          edit_square
                        </span>
                        EDIT Extractor
                      </button>
                    </Link>
                    <div className="bg-gray-50 xdark:bg-gray-800 p-5 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                      <div className="flex items-center justify-between border-b-2 border-dashed border-gray-300 pb-3">
                        <span className="text-sm font-bold text-gray-500 uppercase">
                          Last Modified
                        </span>
                        <span className="text-sm font-bold font-mono">
                          {formatDistanceToNow(new Date(extractor.updatedAt))}{" "}
                          ago
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b-2 border-dashed border-gray-300 pb-3">
                        <span className="text-sm font-bold text-gray-500 uppercase">
                          Created
                        </span>
                        <span className="text-sm font-bold font-mono">
                          {formatDistanceToNow(new Date(extractor.createdAt))}{" "}
                          ago
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-500 uppercase">
                          ID
                        </span>
                        <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded border border-black">
                          {extractor.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 xdark:bg-gray-800 p-5 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                      <h4 className="font-bold text-sm uppercase text-gray-500 mb-2">
                        Quick Actions
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          className="flex flex-col items-center justify-center p-3 bg-white xdark:bg-gray-700 border-2 border-black rounded hover:bg-gray-100 xdark:hover:bg-gray-600 transition-colors"
                          onClick={handleDuplicate}
                        >
                          <span className="material-symbols-outlined mb-1">
                            content_copy
                          </span>
                          <span className="text-xs font-bold">Duplicate</span>
                        </button>
                        <button
                          className="flex flex-col items-center justify-center p-3 bg-white xdark:bg-gray-700 border-2 border-black rounded hover:bg-gray-100 xdark:hover:bg-gray-600 transition-colors"
                          onClick={handleShare}
                        >
                          <span className="material-symbols-outlined mb-1">
                            share
                          </span>
                          <span className="text-xs font-bold">Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t-4 border-black xdark:border-gray-600">
                    <button
                      className="flex items-center justify-center text-red-500 hover:text-red-700 font-bold uppercase text-sm tracking-wider transition-colors group w-full"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                    >
                      <span className="material-symbols-outlined mr-2 group-hover:animate-bounce">
                        delete_forever
                      </span>
                      {deleteMutation.isPending
                        ? "Deleting..."
                        : "Delete Extractor"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
