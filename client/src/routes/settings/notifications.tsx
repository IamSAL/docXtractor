import { EmptyBlock } from '@/components/EmptyBlock'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/notifications')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <EmptyBlock
      title="Silence is Golden"
      description="Notification protocols are currently offline. You will not receive any system alerts at this time."
      icon="notifications_off"
      tag="OFFLINE"
    />
  )
}
