/**
 * NeetGlassbox — "Glass Box" hub: a gallery of standalone, glassmorphism
 * physics solver tools. Each tool is a self-contained HTML file under
 * glassbox/ that shows every solving step, and opens in a new browser tab.
 * Renders into #glassboxView.
 *
 * To add a tool: drop its HTML in glassbox/, add an entry to TOOLS below,
 * add it to the SW shell (sw.js) and bump cache versions. See the
 * glassbox_physics_solver skill for the full build + register flow.
 */
(function (global) {
  let deps = {};
  let container = null;
  const ui = { q: '', tag: '' };

  // --- tool manifest (the only thing you edit to add a new Glass Box tool) ---
  const TOOLS = [
    {
      id: 'vector-solver',
      title: 'Vector Physics Solver',
      desc: 'Vector addition, components, dot/cross products and magnitudes — every step shown, fully offline.',
      file: 'glassbox/vector_solver_app.html',
      icon: '➗',
      tags: ['Vectors', 'Kinematics'],
      cls: 'XI'
    },
    {
      id: 'calculus-solver',
      title: 'Differential Calculus Solver',
      desc: 'Derivatives, rates of change and slopes for NEET physics — step-by-step working with units preserved, fully offline.',
      file: 'glassbox/calculus_physics_solver.html',
      icon: '∂',
      tags: ['Calculus', 'Kinematics'],
      cls: 'XI'
    },
    {
      id: 'trig-waveforms',
      title: 'Trigonometric Waveforms',
      desc: 'Interactive graphs of sin, cos, tan, cot, sec and csc with asymptotes, hover read-outs and an exact-values table — fully offline.',
      file: 'glassbox/trig_waveforms.html',
      icon: '〰️',
      tags: ['Trigonometry', 'Math Tools'],
      cls: 'XI'
    },
    {
      id: 'significant-digits',
      title: 'Significant Digits',
      desc: 'Significant-figure rules (counting, rounding, ×/÷, +/−, scientific notation, errors) plus an unlimited NEET-UG practice quiz — fully offline.',
      file: 'glassbox/significant_digits.html',
      icon: '🔢',
      tags: ['Units & Measurement', 'Math Tools'],
      cls: 'XI'
    }
    // Add the next tools here, one object each.
  ];

  function init(dependencies) {
    deps = dependencies || {};
    container = document.getElementById('glassboxView');
    if (container && !container.dataset.bound) {
      container.addEventListener('click', handleClick);
      container.addEventListener('input', handleInput);
      container.dataset.bound = '1';
    }
  }

  const esc = t => (deps.escapeHtml ? deps.escapeHtml(t) : String(t == null ? '' : t));

  function allTags() {
    const seen = [];
    TOOLS.forEach(t => (t.tags || []).forEach(tag => { if (!seen.includes(tag)) seen.push(tag); }));
    return seen.sort();
  }

  function filtered() {
    const q = ui.q.trim().toLowerCase();
    return TOOLS.filter(t => {
      if (ui.tag && !(t.tags || []).includes(ui.tag)) return false;
      if (!q) return true;
      const hay = [t.title, t.desc, (t.tags || []).join(' ')].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

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
    const total = TOOLS.length;
    const list = filtered();
    const chips = ['', ...allTags()].map(tag => {
      const label = tag || 'All';
      return `<button type="button" class="chip-toggle${ui.tag === tag ? ' on' : ''}" data-tag="${esc(tag)}">${esc(label)}</button>`;
    }).join('');
    const grid = list.length
      ? `<div class="glassbox-grid">${list.map(toolCard).join('')}</div>`
      : `<div class="empty-state panel-card"><h3>No tools match</h3><p>Try a different search or filter.</p></div>`;

    container.innerHTML = `
      <div class="view-hero compact">
        <div>
          <p class="eyebrow-dark">Glass Box</p>
          <h2>Interactive physics solvers</h2>
          <p class="lead">Step-by-step solver tools that show the full method — given data, principle, formula, substitution, units and the final answer. Each opens in a new tab.</p>
        </div>
        <span class="pill">${total} tool${total === 1 ? '' : 's'}</span>
      </div>

      <div class="glassbox-philosophy panel-card">
        <strong>Why "glass box"?</strong>
        <span>Unlike a calculator, these tools never hide the working. Use <em>Show Steps</em> or <em>Auto Solve</em> to watch every line of reasoning — and learn the method, not just the answer.</span>
      </div>

      <div class="glassbox-toolbar">
        <input id="glassboxSearch" type="search" class="search-input" placeholder="Search tools…" value="${esc(ui.q)}" aria-label="Search Glass Box tools" />
        <div class="glassbox-tags chip-group">${chips}</div>
      </div>

      ${grid}`;

    const search = container.querySelector('#glassboxSearch');
    if (search) {
      // keep focus + caret after re-render
      search.focus();
      const v = search.value; search.value = ''; search.value = v;
    }
  }

  function handleClick(e) {
    const chip = e.target.closest('[data-tag]');
    if (chip) {
      ui.tag = chip.dataset.tag || '';
      render();
    }
  }

  function handleInput(e) {
    if (e.target && e.target.id === 'glassboxSearch') {
      ui.q = e.target.value;
      render();
    }
  }

  global.NeetGlassbox = { init, render };
})(window);
