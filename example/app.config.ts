import type { ConfigContext, ExpoConfig } from 'expo/config'

/**
 * `app.json` holds the config. `WEB_OUTPUT=server` exports the same app with
 * `web.output: 'server'`, for the server export check in CI.
 */
export default ({ config }: ConfigContext): Partial<ExpoConfig> => ({
  ...config,
  web: {
    ...config.web,
    output: process.env.WEB_OUTPUT === 'server' ? 'server' : config.web?.output,
  },
})
