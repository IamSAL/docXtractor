import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "../../components/AppLayout";
import { Button } from "../../components/retroui/Button";
import { Card } from "../../components/retroui/Card";
import { Table } from "../../components/retroui/Table";
import { Badge } from "../../components/retroui/Badge";
import { Input } from "../../components/retroui/Input";
import { PageHeader } from "../../components/retroui/PageHeader";
import { useState, useEffect } from "react";
import {
  useRunsControllerFindAll,
  useRunsControllerRemove,
  useRunsControllerRetry,
  getRunsControllerFindAllQueryKey,
} from "@/api/endpoints/runs/runs";
import { useExtractorsControllerFindAll } from "@/api/endpoints/extractors/extractors";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";

// Define search params schema
type RunsSearch = {
  extractorId?: string;
  status?: string;
};

export const Route = createFileRoute("/runs/")({
  component: RunsComponent,
  validateSearch: (search: Record<string, unknown>): RunsSearch => {
    return {
      extractorId: search.extractorId as string | undefined,
      status: search.status as string | undefined,
    };
  },
});

function RunsComponent() {
  const searchParams = Route.useSearch();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(searchParams.status);
  const [extractorId, setExtractorId] = useState<string | undefined>(
    searchParams.extractorId,
  );
  const [search, setSearch] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showExtractorDropdown, setShowExtractorDropdown] = useState(false);

  // Fetch extractors for filter dropdown
  const { data: extractorsData } = useExtractorsControllerFindAll();
  const extractors = extractorsData?.data || [];

  // Update state when URL params change
  useEffect(() => {
    if (searchParams.extractorId) setExtractorId(searchParams.extractorId);
    if (searchParams.status) setStatus(searchParams.status);
  }, [searchParams.extractorId, searchParams.status]);

  // WebSocket: auto-refresh runs list on updates
  useEffect(() => {
    const socket = getSocket();

    socket.emit("joinRunsList");

    const handleRunsListUpdated = () => {
      queryClient.invalidateQueries({
        queryKey: getRunsControllerFindAllQueryKey(),
      });
    };

    socket.on("runs:list:updated", handleRunsListUpdated);

    return () => {
      socket.emit("leaveRunsList");
      socket.off("runs:list:updated", handleRunsListUpdated);
    };
  }, [queryClient]);

  const { data, isLoading, error } = useRunsControllerFindAll(
    {
      page,
      limit: 10,
      status: status as any,
      extractorId,
      search: search || undefined,
    },
    {
      query: {
        enabled: true,
      },
    },
  );

  const deleteMutation = useRunsControllerRemove();
  const retryMutation = useRunsControllerRetry();

  const runs = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / 10);
  const statusCounts = data?.data?.statusCounts || {
    done: 0,
    failed: 0,
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this run?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Run deleted successfully");
      await queryClient.invalidateQueries({
        queryKey: getRunsControllerFindAllQueryKey(),
      });
    } catch (err) {
      toast.error("Failed to delete run");
      console.error(err);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await retryMutation.mutateAsync({ id });
      toast.success("Run restarted successfully");
      await queryClient.invalidateQueries({
        queryKey: getRunsControllerFindAllQueryKey(),
      });
    } catch (err) {
      toast.error("Failed to retry run");
      console.error(err);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "done":
        return "success";
      case "failed":
        return "destructive";
      case "review":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full p-4 lg:p-12">
        {/* Section Header */}
        <PageHeader
          heading="Extraction Runs"
          description="Monitor and manage your AI extraction extractors with precision."
          breadcrumb="/ HOME / RUNS"
        >
          <Link to="/runs/new">
            <Button className="gap-2 px-6 py-3 rounded-lg text-sm uppercase tracking-wide">
              <span className="material-symbols-outlined">add_circle</span>
              New Run
            </Button>
          </Link>
        </PageHeader>

        {/* Filter & Search Toolbar */}
        <div className="mb-0 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-end">
            <div className="flex w-full flex-col gap-1 md:max-w-xs">
              <label className="text-xs font-bold uppercase tracking-wider">
                Search
              </label>
              <Input
                className="w-full h-12 border-2 border-black bg-white px-4 py-2 font-display text-black shadow-[4px_4px_0px_0px_#000000] placeholder:text-gray-500 focus:outline-none focus:ring-0"
                placeholder="Search by Run ID..."
                type="text"
                icon="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex w-full flex-col gap-1 md:w-auto relative">
              <label className="text-xs font-bold uppercase tracking-wider">
                Extractor
              </label>
              <Button
                variant="outline"
                className="flex h-12 min-w-[160px] items-center justify-between border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-white"
                onClick={() => setShowExtractorDropdown(!showExtractorDropdown)}
              >
                <span>
                  {extractorId
                    ? extractors.find((e: any) => e.id === extractorId)?.name ||
                      "All Extractors"
                    : "All Extractors"}
                </span>
                <span className="material-symbols-outlined">expand_more</span>
              </Button>
              {showExtractorDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] z-10 max-h-60 overflow-y-auto">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-primary transition-colors font-bold"
                    onClick={() => {
                      setExtractorId(undefined);
                      setShowExtractorDropdown(false);
                    }}
                  >
                    All Extractors
                  </button>
                  {extractors.map((extractor: any) => (
                    <button
                      key={extractor.id}
                      className="w-full px-4 py-2 text-left hover:bg-primary transition-colors font-bold"
                      onClick={() => {
                        setExtractorId(extractor.id);
                        setShowExtractorDropdown(false);
                      }}
                    >
                      {extractor.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex w-full flex-col gap-1 md:w-auto relative">
              <label className="text-xs font-bold uppercase tracking-wider">
                Status
              </label>
              <Button
                variant="outline"
                className="flex h-12 min-w-[140px] items-center justify-between border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-white"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <span>{status || "Any Status"}</span>
                <span className="material-symbols-outlined">expand_more</span>
              </Button>
              {showStatusDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] z-10">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-primary transition-colors font-bold"
                    onClick={() => {
                      setStatus(undefined);
                      setShowStatusDropdown(false);
                    }}
                  >
                    Any Status
                  </button>
                  {["done", "failed", "processing", "review"].map((s) => (
                    <button
                      key={s}
                      className="w-full px-4 py-2 text-left hover:bg-primary transition-colors font-bold uppercase"
                      onClick={() => {
                        setStatus(s);
                        setShowStatusDropdown(false);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 rounded-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-black font-bold uppercase tracking-wide text-sm">
                Total Runs
              </p>
              <span className="material-symbols-outlined text-3xl opacity-20 group-hover:opacity-100 transition-opacity">
                history
              </span>
            </div>
            <p className="text-4xl font-black tracking-tight">
              {total.toLocaleString()}
            </p>
          </div>
          <div className="bg-primary border-2 border-black p-6 shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 rounded-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-black font-bold uppercase tracking-wide text-sm">
                Successful
              </p>
              <span className="material-symbols-outlined text-3xl opacity-20 group-hover:opacity-100 transition-opacity">
                check_circle
              </span>
            </div>
            <p className="text-4xl font-black tracking-tight">
              {statusCounts.done.toLocaleString()}
            </p>
          </div>
          <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_#FF4d4d] flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 rounded-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-black font-bold uppercase tracking-wide text-sm text-red-500">
                Failed
              </p>
              <span className="material-symbols-outlined text-3xl text-red-500 opacity-20 group-hover:opacity-100 transition-opacity">
                warning
              </span>
            </div>
            <p className="text-4xl font-black tracking-tight text-red-500">
              {statusCounts.failed.toLocaleString()}
            </p>
          </div>
        </section>
        {/* Table Section */}
        <Card shadowsize="md" className="p-0 border-2 overflow-hidden w-full">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Run ID</Table.Head>
                <Table.Head>Extractor</Table.Head>
                <Table.Head>Timestamp</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Confidence</Table.Head>
                <Table.Head className="text-right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                <Table.Row>
                  <Table.Cell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin">
                        progress_activity
                      </span>
                      <span>Loading runs...</span>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : error ? (
                <Table.Row>
                  <Table.Cell
                    colSpan={6}
                    className="text-center py-8 text-red-500"
                  >
                    Error loading runs. Please try again.
                  </Table.Cell>
                </Table.Row>
              ) : runs.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6} className="text-center py-8">
                    No runs found. Create your first run to get started!
                  </Table.Cell>
                </Table.Row>
              ) : (
                runs.map((run: any) => (
                  <Table.Row key={run.id}>
                    <Table.Cell className="font-mono text-base font-bold underline decoration-2 underline-offset-2">
                      <Link
                        to="/runs/$id"
                        params={{ id: run.id }}
                        className="no-underline text-black"
                      >
                        #{run.id.substring(0, 8)}
                      </Link>
                    </Table.Cell>
                    <Table.Cell className="font-bold uppercase tracking-tight">
                      {run.extractor?.name || "Unknown"}
                    </Table.Cell>
                    <Table.Cell className="text-gray-500 font-bold">
                      {new Date(run.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={getStatusVariant(run.status)}>
                        {run.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        variant={run.confidence > 0.8 ? "default" : "warning"}
                        className="gap-2 px-3 py-1.5 min-w-[100px] justify-center"
                      >
                        <span className="material-symbols-outlined text-[16px] font-black">
                          verified
                        </span>
                        {run.confidence
                          ? `${Math.round(run.confidence * 100)}%`
                          : "N/A"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to="/runs/$id"
                          params={{ id: run.id }}
                          className="no-underline"
                        >
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-10 bg-white"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              visibility
                            </span>
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-10 bg-white"
                          title="Retry"
                          onClick={() => handleRetry(run.id)}
                          disabled={retryMutation.isPending}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            replay
                          </span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-10 bg-white hover:bg-destructive hover:text-white"
                          title="Delete"
                          onClick={() => handleDelete(run.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            delete
                          </span>
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </Card>
        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between pb-12">
          <p className="text-sm font-bold uppercase text-gray-500">
            Showing {runs.length > 0 ? (page - 1) * 10 + 1 : 0}-
            {Math.min(page * 10, total)} of {total} runs
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex h-10 w-28 items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-gray-100 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <span className="material-symbols-outlined text-sm">
                arrow_back
              </span>
              Prev
            </Button>
            <Button
              variant="outline"
              className="flex h-10 w-28 items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-gray-100 active:translate-x-1 active:translate-y-1 active:shadow-none"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
            >
              Next
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
