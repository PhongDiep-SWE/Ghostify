import { useState, useEffect } from 'react'

/**
 * Manages light/dark theme.
 * - Default: follows system preference (prefers-color-scheme)
 * - After user toggles: stores explicit choice in localStorage
 * - Sets data-theme on <html> to override the @media rule
 */
export function useTheme() {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('np-theme') || 'system'
  })

  // Resolve whether system is currently dark
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = e => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Apply to DOM whenever mode changes
  useEffect(() => {
    const html = document.documentElement
    if (mode === 'system') {
      html.removeAttribute('data-theme')
      localStorage.removeItem('np-theme')
    } else {
      html.setAttribute('data-theme', mode)
      localStorage.setItem('np-theme', mode)
    }
  }, [mode])

  const isDark = mode === 'dark' || (mode === 'system' && systemDark)

  function toggle() {
    // First toggle always sets an explicit choice based on current effective theme
    setMode(isDark ? 'light' : 'dark')
  }

  return { isDark, toggle }
}
