const VW = 384, VH = 216;

const PALETTE = {
  void:   '#1a1c2c',
  bg:     '#29366f',
  purple: '#5d275d',
  red:    '#b13e53',
  orange: '#ef7d57',
  gold:   '#ffcd75',
  cream:  '#fff1e8',
  green:  '#a7f070',
  dgreen: '#38b764',
  blue:   '#41a6f6',
  lblue:  '#73eff7',
  gray:   '#94b0c2',
  dgray:  '#333c57',
  white:  '#f4f4f4'
};

const SCREEN_ORDER = ['intro', 'map', 'crossy', 'rush', 'fight', 'shop', 'collection'];

let canvas, ctx;
let state = { coins: 0, plushies: {}, screen: 'intro' };
let keys = {};
let justPressed = {};
let mouse = { x: 0, y: 0, down: false, wheel: 0 };
let click = null;

function loadState() {
  try {
    const raw = localStorage.getItem('arcAIdia_save');
    if (raw) {
      const s = JSON.parse(raw);
      state.coins = s.coins || 0;
      state.plushies = s.plushies || {};
    }
  } catch (e) {}
}

function saveState() {
  try {
    localStorage.setItem('arcAIdia_save', JSON.stringify({ coins: state.coins, plushies: state.plushies }));
  } catch (e) {}
}

function setScreen(name) {
  state.screen = name;
  if (SCREENS[name] && SCREENS[name].enter) SCREENS[name].enter();
}

function addCoins(n) {
  state.coins += n;
  saveState();
}

function resize() {
  let scale = Math.min(window.innerWidth / VW, window.innerHeight / VH);
  if (scale >= 1) scale = Math.floor(scale);
  if (scale < 1) scale = scale;
  canvas.style.width = (VW * scale) + 'px';
  canvas.style.height = (VH * scale) + 'px';
}

function pointIn(px, py, x, y, w, h) {
  return px >= x && px < x + w && py >= y && py < y + h;
}

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

function text(str, x, y, size, color, align) {
  ctx.font = size + 'px "Press Start 2P", monospace';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  ctx.fillText(str, Math.floor(x), Math.floor(y));
}

function textCenter(str, y, size, color) {
  ctx.font = size + 'px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  const w = ctx.measureText(str).width;
  ctx.fillText(str, Math.floor((VW - w) / 2), Math.floor(y));
  ctx.textAlign = 'left';
}

function uiButton(label, x, y, w, h, color) {
  const hover = pointIn(mouse.x, mouse.y, x, y, w, h);
  const baseColor = color || PALETTE.dgreen;
  rect(x, y, w, h, hover ? PALETTE.green : baseColor);
  rect(x, y, w, 2, PALETTE.dgray);
  rect(x, y + h - 2, w, 2, PALETTE.dgray);
  rect(x, y, 2, h, PALETTE.dgray);
  rect(x + w - 2, y, 2, h, PALETTE.dgray);
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.void;
  ctx.fillText(label, Math.floor(x + w / 2), Math.floor(y + h / 2 + 1));
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const clicked = click && pointIn(click.x, click.y, x, y, w, h);
  return clicked;
}

function drawHUD() {
  rect(VW - 70, 4, 66, 14, PALETTE.void);
  rect(VW - 68, 6, 62, 10, PALETTE.dgray);
  text('C:' + state.coins, VW - 64, 7, 8, PALETTE.gold);
}

const STARS = [[20,16],[60,28],[110,12],[170,24],[220,10],[270,20],[330,30],[300,40],[50,44],[140,38]];

function drawDesk(x, y) {
  rect(x, y, 40, 12, '#a0633a');
  rect(x, y + 11, 40, 2, '#7d4a2a');
  rect(x + 4, y + 13, 3, 6, '#5d3a1f');
  rect(x + 33, y + 13, 3, 6, '#5d3a1f');
  rect(x + 11, y - 9, 18, 11, PALETTE.void);
  rect(x + 12, y - 8, 16, 9, PALETTE.blue);
  rect(x + 13, y - 7, 6, 2, PALETTE.lblue);
  rect(x + 21, y - 4, 4, 2, PALETTE.green);
  rect(x + 16, y + 2, 8, 3, PALETTE.dgray);
}

function drawChair(x, y) {
  rect(x, y, 10, 8, PALETTE.void);
  rect(x + 1, y + 1, 8, 6, '#2a2d4a');
  rect(x + 3, y + 8, 2, 3, PALETTE.dgray);
  rect(x + 5, y + 8, 2, 3, PALETTE.dgray);
}

function drawPlant(x, y) {
  rect(x + 2, y + 8, 8, 6, PALETTE.orange);
  rect(x, y, 12, 9, PALETTE.dgreen);
  rect(x + 2, y - 4, 8, 6, PALETTE.green);
  rect(x + 4, y - 7, 4, 4, PALETTE.green);
}

function drawOfficeMap() {
  const WALL = '#3a4470', FL1 = '#c4d3da', FL2 = '#aebfcc';
  rect(0, 0, VW, 22, WALL);
  rect(0, 22, VW, 2, '#7d4a2a');
  for (let ty = 24; ty < VH; ty += 8) {
    for (let tx = 0; tx < VW; tx += 8) {
      const c = (((tx + ty) / 8) | 0) % 2 === 0 ? FL1 : FL2;
      rect(tx, ty, 8, 8, c);
    }
  }
  // neon ai& sign on wall
  rect(150, 3, 84, 14, '#222a4a');
  ctx.font = '11px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.lblue;
  ctx.fillText('ai&', 192, 10);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  rect(148, 2, 88, 1, PALETTE.lblue);
  rect(148, 17, 88, 1, PALETTE.lblue);
  // central desk cluster
  drawDesk(108, 40);
  drawDesk(168, 40);
  drawDesk(228, 40);
  drawChair(118, 56);
  drawChair(178, 56);
  drawChair(238, 56);
  // whiteboard (bottom-left)
  rect(20, 150, 46, 26, PALETTE.cream);
  rect(18, 148, 50, 2, '#888');
  rect(22, 154, 16, 2, PALETTE.red);
  rect(22, 158, 24, 2, PALETTE.blue);
  rect(22, 162, 10, 2, PALETTE.dgreen);
  // coffee station (bottom-right)
  rect(326, 150, 30, 18, '#5d3a1f');
  rect(330, 152, 22, 10, PALETTE.dgray);
  rect(334, 154, 6, 6, PALETTE.void);
  rect(344, 156, 4, 4, PALETTE.cream);
  rect(330, 162, 8, 5, PALETTE.cream);
  // plants in corners
  drawPlant(2, 26);
  drawPlant(370, 26);
  drawPlant(2, 188);
  drawPlant(370, 188);
}

