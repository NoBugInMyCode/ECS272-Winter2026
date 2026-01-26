import * as d3 from 'd3'
import { observeSize, clear, addSvg, axisLabel } from './utils.js'

function parseDate(s) {
  if (!s) return null
  if (s instanceof Date) return s
  return d3.utcParse('%Y-%m-%d')(String(s))
}

export function mountCumulativeLines(containerSelector) {
  const dataPromise = d3.csv('./data/medallists.csv', d3.autoType)

  observeSize(containerSelector, async ({ width, height }) => {
    if (width < 200 || height < 200) return

    const raw = await dataPromise
    const rows = raw
      .filter(d => d.country_code && d.medal_date)
      .map(d => ({ 
        country_code: d.country_code, 
        date: parseDate(d.medal_date) 
      }))
      .filter(d => d.date)

    if (rows.length === 0) {
      clear(containerSelector)
      return
    }

    const [minDate, maxDate] = d3.extent(rows, d => d.date)

    const topCountries = d3.rollups(rows, v => v.length, d => d.country_code)
      .sort((a, b) => d3.descending(a[1], b[1]))
      .slice(0, 5)
      .map(d => d[0])

    const filtered = rows.filter(d => topCountries.includes(d.country_code))

    const byCountry = d3.group(filtered, d => d.country_code)
    const series = Array.from(byCountry, ([country, vals]) => {
      const dayCounts = d3.rollups(vals, v => v.length, d => +d.date)
        .sort((a, b) => d3.ascending(a[0], b[0]))

      let running = 0
      const points = [{ date: minDate, value: 0 }]
      
      dayCounts.forEach(([timestamp, count]) => {
        running += count
        points.push({ date: new Date(timestamp), value: running })
      })

      points.push({ date: maxDate, value: running })
      return { country, values: points }
    })

    const maxY = d3.max(series, s => d3.max(s.values, d => d.value)) || 0

    const margin = { top: 30, right: 80, bottom: 40, left: 55 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    clear(containerSelector)
    const svg = addSvg(containerSelector, width, height)
    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleUtc().domain([minDate, maxDate]).range([0, innerW])
    const y = d3.scaleLinear().domain([0, maxY]).range([innerH, 0]).nice()
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(topCountries)

    g.append('g')
      .attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(x)
        .ticks(d3.utcDay.every(2)) 
        .tickFormat(d3.utcFormat('%m/%d')))

    g.append('g').call(d3.axisLeft(y).ticks(6))

    const line = d3.line()
      .curve(d3.curveStepAfter)
      .x(d => x(d.date))
      .y(d => y(d.value))

    g.selectAll('.line')
      .data(series)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', d => colorScale(d.country))
      .attr('stroke-width', 2.5)
      .attr('d', d => line(d.values))

    const labels = series.map(d => ({
      country: d.country,
      y: y(d.values[d.values.length - 1].value),
      color: colorScale(d.country)
    }))

    labels.sort((a, b) => a.y - b.y)
    const minPadding = 14
    for (let i = 1; i < labels.length; i++) {
      if (labels[i].y - labels[i-1].y < minPadding) {
        labels[i].y = labels[i-1].y + minPadding
      }
    }

    g.selectAll('.end-label')
      .data(labels)
      .join('text')
      .attr('class', 'end-label')
      .attr('x', innerW + 8)
      .attr('y', d => d.y)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', d => d.color)
      .text(d => d.country)

    // 8. 轴标题
    axisLabel(svg, 'Date', margin.left + innerW / 2, height - 5, 0, 'middle')
    axisLabel(svg, 'Cumulative Medals', 15, margin.top + innerH / 2, -90, 'middle')
  })
}