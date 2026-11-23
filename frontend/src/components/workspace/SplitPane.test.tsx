import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils/render'
import { SplitPane } from './SplitPane'

function renderPane(props: Partial<Parameters<typeof SplitPane>[0]> = {}) {
  const utils = render(
    <SplitPane
      left={<div data-testid="split-pane-left-content">Left</div>}
      right={<div data-testid="split-pane-right-content">Right</div>}
      leftPercent={30}
      onLeftPercentChange={vi.fn()}
      {...props}
    />,
  )
  const divider = screen.getByTestId('split-pane-divider')
  return { ...utils, onLeftPercentChange: props.onLeftPercentChange ?? vi.fn() }
}

function mockContainerWidth(el: HTMLElement, width: number) {
  el.getBoundingClientRect = () =>
    ({ width, left: 0, right: width, top: 0, bottom: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
}

describe('SplitPane', () => {
  it('renders both panes and the divider', () => {
    renderPane()

    expect(screen.getByTestId('split-pane')).toBeInTheDocument()
    expect(screen.getByTestId('split-pane-left')).toBeInTheDocument()
    expect(screen.getByTestId('split-pane-right')).toBeInTheDocument()
    expect(screen.getByTestId('split-pane-divider')).toBeInTheDocument()
    expect(screen.getByTestId('split-pane-left-content')).toHaveTextContent('Left')
  })

  it('reports percent changes from arrow key navigation', () => {
    const onLeftPercentChange = vi.fn()
    renderPane({ leftPercent: 30, onLeftPercentChange })

    const divider = screen.getByTestId('split-pane-divider')
    fireEvent.keyDown(divider, { key: 'ArrowLeft' })
    expect(onLeftPercentChange).toHaveBeenCalledWith(25)

    fireEvent.keyDown(divider, { key: 'ArrowRight' })
    expect(onLeftPercentChange).toHaveBeenLastCalledWith(35)
  })

  it('drags the divider and reports the clamped percent', () => {
    const onLeftPercentChange = vi.fn()
    const { container } = renderPane({ leftPercent: 30, onLeftPercentChange })

    const divider = screen.getByTestId('split-pane-divider')
    fireEvent.mouseDown(divider, { button: 0 })
    const paneEl = screen.getByTestId('split-pane') as HTMLElement
    mockContainerWidth(paneEl, 800)

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, bubbles: false }))

    expect(onLeftPercentChange).toHaveBeenCalledWith(25)

    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: false }))
  })

  it('clamps the reported percent into the allowed range', () => {
    const onLeftPercentChange = vi.fn()
    renderPane({ leftPercent: 80, onLeftPercentChange })

    const divider = screen.getByTestId('split-pane-divider')
    fireEvent.mouseDown(divider, { button: 0 })
    const paneEl = screen.getByTestId('split-pane') as HTMLElement
    mockContainerWidth(paneEl, 800)

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, bubbles: false }))

    expect(onLeftPercentChange).toHaveBeenLastCalledWith(15)
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: false }))
  })

  it('clamps a NaN percent to the minimum', () => {
    renderPane({ leftPercent: Number.NaN })

    expect(screen.getByTestId('split-pane-left').style.width).toBe('15%')
  })

  it('ignores drags when the container has no width', () => {
    const onLeftPercentChange = vi.fn()
    renderPane({ leftPercent: 30, onLeftPercentChange })

    fireEvent.mouseDown(screen.getByTestId('split-pane-divider'), { button: 0 })
    mockContainerWidth(screen.getByTestId('split-pane') as HTMLElement, 0)

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, bubbles: false }))

    expect(onLeftPercentChange).not.toHaveBeenCalled()
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: false }))
  })
})
