import './style.css'
import { mountMedalsBar } from './src/charts/medalsBar.js'
import { mountCumulativeLines } from './src/charts/cumulativeLines.js'
import { mountDisciplineSankey } from './src/charts/disciplineSankey.js'

document.querySelector('#app').innerHTML = `
  <div id="page">
    <header id="header">
      <h1>Paris 2024 Olympics — Medal Dashboard</h1>
      <p class="subtitle">Jiazhi Sun(918675682) ECS272 HW2 static dashboard. Data source: <a href="https://www.kaggle.com/datasets/piterfm/paris-2024-olympic-summer-games/data">Kaggle Paris 2024 Olympic Summer Games</a></p>
    </header>

    <main id="dashboard">
      <section class="card span-2">
        <div class="card-head">
          <h2>Overview: Top 10 Countries by Total Medals</h2>
          <p class="hint">Bar chart — overview of overall medal distribution.</p>
        </div>
        <div id="chart-bar" class="chart"></div>
      </section>

      <section class="card">
        <div class="card-head">
          <h2>Medals Over Time (Top 5 Countries)</h2>
          <p class="hint">Line chart — cumulative medals by date.</p>
        </div>
        <div id="chart-line" class="chart"></div>
      </section>

      <section class="card">
        <div class="card-head">
          <h2>Where Medals Come From</h2>
          <p class="hint">Sankey (advanced) — disciplines → medal types.</p>
        </div>
        <div id="chart-sankey" class="chart"></div>
      </section>
    </main>
  </div>
`

mountMedalsBar('#chart-bar')
mountCumulativeLines('#chart-line')
mountDisciplineSankey('#chart-sankey')
