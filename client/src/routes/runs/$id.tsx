import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "../../components/AppLayout";
import { Button } from "../../components/retroui/Button";
import {
  useRunsControllerFindOne,
  getRunsControllerFindOneQueryKey,
} from "@/api/endpoints/runs/runs";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";

export const Route = createFileRoute("/runs/$id")({
  component: RunDetailComponent,
});

function RunDetailComponent() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useRunsControllerFindOne(id);
  const queryClient = useQueryClient();

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
          // If source not found (e.g. new source), you might want to add it, but here we assume it exists
          return { ...oldData, data: { ...run, sources } };
        },
      );
    };

    socket.on("run:updated", handleRunUpdated);
    socket.on("run:source:updated", handleSourceUpdated);

    return () => {
      socket.emit("leaveRun", { runId: id });
      socket.off("run:updated", handleRunUpdated);
      socket.off("run:source:updated", handleSourceUpdated);
    };
  }, [id, queryClient]);

  const run = (data as any)?.data;

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
                {run.sources?.length || 0} Sources
              </span>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_#000000] rounded-full ${getStatusColor(
                run.status,
              )}`}
            >
              {run.status === "parsing" || run.status === "extracting" ? (
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
                    {run.progress?.currentStep || "Processing"}
                  </span>
                </div>
                {/* Progress Card */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] p-6 rounded-sm flex flex-col gap-6">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-500">
                    <span className="text-[#007AFF]">01. Parsing</span>
                    <span className="text-[#7A00FF]">02. Combining</span>
                    <span className="text-gray-400">03. Extracting</span>
                  </div>
                  {/* Segmented Bar */}
                  <div className="w-full h-8 border-2 border-black bg-gray-100 flex rounded-sm overflow-hidden relative">
                    <div className="h-full bg-[#007AFF] w-1/3 border-r-2 border-black flex items-center justify-center relative group">
                      <span className="material-symbols-outlined text-white text-sm font-black">
                        check
                      </span>
                    </div>
                    <div className="h-full bg-[#7A00FF] w-1/3 border-r-2 border-black relative overflow-hidden">
                      <div
                        className="absolute inset-0 opacity-20 animate-pulse"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
                          backgroundSize: "10px 10px",
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-black text-[10px] tracking-widest uppercase">
                          Processing
                        </span>
                      </div>
                    </div>
                    <div className="h-full bg-gray-200 w-1/3"></div>
                  </div>
                  <div className="bg-blue-50 border-l-4 border-[#007AFF] p-4 flex gap-4 items-start">
                    <span className="material-symbols-outlined text-[#007AFF] mt-0.5">
                      info
                    </span>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">
                        Combining Context...
                      </p>
                      <p className="text-xs mt-1 text-gray-600 font-medium">
                        Currently merging text streams from PDF parsers and URL
                        scrapers into a unified context window for the LLM.
                      </p>
                    </div>
                  </div>
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

                {/* Context Preview */}
                <section className="flex flex-col gap-4">
                  <h3 className="text-lg font-black uppercase flex items-center gap-2 tracking-tighter">
                    <span className="material-symbols-outlined font-black">
                      visibility
                    </span>
                    Context Preview
                  </h3>
                  <div className="bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] rounded-sm overflow-hidden flex flex-col h-full min-h-[300px]">
                    <div className="bg-gray-800 border-b-2 border-black p-2 flex items-center justify-between px-4">
                      <span className="text-[10px] font-mono text-[#00FF99] font-black uppercase tracking-widest">
                        LIVE_STREAM_LOG
                      </span>
                      <span className="material-symbols-outlined text-sm text-gray-400">
                        terminal
                      </span>
                    </div>
                    <div className="p-4 font-mono text-[11px] leading-relaxed overflow-y-auto font-medium">
                      <p className="text-gray-500 mb-2">
                        // Stream merging started...
                      </p>
                      <p className="mb-2">
                        <span className="text-[#007AFF]">
                          [Source: invoice_2024_Q3.pdf]
                        </span>{" "}
                        <span className="text-white">
                          Detected Total Amount: $4,500.00 USD. Vendor Address:
                          123 Innovation Dr, Tech City. Line Items detected: 4.
                        </span>
                      </p>
                      <p className="mb-2">
                        <span className="text-[#FFD700]">
                          [Source: linkedin.com]
                        </span>{" "}
                        <span className="text-white">
                          Company Size: 51-200 employees. Headquarters: San
                          Francisco, CA. Recent post mentions "Quarterly
                          Growth".
                        </span>
                      </p>
                      <p className="mb-2">
                        <span className="text-[#7A00FF]">[System]</span>{" "}
                        <span className="text-white">
                          Correlating Vendor Address with HQ location... Match
                          confidence 85%.
                        </span>
                      </p>
                      <p className="animate-pulse text-[#00FF99]">_</p>
                    </div>
                  </div>
                </section>
              </div>
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
                    4
                  </div>
                  <div className="w-full bg-gray-100 h-2 mt-3 border-2 border-black rounded-full overflow-hidden">
                    <div className="bg-[#00FF99] h-full w-[66%]"></div>
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
                    1
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
                    1
                  </div>
                </div>
              </div>

              {/* Needs Review Badge */}
              <div className="bg-[#FF6B00] border-2 border-black shadow-[4px_4px_0px_0px_#000000] p-4 flex items-center justify-between cursor-pointer hover:bg-[#e66000] transition-colors rounded-sm">
                <div className="flex flex-col text-white drop-shadow-md">
                  <span className="font-black text-xl italic tracking-tighter leading-none">
                    1 ISSUE
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest mt-1">
                    Needs Review
                  </span>
                </div>
                <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">
                  rate_review
                </span>
              </div>

              <div className="mt-auto flex flex-col gap-3">
                <button
                  className="bg-white hover:bg-gray-50 text-black w-full py-3 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_#000000] transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">
                    description
                  </span>
                  View Full Report
                </button>
                <button
                  className="bg-red-50 hover:bg-red-100 text-red-700 w-full py-3 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_#000000] transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">
                    cancel
                  </span>
                  Cancel Job
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
