import * as d3 from 'd3'
import { onCountryChange } from '../state.js'
import { observeSize, clear, addSvg, axisLabel } from './utils.js'

let selectedCountry = null

function parseDate(s) {
  if (!s) return null
  if (s instanceof Date) return s
  return d3.utcParse('%Y-%m-%d')(String(s))
}

export function mountCumulativeLines(containerSelector) {
  const dataPromise = d3.csv('./data/medallists.csv', d3.autoType)
  const totalsPromise = d3.csv('./data/medals_total.csv', d3.autoType)

  let lastSize = null
  let redraw = () => {}

  onCountryChange(country => {
    selectedCountry = country
    redraw()
  })

  observeSize(containerSelector, ({ width, height }) => {
    if (width < 200 || height < 200) return
    lastSize = { width, height }

    redraw = async () => {
      const raw = await dataPromise
      const totals = await totalsPromise

      const totalMap = new Map(
        totals.map(d => [d.country_code || d.country, d.Total])
      )

      let orderedCountries
      if (selectedCountry) {
        orderedCountries = [selectedCountry]
      } else {
        orderedCountries = totals
          .slice()
          .filter(d => d.Total != null)
          .sort((a, b) => d3.descending(a.Total, b.Total))
          .slice(0, 10)
          .map(d => d.country_code || d.country)
      }

      const countriesToShow = new Set(orderedCountries)

      const rows = raw
        .filter(d => d.medal_date)
        .map(d => ({
          country: d.country_code || d.country,
          date: parseDate(d.medal_date)
        }))
        .filter(d => d.date && countriesToShow.has(d.country))

      if (rows.length === 0) {
        clear(containerSelector)
        return
      }

      const [minDate, maxDate] = d3.extent(rows, d => d.date)
      const byCountry = d3.group(rows, d => d.country)

      const series = orderedCountries
        .filter(c => byCountry.has(c))
        .map(country => {
          const vals = byCountry.get(country).slice().sort((a, b) => a.date - b.date)
          const rawCount = vals.length
          const officialTotal = totalMap.get(country) ?? rawCount
          const scale = officialTotal / rawCount

          let running = 0
          const points = []

          const firstDate = vals[0].date
          points.push({ date: firstDate, value: 0 })

          vals.forEach(v => {
            running += 1
            points.push({ date: v.date, value: running * scale })
          })

          return { country, values: points }
        })

      const maxY = d3.max(series, s => d3.max(s.values, d => d.value)) || 0

      const margin = { top: 40, right: 120, bottom: 40, left: 55 }
      const innerW = lastSize.width - margin.left - margin.right
      const innerH = lastSize.height - margin.top - margin.bottom

      clear(containerSelector)
      const svg = addSvg(containerSelector, lastSize.width, lastSize.height)
        .attr('viewBox', [0, 0, lastSize.width, lastSize.height])
        .attr('preserveAspectRatio', 'xMidYMid meet')

      svg.append('text')
        .attr('x', lastSize.width / 2)
        .attr('y', 18)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text(
          selectedCountry
            ? `Cumulative Medals Over Time — ${selectedCountry}`
            : 'Cumulative Medals Over Time (Top 10 Countries)'
        )

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

      const x = d3.scaleUtc()
        .domain([minDate, maxDate])
        .range([0, innerW])

      const y = d3.scaleLinear()
        .domain([0, maxY])
        .nice()
        .range([innerH, 0])

      const color = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(orderedCountries)

      g.append('g')
        .attr('transform', `translate(0, ${innerH})`)
        .call(d3.axisBottom(x))

      g.append('g').call(d3.axisLeft(y))

      const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.value))

      g.selectAll('.line')
        .data(series, d => d.country)
        .join('path')
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', d => color(d.country))
        .attr('stroke-width', 2.5)
        .transition()
        .duration(500)
        .attr('d', d => line(d.values))

      const legend = g.append('g')
        .attr('transform', `translate(${innerW + 10}, 0)`)

      legend.selectAll('g')
        .data(series.map(d => d.country))
        .join('g')
        .attr('transform', (d, i) => `translate(0, ${i * 16})`)
        .each(function (country) {
          const item = d3.select(this)

          item.append('rect')
            .attr('width', 10)
            .attr('height', 10)
            .attr('y', -8)
            .attr('fill', color(country))

          item.append('text')
            .attr('x', 14)
            .attr('y', 0)
            .style('font-size', '11px')
            .attr('alignment-baseline', 'middle')
            .text(country)
        })

      axisLabel(svg, 'Date', margin.left + innerW / 2, lastSize.height - 5, 0, 'middle')
      axisLabel(svg, 'Cumulative Medals', 15, margin.top + innerH / 2, -90, 'middle')
    }

    redraw()
  })
}
