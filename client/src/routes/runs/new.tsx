import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "../../components/AppLayout";
import { Button } from "../../components/retroui/Button";
import { Select } from "../../components/retroui/Select";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../lib/auth-store";
import { useFilesControllerUploadFile } from "../../api/endpoints/files/files";
import {
  useRunsControllerCreate,
  getRunsControllerFindAllQueryKey,
} from "../../api/endpoints/runs/runs";
import {
  CreateRunDto,
  CreateRunDtoProcessingMode as ProcessingMode,
  RunSourceDto,
} from "../../api/models";
import {
  useExtractorsControllerFindAll,
  useExtractorsControllerFindOne,
} from "../../api/endpoints/extractors/extractors";
import { useQueryClient } from "@tanstack/react-query";
import {
  RunExtractorFormSchema,
  RunExtractorFormData,
  defaultRunExtractorValues,
} from "../../types/run-extractor";
import { RunExtractorSources } from "../../components/modals/RunExtractorSources";
import { RunExtractorSettings } from "../../components/modals/RunExtractorSettings";
import { toast } from "sonner";

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
  const { user } = useAuthStore();
  const uploadFileMutation = useFilesControllerUploadFile();
  const createRunMutation = useRunsControllerCreate();
  const queryClient = useQueryClient();

  // Extractor Selection State
  const [selectedExtractorId, setSelectedExtractorId] = useState<
    string | undefined
  >(urlExtractorId);
  const [selectedExtractorName, setSelectedExtractorName] = useState<
    string | undefined
  >();

  // Fetch extractors if explicit ID is not provided
  const { data: extractorsData } = useExtractorsControllerFindAll({
    query: {
      enabled: !urlExtractorId,
    },
  });

  // Fetch specific extractor if ID is provided
  const { data: extractorData } = useExtractorsControllerFindOne(
    urlExtractorId || "",
    {
      query: {
        enabled: !!urlExtractorId,
      },
    },
  );

  // Update state when extractor data is loaded
  useEffect(() => {
    if (extractorData?.data) {
      setSelectedExtractorName(extractorData.data.name);
      setSelectedExtractorId(extractorData.data.id);
    }
  }, [extractorData]);

  const activeExtractorId = urlExtractorId || selectedExtractorId;

  const methods = useForm<RunExtractorFormData>({
    defaultValues: defaultRunExtractorValues,
    resolver: zodResolver(RunExtractorFormSchema),
  });

  const { handleSubmit, watch } = methods;
  const processingMode = watch("processingMode");
  const sources = watch("sources");

  const handleUploadFile = async (file: File) => {
    if (!user?.id) throw new Error("User not authenticated");

    const result = await uploadFileMutation.mutateAsync({
      data: {
        file,
        userId: user.id,
      },
    });

    const successData = (result as any).data;
    if (!successData?.url) {
      throw new Error("Upload failed: No URL returned");
    }

    return { url: successData.url, id: successData.id };
  };

  const onFormSubmit = async (data: RunExtractorFormData) => {
    try {
      if (!user?.id) {
        toast.error("User not authenticated");
        return;
      }

      if (!activeExtractorId) {
        toast.error("Please select an extractor first");
        return;
      }

      const sourcesDto: RunSourceDto[] = data.sources.map((source) => ({
        type: source.type === "url" ? "url" : "file",
        name: source.name,
        url: source.type === "url" ? source.content : undefined,
        fileId: source.type === "file" ? source.id : undefined,
      }));

      const dto: CreateRunDto = {
        extractorId: activeExtractorId,
        processingMode: data.processingMode as ProcessingMode,
        sources: sourcesDto,
      };

      await createRunMutation.mutateAsync({
        data: dto,
      });

      toast.success("Extraction run started successfully!");

      // Invalidate queries to refresh the runs list
      await queryClient.invalidateQueries({
        queryKey: getRunsControllerFindAllQueryKey(),
      });

      // Navigate to runs list
      navigate({ to: "/runs" });
    } catch (error) {
      toast.error("Failed to start extraction run");
      console.error("Extraction error:", error);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-white">
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-white shrink-0">
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-black">
                      rocket_launch
                    </span>
                    <h3 className="text-black tracking-tight text-xl font-bold uppercase flex items-center gap-2">
                      Run Extractor:
                      {!urlExtractorId ? (
                        <Select
                          value={selectedExtractorId || ""}
                          onValueChange={(id) => {
                            setSelectedExtractorId(id);
                            const name = extractorsData?.data?.find(
                              (ex: any) => ex.id === id,
                            )?.name;
                            if (name) setSelectedExtractorName(name);
                          }}
                        >
                          <Select.Trigger className="bg-primary/20 h-auto px-2 py-0.5 border-0 border-b-2 border-black text-sm font-bold uppercase cursor-pointer focus:ring-0 shadow-none rounded-none min-w-0 max-w-[500px] truncate">
                            <Select.Value placeholder="Select Extractor..." />
                          </Select.Trigger>
                          <Select.Content>
                            <Select.Group>
                              {extractorsData?.data?.map((ex: any) => (
                                <Select.Item key={ex.id} value={ex.id}>
                                  {ex.name}
                                </Select.Item>
                              ))}
                            </Select.Group>
                          </Select.Content>
                        </Select>
                      ) : (
                        <span className="bg-primary/20 px-2 py-0.5 border-b-2 border-black">
                          {selectedExtractorName || "Loading..."}
                        </span>
                      )}
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-gray-500 pl-[44px] flex items-center gap-2">
                    <span>
                      EXTRACTOR ID:{" "}
                      {activeExtractorId
                        ? `#${activeExtractorId.substring(0, 8)}`
                        : "SELECT_REQUIRED"}
                    </span>
                    <span>•</span>
                    <span>{processingMode.toUpperCase()} EXTRACTION MODE</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/runs" })}
                  className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded border border-transparent hover:border-black transition-all"
                >
                  <span className="material-symbols-outlined text-black font-bold">
                    close
                  </span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto w-full">
                {/* Left Column: Input Sources */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <RunExtractorSources onUploadFile={handleUploadFile} />
                </div>

                {/* Right Column: Configuration */}
                <RunExtractorSettings />
              </div>
            </div>

            {/* Footer */}
            <div className="px-12 py-5 border-t-4 border-black bg-gray-50 shrink-0 flex flex-col gap-4">
              <Button
                type="submit"
                disabled={createRunMutation.isPending || !activeExtractorId}
                className="w-full h-12 bg-primary border-2 border-black rounded text-black font-bold text-base uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-primary-hover transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:pointer-events-none"
              >
                {createRunMutation.isPending ? (
                  <>
                    <span>Starting Run...</span>
                    <span className="material-symbols-outlined animate-spin">
                      sync
                    </span>
                  </>
                ) : (
                  <>
                    <span>Run Extraction</span>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform font-black">
                      arrow_forward
                    </span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </AppLayout>
  );
}
