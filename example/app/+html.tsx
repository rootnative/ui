import { shellTags } from '@rootnative/seo/expo-router'
import type { PropsWithChildren } from 'react'

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        {shellTags({
          basePath: process.env.EXPO_BASE_URL,
          themeColor: '#2563eb',
          manifest: '/manifest.webmanifest',
        })}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/*
          SPA redirect handler for GitHub Pages.
          The custom 404.html stores the original path in sessionStorage
          before redirecting to /ui/demo/. This script restores it.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var redirect = sessionStorage.getItem('spa-redirect')
                if (redirect) {
                  sessionStorage.removeItem('spa-redirect')
                  var base = '/ui/demo/'
                  history.replaceState(null, '', base + redirect)
                }
              })()
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
