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
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import {
    useFilesControllerConfirmFiles,
    useFilesControllerUploadFile,
} from '@/api/endpoints/files/files'
import { useNavigate } from '@tanstack/react-router'

interface ExtractorFormProps {
    initialData?: ExtractorFormData
    onSubmit: (data: ExtractorFormData) => Promise<void>
    isSubmitting: boolean
    title: string
    onDelete?: () => void
}

export function ExtractorForm({
    initialData,
    onSubmit: onFormSubmit,
    isSubmitting: isFormSubmitting,
    title,
    onDelete,
}: ExtractorFormProps) {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [isTesting] = useState(false)
    const [fileUrlToId, setFileUrlToId] = useState<Record<string, string>>({})
    const [isThumbnailUploading, setIsThumbnailUploading] = useState(false)

    const uploadFileMutation = useFilesControllerUploadFile()
    const confirmFilesMutation = useFilesControllerConfirmFiles()

    // Initialize React Hook Form with default values or initial data
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        getValues,
        formState: { errors, isDirty },
    } = useForm<ExtractorFormData>({
        defaultValues: initialData || defaultExtractorFormValues,
    })

    // Watch schema and fewShotExamples for the visual editors
    const schema = watch('schema')
    const fewShotExamples = watch('fewShotExamples')

    const handleUploadFile = async (file: File) => {
        if (!user?.id) throw new Error('User not authenticated')

        const result = await uploadFileMutation.mutateAsync({
            data: {
                file,
                userId: user.id,
            },
        })

        const successData = (result as any).data
        if (!successData?.url) {
            console.error('❌ Upload successful but no URL returned:', result)
            throw new Error('Upload failed: No URL returned')
        }

        setFileUrlToId((prev) => ({
            ...prev,
            [successData.url]: successData.id,
        }))

        return { url: successData.url, id: successData.id }
    }

    // Form submission handler
    const handleActualSubmit = async (data: ExtractorFormData) => {
        try {
            // 1. Identify all files that need to be confirmed
            const filesToConfirm: string[] = []

            // Check thumbnail
            if (data.thumbnailUrl && fileUrlToId[data.thumbnailUrl]) {
                filesToConfirm.push(fileUrlToId[data.thumbnailUrl])
            }

            // Check few-shot examples
            data.fewShotExamples.forEach((example) => {
                example.sources.forEach((source) => {
                    if (source.type === 'file' && source.content && fileUrlToId[source.content]) {
                        filesToConfirm.push(fileUrlToId[source.content])
                    }
                })
            })

            // 2. Confirm files if any
            if (filesToConfirm.length > 0 && user?.id) {
                await confirmFilesMutation.mutateAsync({
                    data: {
                        fileIds: filesToConfirm,
                        userId: user.id,
                    },
                })
            }

            // 3. Call the parent's onSubmit
            await onFormSubmit(data)
        } catch (error) {
            toast.error('Failed to save extractor', {
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            })
            console.error('❌ Form submission error:', error)
        }
    }

    // Reset to default system prompt
    const handleResetPrompt = () => {
        setValue('systemPrompt', defaultExtractorFormValues.systemPrompt, { shouldDirty: true })
        toast.info('System prompt reset to default')
    }

    const submit = handleSubmit(handleActualSubmit)

    return (
        <form
            // onSubmit={}
            className="flex-1 flex flex-col h-full overflow-hidden bg-background-light xdark:bg-background-dark relative"
        >
            <header className="sticky top-0 z-10 bg-background-light/95 xdark:bg-background-dark/95 backdrop-blur-sm border-b-2 border-border-light xdark:border-border-dark px-8 py-4.5 flex flex-col gap-4">
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-3xl font-black tracking-tight text-text-main-light xdark:text-white leading-none">
                            {title}
                        </h2>
                        <p className="text-sm text-text-secondary-light xdark:text-text-secondary-dark flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">
                                {initialData ? 'edit' : 'add_circle'}
                            </span>
                            {initialData ? 'Edit your extractor configuration' : 'Create a new extraction extractor'}
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
                                    // onClick={handleTestRun}
                                    disabled={isTesting}
                                >
                                    <span className="material-symbols-outlined text-[18px] filled mr-2">
                                        {isTesting ? 'hourglass_empty' : 'play_arrow'}
                                    </span>
                                    {isTesting ? 'Testing...' : 'Test Run'}
                                </Button>
                            </Tooltip>
                        </TooltipProvider>
                        <Button onClick={submit} disabled={isFormSubmitting}>
                            <span className="material-symbols-outlined text-[18px] filled mr-2">
                                {isFormSubmitting ? 'hourglass_empty' : 'save'}
                            </span>
                            {isFormSubmitting ? 'Saving...' : 'Save Extractor'}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-12 lg:px-36 py-8 pb-24">
                <div className="mx-auto flex flex-col gap-8">
                    <Accordion
                        type="multiple"
                        defaultValue={['basic', 'schema', 'advanced']}
                        className="flex flex-col gap-8"
                    >
                        {/* Basic Information Section */}
                        <AccordionItem
                            value="basic"
                            className="bg-white xdark:bg-surface-dark rounded-xl shadow-subtle border-border-light xdark:border-border-dark overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <AccordionTrigger className="px-6 py-5 border-b border-border-light xdark:border-border-dark hover:bg-gray-50 transition-colors hover:no-underline text-lg">
                                <h3 className="font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">
                                        info
                                    </span>
                                    Basic Information
                                </h3>
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                                <div className="p-6 grid grid-cols-1 gap-6">
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
                                                    <Input
                                                        {...field}
                                                        placeholder="e.g., Invoice Processor"
                                                    />
                                                    {errors.name && (
                                                        <span className="text-xs text-red-500">
                                                            {errors.name.message}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-text-main-light xdark:text-text-secondary-dark">
                                                Description
                                            </label>
                                            <Controller
                                                name="description"
                                                control={control}
                                                render={({ field }) => (
                                                    <Textarea
                                                        {...field}
                                                        className="h-32 resize-none"
                                                        placeholder="Describe what this extractor extracts..."
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-text-main-light xdark:text-text-secondary-dark">
                                                Thumbnail
                                            </label>
                                            <Controller
                                                name="thumbnailUrl"
                                                control={control}
                                                render={({ field }) => (
                                                    <div className="relative group">
                                                        <div
                                                            onClick={() =>
                                                                document
                                                                    .getElementById('thumbnail-upload')
                                                                    ?.click()
                                                            }
                                                            className="w-full h-32 border-2 border-black border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-yellow-50 transition-colors relative overflow-hidden"
                                                        >
                                                            {isThumbnailUploading ? (
                                                                <div className="flex flex-col items-center">
                                                                    <span className="material-symbols-outlined text-primary text-3xl animate-spin">
                                                                        sync
                                                                    </span>
                                                                    <span className="text-xs font-bold text-primary mt-1">
                                                                        UPLOADING...
                                                                    </span>
                                                                </div>
                                                            ) : field.value ? (
                                                                <>
                                                                    <img
                                                                        src={field.value}
                                                                        alt="Thumbnail preview"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                        <span className="text-white font-bold text-sm">
                                                                            Change Image
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="material-symbols-outlined text-gray-400 text-3xl mb-1">
                                                                        add_a_photo
                                                                    </span>
                                                                    <span className="text-xs font-bold text-gray-500 uppercase">
                                                                        Upload Thumbnail
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <input
                                                            id="thumbnail-upload"
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) {
                                                                    setIsThumbnailUploading(true)
                                                                    try {
                                                                        const result =
                                                                            await handleUploadFile(
                                                                                file
                                                                            )
                                                                        field.onChange(result.url)
                                                                    } catch (error) {
                                                                        toast.error(
                                                                            'Failed to upload thumbnail'
                                                                        )
                                                                    } finally {
                                                                        setIsThumbnailUploading(
                                                                            false
                                                                        )
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Field Schema Section */}
                        <SchemaVisualEditor
                            schema={schema}
                            onChange={(newSchema) =>
                                setValue('schema', newSchema, { shouldDirty: true })
                            }
                            readOnly={false}
                        />

                        {/* Advanced Options Section */}
                        <AccordionItem
                            value="advanced"
                            className="bg-white xdark:bg-surface-dark rounded-xl shadow-subtle border-border-light xdark:border-border-dark overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <AccordionTrigger className="px-6 py-5 border-b border-border-light xdark:border-border-dark hover:bg-gray-50 transition-colors hover:no-underline text-lg">
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
                                                render={({ field }) => (
                                                    <Textarea {...field} rows={6} />
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <FewShotExamples
                                        examples={fewShotExamples}
                                        onChange={(newExamples) => {
                                            if (typeof newExamples === 'function') {
                                                const current = getValues('fewShotExamples')
                                                setValue('fewShotExamples', newExamples(current), {
                                                    shouldDirty: true,
                                                })
                                            } else {
                                                setValue('fewShotExamples', newExamples, {
                                                    shouldDirty: true,
                                                })
                                            }
                                        }}
                                        onUploadFile={handleUploadFile}
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
                        {onDelete && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-accent-red hover:text-red-700 hover:bg-red-50"
                                onClick={onDelete}
                            >
                                <span className="material-symbols-outlined text-[18px] mr-1">
                                    delete
                                </span>
                                Delete Extractor
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {isDirty && (
                            <span className="text-xs text-text-secondary-light font-medium">
                                Unsaved changes
                            </span>
                        )}
                        <Button

                            size="lg"
                            onClick={submit}
                            className="shadow-neubrutalist"
                            disabled={isFormSubmitting}
                        >
                            <span className="material-symbols-outlined text-[20px] filled mr-2">
                                {isFormSubmitting ? 'hourglass_empty' : 'save'}
                            </span>
                            {isFormSubmitting ? 'SAVING...' : 'SAVE EXTRACTOR'}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    )
}
