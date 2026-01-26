import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'
import { observeSize, clear, addSvg } from './utils.js'

export function mountDisciplineSankey(containerSelector) {
  let dataPromise = d3.csv('./data/medallists.csv', d3.autoType)

  observeSize(containerSelector, async ({ width, height }) => {
    if (width < 300 || height < 250) return

    const raw = await dataPromise
    const rows = raw.filter(d => d.discipline && d.medal_type)

    // keep top disciplines to avoid an unreadable sankey
    const disciplineTotals = d3.rollups(rows, v => v.length, d => d.discipline)
      .sort((a, b) => d3.descending(a[1], b[1]))

    const topN = 12
    const topSet = new Set(disciplineTotals.slice(0, topN).map(d => d[0]))

    const cleaned = rows.map(d => ({
      discipline: topSet.has(d.discipline) ? d.discipline : 'Other',
      medal_type: d.medal_type
    }))

    const linksRollup = d3.rollups(
      cleaned,
      v => v.length,
      d => d.discipline,
      d => d.medal_type
    )

    const links = []
    for (const [disc, inner] of linksRollup) {
      for (const [medal, value] of inner) {
        links.push({ source: disc, target: medal, value })
      }
    }

    const medalTypes = Array.from(new Set(cleaned.map(d => d.medal_type)))
    // stable ordering for medal nodes
    const medalOrder = ['Gold Medal', 'Silver Medal', 'Bronze Medal']
    medalTypes.sort((a, b) => d3.ascending(medalOrder.indexOf(a), medalOrder.indexOf(b)))

    const disciplines = Array.from(new Set(cleaned.map(d => d.discipline)))
      .sort((a, b) => d3.descending(
        disciplineTotals.find(x => x[0] === a)?.[1] || 0,
        disciplineTotals.find(x => x[0] === b)?.[1] || 0
      ))

    const nodes = [
      ...disciplines.map(d => ({ name: d, side: 'left' })),
      ...medalTypes.map(m => ({ name: m, side: 'right' }))
    ]

    const nodeIndex = new Map(nodes.map((d, i) => [d.name, i]))
    const graph = {
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(l => ({
        source: nodeIndex.get(l.source),
        target: nodeIndex.get(l.target),
        value: l.value
      }))
    }

    const margin = { top: 10, right: 10, bottom: 10, left: 10 }
    const w = width
    const h = height
    const innerW = w - margin.left - margin.right
    const innerH = h - margin.top - margin.bottom

    clear(containerSelector)
    const svg = addSvg(containerSelector, w, h)
    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    const sankeyGen = sankey()
      .nodeWidth(14)
      .nodePadding(10)
      .extent([[0, 0], [innerW, innerH]])

    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGen(graph)

    // links
    g.append('g')
      .selectAll('path')
      .data(sankeyLinks)
      .join('path')
      .attr('class', 'sankey-link')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke-width', d => Math.max(1, d.width))

    // nodes
    const node = g.append('g')
      .selectAll('g')
      .data(sankeyNodes)
      .join('g')
      .attr('class', 'sankey-node')

    node.append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => d.y1 - d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('rx', 3)

    node.append('text')
      .attr('x', d => d.x0 < innerW / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', d => (d.y0 + d.y1) / 2)
      .attr('dy', '0.35em')
      .style('text-anchor', d => d.x0 < innerW / 2 ? 'start' : 'end')
      .attr('class', 'sankey-label')
      .text(d => d.name)
  })
}
