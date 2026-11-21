import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

const MIN_PANE_PERCENT = 15
const MAX_PANE_PERCENT = 70
const KEYBOARD_STEP_PERCENT = 5

export interface SplitPaneProps {
  left: ReactNode
  right: ReactNode
  /** Left pane width as a percentage of the container. */
  leftPercent: number
  onLeftPercentChange: (percent: number) => void
  className?: string
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return MIN_PANE_PERCENT
  return Math.min(MAX_PANE_PERCENT, Math.max(MIN_PANE_PERCENT, value))
}

/**
 * Two-pane layout with a draggable divider. Reports the left pane width as a
 * percentage so callers can persist it; the divider is keyboard operable.
 */
export function SplitPane({
  left,
  right,
  leftPercent,
  onLeftPercentChange,
  className = '',
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const percent = clampPercent(leftPercent)

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const container = containerRef.current
      if (!container) return
      const bounds = container.getBoundingClientRect()
      if (bounds.width === 0) return
      const next = ((clientX - bounds.left) / bounds.width) * 100
      onLeftPercentChange(clampPercent(next))
    },
    [onLeftPercentChange],
  )

  useEffect(() => {
    if (!dragging) return

    const handleMove = (event: MouseEvent) => {
      event.preventDefault()
      updateFromClientX(event.clientX)
    }
    const stopDragging = () => setDragging(false)

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', stopDragging)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', stopDragging)
    }
  }, [dragging, updateFromClientX])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onLeftPercentChange(clampPercent(percent - KEYBOARD_STEP_PERCENT))
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      onLeftPercentChange(clampPercent(percent + KEYBOARD_STEP_PERCENT))
    }
  }

  return (
    <div
      ref={containerRef}
      data-testid="split-pane"
      className={`flex h-full w-full ${className}`}
    >
      <div
        data-testid="split-pane-left"
        className="h-full overflow-y-auto"
        style={{ width: `${percent}%` }}
      >
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panes"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={MIN_PANE_PERCENT}
        aria-valuemax={MAX_PANE_PERCENT}
        tabIndex={0}
        data-testid="split-pane-divider"
        onMouseDown={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onKeyDown={handleKeyDown}
        className={`w-1 shrink-0 cursor-col-resize bg-slate-200 transition-colors hover:bg-slate-300 focus-visible:bg-slate-400 focus-visible:outline-none ${
          dragging ? 'bg-slate-400' : ''
        }`}
      />
      <div data-testid="split-pane-right" className="h-full min-w-0 flex-1 overflow-y-auto">
        {right}
      </div>
    </div>
  )
}