function drawZoneIcon(kind, cx, cy) {
  cx = Math.floor(cx); cy = Math.floor(cy);
  if (kind === 'road') {
    rect(cx - 14, cy - 1, 28, 5, PALETTE.dgray);
    rect(cx - 12, cy, 2, 3, PALETTE.cream);
    rect(cx - 4, cy, 2, 3, PALETTE.cream);
    rect(cx + 6, cy, 2, 3, PALETTE.cream);
    rect(cx - 10, cy - 6, 12, 6, PALETTE.red);
    rect(cx - 8, cy - 5, 8, 2, PALETTE.lblue);
  } else if (kind === 'cars') {
    rect(cx - 12, cy - 6, 8, 5, PALETTE.orange);
    rect(cx - 3, cy - 6, 8, 5, PALETTE.lblue);
    rect(cx - 8, cy, 8, 5, PALETTE.red);
    rect(cx + 1, cy, 8, 5, PALETTE.gold);
  } else if (kind === 'sword') {
    rect(cx - 8, cy - 7, 3, 14, PALETTE.cream);
    rect(cx + 5, cy - 7, 3, 14, PALETTE.cream);
    rect(cx - 9, cy + 6, 5, 3, PALETTE.gold);
    rect(cx + 4, cy + 6, 5, 3, PALETTE.gold);
  }
}

function drawZone(z) {
  const hover = pointIn(mouse.x, mouse.y, z.x, z.y, z.w, z.h);
  rect(z.x + 2, z.y + 3, z.w, z.h, PALETTE.dgray);
  rect(z.x, z.y, z.w, z.h, hover ? PALETTE.cream : z.color);
  rect(z.x, z.y, z.w, 2, PALETTE.void);
  rect(z.x, z.y + z.h - 2, z.w, 2, PALETTE.void);
  rect(z.x, z.y, 2, z.h, PALETTE.void);
  rect(z.x + z.w - 2, z.y, 2, z.h, PALETTE.void);
  drawZoneIcon(z.icon, z.x + z.w / 2, z.y + 20);
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = PALETTE.void;
  ctx.fillText(z.label, Math.floor(z.x + z.w / 2), Math.floor(z.y + z.h - 11));
  ctx.textAlign = 'left';
}

function placeholderScreen(name, hint) {
  return {
    draw: function () {
      rect(0, 0, VW, VH, PALETTE.bg);
      textCenter(name, 60, 14, PALETTE.gold);
      textCenter(hint, 108, 8, PALETTE.cream);
      drawHUD();
    },
    update: function () {}
  };
}

const MAP_ZONES = [
  { id: 'crossy', x: 14, y: 30, w: 78, h: 54, label: 'CROSSY', icon: 'road', color: PALETTE.green },
  { id: 'rush', x: 292, y: 30, w: 78, h: 54, label: 'RUSH HR', icon: 'cars', color: PALETTE.orange },
  { id: 'fight', x: 148, y: 98, w: 88, h: 48, label: 'FIGHTER', icon: 'sword', color: PALETTE.red }
];

function drawPerson(x, y, shirt, hair) {
  const cx = Math.floor(x) + 2;
  const yy = Math.floor(y);
  rect(cx + 1, yy + 13, 5, 4, '#3a2a1a');
  rect(cx + 8, yy + 13, 5, 4, '#3a2a1a');
  rect(cx, yy + 8, 14, 6, shirt);
  rect(cx - 1, yy + 9, 2, 4, shirt);
  rect(cx + 13, yy + 9, 2, 4, shirt);
  rect(cx + 3, yy + 2, 8, 7, PALETTE.cream);
  rect(cx + 3, yy, 8, 3, hair);
  rect(cx + 2, yy + 1, 1, 2, hair);
  rect(cx + 11, yy + 1, 1, 2, hair);
  rect(cx + 5, yy + 5, 1, 1, PALETTE.void);
  rect(cx + 8, yy + 5, 1, 1, PALETTE.void);
}

