/**
 * PropellerAd
 * Injects the Propeller Ads tag script every time `show` flips to true.
 * The ad network handles deduplication / capping on their side.
 *
 * Usage:
 *   <PropellerAd show={adSettings.generation_ad} onAdShown={() => setShowAd(false)} />
 */
export function PropellerAd({ show, onAdShown }) {
  if (!show) return null

  // Inject immediately on render when show=true
  const container = [document.documentElement, document.body].filter(Boolean).pop()
  const s = document.createElement('script')
  s.dataset.zone = '10781216'
  s.src = 'https://al5sm.com/tag.min.js'
  container.appendChild(s)

  // Notify parent so it can reset show=false (allows re-triggering next time)
  if (onAdShown) setTimeout(onAdShown, 0)

  return null
}
