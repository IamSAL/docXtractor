import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "../../components/AppLayout";
import { Popover } from "../../components/retroui/Popover";
import { Button } from "../../components/retroui/Button";
import { Card } from "../../components/retroui/Card";
import { Badge } from "../../components/retroui/Badge";
import { Input } from "../../components/retroui/Input";
import { PageHeader } from "../../components/retroui/PageHeader";
import { useDashboardControllerGetStats } from "../../api/endpoints/dashboard/dashboard";
import { useExtractorsControllerFindAll } from "../../api/endpoints/extractors/extractors";
import { formatDistanceToNow, format } from "date-fns";
import { useLogout } from "../../hooks/useAuth";
import NiceModal from "@ebay/nice-modal-react";
import { TemplateWizardModal } from "@/components/modals/TemplateWizardModal";
import { RunExtractorModal } from "@/components/modals/RunExtractorModal";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: statsData, isLoading: statsLoading } =
    useDashboardControllerGetStats();
  const { data: extractorsData, isLoading: extractorsLoading } =
    useExtractorsControllerFindAll();

  const logout = useLogout();
  const stats = (statsData as any)?.data;
  const extractors = extractorsData?.data || [];

  const systemStats = stats?.systemStats || { ram: 0, cpu: 0, storage: 0 };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "done") {
      return (
        <Badge className="bg-green-200 text-green-900 border-green-900 shadow-none hover:shadow-none font-bold">
          Success
        </Badge>
      );
    } else if (statusLower === "failed") {
      return (
        <Badge className="bg-red-200 text-red-900 border-red-900 shadow-none hover:shadow-none font-bold">
          Failed
        </Badge>
      );
    } else if (
      statusLower === "parsing" ||
      statusLower === "extracting" ||
      statusLower === "queued"
    ) {
      return (
        <Badge className="bg-yellow-200 text-yellow-900 border-yellow-900 shadow-none hover:shadow-none flex items-center gap-1 font-bold">
          <span className="animate-spin material-symbols-outlined text-[10px]">
            progress_activity
          </span>
          Processing
        </Badge>
      );
    }
    return <Badge>{status}</Badge>;
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-12 ">
        <div className="mt-2 mb-8 md:hidden">
          <h2 className="text-3xl font-black text-black tracking-tight leading-tight mb-2">
            Hey there,
          </h2>
          <p className="text-gray-600 font-medium">
            Here's your extraction summary.
          </p>
        </div>

        {/* Desktop Header Section */}
        <PageHeader
          className="hidden md:flex mb-10"
          heading="Dashboard"
          description="Welcome back! Here is your extraction overview."
        >
          <div className="relative">
            <Popover>
              <Popover.Trigger asChild>
                <button className="flex items-center gap-3 bg-white border-2 border-black px-3 py-2 shadow-hard cursor-pointer hover:translate-x-px hover:translate-y-px hover:shadow-hard-sm transition-all w-64 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-gray-200 border-2 border-black overflow-hidden">
                      <img
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPRa7B_KjGMFnt-GCzDzmllIlNq0fMO_xCTH4d0fYwyc_IJKp07LtB5AGrmYPqvi9hQpkmohkTuz4ITA5l8veRzLJIst8FCZ6JPuEIUyzfNOVqVDJ1r8TExfdcEd0vCZU3M6S7whm5PgsSteLx_VGKtH5_JEgneb4f2k4FIayqvDPhFQOoV-YoAqES6kkjrTaU2jiPWONvx9Kpqh3dTRM214SvdixEShPXEKGqztGfTcplP7gJINAIrgZgR3n8KluuAr_zfjH5mcq8"
                      />
                    </div>
                    <span className="font-bold text-sm">Alex Designer</span>
                  </div>
                  <span className="material-symbols-outlined">expand_more</span>
                </button>
              </Popover.Trigger>
              <Popover.Content
                className="w-64 p-0 border-2 border-black shadow-hard rounded-none mt-2"
                align="end"
                sideOffset={0}
              >
                <div className="border-b-2 border-black bg-gray-50 p-4">
                  <p className="text-xs font-black uppercase mb-3">
                    System Status
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>RAM</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 border border-black rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${systemStats.ram}%` }}
                          ></div>
                        </div>
                        <span>{systemStats.ram}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>CPU</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 border border-black rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${systemStats.cpu}%` }}
                          ></div>
                        </div>
                        <span>{systemStats.cpu}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>SSD</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 border border-black rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 transition-all duration-500"
                            style={{ width: `${systemStats.storage}%` }}
                          ></div>
                        </div>
                        <span>{systemStats.storage}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2 flex flex-col gap-1 bg-white">
                  <Link to="/settings">
                    <button className="flex items-center gap-2 w-full text-left px-3 py-2 font-bold text-sm hover:bg-yellow-100 border border-transparent hover:border-black transition-all">
                      <span className="material-symbols-outlined text-[20px]">
                        settings
                      </span>
                      Settings
                    </button>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 font-bold text-sm bg-red-100 text-red-900 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all mt-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      logout
                    </span>
                    Log Out
                  </button>
                </div>
              </Popover.Content>
            </Popover>
          </div>
        </PageHeader>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          {/* Stat 1 */}
          <Card className="p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <p className="font-bold text-sm uppercase text-gray-600">
                Total Documents
              </p>
              <div className="p-1.5 bg-accent-teal/20 border-2 border-black rounded-md text-teal-800">
                <span className="material-symbols-outlined text-[20px]">
                  file_copy
                </span>
              </div>
            </div>
            <div>
              {statsLoading ? (
                <div className="h-10 w-24 bg-gray-200 animate-pulse rounded" />
              ) : (
                <h3 className="text-4xl font-black">
                  {stats?.totalDocuments?.toLocaleString() || 0}
                </h3>
              )}
              <p className="text-sm font-medium text-gray-500 mt-1">
                Processed
              </p>
            </div>
          </Card>
          {/* Stat 2 */}
          <Card className="p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <p className="font-bold text-sm uppercase text-gray-600">
                Active Extractors
              </p>
              <div className="p-1.5 bg-accent-purple/20 border-2 border-black rounded-md text-purple-800">
                <span className="material-symbols-outlined text-[20px]">
                  hub
                </span>
              </div>
            </div>
            <div>
              {statsLoading ? (
                <div className="h-10 w-16 bg-gray-200 animate-pulse rounded" />
              ) : (
                <h3 className="text-4xl font-black">
                  {stats?.activeExtractors || 0}
                </h3>
              )}
              <p className="text-sm font-medium text-gray-500 mt-1">
                Running smoothly
              </p>
            </div>
          </Card>
          {/* Stat 3 */}
          <Card className="p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <p className="font-bold text-sm uppercase text-gray-600">
                Pages Processed
              </p>
              <div className="p-1.5 bg-blue-100 border-2 border-black rounded-md text-blue-800">
                <span className="material-symbols-outlined text-[20px]">
                  layers
                </span>
              </div>
            </div>
            <div>
              {statsLoading ? (
                <div className="h-10 w-20 bg-gray-200 animate-pulse rounded" />
              ) : (
                <h3 className="text-4xl font-black">
                  {stats?.pagesProcessed?.toLocaleString() || 0}
                </h3>
              )}
              <p className="text-sm font-medium text-gray-500 mt-1">
                Lifetime usage
              </p>
            </div>
          </Card>
          {/* Stat 4 */}
          <Card className="p-6 flex flex-col justify-between h-40 bg-green-50">
            <div className="flex justify-between items-start">
              <p className="font-bold text-sm uppercase text-gray-600">
                Success Rate
              </p>
              <div className="p-1.5 bg-green-200 border-2 border-black rounded-md text-green-800">
                <span className="material-symbols-outlined text-[20px]">
                  check_circle
                </span>
              </div>
            </div>
            <div>
              {statsLoading ? (
                <div className="h-10 w-24 bg-gray-200 animate-pulse rounded" />
              ) : (
                <h3 className="text-4xl font-black text-green-700">
                  {stats?.successRate?.toFixed(1) || 0}%
                </h3>
              )}
              <p className="text-sm font-medium text-green-800 mt-1">
                {(stats?.successRate || 0) >= 90
                  ? "High accuracy"
                  : "Good performance"}
              </p>
            </div>
          </Card>
        </section>

        {/* Mobile Search Bar */}
        <div className="mb-8 relative group md:hidden">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <span className="material-symbols-outlined text-black">search</span>
          </div>
          <Input
            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black rounded-lg text-black placeholder-gray-500 font-medium focus:ring-0 focus:border-black shadow-none focus:shadow-hard transition-all h-auto"
            placeholder="Filter recent runs..."
            type="text"
          />
        </div>

        {/* Main Content Grid Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Left Column: Recent Extractors */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold border-b-4 border-primary inline-block pr-2">
                Recent Extractors
              </h3>
              <Link
                className="text-sm font-bold hover:underline flex items-center gap-1"
                to="/extractors"
              >
                View All{" "}
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {extractorsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card
                    key={i}
                    className="p-5 h-48 animate-pulse bg-gray-50 border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-gray-200 w-10 h-10 rounded border-2 border-gray-300" />
                      <div className="bg-gray-200 w-12 h-5 rounded border border-gray-300" />
                    </div>
                    <div className="bg-gray-200 h-6 w-3/4 rounded mb-2" />
                    <div className="bg-gray-200 h-4 w-1/2 rounded mb-4" />
                    <div className="border-t-2 border-dashed border-gray-200 my-3" />
                    <div className="bg-gray-200 h-4 w-1/3 rounded" />
                  </Card>
                ))
              ) : extractors.length === 0 ? (
                <Card className="p-5 flex flex-col items-center justify-center col-span-full h-48 text-center bg-gray-50/50 border-dashed border-2">
                  <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">
                    inventory_2
                  </span>
                  <p className="text-gray-500 font-bold">No extractors found</p>
                  <button
                    onClick={() => NiceModal.show(TemplateWizardModal)}
                    className="mt-2 text-primary hover:underline font-bold text-sm"
                  >
                    Create your first extractor
                  </button>
                </Card>
              ) : (
                extractors.slice(0, 3).map((extractor) => (
                  <Link
                    key={extractor.id}
                    to="/extractors/$id"
                    params={{ id: extractor.id }}
                    className="block"
                  >
                    <Card className="p-5 group cursor-pointer hover:-translate-y-[2px] hover:shadow-hard-lg transition-all h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-gray-100 p-2 rounded border-2 border-black">
                          <span className="material-symbols-outlined">
                            {extractor.thumbnailUrl
                              ? "branding_watermark"
                              : "receipt_long"}
                          </span>
                        </div>
                        <span className="bg-primary px-2 py-0.5 rounded text-xs font-bold border border-black">
                          v1.0
                        </span>
                      </div>
                      <h4 className="font-bold text-lg leading-tight mb-1 line-clamp-1">
                        {extractor.name}
                      </h4>
                      <p className="text-xs text-gray-500 font-mono mb-4 truncate">
                        ID: {extractor.id.split("-")[0].toUpperCase()}
                      </p>
                      <div className="border-t-2 border-dashed border-gray-300 my-3" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600">
                          Updated{" "}
                          {formatDistanceToNow(new Date(extractor.updatedAt))}{" "}
                          ago
                        </span>
                        <Button
                          size="icon"
                          variant="default"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            NiceModal.show(RunExtractorModal, {
                              extractorName: extractor.name,
                              extractorId: extractor.id,
                            });
                          }}
                          className="rounded-full border-2 border-black bg-white hover:bg-black hover:text-white text-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-10 h-10 p-0 flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-xl">
                            play_arrow
                          </span>
                        </Button>
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
          {/* Right Column: Recent Activity / Runs */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            <h3 className="text-2xl font-extrabold border-b-4 border-primary inline-block pr-2">
              Activity Feed
            </h3>
            <Card
              className="p-0 overflow-hidden flex-1 shadow-none border-none border-0"
              shadowsize="sm"
            >
              <div className="border-2 border-black rounded-lg overflow-hidden h-full flex flex-col">
                {/* List Header */}
                <div className="bg-primary/20 p-4 border-b-2 border-black flex items-center justify-between">
                  <span className="font-bold uppercase text-sm">
                    Latest Runs
                  </span>
                  <span className="material-symbols-outlined">history</span>
                </div>
                {/* List Items */}
                <div className="divide-y-2 divide-gray-100 bg-white">
                  {statsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="p-4 animate-pulse">
                        <div className="flex justify-between items-center mb-2">
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                          <div className="h-5 w-16 bg-gray-200 rounded" />
                        </div>
                        <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                        <div className="flex justify-between items-center">
                          <div className="h-3 w-16 bg-gray-200 rounded" />
                          <div className="h-3 w-20 bg-gray-200 rounded" />
                        </div>
                      </div>
                    ))
                  ) : stats?.recentRuns?.length > 0 ? (
                    stats.recentRuns.map((run: any) => (
                      <Link
                        key={run.id}
                        to="/runs/$id"
                        params={{ id: run.id }}
                        className="block hover:bg-gray-50 transition-colors"
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm">
                              #{run.id.substring(0, 8).toUpperCase()}
                            </span>
                            {getStatusBadge(run.status)}
                          </div>
                          <p className="text-sm text-gray-800 mb-1">
                            {run.extractorName}
                          </p>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>
                              {run.documentCount} Doc
                              {run.documentCount !== 1 ? "s" : ""}
                            </span>
                            <span>
                              {formatDistanceToNow(new Date(run.startedAt))} ago
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <span className="material-symbols-outlined text-4xl mb-2 block">
                        inbox
                      </span>
                      <p className="font-bold">No recent runs</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Full Width Runs Table Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-extrabold border-b-4 border-primary inline-block pr-2">
              Extraction History
            </h3>
            <div className="flex gap-2">
              <Link to="/runs">
                <Button
                  variant="outline"
                  className="bg-white hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all py-1 h-auto text-sm font-bold shadow-hard-sm"
                >
                  View All
                </Button>
              </Link>
            </div>
          </div>
          <Card
            className="p-0 overflow-hidden border-none shadow-none z-0"
            shadowsize="sm"
          >
            <div className="border-2 border-black rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-black">
                      <th className="p-4 font-bold text-sm uppercase tracking-wide border-r-2 border-black/10">
                        Run ID
                      </th>
                      <th className="p-4 font-bold text-sm uppercase tracking-wide border-r-2 border-black/10">
                        Extractor
                      </th>
                      <th className="p-4 font-bold text-sm uppercase tracking-wide border-r-2 border-black/10">
                        Date
                      </th>
                      <th className="p-4 font-bold text-sm uppercase tracking-wide border-r-2 border-black/10">
                        Documents
                      </th>
                      <th className="p-4 font-bold text-sm uppercase tracking-wide border-r-2 border-black/10">
                        Status
                      </th>
                      <th className="p-4 font-bold text-sm uppercase tracking-wide text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-100 bg-white">
                    {statsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-4">
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                          </td>
                          <td className="p-4">
                            <div className="h-4 w-32 bg-gray-200 rounded" />
                          </td>
                          <td className="p-4">
                            <div className="h-4 w-28 bg-gray-200 rounded" />
                          </td>
                          <td className="p-4">
                            <div className="h-4 w-8 bg-gray-200 rounded" />
                          </td>
                          <td className="p-4">
                            <div className="h-5 w-16 bg-gray-200 rounded" />
                          </td>
                          <td className="p-4">
                            <div className="h-8 w-8 bg-gray-200 rounded ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : stats?.extractionHistory?.length > 0 ? (
                      stats.extractionHistory.map((run: any) => (
                        <tr
                          key={run.id}
                          className="hover:bg-yellow-50 transition-colors group"
                        >
                          <td className="p-4 font-mono font-bold text-sm">
                            #{run.id.substring(0, 8).toUpperCase()}
                          </td>
                          <td className="p-4 font-medium text-sm">
                            {run.extractorName}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {format(
                              new Date(run.startedAt),
                              "MMM dd, yyyy hh:mm a",
                            )}
                          </td>
                          <td className="p-4 text-sm font-bold">
                            {run.documentCount}
                          </td>
                          <td className="p-4">{getStatusBadge(run.status)}</td>
                          <td className="p-4 text-right">
                            <Link to="/runs/$id" params={{ id: run.id }}>
                              <Button
                                size="icon"
                                variant="outline"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-black hover:bg-black hover:text-white p-1 rounded border-2 border-black w-8 h-8 shadow-none bg-transparent flex items-center justify-center"
                              >
                                <span className="material-symbols-outlined text-lg">
                                  visibility
                                </span>
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-gray-500"
                        >
                          <span className="material-symbols-outlined text-4xl mb-2 block">
                            inbox
                          </span>
                          <p className="font-bold">No extraction history</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </section>

        {/* Floating Action Button (Mobile) */}
        <Link to="/extractors/new">
          <Button className="fixed bottom-6 right-6 w-16 h-16 bg-primary rounded-full border-[3px] border-black shadow-hard flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30 group md:hidden p-0">
            <span className="material-symbols-outlined text-black text-4xl font-bold group-hover:rotate-90 transition-transform">
              add
            </span>
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
}
