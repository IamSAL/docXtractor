import { Controller, useFormContext } from "react-hook-form";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/retroui/Textarea";
import { FewShotExamples } from "@/components/extractors/FewShotExamples";
import { ExtractionSettings } from "@/components/extractors/ExtractionSettings";
import type { ExtractorFormData } from "@/types/extractor";
import { FormErrorMessage } from "@/components/FormErrorMessage";

interface AdvancedOptionsSectionProps {
  onResetPrompt: () => void;
  onUploadFile: (file: File) => Promise<{ url: string; id: string }>;
}

export function AdvancedOptionsSection({
  onResetPrompt,
  onUploadFile,
}: AdvancedOptionsSectionProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ExtractorFormData>();

  return (
    <AccordionItem
      value="advanced"
      className="bg-white xdark:bg-surface-dark rounded-xl shadow-subtle border-border-light xdark:border-border-dark overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
    >
      <AccordionTrigger className="px-6 py-5 border-b border-border-light xdark:border-border-dark hover:bg-gray-50 transition-colors hover:no-underline text-lg">
        <div className="flex flex-1 items-center justify-between mr-4">
          <h3 className="font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              psychology
            </span>
            Advanced Options
          </h3>
          <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full xdark:bg-yellow-900/30 xdark:text-yellow-200">
            Improves accuracy
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-0">
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-text-main-light xdark:text-text-secondary-dark">
                System Prompt
              </label>
              <button
                type="button"
                onClick={onResetPrompt}
                className="text-xs text-primary hover:text-primary-dark font-medium"
              >
                Reset to Default
              </button>
            </div>
            <div className="relative">
              <Controller
                name="systemPrompt"
                control={control}
                render={({ field }) => (
                  <>
                    <Textarea {...field} rows={6} />
                    <FormErrorMessage message={errors.systemPrompt?.message} />
                  </>
                )}
              />
            </div>
          </div>
          <FewShotExamples onUploadFile={onUploadFile} />

          <div className="border-t-2 border-border-light xdark:border-border-dark my-6" />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-text-main-light xdark:text-text-secondary-dark">
                Extraction Settings
              </label>
              <span className="text-xs text-text-sub italic">
                Override global defaults for this extractor
              </span>
            </div>
            <ExtractionSettings showHeader={false} />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
