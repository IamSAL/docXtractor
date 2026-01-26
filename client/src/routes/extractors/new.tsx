import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { Textarea } from '@/components/retroui/Textarea'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { Tooltip, TooltipProvider } from '@/components/retroui/Tooltip'
import { useState } from 'react'
import SchemaVisualEditor from '@/components/jsonjoy/components/SchemaEditor/SchemaVisualEditor'
import '@/components/jsonjoy/index.css'
import { FewShotExamples } from '@/components/extractors/FewShotExamples'
import { ExtractionSettings } from '@/components/extractors/ExtractionSettings'
import { useForm, Controller } from 'react-hook-form'
import type { ExtractorFormData } from '@/types/extractor'
import { defaultExtractorFormValues } from '@/types/extractor'
import { createExtractor, testExtractor } from '@/api/extractors'
import { toast } from 'sonner'

export const Route = createFileRoute('/extractors/new')({
    component: NewExtractorComponent,
})

function NewExtractorComponent() {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isTesting, setIsTesting] = useState(false)

    // Initialize React Hook Form with default values
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isDirty },
    } = useForm<ExtractorFormData>({
        defaultValues: defaultExtractorFormValues,
    })

    // Watch schema and fewShotExamples for the visual editors
    const schema = watch('schema')
    const fewShotExamples = watch('fewShotExamples')

    // Form submission handler
    const onSubmit = async (data: ExtractorFormData) => {
        setIsSubmitting(true)
        try {
            const response = await createExtractor(data)
            toast.success('Extractor created successfully!', {
                description: `Extractor ID: ${response.id}`,
                duration: 5000,
            })
            console.log('✅ Form submitted successfully:', response)
            // Navigate to extractors list or detail page
            // navigate({ to: '/extractors' })
        } catch (error) {
            toast.error('Failed to create extractor', {
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            })
            console.error('❌ Form submission error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Test run handler
    const handleTestRun = async () => {
        setIsTesting(true)
        try {
            const formData = watch()
            const result = await testExtractor(formData)
            toast.success('Test run completed!', {
                description: `Processing time: ${result.processingTime}s`,
                duration: 5000,
            })
            console.log('🧪 Test results:', result)
        } catch (error) {
            toast.error('Test run failed', {
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            })
            console.error('❌ Test run error:', error)
        } finally {
            setIsTesting(false)
        }
    }

    // Reset to default system prompt
    const handleResetPrompt = () => {
        setValue('systemPrompt', defaultExtractorFormValues.systemPrompt, { shouldDirty: true })
        toast.info('System prompt reset to default')
    }

    return (
        <AppLayout>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex-1 flex flex-col h-full overflow-hidden bg-background-light xdark:bg-background-dark relative"
            >
                <header className="sticky top-0 z-10 bg-background-light/95 xdark:bg-background-dark/95 backdrop-blur-sm border-b-2 border-border-light xdark:border-border-dark px-8 py-4.5 flex flex-col gap-4">
                    <div className="flex flex-wrap justify-between items-end gap-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-3xl font-black tracking-tight text-text-main-light xdark:text-white leading-none">
                                New Extractor
                            </h2>
                            <p className="text-sm text-text-secondary-light xdark:text-text-secondary-dark flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                Create a new extraction extractor
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="link"
                                className="text-text-secondary-light hover:text-red-500"
                                onClick={() => navigate({ to: '/extractors' })}
                            >
                                Cancel
                            </Button>
                            <TooltipProvider>
                                <Tooltip content="Test with a sample document" side="bottom">
                                    <Button
                                        type="button"
                                        className="bg-white"
                                        onClick={handleTestRun}
                                        disabled={isTesting}
                                    >
                                        <span className="material-symbols-outlined text-[18px] filled mr-2">
                                            {isTesting ? 'hourglass_empty' : 'play_arrow'}
                                        </span>
                                        {isTesting ? 'Testing...' : 'Test Run'}
                                    </Button>
                                </Tooltip>
                            </TooltipProvider>
                            <Button type="submit" disabled={isSubmitting}>
                                <span className="material-symbols-outlined text-[18px] filled mr-2">
                                    {isSubmitting ? 'hourglass_empty' : 'save'}
                                </span>
                                {isSubmitting ? 'Saving...' : 'Save Extractor'}
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-36 py-8 pb-24">
                    <div className="mx-auto flex flex-col gap-8">
                        <Accordion
                            type="multiple"
                            defaultValue={['basic', 'schema', 'advanced']}
                            className="flex flex-col gap-8"
                        >
                            {/* Basic Information Section */}
                            <AccordionItem
                                value="basic"
                                className="bg-white xdark:bg-surface-dark rounded-xl shadow-subtle border border-border-light xdark:border-border-dark overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <AccordionTrigger className="px-6 py-5 border-b border-border-light xdark:border-border-dark hover:bg-gray-50 transition-colors hover:no-underline text-lg">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">info</span>
                                        Basic Information
                                    </h3>
                                </AccordionTrigger>
                                <AccordionContent className="p-0">
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-text-main-light xdark:text-text-secondary-dark">
                                                Extractor Name
                                                <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <Controller
                                                name="name"
                                                control={control}
                                                rules={{ required: 'Extractor name is required' }}
                                                render={({ field }) => (
                                                    <>
                                                        <Input {...field} placeholder="e.g., Invoice Processor" />
                                                        {errors.name && (
                                                            <span className="text-xs text-red-500">{errors.name.message}</span>
                                                        )}
                                                    </>
                                                )}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-text-main-light xdark:text-text-secondary-dark">
                                                Document Type
                                            </label>
                                            <Controller
                                                name="documentType"
                                                control={control}
                                                render={({ field }) => (
                                                    <div className="relative">
                                                        <select
                                                            {...field}
                                                            className="w-full bg-white border-2 border-black rounded px-4 py-3 h-12 text-black font-medium placeholder-gray-500 focus:outline-none focus:ring-0 focus:bg-yellow-50 focus:border-black transition-all shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-hard focus:shadow-hard focus:-translate-x-0.5 focus:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                                        >
                                                            <option value="invoice">Invoice (PDF/Image)</option>
                                                            <option value="receipt">Receipt</option>
                                                            <option value="contract">Contract</option>
                                                            <option value="bank_statement">Bank Statement</option>
                                                        </select>
                                                    </div>
                                                )}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 md:col-span-2">
                                            <label className="text-sm font-semibold text-text-main-light xdark:text-text-secondary-dark">
                                                Description
                                            </label>
                                            <Controller
                                                name="description"
                                                control={control}
                                                render={({ field }) => (
                                                    <Textarea
                                                        {...field}
                                                        rows={2}
                                                        placeholder="Describe what this extractor extracts..."
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Field Schema Section */}
                            <SchemaVisualEditor
                                schema={schema}
                                onChange={(newSchema) => setValue('schema', newSchema, { shouldDirty: true })}
                                readOnly={false}
                            />

                            {/* Advanced Options Section */}
                            <AccordionItem
                                value="advanced"
                                className="bg-white xdark:bg-surface-dark rounded-xl shadow-subtle border border-border-light xdark:border-border-dark overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <AccordionTrigger className="px-6 py-5 border-b border-border-light xdark:border-border-dark hover:bg-gray-50 transition-colors hover:no-underline text-lg">
                                    <div className="flex flex-1 items-center justify-between mr-4">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">psychology</span>
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
                                                    onClick={handleResetPrompt}
                                                    className="text-xs text-primary hover:text-primary-dark font-medium"
                                                >
                                                    Reset to Default
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <Controller
                                                    name="systemPrompt"
                                                    control={control}
                                                    render={({ field }) => <Textarea {...field} rows={6} />}
                                                />
                                            </div>
                                        </div>
                                        <FewShotExamples
                                            examples={fewShotExamples}
                                            onChange={(newExamples) =>
                                                setValue('fewShotExamples', newExamples, { shouldDirty: true })
                                            }
                                        />

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
                                            <ExtractionSettings showHeader={false} control={control} />
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
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-accent-red hover:text-red-700 hover:bg-red-50"
                            >
                                <span className="material-symbols-outlined text-[18px] mr-1">delete</span>
                                Delete Extractor
                            </Button>
                        </div>
                        <div className="flex items-center gap-4">
                            {isDirty && (
                                <span className="text-xs text-text-secondary-light font-medium">
                                    Unsaved changes
                                </span>
                            )}
                            <Button type="submit" size="lg" className="shadow-neubrutalist" disabled={isSubmitting}>
                                <span className="material-symbols-outlined text-[20px] filled mr-2">
                                    {isSubmitting ? 'hourglass_empty' : 'save'}
                                </span>
                                {isSubmitting ? 'SAVING...' : 'SAVE EXTRACTOR'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    )
}
