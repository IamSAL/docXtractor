import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'
import { ExtractorForm } from '@/components/extractors/ExtractorForm'
import {
    useExtractorsControllerFindOne,
    useExtractorsControllerUpdate,
    useExtractorsControllerRemove,
} from '@/api/endpoints/extractors/extractors'
import { toast } from 'sonner'
import type { ExtractorFormData } from '@/types/extractor'
import { EmptyBlock } from '@/components/EmptyBlock'

export const Route = createFileRoute('/extractors/edit/$id')({
    component: EditExtractorComponent,
})

function EditExtractorComponent() {
    const { id } = Route.useParams()
    const navigate = useNavigate()

    const { data: response, isLoading } = useExtractorsControllerFindOne(id)
    const updateMutation = useExtractorsControllerUpdate()
    const deleteMutation = useExtractorsControllerRemove()

    const extractor = response?.data

    const onSubmit = async (data: ExtractorFormData) => {
        try {
            await updateMutation.mutateAsync({
                id,
                data: data as any,
            })

            toast.success('Extractor updated successfully')
            navigate({ to: '/extractors' })
        } catch (error) {
            toast.error('Failed to update extractor')
            console.error(error)
        }
    }

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this extractor?')) {
            try {
                await deleteMutation.mutateAsync({ id })
                toast.success('Extractor deleted successfully')
                navigate({ to: '/extractors' })
            } catch (error) {
                toast.error('Failed to delete extractor')
                console.error(error)
            }
        }
    }

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-4xl animate-spin text-primary">
                            sync
                        </span>
                        <p className="font-bold text-gray-500 uppercase tracking-widest">
                            Loading Extractor...
                        </p>
                    </div>
                </div>
            </AppLayout>
        )
    }

    if (!extractor) {
        return (
            <AppLayout>
                <div className="flex-1 flex items-center justify-center p-8">
                    <EmptyBlock
                        title="Extractor Not Found"
                        description={`The extractor with ID "${id}" could not be located. It may have been deleted or the ID might be incorrect.`}
                        icon="search_off"
                        tag="404"
                        action={{
                            label: "Back to Extractors",
                            icon: "arrow_back",
                            onClick: () => navigate({ to: '/extractors' })
                        }}
                    />
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <ExtractorForm
                title={`Edit: ${extractor.name}`}
                initialData={extractor as unknown as ExtractorFormData}
                onSubmit={onSubmit}
                onDelete={handleDelete}
                isSubmitting={updateMutation.isPending}
            />
        </AppLayout>
    )
}
