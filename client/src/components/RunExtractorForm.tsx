import { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/retroui/Button";
import { Select } from "@/components/retroui/Select";
import { useAuthStore } from "@/lib/auth-store";
import { useFilesControllerUploadFile } from "@/api/endpoints/files/files";
import {
  useRunsControllerCreate,
  getRunsControllerFindAllQueryKey,
} from "@/api/endpoints/runs/runs";
import {
  CreateRunDto,
  CreateRunDtoProcessingMode as ProcessingMode,
  CreateRunDtoExtractionProvider as ExtractionProvider,
  RunSourceDto,
} from "@/api/models";
import {
  useExtractorsControllerFindAll,
  useExtractorsControllerFindOne,
} from "@/api/endpoints/extractors/extractors";
import { useQueryClient } from "@tanstack/react-query";
import {
  RunExtractorFormSchema,
  RunExtractorFormData,
  defaultRunExtractorValues,
} from "@/types/run-extractor";
import { RunExtractorSources } from "@/components/modals/RunExtractorSources";
import { RunExtractorSettings } from "@/components/modals/RunExtractorSettings";
import { RunExtractorFieldSelector } from "@/components/modals/RunExtractorFieldSelector";
import { toast } from "sonner";

interface RunExtractorFormProps {
  /** Pre-selected extractor ID (locks extractor selection) */
  extractorId?: string;
  /** Pre-selected extractor name (shown when extractorId is provided) */
  extractorName?: string;
  /** Called after a successful run submission */
  onSuccess?: () => void;
  /** Called when the close/cancel button is clicked */
  onClose?: () => void;
  /** Additional CSS class for the outer form container */
  formClassName?: string;
  /** Additional CSS class for the content/body area */
  contentClassName?: string;
  /** Additional CSS class for the grid within the content area */
  gridClassName?: string;
  /** Additional CSS class for the footer area */
  footerClassName?: string;
  /** Additional CSS class for the submit button */
  submitClassName?: string;
  /** Render wrapper for header – receives header JSX as children */
  renderHeader?: (headerContent: React.ReactNode) => React.ReactNode;
  /** Render wrapper for footer – receives footer JSX as children */
  renderFooter?: (footerContent: React.ReactNode) => React.ReactNode;
}

export function RunExtractorForm({
  extractorId: propId,
  extractorName: propName,
  onSuccess,
  onClose,
  formClassName = "flex flex-col h-full",
  contentClassName = "flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar",
  gridClassName = "grid grid-cols-1 lg:grid-cols-12 gap-8",
  footerClassName = "p-6 border-t-4 border-black bg-gray-50 shrink-0 flex flex-col gap-4",
  submitClassName = "w-full h-14 bg-primary border-2 border-black rounded text-black font-black text-lg uppercase tracking-wider shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-primary-hover transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:pointer-events-none",
  renderHeader,
  renderFooter,
}: RunExtractorFormProps) {
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

  // Fetch full extractor data (schema + variants) when an extractor is selected
  const { data: extractorDetail } = useExtractorsControllerFindOne(
    activeExtractorId || "",
    {
      query: {
        enabled: !!activeExtractorId,
      },
    },
  );

  // Update name from fetched detail (useful for page view where only ID comes from URL)
  useEffect(() => {
    if (extractorDetail?.data) {
      setSelectedExtractorName(extractorDetail.data.name);
      if (!propId) setSelectedExtractorId(extractorDetail.data.id);
    }
  }, [extractorDetail, propId]);

  const methods = useForm<RunExtractorFormData>({
    defaultValues: defaultRunExtractorValues,
    resolver: zodResolver(RunExtractorFormSchema),
  });

  const { handleSubmit, watch } = methods;
  const processingMode = watch("processingMode");

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

      const dto = {
        extractorId: activeExtractorId,
        processingMode: data.processingMode as ProcessingMode,
        extractionProvider: data.extractionProvider as ExtractionProvider,
        sources: sourcesDto,
        ...(data.variantId ? { variantId: data.variantId } : {}),
        ...(data.skippedFields?.length
          ? { skippedFields: data.skippedFields }
          : {}),
        ...(data.model ? { model: data.model } : {}),
      } as CreateRunDto;

      await createRunMutation.mutateAsync({
        data: dto,
      });

      toast.success("Extraction run started successfully!");

      // Invalidate queries to refresh the runs list
      await queryClient.invalidateQueries({
        queryKey: getRunsControllerFindAllQueryKey(),
      });

      onSuccess?.();
    } catch (error) {
      toast.error("Failed to start extraction run");
      console.error("Extraction error:", error);
    }
  };

  // ── Header content ──
  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-black">
            rocket_launch
          </span>
          <h3 className="text-black tracking-tight text-xl font-bold uppercase flex items-center gap-2">
            Run Extractor:
            {!propId ? (
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
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded border border-transparent hover:border-black transition-all"
        >
          <span className="material-symbols-outlined text-black font-bold">
            close
          </span>
        </button>
      )}
    </div>
  );

  // ── Footer / submit button content ──
  const footerContent = (
    <Button
      type="submit"
      disabled={createRunMutation.isPending || !activeExtractorId}
      className={submitClassName}
    >
      {createRunMutation.isPending ? (
        <>
          <span>Starting Run...</span>
          <span className="material-symbols-outlined animate-spin">sync</span>
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
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onFormSubmit)} className={formClassName}>
        {/* Header */}
        {renderHeader ? (
          renderHeader(headerContent)
        ) : (
          <div className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-white shrink-0">
            {headerContent}
          </div>
        )}

        {/* Content */}
        <div className={contentClassName}>
          <div className={gridClassName}>
            {/* Left Column: Input Sources + Schema Fields */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <RunExtractorSources onUploadFile={handleUploadFile} />

              {extractorDetail?.data && (
                <RunExtractorFieldSelector
                  schema={(extractorDetail.data as any).schema || {}}
                  variants={(extractorDetail.data as any).variants || []}
                />
              )}
            </div>

            {/* Right Column: Configuration */}
            <RunExtractorSettings />
          </div>
        </div>

        {/* Footer */}
        {renderFooter ? (
          renderFooter(footerContent)
        ) : (
          <div className={footerClassName}>{footerContent}</div>
        )}
      </form>
    </FormProvider>
  );
}
