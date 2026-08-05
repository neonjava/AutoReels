import { useEffect, useState } from 'react'
import api from '../services/api'

export function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('autoreels_theme') as 'dark' | 'light') || 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('autoreels_theme', theme)
  }, [theme])

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => {
        const t = res.data.settings?.theme
        if (t === 'light' || t === 'dark') setThemeState(t)
      })
      .catch(() => undefined)
  }, [])

  const setTheme = (t: 'dark' | 'light') => setThemeState(t)

  return { theme, setTheme }
}
