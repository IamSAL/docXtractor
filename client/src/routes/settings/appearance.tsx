import { EmptyBlock } from '@/components/EmptyBlock'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/appearance')({
    component: AppearanceSettings,
})

function AppearanceSettings() {
    return (
        <EmptyBlock
            title="Vibe Override Locked"
            description="The interface aesthetic is currently locked to system defaults. Custom theme injection coming soon."
            icon="palette"
            tag="AESTHETIC"
        />
    )
}
