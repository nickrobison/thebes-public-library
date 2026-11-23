import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils/render'
import { SplitPane } from './SplitPane'

describe('SplitPane', () => {
  it('renders both panes and the divider', () => {
    render(
      <SplitPane left={<div>LEFT</div>} right={<div>RIGHT</div>} leftPercent={28} onLeftPercentChange={() => {}} />,
    )

    expect(screen.getByTestId('split-pane')).toBeInTheDocument()
    expect(screen.getByTestId('split-pane-left')).toHaveTextContent('LEFT')
    expect(screen.getByTestId('split-pane-right')).toHaveTextContent('RIGHT')
    expect(screen.getByTestId('split-pane-divider')).toBeInTheDocument()
  })

  it('exposes the left pane percentage through aria', () => {
    render(
      <SplitPane left={<div>LEFT</div>} right={<div>RIGHT</div>} leftPercent={40} onLeftPercentChange={() => {}} />,
    )

    const divider = screen.getByTestId('split-pane-divider')
    expect(divider).toHaveAttribute('aria-valuenow', '40')
    expect(divider).toHaveAttribute('aria-valuemin', '15')
    expect(divider).toHaveAttribute('aria-valuemax', '70')
  })

  it('reports percentage changes via arrow keys', () => {
    const onLeftPercentChange = vi.fn()
    render(
      <SplitPane left={<div>LEFT</div>} right={<div>RIGHT</div>} leftPercent={30} onLeftPercentChange={onLeftPercentChange} />,
    )

    const divider = screen.getByTestId('split-pane-divider')
    fireEvent.keyDown(divider, { key: 'ArrowRight' })
    expect(onLeftPercentChange).toHaveBeenCalledWith(35)

    fireEvent.keyDown(divider, { key: 'ArrowLeft' })
    expect(onLeftPercentChange).toHaveBeenCalledWith(25)
  })

  it('clamps percentage changes to the allowed range', () => {
    const onLeftPercentChange = vi.fn()
    render(
      <SplitPane left={<div>LEFT</div>} right={<div>RIGHT</div>} leftPercent={75} onLeftPercentChange={onLeftPercentChange} />,
    )

    const divider = screen.getByTestId('split-pane-divider')
    fireEvent.keyDown(divider, { key: 'ArrowRight' })
    // percent is clamped to MAX_PANE_PERCENT (70); +5 from the clamped value stays in range.
    expect(onLeftPercentChange).toHaveBeenLastCalledWith(70)
  })

  it('enters dragging on mousedown and exits on mouseup', () => {
    render(
      <SplitPane left={<div>LEFT</div>} right={<div>RIGHT</div>} leftPercent={30} onLeftPercentChange={() => {}} />,
    )

    const divider = screen.getByTestId('split-pane-divider')
    fireEvent.mouseDown(divider)
    expect(divider).toHaveClass('bg-slate-400')

    fireEvent.mouseUp(document.body)
    expect(divider).not.toHaveClass('bg-slate-400')
  })
})
