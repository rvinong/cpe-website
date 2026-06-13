import { AnimatePresence, motion as Motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import useTheme from '../context/useTheme'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className="theme-toggle grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white/75 text-navy-900 shadow-sm backdrop-blur transition hover:border-brand-500 hover:text-brand-600"
    >
      <AnimatePresence mode="wait" initial={false}>
        <Motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -35, scale: 0.75 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 35, scale: 0.75 }}
          transition={{ duration: 0.16 }}
          className="grid place-items-center"
          aria-hidden="true"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </Motion.span>
      </AnimatePresence>
    </button>
  )
}

export default ThemeToggle