const CROSSY = {
  CELL: 14, COLS: 27, ROWS: 14,
  OX: 3, OY: 20,
  enter: function () { this.reset(); },
  cellX: function (c) { return this.OX + c * this.CELL; },
  cellY: function (r) { return this.OY + r * this.CELL; },
  reset: function () {
    this.pcol = 13; this.prow = 13;
    this.px = this.cellX(13); this.py = this.cellY(13);
    this.state = 'play';
    this.flash = 0;
    this.buildLanes();
  },
  buildLanes: function () {
    this.lanes = [];
    const shirts = [PALETTE.red, PALETTE.orange, PALETTE.purple, PALETTE.dgreen, PALETTE.lblue];
    const hairs = ['#3a2a1a', '#6b4a2a', '#1a1c2c', '#8a5a2a'];
    for (let r = 1; r < this.ROWS - 1; r++) {
      const dir = (r % 2 === 0) ? 1 : -1;
      const speed = 0.04 + r * 0.006;
      const count = 2 + (r % 2);
      const gap = this.COLS / count;
      const workers = [];
      for (let i = 0; i < count; i++) {
        workers.push({
          col: (i * gap + r * 0.7) % this.COLS,
          dir: dir, speed: speed,
          shirt: shirts[(r + i) % shirts.length],
          hair: hairs[(i + r) % hairs.length]
        });
      }
      this.lanes.push({ row: r, workers: workers });
    }
  },
  move: function (dc, dr) {
    if (this.state !== 'play') return;
    this.pcol = Math.max(0, Math.min(this.COLS - 1, this.pcol + dc));
    this.prow = Math.max(0, Math.min(this.ROWS - 1, this.prow + dr));
  },
  update: function () {
    if (this.state === 'play') {
      if (justPressed['ArrowUp'] || justPressed['w'] || justPressed['W']) this.move(0, -1);
      if (justPressed['ArrowDown'] || justPressed['s'] || justPressed['S']) this.move(0, 1);
      if (justPressed['ArrowLeft'] || justPressed['a'] || justPressed['A']) this.move(-1, 0);
      if (justPressed['ArrowRight'] || justPressed['d'] || justPressed['D']) this.move(1, 0);
      if (click) {
        const pcx = this.px + 9, pcy = this.py + 9;
        const dx = click.x - pcx, dy = click.y - pcy;
        if (Math.abs(dy) >= Math.abs(dx)) this.move(0, dy < 0 ? -1 : 1);
        else this.move(dx < 0 ? -1 : 1, 0);
      }
    }
    for (let i = 0; i < this.lanes.length; i++) {
      const lane = this.lanes[i];
      for (let j = 0; j < lane.workers.length; j++) {
        const w = lane.workers[j];
        w.col += w.dir * w.speed;
        if (w.col < -1.5) w.col += this.COLS + 3;
        else if (w.col > this.COLS + 0.5) w.col -= this.COLS + 3;
      }
    }
    this.px += (this.cellX(this.pcol) - this.px) * 0.35;
    this.py += (this.cellY(this.prow) - this.py) * 0.35;
    if (this.state === 'play') {
      const vrow = Math.round((this.py - this.OY) / this.CELL);
      const pfcol = (this.px - this.OX) / this.CELL + 0.5;
      for (let i = 0; i < this.lanes.length; i++) {
        if (this.lanes[i].row !== vrow) continue;
        const ws = this.lanes[i].workers;
        for (let j = 0; j < ws.length; j++) {
          if (Math.abs(ws[j].col + 0.5 - pfcol) < 0.7) { this.state = 'dead'; this.flash = 20; break; }
        }
      }
      if (vrow <= 0) {
        this.state = 'win';
        addCoins(10);
      }
    }
    if (this.flash > 0) this.flash--;
    if (this.state === 'win') {
      if (click && pointIn(click.x, click.y, 96, 120, 80, 22)) this.reset();
      if (click && pointIn(click.x, click.y, 208, 120, 80, 22)) setScreen('map');
    } else if (this.state === 'dead') {
      if (click && pointIn(click.x, click.y, 96, 120, 80, 22)) this.reset();
      if (click && pointIn(click.x, click.y, 208, 120, 80, 22)) setScreen('map');
    }
  },
  draw: function () {
    rect(0, 0, VW, VH, PALETTE.bg);
    rect(0, 0, VW, 20, PALETTE.dgray);
    textCenter('CROSS THE OFFICE', 6, 8, PALETTE.gold);
    for (let r = 0; r < this.ROWS; r++) {
      const y = this.cellY(r);
      let c = (r % 2 === 0) ? '#c4d3da' : '#aebfcc';
      if (r === 0) c = PALETTE.dgray;
      if (r === this.ROWS - 1) c = '#9aa6b8';
      rect(this.OX, y, this.COLS * this.CELL, this.CELL, c);
    }
    // train platform (row 0)
    const tY = this.cellY(0);
    rect(this.OX, tY, this.COLS * this.CELL, this.CELL, '#5a3a2a');
    rect(this.OX, tY + this.CELL - 2, this.COLS * this.CELL, 2, '#3a2a1a');
    // train body
    const trainX = this.OX + 2;
    rect(trainX, tY - 10, this.COLS * this.CELL - 4, this.CELL + 8, PALETTE.red);
    rect(trainX, tY - 10, this.COLS * this.CELL - 4, 3, PALETTE.dgray);
    rect(trainX, tY - 4, this.COLS * this.CELL - 4, 2, PALETTE.gold);
    // train windows
    const winW = 8, winGap = 4, winY = tY - 8;
    for (let wx = trainX + 4; wx < trainX + this.COLS * this.CELL - 8; wx += winW + winGap) {
      rect(wx, winY, winW, 5, PALETTE.lblue);
      rect(wx + 1, winY + 1, 2, 2, PALETTE.cream);
    }
    // train front (locomotive nose on left)
    rect(trainX - 3, tY - 8, 6, this.CELL + 4, PALETTE.red);
    rect(trainX - 3, tY - 10, 6, 3, PALETTE.dgray);
    rect(trainX - 2, tY - 6, 4, 4, PALETTE.gold);
    // train wheels
    rect(trainX + 2, tY + this.CELL - 2, 5, 4, PALETTE.dgray);
    rect(trainX + this.COLS * this.CELL - 10, tY + this.CELL - 2, 5, 4, PALETTE.dgray);
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText('TRAIN', this.OX + this.COLS * this.CELL / 2, tY + this.CELL / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let i = 0; i < this.lanes.length; i++) {
      const lane = this.lanes[i];
      for (let j = 0; j < lane.workers.length; j++) {
        const w = lane.workers[j];
        drawPerson(this.cellX(w.col), this.cellY(lane.row), w.shirt, w.hair);
      }
    }
    if (this.flash > 0 && (this.flash % 4) < 2) {
      drawPerson(this.px, this.py, PALETTE.white, PALETTE.gold);
    } else {
      drawPerson(this.px, this.py, PALETTE.blue, PALETTE.gold);
    }
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText('David', this.px + 9, this.py - 8);
    ctx.textAlign = 'left';
    text('arrows/WASD or tap to move', 6, VH - 11, 6, PALETTE.cream);
    drawHUD();
    if (this.state === 'win' || this.state === 'dead') {
      rect(70, 60, 244, 96, PALETTE.void);
      rect(72, 62, 240, 92, PALETTE.dgray);
      textCenter(this.state === 'win' ? '+10 COINS!' : 'CAUGHT!', 78, 12, PALETTE.gold);
      textCenter(this.state === 'win' ? 'David caught the train!' : 'a coworker got you', 98, 7, PALETTE.cream);
      uiButton('RETRY', 96, 120, 80, 22, PALETTE.dgreen);
      uiButton('MAP', 208, 120, 80, 22, PALETTE.purple);
    }
  }
};

