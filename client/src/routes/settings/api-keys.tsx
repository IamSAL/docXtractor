import { EmptyBlock } from '@/components/EmptyBlock'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/api-keys')({
    component: ApiKeysSettings,
})

function ApiKeysSettings() {
    return (
        <EmptyBlock
            title="API Access Restricted"
            description="Secure your extraction protocols with unique identifier tokens. No keys currently generated."
            icon="key"
            tag="SECURE"
            action={{
                label: "Generate New Key",
                onClick: () => console.log("Generate key"),
                icon: "add"
            }}
        />
    )
}
