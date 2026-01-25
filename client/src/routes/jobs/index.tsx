import { createFileRoute, Link } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'
import { Button } from '@/components/retroui/Button'
import { Card } from '@/components/retroui/Card'
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/retroui/Table'
import { Badge } from '@/components/retroui/Badge'


export const Route = createFileRoute('/jobs/')({
  component: JobsComponent,
})

function JobsComponent() {
  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Section Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-500 font-mono text-sm tracking-widest uppercase">/ HOME / JOBS</span>
            </div>
            <h2 className="text-5xl font-extrabold tracking-tight text-black mb-1">
              Extraction Jobs

            </h2>
            <p className="text-black font-medium opacity-70 mt-3">
              Monitor and manage your AI extraction pipelines with precision.
            </p>
          </div>
          <Link
            to="/pipelines/new"

          >
            <button className="neobrutal-btn flex items-center gap-2 px-6 py-3 rounded-lg text-sm uppercase tracking-wide">
              <span className="material-symbols-outlined">add_circle</span>
              Run New Job
            </button>
          </Link>
        </header>

        {/* Filter & Search Toolbar */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-end">
            <div className="flex w-full flex-col gap-1 md:max-w-xs">
              <label className="text-xs font-bold uppercase tracking-wider">Search</label>
              <div className="relative">
                <input className="w-full border-2 border-black bg-white px-4 py-2 font-display text-black shadow-[4px_4px_0px_0px_#000000] placeholder:text-gray-500 focus:outline-none h-12" placeholder="Search by Job ID..." type="text" />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-black">search</span>
              </div>
            </div>
            <div className="flex w-full flex-col gap-1 md:w-auto">
              <label className="text-xs font-bold uppercase tracking-wider">Pipeline</label>
              <button className="flex h-12 min-w-[160px] items-center justify-between border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none">
                <span>All Pipelines</span>
                <span className="material-symbols-outlined">expand_more</span>
              </button>
            </div>
            <div className="flex w-full flex-col gap-1 md:w-auto">
              <label className="text-xs font-bold uppercase tracking-wider">Status</label>
              <button className="flex h-12 min-w-[140px] items-center justify-between border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none">
                <span>Any Status</span>
                <span className="material-symbols-outlined">expand_more</span>
              </button>
            </div>
          </div>

        </div>

        {/* Table Section */}
        <Card shadowsize="md" className="p-0 border-2 overflow-hidden w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { id: '8492-A', pipeline: 'Invoice_Parser_v2', time: 'Oct 24, 14:30', status: 'Success', statusVariant: 'success', confidence: 'High', confVariant: 'default' },
                { id: '8492-B', pipeline: 'Receipt_Scanner_Main', time: 'Oct 24, 14:15', status: 'Review', statusVariant: 'warning', confidence: 'Medium', confVariant: 'warning' },
                { id: '8491-X', pipeline: 'Legal_Doc_Analyzer', time: 'Oct 24, 13:45', status: 'Failed', statusVariant: 'destructive', confidence: 'Low', confVariant: 'outline' },
                { id: '8490-C', pipeline: 'Invoice_Parser_v2', time: 'Oct 24, 13:30', status: 'Success', statusVariant: 'success', confidence: 'High', confVariant: 'default' }
              ].map((job, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-base font-bold underline decoration-2 underline-offset-2">
                    <Link to="/jobs/$id" params={{ id: job.id }} className="no-underline text-black">#{job.id}</Link>
                  </TableCell>
                  <TableCell className="font-bold uppercase tracking-tight">{job.pipeline}</TableCell>
                  <TableCell className="text-gray-500 font-bold">{job.time}</TableCell>
                  <TableCell>
                    <Badge variant={job.statusVariant as any}>{job.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={job.confVariant as any} className="gap-2 px-3 py-1.5 min-w-[100px] justify-center">
                      <span className="material-symbols-outlined text-[16px] font-black">verified</span>
                      {job.confidence}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link to="/jobs/$id" params={{ id: job.id }} className="no-underline">
                        <Button variant="outline" size="icon" className="size-10 bg-white">
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </Button>
                      </Link>
                      <Button variant="outline" size="icon" className="size-10 bg-white" title="Retry">
                        <span className="material-symbols-outlined text-[20px]">replay</span>
                      </Button>
                      <Button variant="outline" size="icon" className="size-10 bg-white hover:bg-destructive hover:text-white" title="Delete">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between pb-12">
          <p className="text-sm font-bold uppercase text-gray-500">Showing 1-4 of 248 jobs</p>
          <div className="flex gap-4">
            <button className="flex h-10 w-28 items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-gray-100 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Prev
            </button>
            <button className="flex h-10 w-28 items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-gray-100 active:translate-x-1 active:translate-y-1 active:shadow-none">
              Next
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