const RUSH = {
  CELL: 20, GRID: 7,
  OX: 122, OY: 30,
  exitRow: 3,
  enter: function () { this.reset(); },
  reset: function () {
    this.state = 'play';
    this.sel = -1;
    this.drag = null;
    this.pieces = [
      { id: 'P', orient: 'h', len: 1, col: 1, row: 3, target: true, c: PALETTE.gold },
      { id: 'A', orient: 'v', len: 3, col: 0, row: 0, c: PALETTE.red },
      { id: 'B', orient: 'h', len: 2, col: 2, row: 1, c: PALETTE.purple },
      { id: 'C', orient: 'v', len: 2, col: 3, row: 2, c: PALETTE.orange },
      { id: 'D', orient: 'h', len: 3, col: 3, row: 5, c: PALETTE.lblue },
      { id: 'E', orient: 'v', len: 3, col: 5, row: 0, c: PALETTE.dgreen },
      { id: 'F', orient: 'h', len: 2, col: 2, row: 3, c: PALETTE.cream },
      { id: 'G', orient: 'v', len: 2, col: 6, row: 2, c: PALETTE.blue }
    ];
    this.winT = 0;
  },
  cellsOf: function (p, col, row) {
    col = (col === undefined ? p.col : col);
    row = (row === undefined ? p.row : row);
    const out = [];
    for (let i = 0; i < p.len; i++) {
      if (p.orient === 'h') out.push([col + i, row]);
      else out.push([col, row + i]);
    }
    return out;
  },
  canPlace: function (p, col, row) {
    const cells = this.cellsOf(p, col, row);
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i][0], r = cells[i][1];
      if (c < 0 || c >= this.GRID || r < 0 || r >= this.GRID) return false;
    }
    for (let i = 0; i < this.pieces.length; i++) {
      const q = this.pieces[i];
      if (q === p) continue;
      const oc = this.cellsOf(q);
      for (let j = 0; j < oc.length; j++) {
        for (let k = 0; k < cells.length; k++) {
          if (oc[j][0] === cells[k][0] && oc[j][1] === cells[k][1]) return false;
        }
      }
    }
    return true;
  },
  pieceAt: function (px, py) {
    for (let i = 0; i < this.pieces.length; i++) {
      const p = this.pieces[i];
      const cells = this.cellsOf(p);
      for (let j = 0; j < cells.length; j++) {
        const x = this.OX + cells[j][0] * this.CELL;
        const y = this.OY + cells[j][1] * this.CELL;
        if (px >= x && px < x + this.CELL && py >= y && py < y + this.CELL) return i;
      }
    }
    return -1;
  },
  update: function () {
    if (this.state === 'win') {
      this.winT++;
      if (click && pointIn(click.x, click.y, 96, 120, 80, 22)) this.reset();
      if (click && pointIn(click.x, click.y, 208, 120, 80, 22)) setScreen('map');
      return;
    }
    if (click) {
      const idx = this.pieceAt(click.x, click.y);
      if (idx >= 0) {
        this.sel = idx;
        this.drag = { startCol: this.pieces[idx].col, startRow: this.pieces[idx].row, startMx: click.x, startMy: click.y };
      } else {
        this.sel = -1;
      }
    }
    if (this.sel >= 0 && mouse.down) {
      const p = this.pieces[this.sel];
      const dpx = mouse.x - (this.drag ? this.drag.startMx : mouse.x);
      const dpy = mouse.y - (this.drag ? this.drag.startMy : mouse.y);
      if (p.orient === 'h') {
        const want = (this.drag ? this.drag.startCol : p.col) + Math.round(dpx / this.CELL);
        if (want !== p.col && this.canPlace(p, want, p.row)) p.col = want;
      } else {
        const want = (this.drag ? this.drag.startRow : p.row) + Math.round(dpy / this.CELL);
        if (want !== p.row && this.canPlace(p, p.col, want)) p.row = want;
      }
    } else if (this.sel >= 0 && !mouse.down) {
      this.drag = null;
    }
    if (this.sel >= 0 && !mouse.down) {
      const p = this.pieces[this.sel];
      let dc = 0, dr = 0;
      if (justPressed['ArrowLeft'] || justPressed['a'] || justPressed['A']) dc = -1;
      if (justPressed['ArrowRight'] || justPressed['d'] || justPressed['D']) dc = 1;
      if (justPressed['ArrowUp'] || justPressed['w'] || justPressed['W']) dr = -1;
      if (justPressed['ArrowDown'] || justPressed['s'] || justPressed['S']) dr = 1;
      if (p.orient === 'h') dr = 0; else dc = 0;
      if (dc !== 0 || dr !== 0) {
        if (this.canPlace(p, p.col + dc, p.row + dr)) { p.col += dc; p.row += dr; }
      }
    }
    const t = this.pieces[0];
    if (t.col + t.len - 1 >= this.GRID - 1 && this.state === 'play') {
      this.state = 'win'; addCoins(30); this.winT = 0;
    }
  },
  drawDeskPiece: function (p) {
    const x = this.OX + p.col * this.CELL;
    const y = this.OY + p.row * this.CELL;
    const w = (p.orient === 'h' ? p.len : 1) * this.CELL;
    const h = (p.orient === 'v' ? p.len : 1) * this.CELL;
    if (p.target) {
      drawPerson(x + 3, y + 1, p.c, PALETTE.gold);
      return;
    }
    const pad = 2;
    rect(x + pad, y + pad, w - pad * 2, h - pad * 2, p.c);
    rect(x + pad, y + pad, w - pad * 2, 3, PALETTE.dgray);
    rect(x + pad, y + h - pad - 3, w - pad * 2, 3, PALETTE.dgray);
    rect(x + pad + 4, y + pad + 5, Math.min(10, w - 14), 7, PALETTE.void);
    rect(x + pad + 5, y + pad + 6, Math.min(8, w - 16), 5, PALETTE.lblue);
  },
  draw: function () {
    rect(0, 0, VW, VH, PALETTE.bg);
    rect(0, 0, VW, 20, PALETTE.dgray);
    textCenter('DESK RUSH', 6, 8, PALETTE.gold);
    const gw = this.GRID * this.CELL;
    rect(this.OX - 4, this.OY - 4, gw + 8, gw + 8, PALETTE.void);
    rect(this.OX - 2, this.OY - 2, gw + 4, gw + 4, '#7d4a2a');
    for (let r = 0; r < this.GRID; r++) {
      for (let c = 0; c < this.GRID; c++) {
        const x = this.OX + c * this.CELL;
        const y = this.OY + r * this.CELL;
        rect(x, y, this.CELL, this.CELL, (c + r) % 2 === 0 ? '#c4d3da' : '#aebfcc');
      }
    }
    const ex = this.OX + gw;
    const ey = this.OY + this.exitRow * this.CELL;
    rect(ex, ey, 8, this.CELL, PALETTE.dgreen);
    rect(ex + 2, ey + 4, 4, 2, PALETTE.cream);
    rect(ex + 2, ey + 12, 4, 2, PALETTE.cream);
    if (this.sel >= 0) {
      const p = this.pieces[this.sel];
      const x = this.OX + p.col * this.CELL;
      const y = this.OY + p.row * this.CELL;
      const w = (p.orient === 'h' ? p.len : 1) * this.CELL;
      const h = (p.orient === 'v' ? p.len : 1) * this.CELL;
      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
    this.pieces.forEach(this.drawDeskPiece, this);
    text('drag desks / arrows. get to the EXIT ->', 6, VH - 11, 6, PALETTE.cream);
    drawHUD();
    if (this.state === 'win') {
      rect(70, 60, 244, 96, PALETTE.void);
      rect(72, 62, 240, 92, PALETTE.dgray);
      textCenter('+30 COINS!', 78, 12, PALETTE.gold);
      textCenter('you escaped!', 98, 7, PALETTE.cream);
      uiButton('RETRY', 96, 120, 80, 22, PALETTE.dgreen);
      uiButton('MAP', 208, 120, 80, 22, PALETTE.purple);
    }
  }
};

const FIGHTERS = [
  { name: 'DAVID', role: 'CEO', shirt: PALETTE.blue, hair: PALETTE.gold, skin: PALETTE.cream,
    hp: 110, atk: 10, sp: 'EXEC ORDER', spType: 'dmg', spPow: 28 },
  { name: 'FEIFAN', role: 'Marketing', shirt: PALETTE.orange, hair: PALETTE.gold, skin: PALETTE.cream,
    hp: 90, atk: 9, sp: 'VIRAL CAMP', spType: 'drain', spPow: 18 },
  { name: 'NAO', role: 'Onboarding', shirt: PALETTE.dgreen, hair: '#3a2a1a', skin: PALETTE.cream,
    hp: 100, atk: 8, sp: 'TEAM BUILD', spType: 'buff', spPow: 6 },
  { name: 'MISAKI', role: 'Onboarding', shirt: PALETTE.purple, hair: '#1a1c2c', skin: PALETTE.cream,
    hp: 95, atk: 9, sp: 'HR REVIEW', spType: 'debuff', spPow: 5 },
  { name: 'MARIO', role: 'Engineer', shirt: PALETTE.red, hair: PALETTE.gold, skin: PALETTE.cream,
    hp: 100, atk: 11, sp: 'CODE PUSH', spType: 'dmg', spPow: 22 },
  { name: 'MATTHEW', role: 'Engineer', shirt: PALETTE.lblue, hair: PALETTE.gold, skin: PALETTE.cream,
    hp: 95, atk: 10, sp: 'MERGE CONFLICT', spType: 'dmg', spPow: 30 },
  { name: 'RAJ', role: 'Engineer', shirt: PALETTE.green, hair: '#1a1c2c', skin: '#d4a574',
    hp: 100, atk: 10, sp: 'CRASH REPORT', spType: 'dmg', spPow: 24 },
  { name: 'ATUL', role: 'Engineer', shirt: PALETTE.cream, hair: '#1a1c2c', skin: '#d4a574',
    hp: 105, atk: 9, sp: 'SYS REBOOT', spType: 'heal', spPow: 35 },
  { name: 'TETSUYA', role: 'Engineer', shirt: PALETTE.gray, hair: '#1a1c2c', skin: '#e8c8a0',
    hp: 90, atk: 12, sp: 'FINAL BUILD', spType: 'dmg', spPow: 26 }
];

