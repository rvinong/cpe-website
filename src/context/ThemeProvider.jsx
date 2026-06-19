import { useEffect, useState } from 'react'
import ThemeContext from './theme-context'

function getInitialTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const isDark = theme === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('nwssu-theme', theme)

    const themeColor = document.querySelector('meta[name="theme-color"]')
    themeColor?.setAttribute('content', isDark ? '#060d19' : '#f7f9fc')
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === 'dark' ? 'light' : 'dark',
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
