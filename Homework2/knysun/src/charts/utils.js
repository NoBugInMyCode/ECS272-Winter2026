import * as d3 from 'd3'

export function observeSize(selector, onResize) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector
  if (!el) throw new Error(`Container not found: ${selector}`)

  const ro = new ResizeObserver((entries) => {
    const cr = entries[0].contentRect
    onResize({ width: Math.max(0, cr.width), height: Math.max(0, cr.height) })
  })
  ro.observe(el)

  // trigger once immediately
  const r = el.getBoundingClientRect()
  onResize({ width: Math.max(0, r.width), height: Math.max(0, r.height) })

  return () => ro.disconnect()
}

export function clear(container) {
  const el = typeof container === 'string' ? document.querySelector(container) : container
  if (el) el.innerHTML = ''
}

export function addSvg(container, width, height) {
  const el = typeof container === 'string' ? document.querySelector(container) : container
  return d3.select(el).append('svg').attr('width', width).attr('height', height)
}

export function axisLabel(svg, text, x, y, rotate = 0, anchor = 'middle') {
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('transform', `translate(${x}, ${y}) rotate(${rotate})`)
    .style('text-anchor', anchor)
    .text(text)
}