const ENEMIES = [
  { name: 'SYNTAX ERROR', hp: 55, atk: 7, kind: 'glitch' },
  { name: 'DEVIL BOSS', hp: 85, atk: 13, kind: 'devil' }
];

function drawGlitchEnemy(x, y) {
  const cx = Math.floor(x), cy = Math.floor(y);
  const cols = [PALETTE.red, PALETTE.purple, PALETTE.orange, PALETTE.lblue];
  for (let i = 0; i < 6; i++) {
    rect(cx + (i % 3) * 5, cy + Math.floor(i / 3) * 6, 4, 5, cols[(i + (cx | 0)) % cols.length]);
  }
  rect(cx + 2, cy + 1, 2, 1, PALETTE.void);
  rect(cx + 8, cy + 1, 2, 1, PALETTE.void);
  rect(cx + 3, cy + 4, 6, 1, PALETTE.void);
}

function drawDevilBoss(x, y) {
  const cx = Math.floor(x), cy = Math.floor(y);
  rect(cx + 2, cy + 12, 10, 5, PALETTE.red);
  rect(cx + 3, cy + 11, 8, 1, PALETTE.red);
  rect(cx + 4, cy + 6, 6, 6, PALETTE.red);
  rect(cx + 3, cy + 3, 8, 4, PALETTE.red);
  rect(cx + 2, cy + 1, 2, 3, PALETTE.void);
  rect(cx + 3, cy + 0, 2, 2, PALETTE.void);
  rect(cx + 9, cy + 1, 2, 3, PALETTE.void);
  rect(cx + 8, cy + 0, 2, 2, PALETTE.void);
  rect(cx + 4, cy + 4, 1, 1, PALETTE.gold);
  rect(cx + 7, cy + 4, 1, 1, PALETTE.gold);
  rect(cx + 5, cy + 7, 2, 1, PALETTE.void);
  rect(cx + 1, cy + 17, 4, 3, '#3a2a1a');
  rect(cx + 9, cy + 17, 4, 3, '#3a2a1a');
}

function drawFighterPortrait(f, x, y, sel) {
  const cx = Math.floor(x), cy = Math.floor(y);
  rect(cx, cy, 36, 40, sel ? PALETTE.gold : PALETTE.dgray);
  rect(cx + 1, cy + 1, 34, 38, PALETTE.void);
  drawPerson(cx + 11, cy + 8, f.shirt, f.hair);
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = sel ? PALETTE.gold : PALETTE.cream;
  ctx.fillText(f.name, cx + 18, cy + 28);
  ctx.textAlign = 'left';
}

