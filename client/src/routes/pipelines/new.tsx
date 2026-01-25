import { createFileRoute, Link } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'
import { Button } from '@/components/retroui/Button'
import { PageHeader } from '@/components/retroui/PageHeader'
import { Input } from "@/components/retroui/Input"
import { Textarea } from "@/components/retroui/Textarea"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/retroui/Tabs"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Tooltip, TooltipProvider } from "@/components/retroui/Tooltip"
import { useState } from 'react'
import SchemaVisualEditor from '@/components/jsonjoy/components/SchemaEditor/SchemaVisualEditor'
import type { JSONSchema } from '@/components/jsonjoy/types/jsonSchema'
import '@/components/jsonjoy/index.css'


export const Route = createFileRoute('/pipelines/new')({
    component: NewPipelineComponent,
})

function NewPipelineComponent() {
    // Initial data based on current file + user request
    const [jsonSchema, setJsonSchema] = useState<JSONSchema>({
        type: 'object',
        properties: {
            "Vendor Name": {
                type: "string",
                description: "The name of the vendor"
            },
            "Total Amount": {
                type: "number",
                description: "The total amount of the invoice"
            },
            "Invoice Date": {
                type: "string",
                format: "date",
                description: "The date of the invoice"
            }
        },
        required: ["Vendor Name", "Total Amount"]
    });


    return (
        <AppLayout>
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light xdark:bg-background-dark relative">

                <header className="sticky top-0 z-10 bg-background-light/95 xdark:bg-background-dark/95 backdrop-blur-sm border-b-2 border-border-light xdark:border-border-dark px-8 py-4.5 flex flex-col gap-4">

                    <div className="flex flex-wrap justify-between items-end gap-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-3xl font-black tracking-tight text-text-main-light xdark:text-white leading-none">
                                Invoice Extraction Pipeline v2
                            </h2>
                            <p className="text-sm text-text-secondary-light xdark:text-text-secondary-dark flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                Last edited 2 mins ago
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="link" className="text-text-secondary-light hover:text-red-500">
                                Cancel
                            </Button>
                            <TooltipProvider>
                                <Tooltip content="Test with a sample document">
                                    <Button className="bg-white">
                                        <span className="material-symbols-outlined text-[18px] filled mr-2">
                                            play_arrow
                                        </span>
                                        Test Run
                                    </Button>
                                </Tooltip>
                            </TooltipProvider>
                            <Button className="bg-white">
                                <span className="material-symbols-outlined text-[18px] mr-2">
                                    content_copy
                                </span>
                                Duplicate
                            </Button>
                            <Button>
                                <span className="material-symbols-outlined text-[18px] filled mr-2">
                                    save
                                </span>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </header>


                <div className="flex-1 overflow-y-auto px-36 py-8 pb-24">
                    <div className=" mx-auto flex flex-col gap-8">
                        <Accordion type="multiple" defaultValue={['basic', 'schema', 'advanced']} className="flex flex-col gap-8">

                            {/* Basic Information Section */}
                            <AccordionItem value="basic" className="bg-white xdark:bg-surface-dark rounded-xl shadow-subtle border border-border-light xdark:border-border-dark overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <AccordionTrigger className="px-6 py-5 border-b border-border-light xdark:border-border-dark hover:bg-gray-50  transition-colors hover:no-underline text-lg">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">info</span>
                                        Basic Information
                                    </h3>
                                </AccordionTrigger>
                                <AccordionContent className="p-0">
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-text-main-light xdark:text-text-secondary-dark">
                                                Pipeline Name
                                            </label>
                                            <Input
                                                defaultValue="Standard Invoice Processor"
                                                placeholder="Pipeline Name"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-text-main-light xdark:text-text-secondary-dark">
                                                Document Type
                                            </label>
                                            <div className="relative">
                                                <select className="w-full bg-white border-2 border-black rounded px-4 py-3 h-12 text-black font-medium placeholder-gray-500 focus:outline-none focus:ring-0 focus:bg-yellow-50 focus:border-black transition-all shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-hard focus:shadow-hard focus:-translate-x-0.5 focus:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 appearance-none">
                                                    <option>Invoice (PDF/Image)</option>
                                                    <option>Receipt</option>
                                                    <option>Contract</option>
                                                    <option>Bank Statement</option>
                                                </select>

                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 md:col-span-2">
                                            <label className="text-sm font-semibold text-text-main-light xdark:text-text-secondary-dark">
                                                Description
                                            </label>
                                            <Textarea
                                                rows={2}
                                                defaultValue="Extracts total, date, vendor address, and line items from standard PDF invoices."
                                                placeholder="Description"
                                            />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Field Schema Section */}
                            <SchemaVisualEditor schema={jsonSchema} onChange={setJsonSchema} readOnly={false} />

                            {/* Advanced Options Section */}
                            <AccordionItem value="advanced" className="bg-white xdark:bg-surface-dark rounded-xl shadow-subtle border border-border-light xdark:border-border-dark overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <AccordionTrigger className="px-6 py-5 border-b border-border-light xdark:border-border-dark hover:bg-gray-50  transition-colors hover:no-underline text-lg">
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
                                                <button className="text-xs text-primary hover:text-primary-dark font-medium">
                                                    Reset to Default
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <Textarea
                                                    rows={6}
                                                    defaultValue="You are an expert accountant specializing in data extraction from financial documents. Your goal is to accurately identify and extract the Vendor Name, Total Amount, and Invoice Date from the provided invoice text. Ensure dates are formatted as YYYY-MM-DD and currency symbols are removed from the Total Amount. If a field is ambiguous, mark it as null."
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <label className="text-sm font-semibold text-text-main-light xdark:text-text-secondary-dark">
                                                Few-Shot Examples
                                            </label>

                                            <Accordion type="single" collapsible defaultValue="example1" className="flex flex-col gap-2">
                                                <AccordionItem value="example1" className="border-2 border-black rounded-lg overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                                    <AccordionTrigger className="px-6 py-4 font-bold hover:bg-yellow-50 hover:no-underline data-[state=open]:bg-yellow-50 data-[state=open]:border-b-2 data-[state=open]:border-black">Example 1: Standard Utility Bill</AccordionTrigger>
                                                    <AccordionContent className="p-0 bg-white">
                                                        <div className="p-4">
                                                            This is example 1 content.
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                                <AccordionItem value="example2" className="border-2 border-black rounded-lg overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                                    <AccordionTrigger className="px-6 py-4 font-bold hover:bg-yellow-50 hover:no-underline data-[state=open]:bg-yellow-50 data-[state=open]:border-b-2 data-[state=open]:border-black">Example 2: Restaurant Receipt</AccordionTrigger>
                                                    <AccordionContent className="p-0 bg-white">
                                                        <div className="p-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-xs font-bold text-text-secondary-light uppercase mb-2">
                                                                        Input Text
                                                                    </p>
                                                                    <div className="bg-background-light xdark:bg-background-dark p-3 rounded border border-border-light xdark:border-border-dark h-32 overflow-y-auto text-xs font-mono text-gray-600 xdark:text-gray-400">
                                                                        BURGER KING #4322
                                                                        <br />
                                                                        123 Main St
                                                                        <br />
                                                                        New York, NY 10001
                                                                        <br />
                                                                        <br />
                                                                        Order: 55
                                                                        <br />
                                                                        1 Whopper Meal $12.50
                                                                        <br />
                                                                        1 Coke Zero $2.50
                                                                        <br />
                                                                        <br />
                                                                        Total: $15.00
                                                                        <br />
                                                                        Date: 04/12/2023
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-text-secondary-light uppercase mb-2">
                                                                        Expected JSON Output
                                                                    </p>
                                                                    <div className="bg-background-light xdark:bg-background-dark p-3 rounded border border-border-light xdark:border-border-dark h-32 overflow-y-auto text-xs font-mono text-green-600 xdark:text-green-400">
                                                                        {"{"}
                                                                        <br />
                                                                        &nbsp;&nbsp;"vendor_name": "Burger King",
                                                                        <br />
                                                                        &nbsp;&nbsp;"total_amount": 15.00,
                                                                        <br />
                                                                        &nbsp;&nbsp;"invoice_date": "2023-04-12"
                                                                        <br />
                                                                        {"}"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>

                                            <div className="p-4 bg-background-light/30 xdark:bg-background-dark/30 border-t border-border-light xdark:border-border-dark flex justify-center">
                                                <button className="w-full py-2 border-2 border-dashed border-border-light xdark:border-border-dark rounded-lg text-text-secondary-light hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 font-semibold text-sm">
                                                    <span className="material-symbols-outlined">add</span> Add another
                                                    example
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>

                <div className="fixed bottom-0 left-64 right-0 bg-white xdark:bg-surface-dark border-t-2 border-black xdark:border-gray-600 p-4 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" className="text-accent-red hover:text-red-700 hover:bg-red-50">
                                <span className="material-symbols-outlined text-[18px] mr-1">delete</span>
                                Delete Pipeline
                            </Button>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-text-secondary-light font-medium">
                                Unsaved changes
                            </span>
                            <Button size="lg" className="shadow-neubrutalist">
                                <span className="material-symbols-outlined text-[20px] filled mr-2">
                                    save
                                </span>
                                SAVE PIPELINE
                            </Button>
                        </div>
                    </div>
                </div>

            </div>

        </AppLayout>
    )
}
