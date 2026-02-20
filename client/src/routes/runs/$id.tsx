import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "../../components/AppLayout";
import { Button } from "../../components/retroui/Button";
import {
  useRunsControllerFindOne,
  getRunsControllerFindOneQueryKey,
  useRunsControllerRetry,
  getRunsControllerFindAllQueryKey,
} from "@/api/endpoints/runs/runs";
import { useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";

export const Route = createFileRoute("/runs/$id")({
  component: RunDetailComponent,
});

function RunDetailComponent() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useRunsControllerFindOne(id);
  const queryClient = useQueryClient();
  const retryMutation = useRunsControllerRetry();
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.emit("joinRun", { runId: id });

    const handleRunUpdated = (updatedRun: any) => {
      queryClient.setQueryData(
        getRunsControllerFindOneQueryKey(id),
        (oldData: any) => {
          if (!oldData) return oldData;
          return { ...oldData, data: updatedRun };
        },
      );
    };

    const handleSourceUpdated = (updatedSource: any) => {
      queryClient.setQueryData(
        getRunsControllerFindOneQueryKey(id),
        (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          const run = oldData.data;
          const sources = run.sources?.map((s: any) =>
            s.id === updatedSource.id ? updatedSource : s,
          );
          return { ...oldData, data: { ...run, sources } };
        },
      );
    };

    const handleRunLog = (data: { runId: string; log: any }) => {
      queryClient.setQueryData(
        getRunsControllerFindOneQueryKey(id),
        (oldData: any) => {
          if (!oldData?.data) return oldData;
          const run = oldData.data;
          return {
            ...oldData,
            data: { ...run, logs: [...(run.logs || []), data.log] },
          };
        },
      );
    };

    socket.on("run:updated", handleRunUpdated);
    socket.on("run:source:updated", handleSourceUpdated);
    socket.on("run:log", handleRunLog);

    return () => {
      socket.emit("leaveRun", { runId: id });
      socket.off("run:updated", handleRunUpdated);
      socket.off("run:source:updated", handleSourceUpdated);
      socket.off("run:log", handleRunLog);
    };
  }, [id, queryClient]);

  const run = (data as any)?.data;

  // Compute source statistics
  const sourceStats = useMemo(() => {
    if (!run?.sources) return { parsed: 0, parsing: 0, failed: 0, pending: 0 };
    const sources = run.sources as any[];
    return {
      parsed: sources.filter((s) => s.status === "parsed").length,
      parsing: sources.filter(
        (s) => s.status === "parsing" || s.status === "pending",
      ).length,
      failed: sources.filter((s) => s.status === "failed").length,
      pending: sources.filter((s) => s.status === "pending").length,
    };
  }, [run?.sources]);

  // Compute progress step index (0=queued, 1=parsing, 2=extracting, 3=complete)
  const progressStep = useMemo(() => {
    const step = run?.progress?.currentStep;
    const status = run?.status;
    if (status === "done" || step === "complete") return 3;
    if (status === "failed") return -1;
    if (step === "extracting" || status === "extracting") return 2;
    if (step === "parsing" || status === "parsing") return 1;
    return 0;
  }, [run?.progress?.currentStep, run?.status]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [run?.logs?.length]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "done":
        return "bg-green-400";
      case "failed":
        return "bg-red-500";
      case "parsing":
      case "extracting":
        return "bg-[#FFD700]";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "done":
        return "COMPLETED";
      case "failed":
        return "FAILED";
      case "parsing":
        return "PARSING";
      case "extracting":
        return "EXTRACTING";
      case "queued":
        return "QUEUED";
      default:
        return status?.toUpperCase() || "UNKNOWN";
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-400";
      case "warn":
        return "text-[#FFD700]";
      default:
        return "text-[#007AFF]";
    }
  };

  const getLogSourceColor = (source: string) => {
    switch (source) {
      case "parser":
        return "text-cyan-400";
      case "extractor":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const handleRetry = async () => {
    try {
      await retryMutation.mutateAsync({ id });
      toast.success("Run restarted successfully");
      queryClient.invalidateQueries({
        queryKey: getRunsControllerFindAllQueryKey(),
      });
    } catch {
      toast.error("Failed to retry run");
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-6xl animate-spin">
              progress_activity
            </span>
            <p className="text-xl font-bold">Loading run details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !run) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-6xl text-red-500">
              error
            </span>
            <p className="text-xl font-bold text-red-500">
              Failed to load run details
            </p>
            <Link to="/runs">
              <Button>Back to Runs</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const totalSources = run.sources?.length || 0;
  const completedPercent =
    totalSources > 0 ? Math.round((sourceStats.parsed / totalSources) * 100) : 0;
  const isProcessing =
    run.status === "parsing" ||
    run.status === "extracting" ||
    run.status === "queued";
  const failedSources = sourceStats.failed;

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-auto min-h-[80px] bg-gray-50 border-b-4 border-black p-6 flex flex-col md:flex-row items-start md:items-center justify-between shrink-0 gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
              <Link to="/runs" className="hover:underline hover:text-black">
                RUNS
              </Link>
              <span>/</span>
              <span className="text-black">RUN #{id}</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight">
              Run #{id.substring(0, 8)}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000000] rounded-full">
              <span className="material-symbols-outlined text-lg">layers</span>
              <span className="font-bold text-xs uppercase tracking-wide">
                {totalSources} Sources
              </span>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_#000000] rounded-full ${getStatusColor(
                run.status,
              )}`}
            >
              {isProcessing ? (
                <span className="w-3 h-3 bg-black rounded-full animate-pulse"></span>
              ) : null}
              <span className="font-bold text-xs uppercase tracking-wide">
                {getStatusLabel(run.status)}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-8 pb-12">
            <div className="flex-1 flex flex-col gap-8">
              {/* Unified Monitor Section */}
              <section className="flex flex-col gap-4">
                <div className="flex items-end justify-between">
                  <h3 className="text-xl font-black uppercase flex items-center gap-2 tracking-tighter">
                    <span className="material-symbols-outlined font-black">
                      monitor_heart
                    </span>
                    Unified Extraction Monitor
                  </h3>
                  <span className="text-xs font-black bg-black text-white px-2 py-1 rounded-sm uppercase tracking-widest">
                    {run.progress?.currentStep || run.status}
                  </span>
                </div>
                {/* Progress Card */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] p-6 rounded-sm flex flex-col gap-6">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-500">
                    <span
                      className={
                        progressStep >= 1
                          ? "text-[#007AFF]"
                          : "text-gray-400"
                      }
                    >
                      01. Parsing ({run.progress?.parsed || 0}/
                      {run.progress?.total || totalSources})
                    </span>
                    <span
                      className={
                        progressStep >= 2
                          ? "text-[#7A00FF]"
                          : "text-gray-400"
                      }
                    >
                      02. Extracting
                    </span>
                    <span
                      className={
                        progressStep >= 3
                          ? "text-green-600"
                          : "text-gray-400"
                      }
                    >
                      03. Complete
                    </span>
                  </div>
                  {/* Segmented Bar */}
                  <div className="w-full h-8 border-2 border-black bg-gray-100 flex rounded-sm overflow-hidden relative">
                    {/* Parsing segment */}
                    <div
                      className={`h-full w-1/3 border-r-2 border-black flex items-center justify-center relative ${
                        progressStep >= 1
                          ? "bg-[#007AFF]"
                          : progressStep === 0 && isProcessing
                            ? "bg-[#007AFF] opacity-50"
                            : "bg-gray-200"
                      }`}
                    >
                      {progressStep > 1 ? (
                        <span className="material-symbols-outlined text-white text-sm font-black">
                          check
                        </span>
                      ) : progressStep === 1 ? (
                        <div className="relative flex items-center justify-center w-full h-full">
                          <div
                            className="absolute inset-0 opacity-20 animate-pulse"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
                              backgroundSize: "10px 10px",
                            }}
                          ></div>
                          <span className="text-white font-black text-[10px] tracking-widest uppercase z-10">
                            Parsing
                          </span>
                        </div>
                      ) : null}
                    </div>
                    {/* Extracting segment */}
                    <div
                      className={`h-full w-1/3 border-r-2 border-black flex items-center justify-center relative ${
                        progressStep >= 2
                          ? "bg-[#7A00FF]"
                          : "bg-gray-200"
                      }`}
                    >
                      {progressStep > 2 ? (
                        <span className="material-symbols-outlined text-white text-sm font-black">
                          check
                        </span>
                      ) : progressStep === 2 ? (
                        <div className="relative flex items-center justify-center w-full h-full">
                          <div
                            className="absolute inset-0 opacity-20 animate-pulse"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
                              backgroundSize: "10px 10px",
                            }}
                          ></div>
                          <span className="text-white font-black text-[10px] tracking-widest uppercase z-10">
                            Extracting
                          </span>
                        </div>
                      ) : null}
                    </div>
                    {/* Complete segment */}
                    <div
                      className={`h-full w-1/3 flex items-center justify-center ${
                        progressStep >= 3
                          ? "bg-green-400"
                          : run.status === "failed"
                            ? "bg-red-400"
                            : "bg-gray-200"
                      }`}
                    >
                      {progressStep >= 3 ? (
                        <span className="material-symbols-outlined text-white text-sm font-black">
                          check
                        </span>
                      ) : run.status === "failed" ? (
                        <span className="material-symbols-outlined text-white text-sm font-black">
                          close
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {/* Status info bar */}
                  {run.status === "failed" && run.error ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 flex gap-4 items-start">
                      <span className="material-symbols-outlined text-red-500 mt-0.5">
                        error
                      </span>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight text-red-700">
                          Extraction Failed
                        </p>
                        <p className="text-xs mt-1 text-red-600 font-medium">
                          {run.error}
                        </p>
                      </div>
                    </div>
                  ) : run.status === "done" ? (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 flex gap-4 items-start">
                      <span className="material-symbols-outlined text-green-600 mt-0.5">
                        check_circle
                      </span>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight text-green-700">
                          Extraction Complete
                        </p>
                        <p className="text-xs mt-1 text-green-600 font-medium">
                          All documents processed and data extracted
                          successfully.
                          {run.finishedAt &&
                            run.startedAt &&
                            ` Duration: ${Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s`}
                        </p>
                      </div>
                    </div>
                  ) : isProcessing ? (
                    <div className="bg-blue-50 border-l-4 border-[#007AFF] p-4 flex gap-4 items-start">
                      <span className="material-symbols-outlined text-[#007AFF] mt-0.5">
                        info
                      </span>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">
                          {run.status === "parsing"
                            ? "Parsing Documents..."
                            : run.status === "extracting"
                              ? "Extracting Data..."
                              : "Queued for Processing..."}
                        </p>
                        <p className="text-xs mt-1 text-gray-600 font-medium">
                          {run.status === "parsing"
                            ? `Processing ${run.progress?.parsed || 0} of ${run.progress?.total || totalSources} documents through parsers.`
                            : run.status === "extracting"
                              ? "Running AI extraction on combined document content."
                              : "Waiting in queue for processing to begin."}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sources List */}
                <section className="flex flex-col gap-4">
                  <h3 className="text-lg font-black uppercase flex items-center gap-2 tracking-tighter">
                    <span className="material-symbols-outlined font-black">
                      folder_open
                    </span>
                    Active Sources
                  </h3>
                  <div className="flex flex-col gap-3">
                    {run.sources?.map((source: any, idx: number) => (
                      <div
                        key={source.id || idx}
                        className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] p-3 rounded-sm flex items-center justify-between group hover:translate-x-1 transition-transform"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`size-10 border-2 border-black rounded-sm flex items-center justify-center ${
                              source.type === "file"
                                ? "bg-red-50"
                                : "bg-blue-50"
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined ${
                                source.type === "file"
                                  ? "text-red-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {source.type === "file"
                                ? "picture_as_pdf"
                                : "link"}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-xs uppercase tracking-tight text-black">
                              {source.name}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {source.type === "file" ? "File" : "URL"} •{" "}
                              {source.status}
                              {source.tokenCount
                                ? ` • ${source.tokenCount.toLocaleString()} tokens`
                                : ""}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`size-8 border-2 border-black rounded-full flex items-center justify-center ${
                            source.status === "parsed"
                              ? "bg-green-400"
                              : source.status === "failed"
                                ? "bg-red-500"
                                : "bg-[#FFD700]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px] font-black text-black">
                            {source.status === "parsed"
                              ? "check"
                              : source.status === "failed"
                                ? "close"
                                : "progress_activity"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Logs */}
                <section className="flex flex-col gap-4">
                  <h3 className="text-lg font-black uppercase flex items-center gap-2 tracking-tighter">
                    <span className="material-symbols-outlined font-black">
                      terminal
                    </span>
                    Run Logs
                  </h3>
                  <div className="bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] rounded-sm overflow-hidden flex flex-col h-full min-h-[300px]">
                    <div className="bg-gray-800 border-b-2 border-black p-2 flex items-center justify-between px-4">
                      <span className="text-[10px] font-mono text-[#00FF99] font-black uppercase tracking-widest">
                        LIVE_LOG ({run.logs?.length || 0} entries)
                      </span>
                      <span className="material-symbols-outlined text-sm text-gray-400">
                        terminal
                      </span>
                    </div>
                    <div className="p-4 font-mono text-[11px] leading-relaxed overflow-y-auto font-medium max-h-[400px]">
                      {run.logs && run.logs.length > 0 ? (
                        run.logs.map((log: any, idx: number) => (
                          <p key={idx} className="mb-2">
                            <span className="text-gray-500">
                              [{new Date(log.timestamp).toLocaleTimeString()}]
                            </span>{" "}
                            <span
                              className={`font-black uppercase ${getLogSourceColor(log.source)}`}
                            >
                              [{log.source || "server"}]
                            </span>{" "}
                            <span
                              className={`font-black uppercase ${getLogLevelColor(log.level)}`}
                            >
                              [{log.level}]
                            </span>{" "}
                            <span className="text-white">{log.message}</span>
                          </p>
                        ))
                      ) : (
                        <p className="text-gray-500">
                          No log entries yet...
                        </p>
                      )}
                      {isProcessing && (
                        <p className="animate-pulse text-[#00FF99]">_</p>
                      )}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                </section>
              </div>

              {/* Results Section */}
              {run.status === "done" && run.results && (
                <section className="flex flex-col gap-4">
                  <h3 className="text-xl font-black uppercase flex items-center gap-2 tracking-tighter">
                    <span className="material-symbols-outlined font-black">
                      data_object
                    </span>
                    Extraction Results
                  </h3>
                  <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] rounded-sm overflow-hidden">
                    <div className="bg-gray-50 border-b-2 border-black p-3 px-4 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-gray-600">
                        JSON Output
                      </span>
                      <button
                        className="text-xs font-bold uppercase tracking-wide text-[#007AFF] hover:underline"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(run.results, null, 2),
                          );
                          toast.success("Copied to clipboard");
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono overflow-x-auto max-h-[500px] overflow-y-auto whitespace-pre-wrap">
                      {JSON.stringify(run.results, null, 2)}
                    </pre>
                  </div>
                </section>
              )}

              {/* Error Section */}
              {run.status === "failed" && run.error && (
                <section className="flex flex-col gap-4">
                  <h3 className="text-xl font-black uppercase flex items-center gap-2 tracking-tighter text-red-600">
                    <span className="material-symbols-outlined font-black">
                      error
                    </span>
                    Error Details
                  </h3>
                  <div className="bg-red-50 border-2 border-red-300 shadow-[4px_4px_0px_0px_#FF4d4d] p-6 rounded-sm">
                    <p className="font-mono text-sm text-red-700">
                      {run.error}
                    </p>
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar Stats */}
            <aside className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
              <h3 className="text-lg font-black uppercase border-b-4 border-black pb-2 tracking-tighter">
                Job Statistics
              </h3>
              <div className="flex flex-col gap-4">
                {/* Completed */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] p-4 rounded-sm relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-gray-500 uppercase tracking-widest">
                      Completed
                    </span>
                    <span className="material-symbols-outlined text-[#00FF99] font-black">
                      check_circle
                    </span>
                  </div>
                  <div className="mt-2 text-4xl font-black italic tracking-tighter">
                    {sourceStats.parsed}
                  </div>
                  <div className="w-full bg-gray-100 h-2 mt-3 border-2 border-black rounded-full overflow-hidden">
                    <div
                      className="bg-[#00FF99] h-full transition-all duration-500"
                      style={{ width: `${completedPercent}%` }}
                    ></div>
                  </div>
                </div>
                {/* In Progress */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] p-4 rounded-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-gray-500 uppercase tracking-widest">
                      Processing
                    </span>
                    <span className="material-symbols-outlined text-[#FFD700]">
                      hourglass_top
                    </span>
                  </div>
                  <div className="mt-2 text-4xl font-black italic tracking-tighter">
                    {sourceStats.parsing}
                  </div>
                </div>
                {/* Failed */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] p-4 rounded-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-gray-500 uppercase tracking-widest">
                      Failed
                    </span>
                    <span className="material-symbols-outlined text-red-500">
                      warning
                    </span>
                  </div>
                  <div className="mt-2 text-4xl font-black italic tracking-tighter text-red-500">
                    {sourceStats.failed}
                  </div>
                </div>
              </div>

              {/* Needs Review Badge - only show when there are failed sources or status is review */}
              {(failedSources > 0 || run.status === "review") && (
                <div className="bg-[#FF6B00] border-2 border-black shadow-[4px_4px_0px_0px_#000000] p-4 flex items-center justify-between cursor-pointer hover:bg-[#e66000] transition-colors rounded-sm">
                  <div className="flex flex-col text-white drop-shadow-md">
                    <span className="font-black text-xl italic tracking-tighter leading-none">
                      {failedSources} ISSUE{failedSources !== 1 ? "S" : ""}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest mt-1">
                      Needs Review
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">
                    rate_review
                  </span>
                </div>
              )}

              {/* Metrics */}
              {run.metrics && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 border-b-2 border-gray-200 pb-2">
                    Token Usage
                  </h4>
                  {run.metrics.totalInputTokens != null && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-bold text-gray-600">
                        Input Tokens
                      </span>
                      <span className="font-black text-sm">
                        {run.metrics.totalInputTokens.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {run.metrics.totalOutputTokens != null && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-bold text-gray-600">
                        Output Tokens
                      </span>
                      <span className="font-black text-sm">
                        {run.metrics.totalOutputTokens.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 border-b-2 border-gray-200 pb-2">
                  Timing
                </h4>
                {run.startedAt && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs font-bold text-gray-600">
                      Started
                    </span>
                    <span className="font-bold text-xs">
                      {new Date(run.startedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {run.finishedAt && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs font-bold text-gray-600">
                      Finished
                    </span>
                    <span className="font-bold text-xs">
                      {new Date(run.finishedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {run.startedAt && run.finishedAt && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs font-bold text-gray-600">
                      Duration
                    </span>
                    <span className="font-black text-xs">
                      {Math.round(
                        (new Date(run.finishedAt).getTime() -
                          new Date(run.startedAt).getTime()) /
                          1000,
                      )}
                      s
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-auto flex flex-col gap-3">
                {run.status === "done" && (
                  <Link to="/runs/review/$id" params={{ id: run.id }}>
                    <button
                      className="bg-white hover:bg-gray-50 text-black w-full py-3 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_#000000] transition-all"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">
                        description
                      </span>
                      View Full Report
                    </button>
                  </Link>
                )}
                {(run.status === "failed" || run.status === "done") && (
                  <button
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 w-full py-3 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_#000000] transition-all"
                    type="button"
                    onClick={handleRetry}
                    disabled={retryMutation.isPending}
                  >
                    <span className="material-symbols-outlined text-sm">
                      replay
                    </span>
                    Retry Run
                  </button>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
