import * as d3 from 'd3'
import { setSelectedCountry } from '../state.js'
import { observeSize, clear, addSvg, axisLabel } from './utils.js'

export function mountMedalsBar(containerSelector) {
  const dataPromise = d3.csv('./data/medals_total.csv', d3.autoType)

  const PAGE_SIZE = 10
  let currentPage = 0
  let selectedCountry = null
  let lastSize = null
  let sortedAll = null
  let currentLayer = null

  const root = d3.select(containerSelector)
  root.selectAll('*').remove()

  const controls = root.append('div').attr('class', 'pagination-controls')
  const prevBtn = controls.append('button').text('◀ Prev')
  const pageLabel = controls.append('span').style('margin', '0 8px')
  const nextBtn = controls.append('button').text('Next ▶')

  const chartHost = root.append('div')
    .attr('class', 'chart-host')
    .style('position', 'relative')
    .style('overflow', 'hidden')
    .style('height', '420px')

  if (!document.getElementById('medalsbar-slide-css')) {
    const style = document.createElement('style')
    style.id = 'medalsbar-slide-css'
    style.textContent = `
      .page-layer {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        will-change: transform;
      }
      .slide {
        transition: transform 400ms ease;
      }
      .bar-label {
        font-size: 12px !important;
        fill: #ffffff !important;
        font-weight: 700;
        pointer-events: none;
        paint-order: stroke;
        stroke: rgba(0,0,0,0.6);
        stroke-width: 2px;
      }
    `
    document.head.appendChild(style)
  }

  const xKey = d => d.country_code || d.country

  function getPageData() {
    const totalPages = Math.max(1, Math.ceil(sortedAll.length / PAGE_SIZE))
    currentPage = Math.max(0, Math.min(currentPage, totalPages - 1))
    return {
      totalPages,
      pageData: sortedAll.slice(
        currentPage * PAGE_SIZE,
        (currentPage + 1) * PAGE_SIZE
      )
    }
  }

  function applyHighlight(g) {
    g.selectAll('rect')
      .style('fill', d => {
        const key = xKey(d)
        if (!selectedCountry) return 'rgba(120, 190, 255, 0.85)'
        return key === selectedCountry
          ? '#ffcc00'
          : 'rgba(255, 255, 255, 0.15)'
      })
  }

  function draw(layer, width, height, data) {
    clear(layer)

    const svg = addSvg(layer, width, height)
    const margin = { top: 35, right: 20, bottom: 55, left: 55 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleBand()
      .domain(data.map(xKey))
      .range([0, innerW])
      .padding(0.2)

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.Total)])
      .nice()
      .range([innerH, 0])

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-25)')
      .style('text-anchor', 'end')
      .style('fill', 'rgba(233,238,252,0.9)')

    g.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('fill', 'rgba(233,238,252,0.9)')

    g.selectAll('rect')
      .data(data, xKey)
      .join('rect')
      .attr('x', d => x(xKey(d)))
      .attr('y', d => y(d.Total))
      .attr('width', x.bandwidth())
      .attr('height', d => innerH - y(d.Total))
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        const key = xKey(d)
        selectedCountry = selectedCountry === key ? null : key
        setSelectedCountry(selectedCountry)
        applyHighlight(g)
      })

    applyHighlight(g)

    g.selectAll('.bar-label')
      .data(data, xKey)
      .join('text')
      .attr('class', 'bar-label')
      .attr('x', d => x(xKey(d)) + x.bandwidth() / 2)
      .attr('y', d => y(d.Total) - 8)
      .attr('text-anchor', 'middle')
      .text(d => d.Total)

    axisLabel(svg, 'Country (NOC)', margin.left + innerW / 2, height - 5)
    axisLabel(svg, 'Total medals', 14, margin.top + innerH / 2, -90)
  }

  function render(direction) {
    if (!sortedAll || !lastSize) return

    const { pageData, totalPages } = getPageData()
    pageLabel.text(`Page ${currentPage + 1} / ${totalPages}`)
    prevBtn.attr('disabled', currentPage === 0 ? true : null)
    nextBtn.attr('disabled', currentPage === totalPages - 1 ? true : null)

    const layer = chartHost.append('div')
      .attr('class', 'page-layer')
      .classed('slide', direction !== null)

    if (direction === 'next') layer.style('transform', 'translateX(100%)')
    if (direction === 'prev') layer.style('transform', 'translateX(-100%)')

    draw(layer.node(), lastSize.width, lastSize.height, pageData)

    layer.node().offsetHeight

    if (direction === 'next') {
      layer.style('transform', 'translateX(0)')
      if (currentLayer) currentLayer.style('transform', 'translateX(-100%)')
    } else if (direction === 'prev') {
      layer.style('transform', 'translateX(0)')
      if (currentLayer) currentLayer.style('transform', 'translateX(100%)')
    } else {
      if (currentLayer) currentLayer.remove()
      layer.style('position', 'relative')
      currentLayer = layer
      return
    }

    const old = currentLayer
    currentLayer = layer

    setTimeout(() => {
      if (old) old.remove()
      layer.style('position', 'relative')
    }, 420)
  }

  prevBtn.on('click', () => {
    currentPage--
    render('prev')
  })

  nextBtn.on('click', () => {
    currentPage++
    render('next')
  })

  dataPromise.then(data => {
    sortedAll = data
      .filter(d => d.Total != null)
      .sort((a, b) => d3.descending(a.Total, b.Total))
    render(null)
  })

  observeSize(containerSelector, ({ width, height }) => {
    if (width < 200 || height < 200) return
    lastSize = { width, height }
    render(null)
  })
}
