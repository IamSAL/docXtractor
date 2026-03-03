import { Button } from "@/components/retroui/Button";
import { Tooltip, TooltipProvider } from "@/components/retroui/Tooltip";
import { useState } from "react";
import SchemaVisualEditor from "@/components/jsonjoy/components/SchemaEditor/SchemaVisualEditor";
import "@/components/jsonjoy/index.css";
import { FormProvider, useForm } from "react-hook-form";
import type { ExtractorFormData } from "@/types/extractor";
import { defaultExtractorFormValues } from "@/types/extractor";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import {
  useFilesControllerConfirmFiles,
  useFilesControllerUploadFile,
} from "@/api/endpoints/files/files";
import { useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ExtractorsControllerCreateBody } from "@/api/schemas/extractors/extractors.zod";
import { BasicInfoSection } from "./BasicInfoSection";
import { AdvancedOptionsSection } from "./AdvancedOptionsSection";
import { Accordion } from "@/components/ui/accordion";
import NiceModal from "@ebay/nice-modal-react";
import { RunExtractorModal } from "@/components/modals/RunExtractorModal";

const extractorFormSchema = ExtractorsControllerCreateBody.extend({
  name: z.string().min(1, "Extractor name is required"),
  systemPrompt: z.string().min(1, "System prompt is required"),
  schema: z.any(), // Match JSONSchema recursive type
});

interface ExtractorFormProps {
  initialData?: ExtractorFormData;
  onSubmit: (data: ExtractorFormData) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  onDelete?: () => void;
}

export function ExtractorForm({
  initialData,
  onSubmit: onFormSubmit,
  isSubmitting: isFormSubmitting,
  title,
  onDelete,
}: ExtractorFormProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isTesting] = useState(false);
  const [fileUrlToId, setFileUrlToId] = useState<Record<string, string>>({});

  const uploadFileMutation = useFilesControllerUploadFile();
  const confirmFilesMutation = useFilesControllerConfirmFiles();

  const methods = useForm<ExtractorFormData>({
    defaultValues: initialData || defaultExtractorFormValues,
    resolver: zodResolver(extractorFormSchema) as any,
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty },
  } = methods;

  const schema = watch("schema");

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
      console.error("❌ Upload successful but no URL returned:", result);
      throw new Error("Upload failed: No URL returned");
    }

    setFileUrlToId((prev) => ({
      ...prev,
      [successData.url]: successData.id,
    }));

    return { url: successData.url, id: successData.id };
  };

  const handleActualSubmit = async (data: ExtractorFormData) => {
    try {
      const filesToConfirm: string[] = [];

      if (data.thumbnailUrl && fileUrlToId[data.thumbnailUrl]) {
        filesToConfirm.push(fileUrlToId[data.thumbnailUrl]);
      }

      data.fewShotExamples.forEach((example) => {
        example.sources.forEach((source) => {
          if (
            source.type === "file" &&
            source.content &&
            fileUrlToId[source.content]
          ) {
            filesToConfirm.push(fileUrlToId[source.content]);
          }
        });
      });

      if (filesToConfirm.length > 0 && user?.id) {
        await confirmFilesMutation.mutateAsync({
          data: {
            fileIds: filesToConfirm,
            userId: user.id,
          },
        });
      }

      await onFormSubmit(data);
    } catch (error) {
      toast.error("Failed to save extractor", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      console.error("❌ Form submission error:", error);
    }
  };

  const handleResetPrompt = () => {
    setValue("systemPrompt", defaultExtractorFormValues.systemPrompt, {
      shouldDirty: true,
    });
    toast.info("System prompt reset to default");
  };

  const submit = handleSubmit(handleActualSubmit);
  const currentTitle = methods.watch("name");
  return (
    <FormProvider {...methods}>
      <form className="flex-1 flex flex-col h-full overflow-hidden bg-background-light xdark:bg-background-dark relative">
        <header className="sticky top-0 z-10 bg-background-light/95 xdark:bg-background-dark/95 backdrop-blur-sm border-b-2 border-border-light xdark:border-border-dark px-8 py-4.5 flex flex-col gap-4">
          <div className="flex flex-wrap justify-between items-end gap-4">
            <div className="flex flex-col gap-1">
              <h2
                title={currentTitle || title}
                className="text-3xl font-black tracking-tight text-nowrap overflow-hidden text-text-main-light xdark:text-white leading-none max-w-[500px] text-ellipsis "
              >
                {currentTitle || title}
              </h2>
              <p className="text-sm text-text-secondary-light xdark:text-text-secondary-dark flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  {initialData ? "edit" : "add_circle"}
                </span>
                {initialData
                  ? "Edit your extractor configuration"
                  : "Create a new extraction extractor"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="link"
                className="text-text-secondary-light hover:text-red-500"
                onClick={() => navigate({ to: "/extractors" })}
              >
                Cancel
              </Button>
              <TooltipProvider>
                <Tooltip content="Test with a sample document" side="bottom">
                  <Button
                    type="button"
                    className="bg-white"
                    disabled={isTesting}
                    onClick={() =>
                      NiceModal.show(RunExtractorModal, {
                        extractorName: watch("name") || "Unnamed Extractor",
                        extractorId:
                          (initialData as any)?.id || "NEW-EXTRACTOR",
                      })
                    }
                  >
                    <span className="material-symbols-outlined text-[18px] filled mr-2">
                      {isTesting ? "hourglass_empty" : "play_arrow"}
                    </span>
                    {isTesting ? "Testing..." : "Test Run"}
                  </Button>
                </Tooltip>
              </TooltipProvider>
              <Button onClick={submit} disabled={isFormSubmitting}>
                <span className="material-symbols-outlined text-[18px] filled mr-2">
                  {isFormSubmitting ? "hourglass_empty" : "save"}
                </span>
                {isFormSubmitting ? "Saving..." : "Save Extractor"}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-12 lg:px-36 py-8 pb-24">
          <div className="mx-auto flex flex-col gap-8">
            <Accordion
              type="multiple"
              defaultValue={["basic", "schema", "advanced"]}
              className="flex flex-col gap-8"
            >
              <BasicInfoSection onUploadFile={handleUploadFile} />

              <SchemaVisualEditor
                schema={schema}
                onChange={(newSchema) =>
                  setValue("schema", newSchema, { shouldDirty: true })
                }
                readOnly={false}
              />

              <AdvancedOptionsSection
                onResetPrompt={handleResetPrompt}
                onUploadFile={handleUploadFile}
              />
            </Accordion>
          </div>
        </div>

        <div className="fixed bottom-0 left-64 right-0 bg-white xdark:bg-surface-dark border-t-2 border-black xdark:border-gray-600 p-4 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-accent-red hover:text-red-700 hover:bg-red-50"
                  onClick={onDelete}
                >
                  <span className="material-symbols-outlined text-[18px] mr-1">
                    delete
                  </span>
                  Delete Extractor
                </Button>
              )}
            </div>
            <div className="flex items-center gap-4">
              {isDirty && (
                <span className="text-xs text-text-secondary-light font-medium">
                  Unsaved changes
                </span>
              )}
              <Button
                size="lg"
                onClick={submit}
                className="shadow-neubrutalist"
                disabled={isFormSubmitting}
              >
                <span className="material-symbols-outlined text-[20px] filled mr-2">
                  {isFormSubmitting ? "hourglass_empty" : "save"}
                </span>
                {isFormSubmitting ? "SAVING..." : "SAVE EXTRACTOR"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
