import { useEffect, useRef } from 'react'

/**
 * PropellerAd
 * Injects the Propeller Ads tag script inside a useEffect (safe for React).
 * Fires every time `show` changes from false → true.
 * After injecting, calls onAdShown() so the parent can reset show=false
 * (which allows re-triggering on the next user action).
 *
 * IMPORTANT: The script is appended to <body> — the ad network handles
 * rendering the actual popup/overlay on their side.
 */
export function PropellerAd({ show, onAdShown }) {
  const prevShow = useRef(false)

  useEffect(() => {
    // Only fire when show transitions false → true
    if (!show || prevShow.current === true) {
      prevShow.current = show
      return
    }
    prevShow.current = true

    // Inject the Propeller Ads script tag into <body>
    const s = document.createElement('script')
    s.dataset.zone = '10781216'
    s.src = 'https://al5sm.com/tag.min.js'
    s.async = true
    document.body.appendChild(s)

    // Reset parent state after a short delay so ad has time to load,
    // and so the next Generate/Download click can re-trigger
    const timer = setTimeout(() => {
      prevShow.current = false
      if (onAdShown) onAdShown()
    }, 2000)

    return () => clearTimeout(timer)
  }, [show]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
