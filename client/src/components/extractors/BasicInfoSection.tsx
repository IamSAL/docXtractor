import { Controller, useFormContext } from 'react-hook-form'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/retroui/Input'
import { Textarea } from '@/components/retroui/Textarea'
import { useState } from 'react'
import { toast } from 'sonner'
import type { ExtractorFormData } from '@/types/extractor'
import { FormErrorMessage } from '@/components/FormErrorMessage'

interface BasicInfoSectionProps {
    onUploadFile: (file: File) => Promise<{ url: string; id: string }>
}

export function BasicInfoSection({ onUploadFile }: BasicInfoSectionProps) {
    const { control, formState: { errors } } = useFormContext<ExtractorFormData>()
    const [isThumbnailUploading, setIsThumbnailUploading] = useState(false)

    return (
        <AccordionItem
            value="basic"
            className="bg-white xdark:bg-surface-dark rounded-xl shadow-subtle border-border-light xdark:border-border-dark overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
            <AccordionTrigger className="px-6 py-5 border-b border-border-light xdark:border-border-dark hover:bg-gray-50 transition-colors hover:no-underline text-lg">
                <h3 className="font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">info</span>
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
                            render={({ field }) => (
                                <>
                                    <Input {...field} placeholder="e.g., Invoice Processor" />
                                    <FormErrorMessage message={errors.name?.message} />
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
                                            onClick={() => document.getElementById('thumbnail-upload')?.click()}
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
                                                        const result = await onUploadFile(file)
                                                        field.onChange(result.url)
                                                    } catch (error) {
                                                        toast.error('Failed to upload thumbnail')
                                                    } finally {
                                                        setIsThumbnailUploading(false)
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
    )
}
