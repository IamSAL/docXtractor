import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'

import * as Sentry from '@sentry/tanstackstart-react'

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { EmptyBlock } from './components/EmptyBlock'

// Create a new router instance
export const getRouter = () => {
  const rqContext = TanstackQuery.getContext()

  const router = createRouter({
    routeTree,
    context: {
      ...rqContext,
    },

    defaultPreload: 'intent',
    defaultNotFoundComponent: () => (
      <div
        className="min-h-screen w-screen flex items-center justify-center p-6 bg-white antialiased selection:bg-primary selection:text-black font-display"
        style={{
          backgroundImage: 'radial-gradient(#d4d4d4 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      >
        <EmptyBlock
          title="404: PROTOCOL ABORT"
          description="The requested coordinates do not exist in the DocXTractor database. The route has been purged or never existed."
          icon="error_outline"
          tag="MISSING"
          action={{
            label: "Return to Base",
            icon: "home",
            onClick: () => window.location.href = '/'
          }}
        />
      </div>
    ),
  })

  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })

  if (!router.isServer) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [],
      tracesSampleRate: 1.0,
      sendDefaultPii: true,
    })
  }

  return router
}