const FIGHT = {
  sub: 'select', selIdx: -1,
  enter: function () { this.sub = 'select'; this.selIdx = -1; this.startBattle(); },
  startBattle: function () {
    const f = FIGHTERS[this.selIdx >= 0 ? this.selIdx : 0];
    const e = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
    this.player = { name: f.name, hp: f.hp, maxhp: f.hp, atk: f.atk, buff: 0 };
    this.enemy = { name: e.name, hp: e.hp, maxhp: e.hp, atk: e.atk, debuff: 0, kind: e.kind };
    this.turn = 'player'; this.log = ['A ' + e.name + ' appears!']; this.logT = 0;
    this.spCd = 0; this.state = 'play'; this.shake = 0;
    this.pflash = 0; this.eflash = 0; this.fighter = f;
  },
  selectFighter: function (i) {
    this.selIdx = i; this.startBattle(); this.sub = 'battle';
  },
  doAttack: function () {
    if (this.turn !== 'player' || this.state !== 'play') return;
    const dmg = this.player.atk + this.player.buff + Math.floor(Math.random() * 4);
    this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
    this.eflash = 10; this.shake = 6;
    this.log = [this.player.name + ' attacks! ' + dmg + ' dmg'];
    this.logT = 0; this.endTurn();
  },
  doSpecial: function () {
    if (this.turn !== 'player' || this.state !== 'play' || this.spCd > 0) return;
    const f = this.fighter; let msg = '';
    if (f.spType === 'dmg') {
      const dmg = f.spPow + Math.floor(Math.random() * 5);
      this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
      this.eflash = 14; this.shake = 10;
      msg = f.sp + '! ' + dmg + ' dmg!';
    } else if (f.spType === 'drain') {
      const dmg = f.spPow + Math.floor(Math.random() * 4);
      this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
      this.player.hp = Math.min(this.player.maxhp, this.player.hp + Math.floor(dmg / 2));
      this.eflash = 12; this.pflash = 6;
      msg = f.sp + '! ' + dmg + ' dmg, healed!';
    } else if (f.spType === 'buff') {
      this.player.buff += f.spPow; this.pflash = 10;
      msg = f.sp + '! ATK +' + f.spPow;
    } else if (f.spType === 'debuff') {
      this.enemy.debuff += f.spPow; this.eflash = 10;
      msg = f.sp + '! enemy ATK -' + f.spPow;
    } else if (f.spType === 'heal') {
      const h = f.spPow; this.player.hp = Math.min(this.player.maxhp, this.player.hp + h);
      this.pflash = 12;
      msg = f.sp + '! healed ' + h;
    }
    this.spCd = 3; this.log = [msg]; this.logT = 0; this.endTurn();
  },
  endTurn: function () {
    if (this.enemy.hp <= 0) {
      this.state = 'win'; addCoins(50); return;
    }
    if (this.player.hp <= 0) { this.state = 'lose'; return; }
    this.turn = 'enemy'; this.logT = 0;
  },
  enemyTurn: function () {
    if (this.turn !== 'enemy' || this.state !== 'play') return;
    const dmg = Math.max(1, this.enemy.atk - this.enemy.debuff + Math.floor(Math.random() * 4) - 1);
    this.player.hp = Math.max(0, this.player.hp - dmg);
    this.pflash = 10; this.shake = 6;
    this.log = [this.enemy.name + ' hits! ' + dmg + ' dmg'];
    this.logT = 0; this.spCd = Math.max(0, this.spCd - 1);
    if (this.player.hp <= 0) { this.state = 'lose'; return; }
    this.turn = 'player';
  },
  update: function () {
    if (this.shake > 0) this.shake--;
    if (this.pflash > 0) this.pflash--;
    if (this.eflash > 0) this.eflash--;
    if (this.logT < 60) this.logT++;
    if (this.sub === 'select') {
      for (let i = 0; i < FIGHTERS.length; i++) {
        const col = i % 5, row = Math.floor(i / 5);
        const x = 14 + col * 74, y = 30 + row * 64;
        if (click && pointIn(click.x, click.y, x, y, 36, 40)) { this.selectFighter(i); return; }
      }
      return;
    }
    if (this.state === 'win' || this.state === 'lose') {
      if (click && pointIn(click.x, click.y, 96, 120, 80, 22)) { this.sub = 'select'; this.selIdx = -1; return; }
      if (click && pointIn(click.x, click.y, 208, 120, 80, 22)) setScreen('map');
      return;
    }
    if (this.turn === 'enemy' && this.logT >= 30) { this.enemyTurn(); return; }
    if (this.turn !== 'player') return;
    if (click && pointIn(click.x, click.y, 30, 150, 100, 22)) this.doAttack();
    if (click && pointIn(click.x, click.y, 142, 150, 100, 22)) this.doSpecial();
    if (click && pointIn(click.x, click.y, 254, 150, 100, 22)) setScreen('map');
  },
  drawHpBar: function (x, y, w, hp, maxhp, color) {
    rect(x, y, w, 8, PALETTE.void);
    rect(x + 1, y + 1, w - 2, 6, PALETTE.dgray);
    const pct = Math.max(0, hp / maxhp);
    rect(x + 1, y + 1, Math.floor((w - 2) * pct), 6, color);
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText(hp + '/' + maxhp, x + w / 2, y + 9);
    ctx.textAlign = 'left';
  },
  draw: function () {
    if (this.sub === 'select') { this.drawSelect(); return; }
    this.drawBattle();
  },
  drawSelect: function () {
    rect(0, 0, VW, VH, PALETTE.bg);
    rect(0, 0, VW, 20, PALETTE.dgray);
    textCenter('CHOOSE FIGHTER', 6, 8, PALETTE.gold);
    for (let i = 0; i < FIGHTERS.length; i++) {
      const f = FIGHTERS[i];
      const col = i % 5, row = Math.floor(i / 5);
      const x = 14 + col * 74, y = 30 + row * 64;
      const sel = (this.selIdx === i);
      const hover = pointIn(mouse.x, mouse.y, x, y, 36, 40);
      drawFighterPortrait(f, x, y, sel || hover);
      if (hover || sel) {
        ctx.font = '5px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = PALETTE.lblue;
        ctx.fillText(f.role, x + 18, y + 36);
        ctx.textAlign = 'left';
      }
    }
    if (this.selIdx >= 0) {
      const f = FIGHTERS[this.selIdx];
      textCenter(f.name + ' - ' + f.sp, VH - 16, 6, PALETTE.gold);
    } else {
      textCenter('click a character', VH - 16, 6, PALETTE.cream);
    }
    drawHUD();
  },
  drawBattle: function () {
    const sx = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    rect(0, 0, VW, VH, PALETTE.bg);
    rect(0, 0, VW, 20, PALETTE.dgray);
    textCenter('OFFICE BRAWL', 6, 8, PALETTE.gold);
    const f = this.fighter;
    const py = 120 - (this.pflash > 0 && this.pflash % 4 < 2 ? 2 : 0);
    if (this.pflash > 0 && this.pflash % 4 < 2) {
      drawPerson(40 + sx, py, PALETTE.white, f.hair);
    } else {
      drawPerson(40 + sx, py, f.shirt, f.hair);
    }
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(f.name, 49 + sx, py - 8);
    ctx.textAlign = 'left';
    this.drawHpBar(20, 80, 80, this.player.hp, this.player.maxhp, PALETTE.green);
    text('YOU', 20, 70, 6, PALETTE.cream);
    if (this.player.buff > 0) text('ATK+' + this.player.buff, 20, 92, 5, PALETTE.gold);
    const ex = 320 + sx * -1;
    const ey = 30 - (this.eflash > 0 && this.eflash % 4 < 2 ? 2 : 0);
    if (this.eflash > 0 && this.eflash % 4 < 2) {
      if (this.enemy.kind === 'glitch') drawGlitchEnemy(ex, ey);
      else drawDevilBoss(ex, ey);
    } else {
      if (this.enemy.kind === 'glitch') drawGlitchEnemy(ex, ey);
      else drawDevilBoss(ex, ey);
    }
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = PALETTE.red;
    ctx.fillText(this.enemy.name, ex + 7, ey - 8);
    ctx.textAlign = 'left';
    this.drawHpBar(280, 80, 80, this.enemy.hp, this.enemy.maxhp, PALETTE.red);
    text('ENEMY', 280, 70, 6, PALETTE.cream);
    if (this.enemy.debuff > 0) text('ATK-' + this.enemy.debuff, 280, 92, 5, PALETTE.gray);
    if (this.state === 'play') {
      const canAct = (this.turn === 'player');
      const spReady = this.spCd === 0;
      const ax = 30, sx2 = 142, fx = 254;
      const ah = canAct ? PALETTE.red : PALETTE.dgray;
      const sh = canAct && spReady ? f.shirt : PALETTE.dgray;
      uiButton('ATTACK', ax, 150, 100, 22, ah);
      uiButton(f.sp, sx2, 150, 100, 22, sh);
      uiButton('FLEE', fx, 150, 100, 22, PALETTE.purple);
      if (!spReady && this.spCd > 0) {
        ctx.font = '5px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = PALETTE.cream;
        ctx.fillText('CD:' + this.spCd, sx2 + 50, 144);
        ctx.textAlign = 'left';
      }
    }
    if (this.log.length > 0) {
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = PALETTE.cream;
      ctx.fillText(this.log[0], VW / 2, 112);
      ctx.textAlign = 'left';
    }
    drawHUD();
    if (this.state === 'win' || this.state === 'lose') {
      rect(70, 60, 244, 96, PALETTE.void);
      rect(72, 62, 240, 92, PALETTE.dgray);
      textCenter(this.state === 'win' ? '+50 COINS!' : 'DEFEATED', 78, 12, PALETTE.gold);
      textCenter(this.state === 'win' ? this.enemy.name + ' down!' : 'you were fired', 98, 7, PALETTE.cream);
      uiButton('RETRY', 96, 120, 80, 22, PALETTE.dgreen);
      uiButton('MAP', 208, 120, 80, 22, PALETTE.purple);
    }
  }
};

const PLUSHIE_POOLS = {
  interns: {
    label: 'INTERNS', color: PALETTE.green, price: 50,
    members: ['Noah', 'Noa', 'Saria', 'Sakurako', 'Shinon', 'Richard', 'Samer', 'Lamu']
  },
  suits: {
    label: 'SUITS', color: PALETTE.orange, price: 150,
    members: ['Nao', 'David', 'Feifan', 'Hagio-San']
  },
  engineers: {
    label: 'ENGINEERS', color: PALETTE.lblue, price: 400,
    members: ['Mario', 'Matthew', 'Tetsuya', 'Raj', 'Atul']
  }
};

let lootboxResult = null;

function rollLootbox(poolKey) {
  const pool = PLUSHIE_POOLS[poolKey];
  if (state.coins < pool.price) return;
  addCoins(-pool.price);
  const name = pool.members[Math.floor(Math.random() * pool.members.length)];
  const key = poolKey + ':' + name;
  if (state.plushies[key]) {
    state.plushies[key].count = (state.plushies[key].count || 1) + 1;
  } else {
    state.plushies[key] = { pool: poolKey, name: name, count: 1 };
  }
  saveState();
  lootboxResult = { poolKey: poolKey, name: name, t: 0 };
  setScreen('lootbox');
}

