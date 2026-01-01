(() => {
  const board = document.getElementById('oll-board');
  const statusEl = document.getElementById('status');
  const matchEl = document.getElementById('match');
  const searchBtn = document.getElementById('search-btn');
  const resetBtn = document.getElementById('reset-btn');

  const topState = new Array(9).fill(false);
  topState[4] = true; // center is always yellow
  const ringState = new Array(12).fill(false);

  const topOrder = [
    { row: 1, col: 1, idx: 0 },
    { row: 1, col: 2, idx: 1 },
    { row: 1, col: 3, idx: 2 },
    { row: 2, col: 1, idx: 3 },
    { row: 2, col: 2, idx: 4 },
    { row: 2, col: 3, idx: 5 },
    { row: 3, col: 1, idx: 6 },
    { row: 3, col: 2, idx: 7 },
    { row: 3, col: 3, idx: 8 },
  ];

  const ringOrder = [
    { row: 0, col: 1, idx: 0 },
    { row: 0, col: 2, idx: 1 },
    { row: 0, col: 3, idx: 2 },
    { row: 1, col: 0, idx: 3, orientation: 'vertical' },
    { row: 2, col: 0, idx: 4, orientation: 'vertical' },
    { row: 3, col: 0, idx: 5, orientation: 'vertical' },
    { row: 1, col: 4, idx: 6, orientation: 'vertical' },
    { row: 2, col: 4, idx: 7, orientation: 'vertical' },
    { row: 3, col: 4, idx: 8, orientation: 'vertical' },
    { row: 4, col: 1, idx: 9 },
    { row: 4, col: 2, idx: 10 },
    { row: 4, col: 3, idx: 11 },
  ];

  const ringCoords = [
    [-1, -2], [0, -2], [1, -2], // north
    [-2, -1], [-2, 0], [-2, 1], // west
    [2, -1], [2, 0], [2, 1],    // east
    [-1, 2], [0, 2], [1, 2],    // south
  ];

  const rotateCoordsCW = ([x, y]) => [y, -x];

  const rotateMatrixCW = (matrix) => {
    const size = matrix.length;
    const next = Array.from({ length: size }, () => Array(size).fill(null));
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        next[c][size - 1 - r] = matrix[r][c];
      }
    }
    return next;
  };

  const matrixFromTopPattern = (pattern) => {
    const bits = pattern.split('').map(Number);
    return [
      [bits[0], bits[1], bits[2]],
      [bits[3], 1, bits[4]],
      [bits[5], bits[6], bits[7]],
    ];
  };

  const patternFromMatrix = (matrix) => [
    matrix[0][0], matrix[0][1], matrix[0][2],
    matrix[1][0], matrix[1][2],
    matrix[2][0], matrix[2][1], matrix[2][2],
  ].join('');

  const rotateTopPattern = (pattern, turns) => {
    let matrix = matrixFromTopPattern(pattern);
    for (let i = 0; i < turns; i += 1) matrix = rotateMatrixCW(matrix);
    return patternFromMatrix(matrix);
  };

  const ringMatrixFromPattern = (pattern) => {
    const matrix = Array.from({ length: 5 }, () => Array(5).fill(null));
    const values = pattern.split('').map(Number);
    ringOrder.forEach(({ row, col, idx }) => {
      matrix[row][col] = values[idx];
    });
    return matrix;
  };

  const ringPatternFromMatrix = (matrix) => ringOrder
    .map(({ row, col }) => (matrix[row][col] ? 1 : 0))
    .join('');

  const rotateRingPattern = (pattern, turns) => {
    let matrix = ringMatrixFromPattern(pattern);
    for (let i = 0; i < turns; i += 1) matrix = rotateMatrixCW(matrix);
    return ringPatternFromMatrix(matrix);
  };

  const buildMiniBoard = (entry) => {
    const mini = document.createElement('div');
    mini.className = 'mini-board';

    const matrix = Array.from({ length: 5 }, () => Array(5).fill(null));

    topOrder.forEach(({ row, col, idx }) => {
      const bitIndex = idx === 4 ? null : idx > 4 ? idx - 1 : idx;
      const active = idx === 4 ? true : entry.topPattern[bitIndex] === '1';
      matrix[row][col] = { active, type: 'top' };
    });

    ringOrder.forEach(({ row, col, idx, orientation }) => {
      matrix[row][col] = {
        active: entry.ringPattern[idx] === '1',
        type: 'ring',
        orientation: orientation === 'vertical' ? 'vertical' : 'horizontal',
      };
    });

    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        const cellInfo = matrix[r][c];
        if (!cellInfo) {
          const spacer = document.createElement('div');
          spacer.className = 'placeholder';
          mini.appendChild(spacer);
          continue;
        }
        const cell = document.createElement('div');
        const roleClass = cellInfo.type === 'ring' ? ` ring ${cellInfo.orientation}` : ' top';
        cell.className = `mini-cell${cellInfo.active ? ' active' : ''}${roleClass}`;
        mini.appendChild(cell);
      }
    }

    return mini;
  };

  const topPatternString = () => topOrder
    .filter((cell) => cell.idx !== 4)
    .map((cell) => (topState[cell.idx] ? '1' : '0'))
    .join('');

  const ringPatternString = () => ringState.map((v) => (v ? '1' : '0')).join('');

  const render = () => {
    board.querySelectorAll('.sticker[data-type="top"]').forEach((el) => {
      const idx = Number(el.dataset.index);
      el.classList.toggle('active', topState[idx]);
    });
    board.querySelectorAll('.sticker[data-type="ring"]').forEach((el) => {
      const idx = Number(el.dataset.index);
      el.classList.toggle('active', ringState[idx]);
    });

    statusEl.textContent = `Top ${topPatternString()} · Ring ${ringPatternString()}`;
  };

  const makeSticker = ({ type, idx, label, disabled = false, orientation }) => {
    const el = document.createElement('button');
    el.type = 'button';
    const orientClass = orientation ? ` ${orientation}` : '';
    el.className = `sticker ${type}${disabled ? ' disabled' : ''}${orientClass}`;
    el.dataset.type = type;
    el.dataset.index = idx;
    el.setAttribute('aria-label', label);
    if (disabled) el.setAttribute('aria-disabled', 'true');
    el.addEventListener('click', () => {
      if (type === 'top') {
        if (idx === 4) return;
        topState[idx] = !topState[idx];
      } else {
        ringState[idx] = !ringState[idx];
      }
      render();
      matchEl.innerHTML = '';
    });
    return el;
  };

  const buildBoard = () => {
    const grid = Array.from({ length: 5 }, () => Array(5).fill(null));

    topOrder.forEach((cell) => {
      grid[cell.row][cell.col] = makeSticker({
        type: 'top',
        idx: cell.idx,
        label: `Top sticker ${cell.idx === 4 ? 'center' : cell.idx + 1}`,
        disabled: cell.idx === 4,
      });
    });

    ringOrder.forEach((cell) => {
      grid[cell.row][cell.col] = makeSticker({
        type: 'ring',
        idx: cell.idx,
        label: `Outer sticker ${cell.idx + 1}`,
        orientation: cell.orientation === 'vertical' ? 'vertical' : undefined,
      });
    });

    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        const node = grid[r][c] || document.createElement('div');
        node.classList.add('placeholder');
        if (grid[r][c]) node.classList.remove('placeholder');
        board.appendChild(node);
      }
    }
    render();
  };

  const reset = () => {
    for (let i = 0; i < topState.length; i += 1) topState[i] = false;
    topState[4] = true;
    for (let i = 0; i < ringState.length; i += 1) ringState[i] = false;
    statusEl.textContent = 'Pattern cleared. Toggle stickers to mark yellow.';
    matchEl.innerHTML = '';
    render();
  };

  let casesPromise;
  const loadCases = () => {
    if (!casesPromise) {
      casesPromise = fetch('data/oll_cases.json').then((res) => {
        if (!res.ok) throw new Error('Could not load OLL data');
        return res.json();
      });
    }
    return casesPromise;
  };

  const rotationMessages = [
    'Orientation matches the reference.',
    'Detected cube rotated 90° clockwise.',
    'Detected cube rotated 180° from reference.',
    'Detected cube rotated 90° counterclockwise.',
  ];

  const correctionMessages = [
    'No reorientation needed.',
    'Rotate the cube 90° counterclockwise (y\') to align with the reference.',
    'Rotate the cube 180° (y2) to align with the reference.',
    'Rotate the cube 90° clockwise (y) to align with the reference.',
  ];

  const search = async () => {
    searchBtn.disabled = true;
    statusEl.textContent = 'Searching…';
    matchEl.innerHTML = '';
    try {
      const userTop = topPatternString();
      const userRing = ringPatternString();
      const cases = await loadCases();
      let found = null;

      for (const entry of cases) {
        for (let turns = 0; turns < 4; turns += 1) {
          const rotatedTop = rotateTopPattern(entry.topPattern, turns);
          const rotatedRing = rotateRingPattern(entry.ringPattern, turns);
          if (rotatedTop === userTop && rotatedRing === userRing) {
            found = { entry, turns };
            break;
          }
        }
        if (found) break;
      }

      if (!found) {
        statusEl.textContent = 'No exact match found. Double-check the yellow stickers and orientation.';
        return;
      }

      const { entry, turns } = found;
      const rotationNote = rotationMessages[turns];
      const correction = correctionMessages[turns];
      statusEl.textContent = `${entry.id} · ${rotationNote}`;
      const mini = buildMiniBoard(entry);
      matchEl.innerHTML = `
        <div class="match-layout">
          <div class="match-text">
            <div class="code-chip">${entry.id}</div>
            <div class="code-chip">${entry.solution}</div>
            <small>${correction}</small>
            <small>Top ${userTop} · Ring ${userRing}</small>
          </div>
        </div>
      `;
      matchEl.querySelector('.match-layout').appendChild(mini);
    } catch (err) {
      statusEl.textContent = 'Something went wrong while searching. Please reload and try again.';
      console.error(err);
    } finally {
      searchBtn.disabled = false;
    }
  };

  searchBtn?.addEventListener('click', search);
  resetBtn?.addEventListener('click', reset);

  buildBoard();
})();
