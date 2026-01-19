(() => {
  const animCube = document.getElementById('anim-cube');
  const animSection = document.getElementById('animation-section');
  const replayBtn = document.getElementById('anim-replay');
  const stepsContainer = document.getElementById('anim-steps');
  
  if (!animCube) return;

  // Constants
  const FACES = ['u', 'f', 'r', 'd', 'l', 'b'];
  // Adjusted to Standard CFOP orientation: U=Yellow, F=Green, R=Orange, D=White, L=Red, B=Blue
  const COLORS = ['yellow', 'green', 'orange', 'white', 'red', 'blue'];
  // Indices for State array
  const U=0, F=1, R=2, D=3, L=4, B=5; 
  
  // State: [FaceIndex][StickerIndex] = ColorString
  let state = [];
  let solvedState = [];
  let currentSolution = '';
  let isAnimating = false;
  let killAnimation = false;

  // Cubie Management
  // 3x3x3 grid. x, y, z in {-1, 0, 1}
  // We store references to DOM elements
  const cubies = [];

  /*
    Coordinate System (Web 3D):
    +X: Right
    +Y: Down (So Top is y=-1)
    +Z: Front (So Front is z=1)
  */

  const createCubie = (x, y, z) => {
    const el = document.createElement('div');
    el.className = 'cubie';
    el.dataset.x = x;
    el.dataset.y = y;
    el.dataset.z = z;
    
    // Position
    // 50px unit. Center (0,0,0) is at 50%, 50% (css centered).
    // translate3d(x*50, y*50, z*50).
    el.style.transform = `translate3d(${x*50}px, ${y*50}px, ${z*50}px)`;

    // Create 6 faces
    FACES.forEach(f => {
      const face = document.createElement('div');
      face.className = `face face-${f} sticker`;
      el.appendChild(face);
    });

    return el;
  };

  const initWorld = () => {
    animCube.innerHTML = '';
    cubies.length = 0;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const c = createCubie(x, y, z);
          animCube.appendChild(c);
          cubies.push(c);
        }
      }
    }
    // Set Solved State
    solvedState = COLORS.map(c => Array(9).fill(c));
    state = JSON.parse(JSON.stringify(solvedState)); // Deep copy
  };

  // State Helpers (Logic from previous file)
  const getS = (f, i) => state[f][i];
  const setS = (f, i, c) => state[f][i] = c;
  
  const cycle = (arr) => {
    const lastVal = getS(arr[arr.length-1][0], arr[arr.length-1][1]);
    for (let i = arr.length - 1; i > 0; i--) {
        const [tf, ti] = arr[i];
        const [sf, si] = arr[i-1];
        setS(tf, ti, getS(sf, si));
    }
    const [tf, ti] = arr[0];
    setS(tf, ti, lastVal); 
  };

  const rotateFaceState = (f) => {
    cycle([[f,0], [f,2], [f,8], [f,6]]);
    cycle([[f,1], [f,5], [f,7], [f,3]]);
  };

  // State Updates (Logical)
  // These modify 'state' array.
  const logicalMoves = {
    U: () => {
      rotateFaceState(U);
      cycle([[F,0],[L,0],[B,0],[R,0]]);
      cycle([[F,1],[L,1],[B,1],[R,1]]);
      cycle([[F,2],[L,2],[B,2],[R,2]]);
    },
    D: () => {
      rotateFaceState(D);
      cycle([[F,6],[R,6],[B,6],[L,6]]);
      cycle([[F,7],[R,7],[B,7],[L,7]]);
      cycle([[F,8],[R,8],[B,8],[L,8]]);
    },
    R: () => {
      rotateFaceState(R);
      cycle([[F,2],[U,2],[B,6],[D,2]]);
      cycle([[F,5],[U,5],[B,3],[D,5]]);
      cycle([[F,8],[U,8],[B,0],[D,8]]);
    },
    L: () => {
      rotateFaceState(L);
      cycle([[F,0],[D,0],[B,8],[U,0]]);
      cycle([[F,3],[D,3],[B,5],[U,3]]);
      cycle([[F,6],[D,6],[B,2],[U,6]]);
    },
    F: () => {
      rotateFaceState(F);
      cycle([[U,6],[R,0],[D,2],[L,8]]);
      cycle([[U,7],[R,3],[D,1],[L,5]]);
      cycle([[U,8],[R,6],[D,0],[L,2]]);
    },
    B: () => {
      rotateFaceState(B);
      cycle([[U,2],[L,0],[D,6],[R,8]]);
      cycle([[U,1],[L,3],[D,7],[R,5]]);
      cycle([[U,0],[L,6],[D,8],[R,2]]);
    }
  };

  const applyLogicalMove = (base) => {
    if (logicalMoves[base]) {
        logicalMoves[base]();
        return;
    }
    
    // M' Logic (Used in x and r)
    // Moves M slice Up (F -> U -> B -> D)
    const applyMPrime = () => {
       cycle([[F,1],[U,1],[B,7],[D,1]]);
       cycle([[F,4],[U,4],[B,4],[D,4]]);
       cycle([[F,7],[U,7],[B,1],[D,7]]);
    };

    // S Logic (Used in f and z)
    // Moves S slice CW (following F)
    const applyS = () => {
        cycle([[U,3],[R,1],[D,5],[L,7]]);
        cycle([[U,4],[R,4],[D,4],[L,4]]);
        cycle([[U,5],[R,7],[D,3],[L,1]]);
    };

    if (base === 'x') {
       // x = R M' L'
       applyLogicalMove('R');
       applyMPrime();
       // L'
       applyLogicalMove('L'); applyLogicalMove('L'); applyLogicalMove('L');
    }
    else if (base === 'y') {
       // y = U E' D'
       // U
       applyLogicalMove('U');
       // E' (follows U direction)
       cycle([[F,3],[L,3],[B,3],[R,3]]);
       cycle([[F,4],[L,4],[B,4],[R,4]]);
       cycle([[F,5],[L,5],[B,5],[R,5]]);
       // D'
       applyLogicalMove('D'); applyLogicalMove('D'); applyLogicalMove('D');
    }
    else if (base === 'r') {
       // r = R M'
       applyLogicalMove('R');
       applyMPrime();
    }
    else if (base === 'l') {
       // l = L M
       // M is opposite of M'
       applyLogicalMove('L');
       applyMPrime(); applyMPrime(); applyMPrime(); // M = M' x 3
    }
    else if (base === 'u') { // Uw
        // u = U E' = y D
        applyLogicalMove('y');
        applyLogicalMove('D');
    }
    else if (base === 'd') { // Dw
        // d = D E = y' U
        applyLogicalMove('y'); applyLogicalMove('y'); applyLogicalMove('y'); // y'
        applyLogicalMove('U');
    }
    else if (base === 'f') { // Fw
        // f = F S
        applyLogicalMove('F');
        applyS();
    }
    else if (base === 'b') { // Bw
        // b = B S'
        applyLogicalMove('B');
        applyS(); applyS(); applyS(); // S'
    }
  };

  // Mapping from State Index to Cubie Face
  // Returns { x, y, z, fName }
  const getCubieFaceForSticker = (faceIdx, sIdx) => {
    let x=0, y=0, z=0, fName='';
    
    // Helper: Map 0..8 to row/col
    const row = Math.floor(sIdx / 3);
    const col = sIdx % 3;

    switch(faceIdx) {
      case U: // y = -1. Z increases with row. X increases with col.
        y = -1;
        z = row - 1; // 0->-1, 1->0, 2->1
        x = col - 1; 
        fName = 'face-u';
        break;
      case D: // y = 1. Z decreases with row. X increases with col.
        y = 1;
        z = 1 - row;
        x = col - 1;
        fName = 'face-d';
        break;
      case F: // z = 1. Y increases with row. X increases with col.
        z = 1;
        y = row - 1;
        x = col - 1;
        fName = 'face-f';
        break;
      case B: // z = -1. Y increases with row. X DECREASES with col 
        z = -1;
        y = row - 1;
        x = 1 - col;
        fName = 'face-b';
        break;
      case L: // x = -1. Y increases with row. Z increases with col.
        x = -1;
        y = row - 1;
        z = col - 1;
        fName = 'face-l';
        break;
      case R: // x = 1. Y increases row. Z DECREASES col.
        x = 1;
        y = row - 1;
        z = 1 - col;
        fName = 'face-r';
        break;
    }
    return {x, y, z, fName};
  };

  const render = () => {
    // For each face in state
    state.forEach((stickers, fIdx) => {
      stickers.forEach((color, sIdx) => {
        // Find geometry
        const {x, y, z, fName} = getCubieFaceForSticker(fIdx, sIdx);
        
        // Find DOM
        const cubie = cubies.find(c => 
          parseInt(c.dataset.x) === x &&
          parseInt(c.dataset.y) === y &&
          parseInt(c.dataset.z) === z
        );
        
        if (cubie) {
          const faceEl = cubie.querySelector('.' + fName);
          if (faceEl) {
            faceEl.className = `face ${fName} ${color}`;
          }
        }
      });
    });
  };

  // Animation Primitive
  const visualRotate = async (filterFn, axis, angleDeg) => {
    if (killAnimation) return;

    // 1. Identify Group
    const group = cubies.filter(c => filterFn(
      parseInt(c.dataset.x),
      parseInt(c.dataset.y),
      parseInt(c.dataset.z)
    ));

    if (group.length === 0) return;

    // 2. Create Pivot
    const pivot = document.createElement('div');
    pivot.style.position = 'absolute';
    pivot.style.top = '50%';
    pivot.style.left = '50%';
    pivot.style.width = '0';
    pivot.style.height = '0';
    pivot.style.transformStyle = 'preserve-3d';
    pivot.style.transform = 'rotate(0deg)'; // Init
    pivot.style.transition = 'transform 0.25s ease-out'; // Fast and smooth
    animCube.appendChild(pivot);

    // 3. Move cubies to pivot
    group.forEach(c => pivot.appendChild(c));

    // 4. Trigger Reflow
    pivot.offsetHeight;

    // 5. Animate
    let transformCmd = '';
    if (axis === 'x') transformCmd = `rotateX(${angleDeg}deg)`;
    if (axis === 'y') transformCmd = `rotateY(${angleDeg}deg)`;
    if (axis === 'z') transformCmd = `rotateZ(${angleDeg}deg)`;
    
    pivot.style.transform = transformCmd;

    // 6. Wait for transition
    await new Promise(r => setTimeout(r, 260));

    // 7. Cleanup
    group.forEach(c => {
        animCube.appendChild(c);
        // c element retains its relative transform (translate3d)
        // But since it's removed from pivot, visual rotation is lost.
        // This is where we must immediately Update Logic & Render
        // So the "snap back" shows the new colors in the old positions.
    });
    pivot.remove();
  };

  const parseMove = (moveStr) => {
    let m = moveStr;
    let isPrime = m.includes("'");
    let isDouble = m.includes("2");
    
    // Remove modifiers to identify base
    // Handle 'w' before ' or 2. e.g. Fw2, Fw'.
    // Regex might be cleaner but manual parsing is fine.
    
    let baseRaw = m.replace("'", "").replace("2", ""); // e.g. "Fw", "R", "r"
    
    let base = baseRaw;
    let isWide = false;
    
    if (baseRaw.length > 1 && baseRaw.toLowerCase().endsWith('w')) {
        isWide = true;
        base = baseRaw[0].toLowerCase(); // Use lowercase for wide internal logic (r, l, u, d, f, b)
    } else if (['u','d','l','r','f','b'].includes(baseRaw)) { 
        // Already lowercase wide move
        isWide = true;
        base = baseRaw;
    } else {
        // Standard uppercase
        base = baseRaw;
    }
    
    return { base, isPrime, isDouble };
  };

  const animateMove = async (move) => {
    const { base, isPrime, isDouble } = parseMove(move);

    let angle = -90; // Default CW
    
    // Override angles based on move type
    const getAngle = (baseParams) => {
        let a = baseParams;
        if (isPrime) a *= -1;
        if (isDouble) a *= 2;
        return a;
    };

    // Filters and Base Angles (CW)
    let filter = null;
    let axis = '';
    let baseAngle = 0;

    switch(base) {
      case 'U': 
        filter = (x,y,z) => y === -1;
        axis = 'y';
        baseAngle = -90; // Top spins left (CW from top)
        break;
      case 'D':
        filter = (x,y,z) => y === 1;
        axis = 'y';
        baseAngle = 90; // Bottom spins right (CW from bottom)
        break;
      case 'R':
        filter = (x,y,z) => x === 1;
        axis = 'x';
        baseAngle = 90; // CW around X
        break;
      case 'L':
        filter = (x,y,z) => x === -1;
        axis = 'x';
        baseAngle = -90; // CW around -X (CCW X)
        break;
      case 'F':
        filter = (x,y,z) => z === 1;
        axis = 'z';
        baseAngle = 90; // CW around Z
        break;
      case 'B':
        filter = (x,y,z) => z === -1;
        axis = 'z';
        baseAngle = -90; // CW around -Z (CCW Z)
        break;
      case 'y':
        filter = () => true;
        axis = 'y';
        baseAngle = -90;
        break;
      case 'x':
        filter = () => true;
        axis = 'x';
        baseAngle = 90;
        break;
      case 'r': // wide R (R + M')
        filter = (x,y,z) => x >= 0;
        axis = 'x';
        baseAngle = 90; 
        break;
      case 'l': // wide L (L + M)
        filter = (x,y,z) => x <= 0;
        axis = 'x';
        baseAngle = -90; 
        break;
      case 'u': // wide U (U + E')
        filter = (x,y,z) => y <= 0;
        axis = 'y';
        baseAngle = -90; 
        break;
      case 'd': // wide D (D + E)
        filter = (x,y,z) => y >= 0;
        axis = 'y';
        baseAngle = 90; 
        break;
      case 'f': // wide F (F + S)
        filter = (x,y,z) => z >= 0;
        axis = 'z';
        baseAngle = 90; 
        break;
      case 'b': // wide B (B + S')
        filter = (x,y,z) => z <= 0;
        axis = 'z';
        baseAngle = -90; 
        break;
    }

    if (filter) {
        await visualRotate(filter, axis, getAngle(baseAngle));
    }

    // Update Logic
    // Apply logical moves
    let count = 1;
    if (isDouble) count = 2;
    if (isPrime) count = 3;
    
    for(let k=0; k<count; k++) {
        applyLogicalMove(base);
    }
    
    render();
  };


  const fullAnimation = async () => {
    isAnimating = true;
    killAnimation = false;
    replayBtn.disabled = true;

    // Reset to initial
    initWorld();
    
    // Setup Unsolved State
    const moves = currentSolution.split(' ').filter(x=>x);
    // Inverse setup
    // Helper to invert move
    const invert = m => {
        if(m.endsWith('2')) return m;
        if(m.endsWith("'")) return m.slice(0, -1);
        return m + "'";
    };
    
    // Apply setup INSTANTLY (logical only)
    const setupMoves = moves.slice().reverse().map(invert);
    setupMoves.forEach(m => {
        const { base, isPrime, isDouble } = parseMove(m);
        let c = 1;
        if(isDouble) c=2;
        else if(isPrime) c=3;
        for(let i=0; i<c; i++) applyLogicalMove(base);
    });
    
    render();
    
    // Render Chips
    stepsContainer.innerHTML = '';
    moves.forEach(m => {
       const span = document.createElement('span');
       span.className = 'move-chip';
       span.textContent = m;
       span.style.margin = '0 4px';
       span.style.padding = '2px 6px';
       span.style.background = '#eee';
       span.style.borderRadius = '4px';
       stepsContainer.appendChild(span);
    });

    // Play Moves
    const chips = stepsContainer.children;
    
    // Initial Pause
    await new Promise(r => setTimeout(r, 500));

    for (let i = 0; i < moves.length; i++) {
        if (killAnimation) break;
        if (i > 0) chips[i-1].style.background = '#eee';
        chips[i].style.background = '#86efac';
        
        let m = moves[i];
        await animateMove(m);
        
        // Small pause between moves
        await new Promise(r => setTimeout(r, 100));
    }

    if (!killAnimation) {
       // Finished
       if (chips.length > 0) chips[chips.length-1].style.background = '#eee';
       replayBtn.disabled = false;
       isAnimating = false;

       // Wait and Reset to Unsolved
       await new Promise(r => setTimeout(r, 1500));
       if (!isAnimating) { // Check if user didn't start again
           initWorld(); // Reset to Solved
           // Apply setup again to show unsolved
           setupMoves.forEach(m => {
             const { base, isPrime, isDouble } = parseMove(m);
             let c = 1;
             if(isDouble) c=2;
             else if(isPrime) c=3;
             for(let i=0; i<c; i++) applyLogicalMove(base);
           });
           render();
       }
    }
  };

  window.addEventListener('f2l-solution-found', (e) => {
    currentSolution = e.detail.solution;
    if (currentSolution) {
       if (isAnimating) {
           killAnimation = true;
           setTimeout(() => fullAnimation(), 500);
       } else {
           animSection.style.display = 'block';
           fullAnimation();
       }
    }
  });

  replayBtn.addEventListener('click', () => {
      if (isAnimating) return;
      fullAnimation();
  });

  initWorld();

})();
