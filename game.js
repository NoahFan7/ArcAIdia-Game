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
let mouse = { x: 0, y: 0 };
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
  CELL: 18, COLS: 21, ROWS: 10,
  OX: 3, OY: 24,
  enter: function () { this.reset(); },
  cellX: function (c) { return this.OX + c * this.CELL; },
  cellY: function (r) { return this.OY + r * this.CELL; },
  reset: function () {
    this.pcol = 10; this.prow = 9;
    this.px = this.cellX(10); this.py = this.cellY(9);
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
      const speed = 0.022 + r * 0.0035;
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
      if (r === 0) c = PALETTE.dgreen;
      if (r === this.ROWS - 1) c = '#9aa6b8';
      rect(this.OX, y, this.COLS * this.CELL, this.CELL, c);
    }
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText('EXIT', this.OX + this.COLS * this.CELL / 2, this.cellY(0) + 9);
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
      textCenter(this.state === 'win' ? 'David made it!' : 'a coworker got you', 98, 7, PALETTE.cream);
      uiButton('RETRY', 96, 120, 80, 22, PALETTE.dgreen);
      uiButton('MAP', 208, 120, 80, 22, PALETTE.purple);
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
  rush: placeholderScreen('RUSH HOUR', 'free the car   [ESC] map'),
  fight: placeholderScreen('TURN FIGHTER', 'defeat enemy   [ESC] map'),
  shop: {
    draw: function () {
      rect(0, 0, VW, VH, PALETTE.bg);
      textCenter('SHOP', 36, 14, PALETTE.gold);
      textCenter('lootboxes coming soon', 78, 8, PALETTE.cream);
      uiButton('COLLECTION', VW / 2 - 54, 116, 108, 20, PALETTE.dgreen);
      textCenter('[ESC] map', VH - 15, 7, PALETTE.gray);
      drawHUD();
    },
    update: function () {
      if (click && pointIn(click.x, click.y, VW / 2 - 54, 116, 108, 20)) setScreen('collection');
    }
  },
  collection: placeholderScreen('COLLECTION', 'your plushies   [ESC] map')
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
    click = { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  });
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const scale = r.width / VW;
    mouse.x = (t.clientX - r.left) / scale;
    mouse.y = (t.clientY - r.top) / scale;
    click = { x: mouse.x, y: mouse.y };
  }, { passive: false });
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
  requestAnimationFrame(loop);
}

window.addEventListener('load', init);