const SHOP = {
  draw: function () {
    rect(0, 0, VW, VH, PALETTE.bg);
    rect(0, 0, VW, 20, PALETTE.dgray);
    textCenter('SHOP', 6, 8, PALETTE.gold);
    const keys = ['interns', 'suits', 'engineers'];
    const prices = [50, 150, 400];
    const descs = ['intern plushies', 'exec plushies', 'eng plushies'];
    const boxW = 100, boxH = 80, gap = 14;
    const startX = (VW - (boxW * 3 + gap * 2)) / 2;
    for (let i = 0; i < 3; i++) {
      const k = keys[i];
      const pool = PLUSHIE_POOLS[k];
      const x = startX + i * (boxW + gap);
      const y = 30;
      const hover = pointIn(mouse.x, mouse.y, x, y, boxW, boxH);
      const affordable = state.coins >= pool.price;
      rect(x + 2, y + 3, boxW, boxH, PALETTE.void);
      rect(x, y, boxW, boxH, hover && affordable ? PALETTE.gold : pool.color);
      rect(x, y, boxW, 2, PALETTE.dgray);
      rect(x, y + boxH - 2, boxW, 2, PALETTE.dgray);
      rect(x, y, 2, boxH, PALETTE.dgray);
      rect(x + boxW - 2, y, 2, boxH, PALETTE.dgray);
      const cx = x + boxW / 2;
      rect(cx - 10, y + 12, 20, 16, PALETTE.void);
      rect(cx - 8, y + 14, 16, 12, pool.color);
      rect(cx - 6, y + 16, 4, 4, PALETTE.gold);
      rect(cx + 2, y + 16, 4, 4, PALETTE.gold);
      rect(cx - 3, y + 20, 6, 1, PALETTE.cream);
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = PALETTE.void;
      ctx.fillText(pool.label, cx, y + 34);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = affordable ? PALETTE.void : PALETTE.red;
      ctx.fillText(pool.price + 'C', cx, y + 50);
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.fillStyle = PALETTE.void;
      ctx.fillText(descs[i], cx, y + 64);
      ctx.textAlign = 'left';
      if (!affordable) {
        ctx.font = '6px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = PALETTE.red;
        ctx.fillText('need ' + pool.price + 'C', cx, y + 72);
        ctx.textAlign = 'left';
      }
    }
    uiButton('COLLECTION', VW / 2 - 54, 122, 108, 20, PALETTE.dgreen);
    uiButton('MAP', 6, 4, 50, 16, PALETTE.purple);
    textCenter('click a lootbox to open', VH - 13, 6, PALETTE.cream);
    drawHUD();
  },
  update: function () {
    if (!click) return;
    if (pointIn(click.x, click.y, 6, 4, 50, 16)) { setScreen('map'); return; }
    if (pointIn(click.x, click.y, VW / 2 - 54, 122, 108, 20)) { setScreen('collection'); return; }
    const keys = ['interns', 'suits', 'engineers'];
    const boxW = 100, gap = 14;
    const startX = (VW - (boxW * 3 + gap * 2)) / 2;
    for (let i = 0; i < 3; i++) {
      const x = startX + i * (boxW + gap);
      if (pointIn(click.x, click.y, x, 30, boxW, 80)) { rollLootbox(keys[i]); return; }
    }
  }
};

const LOOTBOX = {
  draw: function () {
    rect(0, 0, VW, VH, PALETTE.void);
    if (!lootboxResult) { setScreen('shop'); return; }
    const r = lootboxResult;
    r.t++;
    const pool = PLUSHIE_POOLS[r.poolKey];
    const phase = r.t;
    if (phase < 30) {
      const f = 30 - phase;
      const cx = VW / 2, cy = VH / 2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + phase * 0.1;
        const rad = f * 1.5;
        const px = cx + Math.cos(a) * rad;
        const py = cy + Math.sin(a) * rad;
        rect(px - 2, py - 2, 4, 4, [PALETTE.gold, PALETTE.cream, pool.color, PALETTE.lblue][i % 4]);
      }
      rect(cx - 16, cy - 16, 32, 32, pool.color);
      rect(cx - 12, cy - 12, 24, 24, PALETTE.void);
      if (phase % 6 < 3) rect(cx - 8, cy - 8, 16, 16, PALETTE.gold);
      else rect(cx - 8, cy - 8, 16, 16, pool.color);
      textCenter('OPENING...', cy + 24, 8, PALETTE.cream);
    } else {
      const cx = VW / 2, cy = 80;
      const owned = state.plushies[r.poolKey + ':' + r.name];
      const isNew = owned && owned.count === 1;
      rect(cx - 30, cy - 24, 60, 60, PALETTE.gold);
      rect(cx - 26, cy - 20, 52, 52, PALETTE.purple);
      drawPerson(cx - 7, cy - 4, pool.color, PALETTE.gold);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = PALETTE.gold;
      ctx.fillText('YOU GOT', cx, 24);
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = PALETTE.cream;
      ctx.fillText(r.name, cx, 40);
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.fillStyle = pool.color;
      ctx.fillText(pool.label, cx, 56);
      if (!isNew) {
        ctx.fillStyle = PALETTE.gray;
        ctx.fillText('DUPLICATE x' + owned.count, cx, 148);
      } else {
        ctx.fillStyle = PALETTE.gold;
        ctx.fillText('NEW!', cx, 148);
      }
      ctx.textAlign = 'left';
      uiButton('OPEN AGAIN', 60, 168, 110, 22, state.coins >= pool.price ? PALETTE.dgreen : PALETTE.dgray);
      uiButton('COLLECTION', 178, 168, 100, 22, PALETTE.orange);
      uiButton('MAP', 288, 168, 60, 22, PALETTE.purple);
      textCenter('coins: ' + state.coins, 144, 6, PALETTE.gold);
    }
    drawHUD();
  },
  update: function () {
    if (!lootboxResult) return;
    const r = lootboxResult;
    if (r.t < 30) return;
    const pool = PLUSHIE_POOLS[r.poolKey];
    if (click && pointIn(click.x, click.y, 60, 168, 110, 22) && state.coins >= pool.price) {
      rollLootbox(r.poolKey); return;
    }
    if (click && pointIn(click.x, click.y, 178, 168, 100, 22)) { setScreen('collection'); return; }
    if (click && pointIn(click.x, click.y, 288, 168, 60, 22)) { setScreen('map'); return; }
  }
};

