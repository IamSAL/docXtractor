import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/autoruns/edit/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/autoruns/edit/$id"!</div>
}
