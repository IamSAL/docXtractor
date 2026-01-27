import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'
import { ExtractorForm } from '@/components/extractors/ExtractorForm'
import { useExtractorsControllerCreate } from '@/api/endpoints/extractors/extractors'
import { toast } from 'sonner'
import type { ExtractorFormData } from '@/types/extractor'

export const Route = createFileRoute('/extractors/new')({
    component: NewExtractorComponent,
})

function NewExtractorComponent() {
    const navigate = useNavigate()
    const createMutation = useExtractorsControllerCreate()

    const onSubmit = async (data: ExtractorFormData) => {
        try {
            await createMutation.mutateAsync({
                data: data as any, // Cast to any because of minor type differences in nested objects vs DTO
            })

            toast.success('Extractor created successfully!', {
                description: 'Your new extractor has been saved.',
            })

            navigate({ to: '/extractors' })
        } catch (error) {
            toast.error('Failed to create extractor')
            console.error(error)
        }
    }

    return (
        <AppLayout>
            <ExtractorForm
                title="New Extractor"
                onSubmit={onSubmit}
                isSubmitting={createMutation.isPending}
            />
        </AppLayout>
    )
}
