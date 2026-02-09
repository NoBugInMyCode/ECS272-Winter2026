import './style.css'
import { mountMedalsBar } from './src/charts/medalsBar.js'
import { mountCumulativeLines } from './src/charts/cumulativeLines.js'
import { mountDisciplineSankey } from './src/charts/disciplineSankey.js'

document.querySelector('#app').innerHTML = `
  <div id="page">
    <header id="header">
      <h1>Paris 2024 Olympics — Medal Exploration Dashboard</h1>
      <p class="subtitle">
        Jiazhi Sun (918675682) · ECS 272 HW3 Interactive Dashboard<br/>
        Data source:
        <a href="https://www.kaggle.com/datasets/piterfm/paris-2024-olympic-summer-games/data" target="_blank">
          Kaggle — Paris 2024 Olympic Summer Games
        </a>
      </p>
      <p class="subtitle">
        This dashboard is designed for <strong>interactive data exploration</strong>.
        Users start from a high-level overview and drill down into temporal and structural details
        through coordinated interactions.
      </p>
    </header>

    <main id="dashboard">
      <!-- CONTEXT VIEW -->
      <section class="card span-2">
        <div class="card-head">
          <h2>Context View: Countries by Total Medals</h2>
          <p class="hint">
            Bar chart — provides an overview of overall medal distribution across countries.
          </p>
          <p class="hint">
            <strong>Interaction:</strong> Click a bar to highlight a country and filter the focus views below.
          </p>
        </div>
        <div id="chart-bar" class="chart"></div>
      </section>

      <!-- FOCUS VIEW 1 -->
      <section class="card">
        <div class="card-head">
          <h2>Focus View: Medal Accumulation Over Time</h2>
          <p class="hint">
            Line chart — shows how medals accumulate over time.
          </p>
          <p class="hint">
            Selecting a country in the bar chart re-renders this view to display
            only the selected country, supporting temporal drill-down analysis.
          </p>
        </div>
        <div id="chart-line" class="chart"></div>
      </section>

      <!-- FOCUS VIEW 2 -->
      <section class="card">
        <div class="card-head">
          <h2>Focus View: Medal Composition by Discipline</h2>
          <p class="hint">
            Sankey diagram — visualizes how medals are distributed across disciplines and medal types.
          </p>
          <p class="hint">
            This view complements the temporal analysis by revealing structural patterns
            behind medal outcomes.
          </p>
        </div>
        <div id="chart-sankey" class="chart"></div>
      </section>
    </main>
  </div>
`

mountMedalsBar('#chart-bar')
mountCumulativeLines('#chart-line')
mountDisciplineSankey('#chart-sankey')