const COLLECTION = {
  scroll: 0,
  enter: function () { this.scroll = 0; },
  draw: function () {
    rect(0, 0, VW, VH, PALETTE.bg);
    rect(0, 0, VW, 20, PALETTE.dgray);
    textCenter('COLLECTION', 6, 8, PALETTE.gold);
    const poolKeys = ['interns', 'suits', 'engineers'];
    let y = 26;
    const cellW = 36, cellH = 40, perRow = 8, gap = 3;
    const startX = 10;
    let totalOwned = 0, totalPlushies = 0;
    for (let pi = 0; pi < poolKeys.length; pi++) {
      const pool = PLUSHIE_POOLS[poolKeys[pi]];
      const startY = y - this.scroll;
      if (startY > -20 && startY < VH) {
        rect(6, startY - 2, VW - 12, 1, pool.color);
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = pool.color;
        ctx.fillText(pool.label, 10, startY + 2);
        let poolOwned = 0;
        for (let m = 0; m < pool.members.length; m++) {
          const key = poolKeys[pi] + ':' + pool.members[m];
          if (state.plushies[key]) poolOwned++;
        }
        totalPlushies += pool.members.length;
        totalOwned += poolOwned;
        ctx.textAlign = 'right';
        ctx.fillStyle = PALETTE.cream;
        ctx.fillText(poolOwned + '/' + pool.members.length, VW - 12, startY + 2);
        ctx.textAlign = 'left';
      }
      y += 14;
      for (let m = 0; m < pool.members.length; m++) {
        const col = m % perRow;
        const row = Math.floor(m / perRow);
        const x = startX + col * (cellW + gap);
        const cellY = y + row * (cellH + gap) - this.scroll;
        if (cellY > -cellH && cellY < VH) {
          const key = poolKeys[pi] + ':' + pool.members[m];
          const owned = state.plushies[key];
          rect(x, cellY, cellW, cellH, PALETTE.dgray);
          rect(x + 1, cellY + 1, cellW - 2, cellH - 2, PALETTE.void);
          if (owned) {
            drawPerson(x + 11, cellY + 6, pool.color, PALETTE.gold);
            if (owned.count > 1) {
              ctx.font = '5px "Press Start 2P", monospace';
              ctx.textAlign = 'right';
              ctx.textBaseline = 'top';
              ctx.fillStyle = PALETTE.gold;
              ctx.fillText('x' + owned.count, x + cellW - 3, cellY + 2);
              ctx.textAlign = 'left';
            }
            ctx.font = '5px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = PALETTE.cream;
            ctx.fillText(pool.members[m].substring(0, 6), x + cellW / 2, cellY + 26);
            ctx.textAlign = 'left';
          } else {
            ctx.globalAlpha = 0.5;
            drawPerson(x + 11, cellY + 6, PALETTE.dgray, PALETTE.dgray);
            ctx.globalAlpha = 1;
            ctx.font = '5px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = PALETTE.dgray;
            ctx.fillText('???', x + cellW / 2, cellY + 26);
            ctx.textAlign = 'left';
          }
        }
        totalPlushies++;
      }
      y += Math.ceil(pool.members.length / perRow) * (cellH + gap) + 6;
    }
    const maxScroll = Math.max(0, y - VH + 10);
    if (maxScroll > 0) {
      const sbH = VH - 30;
      rect(VW - 4, 24, 3, sbH, PALETTE.dgray);
      const thumbH = Math.max(10, sbH * VH / (y + 10));
      const thumbY = 24 + (sbH - thumbH) * (this.scroll / maxScroll);
      rect(VW - 4, thumbY, 3, thumbH, PALETTE.cream);
    }
    uiButton('MAP', 6, 4, 50, 16, PALETTE.purple);
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(totalOwned + '/' + totalPlushies, VW - 60, 6);
    ctx.textAlign = 'left';
    drawHUD();
  },
  update: function () {
    if (click && pointIn(click.x, click.y, 6, 4, 50, 16)) { setScreen('map'); return; }
    if (click && pointIn(click.x, click.y, VW - 6, 24, 6, VH - 30)) {
      this.dragging = true;
      return;
    }
    if (mouse.down && this.dragging) {
      const sbH = VH - 30;
      this.scroll = Math.max(0, Math.min(300, ((mouse.y - 24) / sbH) * 300));
    } else {
      this.dragging = false;
    }
    if (mouse.wheel) {
      this.scroll = Math.max(0, Math.min(300, this.scroll + mouse.wheel));
      mouse.wheel = 0;
    }
  }
};

const SCREENS = {
  intro: {
    draw: function () {
      rect(0, 0, VW, VH, PALETTE.purple);
      STARS.forEach(function (s) { rect(s[0], s[1], 2, 2, PALETTE.cream); });
      textCenter('ARCAIDIA', 50, 22, PALETTE.gold);
      textCenter('arcade of ai&', 80, 8, PALETTE.cream);
      uiButton('PLAY', VW / 2 - 34, 148, 68, 22, PALETTE.gold);
    },
    update: function () {
      if (click && pointIn(click.x, click.y, VW / 2 - 34, 148, 68, 22)) setScreen('map');
    }
  },
  map: {
    draw: function () {
      drawOfficeMap();
      MAP_ZONES.forEach(drawZone);
      uiButton('MENU', 6, 4, 50, 16, PALETTE.purple);
      textCenter('click a zone', VH - 13, 7, PALETTE.cream);
      drawHUD();
    },
    update: function () {
      if (!click) return;
      if (pointIn(click.x, click.y, 6, 4, 50, 16)) { setScreen('shop'); return; }
      for (let i = 0; i < MAP_ZONES.length; i++) {
        const z = MAP_ZONES[i];
        if (pointIn(click.x, click.y, z.x, z.y, z.w, z.h)) { setScreen(z.id); return; }
      }
    }
  },
  crossy: CROSSY,
  rush: RUSH,
  fight: FIGHT,
  shop: SHOP,
  lootbox: LOOTBOX,
  collection: COLLECTION
};

function loop(t) {
  ctx.fillStyle = PALETTE.void;
  ctx.fillRect(0, 0, VW, VH);
  const s = SCREENS[state.screen] || SCREENS.intro;
  s.draw();
  s.update();
  click = null;
  justPressed = {};
  requestAnimationFrame(loop);
}

function setupInput() {
  window.addEventListener('keydown', function (e) {
    const k = e.key;
    if (!keys[k]) justPressed[k] = true;
    keys[k] = true;
    if (k === 'Escape') setScreen('map');
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(k) !== -1) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) {
    keys[e.key] = false;
  });
  canvas.addEventListener('mousemove', function (e) {
    const r = canvas.getBoundingClientRect();
    const scale = r.width / VW;
    mouse.x = (e.clientX - r.left) / scale;
    mouse.y = (e.clientY - r.top) / scale;
  });
  canvas.addEventListener('mousedown', function (e) {
    const r = canvas.getBoundingClientRect();
    const scale = r.width / VW;
    mouse.down = true;
    click = { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  });
  window.addEventListener('mouseup', function () { mouse.down = false; });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    mouse.wheel += (e.deltaY > 0 ? 12 : -12);
  }, { passive: false });
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const scale = r.width / VW;
    mouse.down = true;
    mouse.x = (t.clientX - r.left) / scale;
    mouse.y = (t.clientY - r.top) / scale;
    click = { x: mouse.x, y: mouse.y };
  }, { passive: false });
  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const scale = r.width / VW;
    mouse.x = (t.clientX - r.left) / scale;
    mouse.y = (t.clientY - r.top) / scale;
  }, { passive: false });
  window.addEventListener('touchend', function () { mouse.down = false; });
}

function init() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  canvas.width = VW;
  canvas.height = VH;
  loadState();
  resize();
  setupInput();
  window.addEventListener('resize', resize);
  window.state = state;
  window.addCoins = addCoins;
  window.saveState = saveState;
  requestAnimationFrame(loop);
}

window.addEventListener('load', init);
