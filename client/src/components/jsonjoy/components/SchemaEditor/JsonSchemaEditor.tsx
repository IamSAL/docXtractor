import { Maximize2 } from "lucide-react";
import {
  type FC,
  type MouseEvent as ReactMouseEvent,
  useRef,
  useState,
} from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs.tsx";
import { useTranslation } from "../../hooks/use-translation.ts";
import { cn } from "../../lib/utils.ts";
import type { JSONSchema } from "../../types/jsonSchema.ts";
import JsonSchemaVisualizer from "./JsonSchemaVisualizer.tsx";
import SchemaVisualEditor from "./SchemaVisualEditor.tsx";

/** @public */
export interface JsonSchemaEditorProps {
  schema?: JSONSchema;
  readOnly: boolean;
  setSchema?: (schema: JSONSchema) => void;
  className?: string;
}

/** @public */
const JsonSchemaEditor: FC<JsonSchemaEditorProps> = ({
  schema = { type: "object" },
  readOnly = false,
  setSchema,
  className,
}) => {
  // Handle schema changes and propagate to parent if needed
  const handleSchemaChange = (newSchema: JSONSchema) => {
    setSchema(newSchema);
  };

  const t = useTranslation();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const resizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const fullscreenClass = isFullscreen
    ? "fixed inset-0 z-50 bg-background"
    : "";

  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth =
      ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Limit the minimum and maximum width
    if (newWidth >= 20 && newWidth <= 80) {
      setLeftPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={cn(
        "json-editor-container w-full",
        fullscreenClass,
        className,
        "jsonjoy",
      )}
    >
      {/* For mobile screens - show as tabs */}
      <div className="block lg:hidden w-full">
        <Tabs defaultValue="visual" className="w-full">
          <div className="flex items-center justify-between px-4 py-3 border-b w-full">
            <h3 className="font-medium">{t.schemaEditorTitle}</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                aria-label={t.schemaEditorToggleFullscreen}
              >
                <Maximize2 size={16} />
              </button>
              <TabsList className="grid grid-cols-2 w-[200px]">
                <TabsTrigger value="visual">
                  {t.schemaEditorEditModeVisual}
                </TabsTrigger>
                <TabsTrigger value="json">
                  {t.schemaEditorEditModeJson}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent
            value="visual"
            className={cn(
              "focus:outline-hidden w-full",
              isFullscreen ? "h-screen" : "h-[500px]",
            )}
          >
            <SchemaVisualEditor
              readOnly={readOnly}
              schema={schema}
              onChange={handleSchemaChange}
            />
          </TabsContent>

          <TabsContent
            value="json"
            className={cn(
              "focus:outline-hidden w-full",
              isFullscreen ? "h-screen" : "h-[500px]",
            )}
          >
            <JsonSchemaVisualizer
              schema={schema}
              onChange={handleSchemaChange}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* For large screens - show side by side */}
      <div
        ref={containerRef}
        className={cn(
          "hidden lg:flex lg:flex-col w-full bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden",
          isFullscreen ? "h-screen fixed inset-0 z-50" : "h-[650px]",
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black w-full shrink-0 bg-yellow-50/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border-2 border-black bg-primary flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="material-symbols-outlined text-white text-sm">settings_input_component</span>
            </div>
            <h3 className="font-black uppercase tracking-tight text-sm">{t.schemaEditorTitle}</h3>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border-2 border-transparent hover:border-black transition-all hover:bg-white active:translate-y-0.5"
            aria-label={t.schemaEditorToggleFullscreen}
          >
            <span className="material-symbols-outlined text-lg">
              {isFullscreen ? "fullscreen_exit" : "fullscreen"}
            </span>
          </button>
        </div>
        <div className="flex flex-row w-full grow min-h-0">
          <div
            className="h-full min-h-0 overflow-hidden"
            style={{ width: `${leftPanelWidth}%` }}
          >
            <SchemaVisualEditor
              readOnly={readOnly}
              schema={schema}
              onChange={handleSchemaChange}
            />
          </div>
          {/** biome-ignore lint/a11y/noStaticElementInteractions: What exactly does this div do? */}
          <div
            ref={resizeRef}
            className="w-1.5 bg-black hover:bg-primary cursor-col-resize shrink-0 transition-colors"
            onMouseDown={handleMouseDown}
          />
          <div
            className="h-full min-h-0 bg-gray-50/50"
            style={{ width: `${100 - leftPanelWidth}%` }}
          >
            <JsonSchemaVisualizer
              schema={schema}
              onChange={handleSchemaChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonSchemaEditor;
