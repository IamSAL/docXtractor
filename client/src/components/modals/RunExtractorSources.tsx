import { useFormContext, useFieldArray } from "react-hook-form";
import type {
  RunExtractorFormData,
  ExtractionSource,
} from "@/types/run-extractor";
import { FormErrorMessage } from "@/components/FormErrorMessage";

interface RunExtractorSourcesProps {
  onUploadFile: (file: File) => Promise<{ url: string; id: string }>;
}

export function RunExtractorSources({
  onUploadFile,
}: RunExtractorSourcesProps) {
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext<RunExtractorFormData>();
  const {
    fields: sources,
    append,
    remove,
    update,
  } = useFieldArray({
    control,
    name: "sources",
  });

  const addFileSource = async (file: File) => {
    const tempId = crypto.randomUUID();
    const newSource: ExtractionSource = {
      id: tempId,
      type: "file",
      name: file.name,
      content: "",
      status: "uploading",
      sizeBytes: file.size,
    };

    append(newSource);

    try {
      const result = await onUploadFile(file);
      const currentSources = getValues("sources");
      const index = currentSources.findIndex((s) => s.id === tempId);
      if (index !== -1) {
        // Update with the actual file ID from backend and the URL
        update(index, {
          ...newSource,
          id: result.id, // Use the actual file ID from backend
          content: result.url,
          status: "ready",
        });
      }
    } catch (error) {
      const currentSources = getValues("sources");
      const index = currentSources.findIndex((s) => s.id === tempId);
      if (index !== -1) {
        update(index, {
          ...newSource,
          status: "error",
          description: "Upload failed",
        });
      }
    }
  };

  const addUrlSource = () => {
    append({
      id: crypto.randomUUID(),
      type: "url",
      name: "External URL",
      content: "",
      status: "ready",
      description: "Enter document/webpage URL",
    });
  };

  const updateSourceContent = (index: number, content: string) => {
    const source = sources[index];
    update(index, { ...source, content });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1 flex justify-between items-center">
          <span>Input Sources</span>
          <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full">
            Supported: PDF, URL, DOCX
          </span>
        </label>
        <div className="relative group cursor-pointer">
          <input
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            multiple
            type="file"
            onChange={(e) => {
              const files = e.target.files;
              if (files) {
                Array.from(files).forEach(addFileSource);
              }
            }}
          />
          <div className="flex flex-row items-center gap-6 rounded-lg border-2 border-dashed border-gray-400 bg-gray-50 px-6 py-8 transition-all group-hover:border-black group-hover:bg-primary/10">
            <div className="w-14 h-14 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-hard-sm shrink-0">
              <span className="material-symbols-outlined text-2xl text-black">
                add_to_photos
              </span>
            </div>
            <div className="flex flex-col">
              <p className="text-black text-base font-bold">
                Drop files here to upload
              </p>
              <p className="text-gray-600 text-xs mt-1">or click to browse</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button
            type="button"
            onClick={addUrlSource}
            className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">link</span>
            Add URL
          </button>
        </div>
        <FormErrorMessage message={errors.sources?.message} />
      </div>

      {sources.length > 0 && (
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
            Added Sources ({sources.length})
          </label>
          <div className="grid grid-cols-1 gap-3">
            {sources.map((source, index) => (
              <div
                key={source.id}
                className="flex flex-col border-2 border-black bg-white shadow-hard-sm transition-all overflow-hidden group"
              >
                <div className="flex items-center justify-between p-3 border-b-2 border-black last:border-b-0">
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div
                      className={`w-8 h-8 border border-black flex items-center justify-center shrink-0 ${
                        source.type === "file" ? "bg-red-100" : "bg-blue-100"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-lg ${
                          source.type === "file"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {source.type === "file" ? "picture_as_pdf" : "link"}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      {source.type === "url" ? (
                        <input
                          type="text"
                          value={source.content}
                          onChange={(e) =>
                            updateSourceContent(index, e.target.value)
                          }
                          placeholder="https://example.com/document.pdf"
                          className="text-sm font-bold bg-transparent border-none p-0 focus:ring-0 w-full"
                        />
                      ) : (
                        <span className="text-sm font-bold truncate">
                          {source.name}
                        </span>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold">
                        {source.sizeBytes && (
                          <span>
                            {(source.sizeBytes / 1024 / 1024).toFixed(1)} MB
                          </span>
                        )}
                        {source.sizeBytes && (
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        )}
                        <span
                          className={`${
                            source.status === "ready"
                              ? "text-green-600"
                              : source.status === "uploading"
                                ? "text-blue-600 animate-pulse"
                                : "text-red-600"
                          } flex items-center gap-1`}
                        >
                          <span className="material-symbols-outlined text-[10px]">
                            {source.status === "ready"
                              ? "check_circle"
                              : source.status === "uploading"
                                ? "sync"
                                : "error"}
                          </span>
                          {source.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>

                {/* Preview Section */}
                {source.status === "ready" && source.content && (
                  <div className="p-3 bg-gray-50 border-t-2 border-black flex justify-center items-center">
                    {source.content.match(
                      /\.(jpeg|jpg|gif|png|webp|svg|bmp|tiff|avif)/i,
                    ) || source.content.startsWith("data:image") ? (
                      <img
                        src={source.content}
                        alt={source.name}
                        className="max-h-40 rounded border-2 border-black object-contain bg-white shadow-sm"
                        onError={(e) => {
                          (
                            e.target as HTMLImageElement
                          ).parentElement!.style.display = "none";
                        }}
                      />
                    ) : source.content.match(/\.pdf/i) ? (
                      <div className="flex items-center gap-3 py-2">
                        <span className="material-symbols-outlined text-red-500 text-3xl">
                          picture_as_pdf
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700">
                            PDF Document
                          </span>
                          <a
                            href={source.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline break-all"
                          >
                            View Full Document
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 py-2">
                        <span className="material-symbols-outlined text-gray-500 text-3xl">
                          description
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700">
                            Resource
                          </span>
                          <a
                            href={source.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline break-all line-clamp-1"
                          >
                            {source.content}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
