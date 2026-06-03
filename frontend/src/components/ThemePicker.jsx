import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../utils/cn';

const ThemePicker = ({ className }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const { themeId, setTheme, themes } = useTheme();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSelect = (id) => {
    setTheme(id);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <motion.button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'p-2.5 rounded-xl transition-colors',
          open
            ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
            : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]'
        )}
        aria-label="Choose theme"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Palette size={20} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Theme picker"
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 z-[100] glass-modal p-3 w-[15.5rem] sm:w-[17rem] rounded-2xl"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-0.5 mb-2">
              Appearance
            </p>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => {
                const isActive = themeId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelect(t.id)}
                    className={cn(
                      'relative flex flex-col gap-1.5 p-2 rounded-xl border text-left transition-all duration-150',
                      isActive
                        ? 'border-[var(--accent)] bg-[var(--accent-muted)] ring-1 ring-[var(--accent)]/30'
                        : 'border-[var(--border)] hover:border-[var(--accent)]/35 hover:bg-[var(--surface-hover)]'
                    )}
                  >
                    <div className="flex w-full h-5 rounded-md overflow-hidden border border-[var(--border)]/50">
                      {t.preview.map((color, i) => (
                        <div key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium leading-tight text-[var(--text-primary)] pr-4">
                      {t.label}
                    </span>
                    {isActive && (
                      <Check
                        size={13}
                        className="absolute top-2 right-2 text-[var(--accent)]"
                        strokeWidth={2.5}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemePicker;
