import * as d3 from 'd3'
import { observeSize, clear, addSvg, axisLabel } from './utils.js'

export function mountMedalsBar(containerSelector) {
  let dataPromise = d3.csv('./data/medals_total.csv', d3.autoType)
  let lastGoodSize = null

  observeSize(containerSelector, async ({ width, height }) => {
    let useFallbackSize = false

    if (width < 200 || height < 200) {
      if (!lastGoodSize) return
      width = lastGoodSize.width
      height = lastGoodSize.height
      useFallbackSize = true
    } else {
      lastGoodSize = { width, height }
    }

    const raw = await dataPromise
    const data = raw
      .filter(d => d.country && d.Total != null)
      .sort((a, b) => d3.descending(a.Total, b.Total))
      .slice(0, 10)

    const margin = { top: 20, right: 20, bottom: 55, left: 55 }
    const w = width
    const h = height
    const innerW = w - margin.left - margin.right
    const innerH = h - margin.top - margin.bottom

    clear(containerSelector)
    const svg = addSvg(containerSelector, w, h)
      .attr('viewBox', [0, 0, w, h])
      .attr('preserveAspectRatio', 'xMidYMid meet')

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleBand()
      .domain(data.map(d => d.country_code || d.country))
      .range([0, innerW])
      .padding(0.2)

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.Total) || 0])
      .nice()
      .range([innerH, 0])

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-25)')
      .style('text-anchor', 'end')

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y).ticks(6))

    g.selectAll('rect')
      .data(data, d => d.country_code || d.country)
      .join('rect')
      .attr('x', d => x(d.country_code || d.country))
      .attr('y', d => y(d.Total))
      .attr('width', x.bandwidth())
      .attr('height', d => innerH - y(d.Total))
      .attr('rx', 4)

    g.selectAll('.bar-label')
      .data(data, d => d.country_code || d.country)
      .join('text')
      .attr('class', 'bar-label')
      .attr('x', d => (x(d.country_code || d.country) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.Total) - 6)
      .style('text-anchor', 'middle')
      .text(d => d.Total)

    axisLabel(svg, 'Country (NOC)', margin.left + innerW / 2, h - 10, 0, 'middle')
    axisLabel(svg, 'Total medals', 14, margin.top + innerH / 2, -90, 'middle')
  })
}
