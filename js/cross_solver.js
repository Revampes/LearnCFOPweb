(() => {
  const cube = document.getElementById('cube');
  const scene = document.getElementById('scene');
  const statusEl = document.getElementById('solver-status');
  const solutionEl = document.getElementById('solution-text');
  const solveBtn = document.getElementById('solve-btn');
  const resetBtn = document.getElementById('reset-btn');

  // --- 3D Rotation Logic ---
  let rotX = -25;
  let rotY = -45;
  let isDragging = false;
  let startX, startY;

  const updateRotation = () => {
    cube.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  };

  scene.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    scene.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    rotY += dx * 0.5;
    rotX -= dy * 0.5;
    startX = e.clientX;
    startY = e.clientY;
    updateRotation();
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    scene.style.cursor = 'grab';
  });

  // Touch support
  scene.addEventListener('touchstart', (e) => {
    isDragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  });

  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    rotY += dx * 0.5;
    rotX -= dy * 0.5;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    updateRotation();
  });

  document.addEventListener('touchend', () => {
    isDragging = false;
  });


  // --- Cube State & Selection ---
  const faces = ['U', 'L', 'F', 'R', 'B', 'D'];
  const faceEls = {};
  faces.forEach(f => faceEls[f] = cube.querySelector(`.face-${f.toLowerCase()}`));

  // Edge definitions (Sticker indices)
  // [Face, Index]
  const edges = [
    { id: 'UB', s1: ['U', 1], s2: ['B', 1] },
    { id: 'UL', s1: ['U', 3], s2: ['L', 1] },
    { id: 'UR', s1: ['U', 5], s2: ['R', 1] },
    { id: 'UF', s1: ['U', 7], s2: ['F', 1] },
    { id: 'LB', s1: ['L', 3], s2: ['B', 5] },
    { id: 'LF', s1: ['L', 5], s2: ['F', 3] },
    { id: 'RB', s1: ['R', 5], s2: ['B', 3] },
    { id: 'RF', s1: ['R', 3], s2: ['F', 5] },
    { id: 'DB', s1: ['D', 7], s2: ['B', 7] },
    { id: 'DL', s1: ['D', 3], s2: ['L', 7] },
    { id: 'DR', s1: ['D', 5], s2: ['R', 7] },
    { id: 'DF', s1: ['D', 1], s2: ['F', 7] }
  ];

  // Map sticker ID to edge
  const stickerToEdge = {};
  edges.forEach((edge, idx) => {
    const id1 = `${edge.s1[0]}${edge.s1[1]}`;
    const id2 = `${edge.s2[0]}${edge.s2[1]}`;
    stickerToEdge[id1] = { edgeIdx: idx, part: 0 }; // part 0 = primary
    stickerToEdge[id2] = { edgeIdx: idx, part: 1 }; // part 1 = secondary
  });

  // Selected white edges: Map edgeIdx -> part (0 or 1 is White)
  // We need to know WHICH part is white to determine orientation.
  const selectedEdges = new Map(); 

  const createStickers = () => {
    faces.forEach(f => {
      const faceEl = faceEls[f];
      faceEl.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const el = document.createElement('div');
        el.className = 'sticker';
        el.dataset.id = `${f}${i}`;
        
        // Centers
        if (i === 4) {
          el.classList.add(getColorForFace(f));
          el.style.cursor = 'default';
        } else {
          el.addEventListener('click', handleStickerClick);
        }
        faceEl.appendChild(el);
      }
    });
  };

  const getColorForFace = (f) => {
    switch(f) {
      case 'U': return 'yellow';
      case 'F': return 'green';
      case 'R': return 'orange';
      case 'B': return 'blue';
      case 'L': return 'red';
      case 'D': return 'white';
    }
    return '';
  };

  const handleStickerClick = (e) => {
    const id = e.target.dataset.id;
    const info = stickerToEdge[id];
    
    if (!info) return; // Not an edge sticker (corner)

    const { edgeIdx, part } = info;

    if (selectedEdges.has(edgeIdx)) {
      // Already selected, toggle off or switch part?
      // If clicking the same part, remove.
      // If clicking the other part, switch white to that part.
      const currentPart = selectedEdges.get(edgeIdx);
      if (currentPart === part) {
        selectedEdges.delete(edgeIdx);
      } else {
        selectedEdges.set(edgeIdx, part);
      }
    } else {
      if (selectedEdges.size >= 4) {
        alert('You can only select 4 edges.');
        return;
      }
      selectedEdges.set(edgeIdx, part);
    }
    render();
  };

  const render = () => {
    // Reset all stickers to default gray (except centers)
    document.querySelectorAll('.sticker').forEach(el => {
      if (el.dataset.id.endsWith('4')) return;
      el.className = 'sticker';
    });

    // Highlight selected
    selectedEdges.forEach((part, edgeIdx) => {
      const edge = edges[edgeIdx];
      const whiteStickerId = part === 0 ? `${edge.s1[0]}${edge.s1[1]}` : `${edge.s2[0]}${edge.s2[1]}`;
      const otherStickerId = part === 0 ? `${edge.s2[0]}${edge.s2[1]}` : `${edge.s1[0]}${edge.s1[1]}`;

      const whiteEl = cube.querySelector(`[data-id='${whiteStickerId}']`);
      const otherEl = cube.querySelector(`[data-id='${otherStickerId}']`);

      if (whiteEl) {
        whiteEl.classList.add('white');
        whiteEl.classList.add('is-selected');
      }
      // We don't know the other color, but we can leave it gray or infer?
      // For Cross solver, we need to know WHICH edge it is (e.g. White-Green).
      // But the user only selects "White".
      // PROBLEM: If the user just clicks "White", we don't know if it's the White-Green or White-Red edge!
      // The user said "select 4 side that must contain white as one out of two of colour".
      // Maybe they assume we know the other color?
      // Or maybe they need to select the specific edge position?
      // "Select 4 side" -> Maybe they mean "Select the 4 White Edges on the cube".
      // If I have a scrambled cube, I see a White-Green edge at UR. I click the White sticker.
      // But the solver needs to know it's the White-Green edge.
      // So the user must tell us "This is the White-Green edge".
      // OR, we assume the user is painting the cube?
      // If the user just clicks "White" on UR, we know there is a White sticker at U5.
      // But we don't know if the other sticker (R1) is Green, Red, Blue, or Orange.
      
      // Wait, the user request: "select 4 side that must contain white as one out of two of colour".
      // Maybe the user implies we should be able to set the other color too?
      // Or maybe the user just wants to practice "White Cross" and assumes we can deduce? We can't deduce.
      
      // Let's update the UI to allow cycling colors for the non-white part?
      // Or simpler: The user clicks the White part, and we assume standard color scheme?
      // No, the edge is scrambled. It could be any of the 4 white edges.
      
      // Alternative: The user selects the POSITION of the 4 white edges.
      // And we need to know WHICH white edge is where.
      // Maybe we ask the user to "Place the White-Green edge", then "Place the White-Orange edge", etc?
      // That's tedious.
      
      // Maybe the user just wants to solve "A" cross, not a specific scrambled state?
      // No, "solution provider" implies solving a specific scramble.
      
      // Let's assume the user will click the sticker that IS white.
      // And then maybe we cycle the OTHER sticker's color?
      // Or we just ask the user to paint the whole cube? No, "select 4 side".
      
      // Let's try this:
      // When you click an edge, it cycles through the 4 possible White Edges:
      // 1. White-Green
      // 2. White-Orange
      // 3. White-Blue
      // 4. White-Red
      // And assigns the colors accordingly.
      
      if (otherEl) {
        // For now, let's just show it as selected.
        // We need a way to specify the edge identity.
        // Let's add a "color cycler" to the other sticker?
        // Or maybe a popup?
      }
    });

    statusEl.textContent = `Selected: ${selectedEdges.size}/4 edges`;
  };

  // --- Solver Logic (BFS) ---
  // We need to know the permutation and orientation of the 4 white edges.
  // Edges: WG, WO, WB, WR.
  // Positions: 0..11 (UB, UL, UR, UF, LB, LF, RB, RF, DB, DL, DR, DF).
  // Orientation: 0 (Good), 1 (Bad).
  
  // Since we don't have full input yet, I'll implement the BFS structure but can't run it without full state.
  // I'll update the UI to allow specifying the edge identity.
  // When an edge is selected (White part identified), we need to say WHICH edge it is.
  // I'll add a small text overlay or color indicator on the other sticker.
  
  // Revised Interaction:
  // Click an edge -> It becomes a "White Edge".
  // Repeated clicks cycle through: WG -> WO -> WB -> WR -> Unselected.
  // The "White" sticker is placed where the user clicked. The "Other" sticker gets the corresponding color.
  
  const edgeTypes = [
    { name: 'WG', c1: 'white', c2: 'green' },
    { name: 'WO', c1: 'white', c2: 'orange' },
    { name: 'WB', c1: 'white', c2: 'blue' },
    { name: 'WR', c1: 'white', c2: 'red' }
  ];
  
  // Map edgeIdx -> { typeIdx: 0..3, whitePart: 0|1 }
  const edgeAssignments = new Map();

  const handleStickerClick2 = (e) => {
    const id = e.target.dataset.id;
    const info = stickerToEdge[id];
    if (!info) return;

    const { edgeIdx, part } = info;
    
    // Check if this edge is already assigned
    let current = edgeAssignments.get(edgeIdx);
    
    if (!current) {
      // New assignment: Start with WG, white at clicked part
      // Check if WG is already used?
      const nextType = getNextAvailableType(-1);
      if (nextType === -1) {
        alert('All 4 white edges are already placed!');
        return;
      }
      edgeAssignments.set(edgeIdx, { typeIdx: nextType, whitePart: part });
    } else {
      // Cycle type
      // If we click the SAME part, cycle type.
      // If we click the OTHER part, maybe flip orientation? Or just treat as cycle.
      // Let's just cycle type for simplicity.
      const nextType = getNextAvailableType(current.typeIdx);
      if (nextType === -1) {
        // No more types available, remove assignment
        edgeAssignments.delete(edgeIdx);
      } else {
        edgeAssignments.set(edgeIdx, { typeIdx: nextType, whitePart: part });
      }
    }
    render2();
  };

  const getNextAvailableType = (currentTypeIdx) => {
    // Types: 0, 1, 2, 3.
    // We want the next one that isn't used by OTHER edges.
    for (let i = 1; i <= 4; i++) {
      const t = (currentTypeIdx + i) % 5; // 5 states: 0,1,2,3,4(None)
      if (t === 4) return -1; // Cycle to None
      
      // Check if t is used
      let used = false;
      for (const [eIdx, data] of edgeAssignments.entries()) {
        if (data.typeIdx === t) {
          used = true;
          break;
        }
      }
      if (!used) return t;
    }
    return -1;
  };

  const render2 = () => {
    document.querySelectorAll('.sticker').forEach(el => {
      if (el.dataset.id.endsWith('4')) return;
      el.className = 'sticker';
      el.style.backgroundColor = '';
    });

    edgeAssignments.forEach((data, edgeIdx) => {
      const edge = edges[edgeIdx];
      const type = edgeTypes[data.typeIdx];
      
      const whiteStickerId = data.whitePart === 0 ? `${edge.s1[0]}${edge.s1[1]}` : `${edge.s2[0]}${edge.s2[1]}`;
      const colorStickerId = data.whitePart === 0 ? `${edge.s2[0]}${edge.s2[1]}` : `${edge.s1[0]}${edge.s1[1]}`;
      
      const whiteEl = cube.querySelector(`[data-id='${whiteStickerId}']`);
      const colorEl = cube.querySelector(`[data-id='${colorStickerId}']`);
      
      if (whiteEl) {
        whiteEl.style.backgroundColor = 'white';
        whiteEl.classList.add('is-selected');
      }
      if (colorEl) {
        // Map color name to hex or class
        colorEl.classList.add(type.c2); // e.g. 'green', 'orange'
        // Also add explicit color style if needed, but classes should work
      }
    });
    
    statusEl.textContent = `Placed: ${edgeAssignments.size}/4 edges`;
  };

  // Override the click handler
  createStickers();
  // Re-bind with new handler
  document.querySelectorAll('.sticker').forEach(el => {
    if (!el.dataset.id.endsWith('4')) {
      el.removeEventListener('click', handleStickerClick);
      el.addEventListener('click', handleStickerClick2);
    }
  });

  // --- Solver Implementation ---
  const solve = () => {
    if (edgeAssignments.size < 4) {
      solutionEl.textContent = 'Please place all 4 white edges.';
      return;
    }
    
    // Convert assignments to solver state
    // State: [EdgePosition, Orientation] for each of the 4 edges (WG, WO, WB, WR)
    // Target: WG at DF(11), WO at DR(10), WB at DB(8), WR at DL(9)? 
    // Wait, standard placement:
    // F=Green, R=Orange, B=Blue, L=Red.
    // DF = White-Green
    // DR = White-Orange
    // DB = White-Blue
    // DL = White-Red
    
    // Edge Indices:
    // DF=11, DR=10, DB=8, DL=9.
    
    // We need to find where WG is.
    // edgeAssignments maps Location -> Type.
    // We need Type -> Location.
    
    const pieceLocs = {}; // typeIdx -> { edgeIdx, whitePart }
    edgeAssignments.forEach((data, edgeIdx) => {
      pieceLocs[data.typeIdx] = { edgeIdx, whitePart: data.whitePart };
    });
    
    // Define Goal
    // WG (0) -> DF (11). White is on D (part 0 of DF is D).
    // WO (1) -> DR (10). White is on D (part 0 of DR is D).
    // WB (2) -> DB (8). White is on D (part 0 of DB is D).
    // WR (3) -> DL (9). White is on D (part 0 of DL is D).
    
    // Orientation check:
    // For DF (D1, F7): Part 0 is D. If White is on D, Ori=0.
    // For UF (U7, F1): Part 0 is U. If White is on U, Ori=0.
    // We need a consistent orientation definition.
    // Let's say Ori 0 = White/Yellow is on U/D face.
    // If edge is in middle layer (FR, FL, BL, BR), Ori 0 = ?
    // Standard definition: Good/Bad edges.
    // Let's use a simple BFS state: [p0, o0, p1, o1, p2, o2, p3, o3]
    // p = 0..11, o = 0..1.
    
    // Initial State
    const startState = [];
    for(let i=0; i<4; i++) {
      const loc = pieceLocs[i];
      startState.push(loc.edgeIdx);
      // Orientation:
      // We need to define "Good" orientation for each slot.
      // Simplified: Just track where the White sticker is.
      // In our `edges` array:
      // s1 is usually U/D or L/R.
      // Let's check:
      // UB: U, B. White on U -> 0.
      // DF: D, F. White on D -> 0.
      // FR: F, R. No U/D.
      // Let's just track "Is White on Part 0?"
      // loc.whitePart is 0 or 1.
      startState.push(loc.whitePart);
    }
    
    // BFS
    const queue = [[startState, []]]; // [state, moves]
    const visited = new Set();
    visited.add(JSON.stringify(startState));
    
    // Target: 
    // WG(0) -> 11, 0
    // WO(1) -> 10, 0
    // WB(2) -> 8, 0
    // WR(3) -> 9, 0
    const targetStr = JSON.stringify([11,0, 10,0, 8,0, 9,0]);
    
    if (JSON.stringify(startState) === targetStr) {
      solutionEl.textContent = "Solved!";
      return;
    }
    
    let iterations = 0;
    while(queue.length > 0 && iterations < 200000) {
      iterations++;
      const [currState, moves] = queue.shift();
      
      if (moves.length >= 8) continue; // Cap at 8 moves
      
      // Try all moves: U, U', U2, D, ...
      const moveNames = ["U", "U'", "D", "D'", "F", "F'", "B", "B'", "R", "R'", "L", "L'"];
      
      for (const m of moveNames) {
        const nextState = applyMove(currState, m);
        const nextStr = JSON.stringify(nextState);
        
        if (nextStr === targetStr) {
          solutionEl.innerHTML = [...moves, m].join(' ');
          return;
        }
        
        if (!visited.has(nextStr)) {
          visited.add(nextStr);
          queue.push([nextState, [...moves, m]]);
        }
      }
    }
    
    solutionEl.textContent = "No solution found within 8 moves.";
  };

  // Move Tables (Permutation and Orientation changes)
  // This is tedious to write manually.
  // I'll implement a generic `applyMove` based on edge cycles.
  
  const applyMove = (state, move) => {
    // state: [p0, o0, p1, o1, p2, o2, p3, o3]
    // We need to update p and o for each of the 4 pieces.
    const newState = [...state];
    
    // Define cycles for each move
    // U: UB(0) -> UL(1) -> UF(3) -> UR(2) -> UB
    // Indices: 0, 1, 3, 2
    // Orientation: U moves don't change orientation relative to U/D.
    
    // F: UF(3) -> RF(7) -> DF(11) -> LF(5) -> UF
    // Orientation: F changes orientation?
    // UF(U,F) -> RF(R,F). White on U -> White on R (Bad? Depends on definition).
    // Let's trace stickers.
    // UF: U(0), F(1).
    // RF: R(0), F(1).
    // DF: D(0), F(1).
    // LF: L(0), F(1).
    
    // If White is at UF(0) [U], F move puts it at RF(0) [R].
    // If White is at UF(1) [F], F move puts it at RF(1) [F].
    
    // Let's define the cycles explicitly with orientation flips.
    // Flip = 1 means "Swap whitePart 0/1".
    
    let cycle = [];
    let flip = 0;
    
    const baseMove = move[0];
    const dir = move.length > 1 ? (move[1] === "'" ? 1 : 2) : 0; // 0=CW, 1=CCW, 2=Double? No, standard is 1=CW, 3=CCW.
    // My loop below handles single CW. I'll repeat for others.
    
    // Edges:
    // 0:UB, 1:UL, 2:UR, 3:UF
    // 4:LB, 5:LF, 6:RB, 7:RF
    // 8:DB, 9:DL, 10:DR, 11:DF
    
    switch(baseMove) {
      case 'U': cycle = [0, 1, 3, 2]; flip = 0; break; // UB->UL->UF->UR
      case 'D': cycle = [11, 9, 8, 10]; flip = 0; break; // DF->DL->DB->DR
      case 'L': cycle = [1, 4, 9, 5]; flip = 0; break; // UL->LB->DL->LF. Check Ori.
                // UL(U,L) -> LB(L,B). White on U(0) -> White on L(0).
                // LB(L,B) -> DL(D,L). White on L(0) -> White on D(0).
                // DL(D,L) -> LF(L,F). White on D(0) -> White on L(0).
                // LF(L,F) -> UL(U,L). White on L(0) -> White on U(0).
                // Seems 0->0 mapping holds for L/R moves too if defined correctly?
                // Let's check edges definition:
                // UL: U(0), L(1).
                // LB: L(0), B(1).
                // DL: D(0), L(1).
                // LF: L(0), F(1).
                // Yes, part 0 is U/D/L/R. Part 1 is F/B/L/R.
                // So L move preserves "Part 0 is Primary".
                break;
      case 'R': cycle = [2, 7, 10, 6]; flip = 0; break; // UR->RF->DR->RB
      case 'F': cycle = [3, 5, 11, 7]; flip = 1; break; // UF->LF->DF->RF.
                // UF(U,F) -> LF(L,F). White on U(0) -> White on L(0).
                // Wait, UF(0) is U. LF(0) is L.
                // F move: U sticker goes to R face (RF).
                // UF(U) -> RF(R).
                // UF(F) -> RF(F).
                // Let's check indices.
                // UF: 3. s1=U, s2=F.
                // LF: 5. s1=L, s2=F.
                // DF: 11. s1=D, s2=F.
                // RF: 7. s1=R, s2=F.
                
                // F Move (CW):
                // UF -> RF.
                // U sticker (0) -> R sticker (0).
                // F sticker (1) -> F sticker (1).
                // So 0->0, 1->1.
                // Wait, why did I think it flips?
                // Ah, F move rotates the face.
                // Top (U) -> Right (R).
                // Right (R) -> Bottom (D).
                // Bottom (D) -> Left (L).
                // Left (L) -> Top (U).
                
                // UF(0)[U] -> RF(0)[R].
                // RF(0)[R] -> DF(0)[D].
                // DF(0)[D] -> LF(0)[L].
                // LF(0)[L] -> UF(0)[U].
                // So 0 maps to 0. No flip?
                // Let's check F move on F stickers.
                // UF(1)[F] -> RF(1)[F].
                // Yes.
                // So F move is also flip=0?
                // Let's verify B move.
      case 'B': cycle = [0, 6, 8, 4]; flip = 0; break; // UB->RB->DB->LB
    }
    
    // Wait, is it really 0 flip for all?
    // Standard F2L logic says F/B moves flip edge orientation.
    // That's because "Good" edge is defined by U/D colors.
    // If White is on U (Good), and we do F, White goes to R (Bad).
    // So F move SHOULD flip orientation state if state means "Is Good".
    // But here my state is "Is White on Part 0".
    // Part 0 for UF is U. Part 0 for RF is R.
    // If White is on U (Part 0), after F, White is on R (Part 0).
    // So "Is White on Part 0" remains TRUE.
    // So the value 0/1 doesn't change.
    // BUT, does "Part 0" always mean the same "Goodness"?
    // For Solver, we want White on D (Part 0 of DF).
    // If we have White on R (Part 0 of RF), and we do F -> White on D (Part 0 of DF).
    // So 0->0 is correct tracking of the sticker.
    // The "Goal" state requires 0.
    // So if we start with 0 and keep 0, we reach 0.
    // So F move is fine.
    
    // What about U move?
    // UB(0)[U] -> UL(0)[U]. Correct.
    
    // So it seems flip is always 0 with this specific edge definition?
    // Let's double check L/R moves.
    // L move:
    // UL(0)[U] -> LB(0)[L].
    // LB(0)[L] -> DL(0)[D].
    // DL(0)[D] -> LF(0)[L].
    // LF(0)[L] -> UL(0)[U].
    // Yes, 0->0.
    
    // So tracking "Is White on Part 0" seems robust and flip-free for single moves!
    // This simplifies things greatly.
    
    // Apply cycle
    const times = move.endsWith("'") ? 3 : (move.endsWith("2") ? 2 : 1); // Support ' and 2?
    // My move list only has ' and normal.
    
    for (let t=0; t<times; t++) {
      // We need to update all 4 pieces in the state.
      // State has 4 pieces. Each has (pos, ori).
      // We iterate through the 4 pieces. If a piece is in the cycle, move it.
      
      for (let i=0; i<4; i++) {
        const pos = newState[i*2];
        const ori = newState[i*2+1];
        
        const idxInCycle = cycle.indexOf(pos);
        if (idxInCycle !== -1) {
          const nextPos = cycle[(idxInCycle + 1) % 4];
          newState[i*2] = nextPos;
          // newState[i*2+1] = ori ^ flip; // Flip is 0
        }
      }
    }
    
    return newState;
  };

  solveBtn.addEventListener('click', solve);
  resetBtn.addEventListener('click', () => {
    edgeAssignments.clear();
    render2();
    solutionEl.textContent = 'Waiting for input...';
  });

})();
