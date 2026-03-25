import { useState, useEffect } from 'react'
import { api } from '../services/api'

/**
 * useAdSettings
 * Fetches the effective ad settings for the logged-in user.
 * Defaults to TRUE (show ads) while loading — this means if the API is
 * slow, we still show the ad rather than silently skipping it.
 * On error, we also default to true (fail open for ad revenue).
 *
 * Returns: { adSettings, adLoaded }
 *   adSettings: { generation_ad: bool, download_ad: bool }
 *   adLoaded: true once the fetch completes (success or failure)
 */
export function useAdSettings() {
  const [adSettings, setAdSettings] = useState({
    generation_ad: true,
    download_ad: true
  })
  const [adLoaded, setAdLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.getAdSettings()
      .then(data => {
        if (!cancelled && data) {
          setAdSettings({
            generation_ad: data.generation_ad ?? true,
            download_ad: data.download_ad ?? true
          })
        }
      })
      .catch((err) => {
        console.warn('[useAdSettings] Failed to fetch ad settings, defaulting to ON:', err)
        // Keep defaults (true) — fail open
      })
      .finally(() => {
        if (!cancelled) setAdLoaded(true)
      })
    return () => { cancelled = true }
  }, [])

  return { adSettings, adLoaded }
}
