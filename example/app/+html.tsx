import { shellTags } from '@rootnative/seo/expo-router'
import { ScrollViewStyleReset } from 'expo-router/html'
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
          Gives `#root` and `body` their height and disables body scrolling,
          so a Stack screen that fills its parent has a parent to fill. The
          static output uses this shell; the single-page output used Expo's
          own template, which carries the same reset.
        */}
        <ScrollViewStyleReset />
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
