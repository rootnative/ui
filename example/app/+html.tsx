import { darkTheme } from '@rootnative/core'
import {
  schemeGuardCss,
  schemeGuardScript,
} from '@rootnative/core/static-export'
import { shellTags } from '@rootnative/seo/expo-router'
import { ScrollViewStyleReset } from 'expo-router/html'
import type { PropsWithChildren } from 'react'

const SCHEME_GUARD_CSS = schemeGuardCss({
  background: darkTheme.colors.background,
})

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
          The export holds the light theme. For a dark-scheme reader these
          two hide the page until ThemeProvider shows the dark theme, so the
          light server paint never shows.
        */}
        <script dangerouslySetInnerHTML={{ __html: schemeGuardScript() }} />
        <style dangerouslySetInnerHTML={{ __html: SCHEME_GUARD_CSS }} />
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
