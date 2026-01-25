import { Button } from '@/components/retroui/Button'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {


  return (
    <Link to="/dashboard"><Button>Click Me!</Button></Link>
  )
}
