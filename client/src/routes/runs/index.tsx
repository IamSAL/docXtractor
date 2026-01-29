import { createFileRoute, Link } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'
import { Button } from '../../components/retroui/Button'
import { Card } from '../../components/retroui/Card'
import { Table } from '../../components/retroui/Table'
import { Badge } from '../../components/retroui/Badge'
import { Input } from '../../components/retroui/Input'
import { PageHeader } from '../../components/retroui/PageHeader'



export const Route = createFileRoute('/runs/')({
  component: RunsComponent,
})

function RunsComponent() {
  return (
    <AppLayout>
      <div className="flex flex-col h-full p-4 lg:p-12">
        {/* Section Header */}
        <PageHeader
          heading="Extraction Runs"
          description="Monitor and manage your AI extraction extractors with precision."
          breadcrumb="/ HOME / RUNS"
        >
          <Link to="/extractors/new">
            <Button className="gap-2 px-6 py-3 rounded-lg text-sm uppercase tracking-wide">
              <span className="material-symbols-outlined">add_circle</span>
              Run New Run
            </Button>
          </Link>
        </PageHeader>

        {/* Filter & Search Toolbar */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-end">
            <div className="flex w-full flex-col gap-1 md:max-w-xs">
              <label className="text-xs font-bold uppercase tracking-wider">Search</label>
              <Input
                className="w-full h-12 border-2 border-black bg-white px-4 py-2 font-display text-black shadow-[4px_4px_0px_0px_#000000] placeholder:text-gray-500 focus:outline-none focus:ring-0"
                placeholder="Search by Run ID..."
                type="text"
                icon="search"
              />
            </div>
            <div className="flex w-full flex-col gap-1 md:w-auto">
              <label className="text-xs font-bold uppercase tracking-wider">Extractor</label>
              <Button variant="outline" className="flex h-12 min-w-[160px] items-center justify-between border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-white">
                <span>All Extractors</span>
                <span className="material-symbols-outlined">expand_more</span>
              </Button>
            </div>
            <div className="flex w-full flex-col gap-1 md:w-auto">
              <label className="text-xs font-bold uppercase tracking-wider">Status</label>
              <Button variant="outline" className="flex h-12 min-w-[140px] items-center justify-between border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-white">
                <span>Any Status</span>
                <span className="material-symbols-outlined">expand_more</span>
              </Button>
            </div>
          </div>

        </div>


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
              {[
                { id: '8492-A', extractor: 'Invoice_Parser_v2', time: 'Oct 24, 14:30', status: 'Success', statusVariant: 'success', confidence: 'High', confVariant: 'default' },
                { id: '8492-B', extractor: 'Receipt_Scanner_Main', time: 'Oct 24, 14:15', status: 'Review', statusVariant: 'warning', confidence: 'Medium', confVariant: 'warning' },
                { id: '8491-X', extractor: 'Legal_Doc_Analyzer', time: 'Oct 24, 13:45', status: 'Failed', statusVariant: 'destructive', confidence: 'Low', confVariant: 'outline' },
                { id: '8490-C', extractor: 'Invoice_Parser_v2', time: 'Oct 24, 13:30', status: 'Success', statusVariant: 'success', confidence: 'High', confVariant: 'default' }
              ].map((run, i) => (
                <Table.Row key={i}>
                  <Table.Cell className="font-mono text-base font-bold underline decoration-2 underline-offset-2">
                    <Link to="/runs/$id" params={{ id: run.id }} className="no-underline text-black">#{run.id}</Link>
                  </Table.Cell>
                  <Table.Cell className="font-bold uppercase tracking-tight">{run.extractor}</Table.Cell>
                  <Table.Cell className="text-gray-500 font-bold">{run.time}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={run.statusVariant as any}>{run.status}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={run.confVariant as any} className="gap-2 px-3 py-1.5 min-w-[100px] justify-center">
                      <span className="material-symbols-outlined text-[16px] font-black">verified</span>
                      {run.confidence}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link to="/runs/$id" params={{ id: run.id }} className="no-underline">
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
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card>
        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between pb-12">
          <p className="text-sm font-bold uppercase text-gray-500">Showing 1-4 of 248 runs</p>
          <div className="flex gap-4">
            <Button variant="outline" className="flex h-10 w-28 items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-gray-100 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Prev
            </Button>
            <Button variant="outline" className="flex h-10 w-28 items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-gray-100 active:translate-x-1 active:translate-y-1 active:shadow-none">
              Next
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
