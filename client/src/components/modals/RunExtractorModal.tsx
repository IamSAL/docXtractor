import { useState, useEffect } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/retroui/Button";
import { useAuthStore } from "@/lib/auth-store";
import { useFilesControllerUploadFile } from "@/api/endpoints/files/files";
import {
  useRunsControllerCreate,
  getRunsControllerFindAllQueryKey,
  ProcessingMode,
  RunSourceDto,
  CreateRunDto,
} from "@/api/endpoints/runs/runs";
import { useExtractorsControllerFindAll } from "@/api/endpoints/extractors/extractors";
import { useQueryClient } from "@tanstack/react-query";
import {
  RunExtractorFormSchema,
  RunExtractorFormData,
  defaultRunExtractorValues,
} from "@/types/run-extractor";
import { RunExtractorSources } from "./RunExtractorSources";
import { RunExtractorSettings } from "./RunExtractorSettings";
import { toast } from "sonner";

import { Dialog } from "@/components/retroui/Dialog";

interface RunExtractorModalProps {
  extractorName?: string;
  extractorId?: string;
}

export const RunExtractorModal = NiceModal.create(
  ({
    extractorName: propName,
    extractorId: propId,
  }: RunExtractorModalProps) => {
    const modal = useModal();
    const { user } = useAuthStore();
    const uploadFileMutation = useFilesControllerUploadFile();
    const createRunMutation = useRunsControllerCreate();
    const queryClient = useQueryClient();

    // Extractor Selection State
    const [selectedExtractorId, setSelectedExtractorId] = useState<
      string | undefined
    >(propId);
    const [selectedExtractorName, setSelectedExtractorName] = useState<
      string | undefined
    >(propName);

    // Fetch extractors if explicit ID is not provided
    const { data: extractorsData } = useExtractorsControllerFindAll({
      query: {
        enabled: !propId,
      },
    });

    // Update state if props change
    useEffect(() => {
      if (propId) setSelectedExtractorId(propId);
      if (propName) setSelectedExtractorName(propName);
    }, [propId, propName]);

    const activeExtractorId = propId || selectedExtractorId;

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

        modal.resolve("success");
        modal.hide();
      } catch (error) {
        toast.error("Failed to start extraction run");
        console.error("Extraction error:", error);
      }
    };

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={(open) => !open && modal.hide()}
      >
        <Dialog.Content
          className="max-w-4xl p-0 border-4 border-black bg-white shadow-hard-lg"
          size="auto"
        >
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onFormSubmit)}
              className="flex flex-col h-full max-h-[90vh]"
            >
              {/* Header */}
              <Dialog.Header
                asChild
                className="flex items-center justify-between px-6 py-5 border-b-4 border-black bg-white shrink-0"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-3xl text-black">
                        rocket_launch
                      </span>
                      <h3 className="text-black tracking-tight text-xl font-bold uppercase flex items-center gap-2">
                        Run Extractor:
                        {!propId ? (
                          <select
                            className="bg-primary/20 px-2 py-0.5 border-b-2 border-black text-sm font-bold uppercase cursor-pointer focus:outline-none max-w-[200px] truncate"
                            value={selectedExtractorId || ""}
                            onChange={(e) => {
                              const id = e.target.value;
                              setSelectedExtractorId(id);
                              const name = extractorsData?.data?.find(
                                (ex: any) => ex.id === id,
                              )?.name;
                              if (name) setSelectedExtractorName(name);
                            }}
                          >
                            <option value="" disabled>
                              Select Extractor...
                            </option>
                            {extractorsData?.data?.map((ex: any) => (
                              <option key={ex.id} value={ex.id}>
                                {ex.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="bg-primary/20 px-2 py-0.5 border-b-2 border-black">
                            {selectedExtractorName}
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
                      <span>
                        {processingMode.toUpperCase()} EXTRACTION MODE
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => modal.hide()}
                    className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded border border-transparent hover:border-black transition-all"
                  >
                    <span className="material-symbols-outlined text-black font-bold">
                      close
                    </span>
                  </button>
                </div>
              </Dialog.Header>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Input Sources */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <RunExtractorSources onUploadFile={handleUploadFile} />
                  </div>

                  {/* Right Column: Configuration */}
                  <RunExtractorSettings />
                </div>
              </div>

              {/* Footer */}
              <Dialog.Footer
                position="static"
                className="p-6 border-t-4 border-black bg-gray-50 shrink-0 flex flex-col gap-4"
              >
                <div className="w-full bg-primary/40 border-2 border-black rounded p-4 flex items-center justify-between shadow-hard-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary border-2 border-black flex items-center justify-center rounded-full">
                      <span className="material-symbols-outlined text-black">
                        analytics
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase leading-none mb-1">
                        Ready to Extract
                      </span>
                      <span className="text-[10px] font-mono text-gray-600">
                        {sources.length} SOURCES •{" "}
                        {processingMode.toUpperCase()} • ~{sources.length * 5}K
                        TOKENS
                      </span>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="block text-xs font-bold leading-none mb-1">
                      EST. COST: ${(sources.length * 0.04).toFixed(2)}
                    </span>
                    <span className="block text-[10px] text-gray-600 uppercase font-bold">
                      ~{sources.length * 15}s Processing Delay
                    </span>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={createRunMutation.isPending || !activeExtractorId}
                  className="w-full h-14 bg-primary border-2 border-black rounded text-black font-black text-lg uppercase tracking-wider shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-primary-hover transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:pointer-events-none"
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
                      <span>Start Extraction Run</span>
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform font-black">
                        arrow_forward
                      </span>
                    </>
                  )}
                </Button>
              </Dialog.Footer>
            </form>
          </FormProvider>
        </Dialog.Content>
      </Dialog>
    );
  },
);
