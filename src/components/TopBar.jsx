import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks'
import ghostifyIcon from '../assets/ghostify.png'

export default function TopBar() {
  const { isDark, toggle } = useTheme()

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0"
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div className="flex items-center gap-2">
        <img src={ghostifyIcon} alt="" className="w-9 h-9 object-contain select-none" draggable={false} />
        <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-primary)] select-none">
          Ghostify
        </span>
      </div>

      <button
        onClick={toggle}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ WebkitAppRegion: 'no-drag' }}
        className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        {isDark
          ? <Sun  size={13} strokeWidth={1.5} />
          : <Moon size={13} strokeWidth={1.5} />
        }
      </button>
    </header>
  )
}
