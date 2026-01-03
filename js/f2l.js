(() => {
  const board = document.getElementById('f2l-board');
  if (!board) return;

  const statusEl = document.getElementById('f2l-status');
  const matchEl = document.getElementById('f2l-match');
  const solutionEl = document.getElementById('f2l-solution');
  const cornerOriBtn = document.getElementById('corner-ori');
  const edgeOriBtn = document.getElementById('edge-ori');
  const searchBtn = document.getElementById('f2l-search');
  const resetBtn = document.getElementById('f2l-reset');

  const state = {
    corner: null,
    cornerOri: 0,
    edge: null,
    edgeOri: 0,
  };

  const cornerOriLabels = ['Twist: white on U', 'Twist: white on R', 'Twist: white on F'];
  const edgeOriLabels = ['Flip: red on F', 'Flip: blue on F'];

  const cornerPositions = [
    { id: 'UFR', face: 'top', x: 82, y: 82, label: 'UFR (above slot)' },
    { id: 'UBR', face: 'top', x: 82, y: 18, label: 'UBR (top)' },
    { id: 'UBL', face: 'top', x: 18, y: 18, label: 'UBL (top)' },
    { id: 'UFL', face: 'top', x: 18, y: 82, label: 'UFL (top)' },
    { id: 'FR_SLOT', face: 'front', x: 82, y: 82, label: 'FR slot (inserted)' },
  ];

  const edgePositions = [
    { id: 'UR', face: 'top', x: 82, y: 50, label: 'UR (top)' },
    { id: 'UF', face: 'top', x: 50, y: 82, label: 'UF (top)' },
    { id: 'UL', face: 'top', x: 18, y: 50, label: 'UL (top)' },
    { id: 'UB', face: 'top', x: 50, y: 18, label: 'UB (top)' },
    { id: 'FR', face: 'front', x: 82, y: 50, label: 'FR slot (inserted)' },
  ];

  const faces = {
    top: board.querySelector('[data-face="top"]'),
    front: board.querySelector('[data-face="front"]'),
    right: board.querySelector('[data-face="right"]'),
  };

  const makeMarker = (pos, type) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `piece ${type}`;
    btn.style.left = `${pos.x}%`;
    btn.style.top = `${pos.y}%`;
    btn.dataset.id = pos.id;
    btn.dataset.type = type;
    btn.setAttribute('aria-label', `${type === 'corner' ? 'Corner' : 'Edge'} ${pos.label}`);
    btn.textContent = type === 'corner' ? 'C' : 'E';
    btn.addEventListener('click', () => {
      if (type === 'corner') {
        state.corner = pos.id;
      } else {
        state.edge = pos.id;
      }
      render();
    });
    return btn;
  };

  const placeMarkers = () => {
    cornerPositions.forEach((pos) => {
      const face = faces[pos.face];
      if (face) face.appendChild(makeMarker(pos, 'corner'));
    });
    edgePositions.forEach((pos) => {
      const face = faces[pos.face];
      if (face) face.appendChild(makeMarker(pos, 'edge'));
    });
  };

  const renderOrientation = () => {
    cornerOriBtn.textContent = cornerOriLabels[state.cornerOri];
    edgeOriBtn.textContent = edgeOriLabels[state.edgeOri];
  };

  const renderSelection = () => {
    board.querySelectorAll('.piece').forEach((el) => {
      const id = el.dataset.id;
      const type = el.dataset.type;
      const isActive = (type === 'corner' && id === state.corner) || (type === 'edge' && id === state.edge);
      el.classList.toggle('is-active', isActive);
      el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };

  const renderStatus = (message) => {
    statusEl.textContent = message;
  };

  const render = () => {
    renderOrientation();
    renderSelection();
    const corner = state.corner || '—';
    const edge = state.edge || '—';
    renderStatus(`Corner: ${corner} · Edge: ${edge}`);
  };

  const cycleCornerOri = () => {
    state.cornerOri = (state.cornerOri + 1) % cornerOriLabels.length;
    renderOrientation();
  };

  const cycleEdgeOri = () => {
    state.edgeOri = (state.edgeOri + 1) % edgeOriLabels.length;
    renderOrientation();
  };

  let casesPromise;
  const loadCases = () => {
    if (!casesPromise) {
      casesPromise = fetch('data/f2l_cases.json').then((res) => {
        if (!res.ok) throw new Error('Could not load F2L data');
        return res.json();
      });
    }
    return casesPromise;
  };

  const search = async () => {
    if (!state.corner || !state.edge) {
      renderStatus('Pick a corner and an edge position first.');
      return;
    }
    searchBtn.disabled = true;
    renderStatus('Searching…');
    matchEl.textContent = '';
    solutionEl.textContent = '';
    try {
      const cases = await loadCases();
      const found = cases.find((entry) =>
        entry.cornerPos === state.corner
        && entry.cornerOri === state.cornerOri
        && entry.edgePos === state.edge
        && entry.edgeOri === state.edgeOri);

      if (!found) {
        renderStatus('No case found for this pairing yet. Add it to data/f2l_cases.json.');
        return;
      }

      renderStatus(`${found.id} · ${found.name || 'F2L case'}`);
      matchEl.innerHTML = `Corner ${found.cornerPos} (ori ${found.cornerOri}) · Edge ${found.edgePos} (ori ${found.edgeOri})`;
      solutionEl.innerHTML = `<div class="code-chip">${found.solution}</div>`;
    } catch (err) {
      renderStatus('Search failed. Reload and try again.');
      console.error(err);
    } finally {
      searchBtn.disabled = false;
    }
  };

  const reset = () => {
    state.corner = null;
    state.edge = null;
    state.cornerOri = 0;
    state.edgeOri = 0;
    matchEl.textContent = '';
    solutionEl.textContent = '';
    renderStatus('Select a corner and an edge to begin.');
    render();
  };

  cornerOriBtn?.addEventListener('click', () => {
    cycleCornerOri();
  });

  edgeOriBtn?.addEventListener('click', () => {
    cycleEdgeOri();
  });

  searchBtn?.addEventListener('click', search);
  resetBtn?.addEventListener('click', reset);

  placeMarkers();
  render();
})();
