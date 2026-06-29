/**
 * NeetGlassbox — "Glass Box" hub: a gallery of standalone interactive
 * physics tools / simulators. Each tool is a self-contained HTML file under
 * glassbox/ and opens in a new browser tab. Renders into #glassboxView.
 *
 * To add a tool: drop the HTML file in glassbox/, add an entry to TOOLS
 * below (and to the SW shell list in sw.js), then rebuild cache versions.
 */
(function (global) {
  let deps = {};
  let container = null;

  // --- tool manifest (the only thing you edit to add a new Glass Box tool) ---
  const TOOLS = [
    {
      id: 'vector-solver',
      title: 'Vector Physics Solver',
      desc: 'Step-by-step vector addition, components, dot/cross products and magnitudes — every step shown inside the glass box.',
      file: 'glassbox/vector_solver_app.html',
      icon: '➗',
      tags: ['Vectors', 'Kinematics'],
      cls: 'XI'
    }
    // Add the next 49+ tools here, one object each.
  ];

  function init(dependencies) {
    deps = dependencies || {};
    container = document.getElementById('glassboxView');
  }

  const esc = t => (deps.escapeHtml ? deps.escapeHtml(t) : String(t == null ? '' : t));

  function toolCard(tool) {
    const tags = (tool.tags || [])
      .map(t => `<span class="learn-badge">${esc(t)}</span>`).join('');
    const cls = tool.cls ? `<span class="glassbox-class">Class ${esc(tool.cls)}</span>` : '';
    return `
      <a class="glassbox-card panel-card" href="${esc(tool.file)}" target="_blank" rel="noopener">
        <div class="glassbox-card-icon" aria-hidden="true">${esc(tool.icon || '🧪')}</div>
        <div class="glassbox-card-body">
          <div class="glassbox-card-head">
            <h3>${esc(tool.title)}</h3>
            ${cls}
          </div>
          <p class="glassbox-card-desc">${esc(tool.desc || '')}</p>
          <div class="glassbox-card-tags">${tags}</div>
        </div>
        <span class="glassbox-card-open" aria-hidden="true">Open ↗</span>
      </a>`;
  }

  function render() {
    if (!container) container = document.getElementById('glassboxView');
    if (!container) return;
    const count = TOOLS.length;
    const cards = count
      ? `<div class="glassbox-grid">${TOOLS.map(toolCard).join('')}</div>`
      : `<div class="empty-state panel-card"><h3>No tools yet</h3><p>Interactive tools will appear here.</p></div>`;
    container.innerHTML = `
      <div class="view-hero compact">
        <div>
          <p class="eyebrow-dark">Glass Box</p>
          <h2>Interactive physics tools</h2>
          <p class="lead">Self-contained solvers and simulators that show every working step. Each opens in a new tab.</p>
        </div>
        <span class="pill">${count} tool${count === 1 ? '' : 's'}</span>
      </div>
      ${cards}`;
  }

  global.NeetGlassbox = { init, render };
})(window);
