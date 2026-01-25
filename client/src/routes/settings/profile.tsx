import { EmptyBlock } from '@/components/EmptyBlock'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <EmptyBlock
      title="Identity Protocol Offline"
      description="User profile metadata is restricted. Initiate identity verification to customize your operator settings."
      icon="person_off"
      tag="PROFILE"
    />
  )
}
