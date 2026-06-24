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

const SCREEN_ORDER = ['intro', 'map', 'crossy', 'mines', 'fight', 'shop', 'collection'];

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
  if (n > 0) playSfx('coin');
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
  const mx = VW - 92, my = 4;
  const mhover = pointIn(mouse.x, mouse.y, mx, my, 18, 14);
  rect(mx, my, 18, 14, mhover ? PALETTE.dgray : PALETTE.void);
  rect(mx + 1, my + 1, 16, 12, musicPlaying ? PALETTE.dgreen : PALETTE.dgray);
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = PALETTE.void;
  ctx.fillText(musicPlaying ? 'M' : 'X', mx + 9, my + 3);
  ctx.textAlign = 'left';
  if (click && pointIn(click.x, click.y, mx, my, 18, 14)) { toggleMusic(); playSfx('click'); }
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
  } else if (kind === 'hazard') {
    rect(cx - 12, cy - 2, 24, 8, PALETTE.gold);
    rect(cx - 11, cy - 1, 22, 6, PALETTE.void);
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText('!', cx, cy + 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
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
  { id: 'mines', x: 292, y: 30, w: 78, h: 54, label: 'MINES', icon: 'hazard', color: PALETTE.orange },
  { id: 'fight', x: 148, y: 98, w: 88, h: 48, label: 'FIGHTER', icon: 'sword', color: PALETTE.red }
];

const SKIN_TONES = { white: PALETTE.cream, tan: '#d4a574', brown: '#a06b3c' };
const HAIR_COLORS = { blonde: PALETTE.gold, black: '#1a1c2c', brown: '#5a3a1a', red: PALETTE.red };

const CHAR_DATA = {
  David:      { hair: HAIR_COLORS.blonde, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short' },
  Feifan:     { hair: HAIR_COLORS.blonde, skin: SKIN_TONES.white, gender: 'f', hairStyle: 'long' },
  Nao:        { hair: HAIR_COLORS.black, skin: SKIN_TONES.white, gender: 'f', hairStyle: 'long' },
  Misaki:     { hair: HAIR_COLORS.black, skin: SKIN_TONES.white, gender: 'f', hairStyle: 'long' },
  Mario:      { hair: HAIR_COLORS.blonde, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short' },
  Matthew:    { hair: HAIR_COLORS.blonde, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short' },
  Raj:        { hair: HAIR_COLORS.brown, skin: SKIN_TONES.brown, gender: 'm', hairStyle: 'short' },
  Atul:       { hair: HAIR_COLORS.brown, skin: SKIN_TONES.brown, gender: 'm', hairStyle: 'short' },
  Tetsuya:    { hair: HAIR_COLORS.black, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short' },
  Noah:       { hair: HAIR_COLORS.black, skin: SKIN_TONES.tan, gender: 'm', hairStyle: 'short' },
  Noa:        { hair: HAIR_COLORS.red, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short' },
  Saria:      { hair: HAIR_COLORS.brown, skin: SKIN_TONES.tan, gender: 'f', hairStyle: 'long' },
  Sakurako:   { hair: HAIR_COLORS.black, skin: SKIN_TONES.white, gender: 'f', hairStyle: 'long' },
  Shinon:     { hair: HAIR_COLORS.black, skin: SKIN_TONES.white, gender: 'f', hairStyle: 'long' },
  Richard:    { hair: HAIR_COLORS.black, skin: SKIN_TONES.tan, gender: 'm', hairStyle: 'short' },
  Samer:      { hair: HAIR_COLORS.black, skin: SKIN_TONES.brown, gender: 'm', hairStyle: 'short' },
  Lamu:       { hair: HAIR_COLORS.black, skin: SKIN_TONES.white, gender: 'f', hairStyle: 'long' },
  'Hagio-San':{ hair: HAIR_COLORS.black, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short' }
};

function charLooks(name) {
  return CHAR_DATA[name] || { hair: HAIR_COLORS.black, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short' };
}

function drawPerson(x, y, opts) {
  if (typeof opts === 'string') {
    opts = { shirt: opts, hair: arguments[3] || HAIR_COLORS.black, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short' };
  }
  const cx = Math.floor(x);
  const yy = Math.floor(y);
  const shirt = opts.shirt || PALETTE.blue;
  const hair = opts.hair || HAIR_COLORS.black;
  const skin = opts.skin || SKIN_TONES.white;
  const female = opts.gender === 'f';
  const longHair = opts.hairStyle === 'long' || female;
  const flash = opts.flash;
  const s = flash ? PALETTE.white : skin;
  const sh = flash ? PALETTE.white : shirt;
  const hr = flash ? PALETTE.white : hair;

  if (female) {
    rect(cx + 3, yy + 15, 10, 3, '#2a2a3a');
    rect(cx + 2, yy + 17, 12, 2, '#2a2a3a');
    rect(cx + 4, yy + 19, 2, 2, '#1a1a2a');
    rect(cx + 10, yy + 19, 2, 2, '#1a1a2a');
  } else {
    rect(cx + 3, yy + 15, 4, 4, '#2a2a3a');
    rect(cx + 9, yy + 15, 4, 4, '#2a2a3a');
    rect(cx + 3, yy + 18, 4, 1, '#1a1a2a');
    rect(cx + 9, yy + 18, 4, 1, '#1a1a2a');
  }
  if (female) {
    rect(cx + 3, yy + 10, 10, 5, sh);
    rect(cx + 4, yy + 13, 8, 2, sh);
    rect(cx + 5, yy + 10, 6, 1, '#3a3a4a');
  } else {
    rect(cx + 2, yy + 10, 12, 5, sh);
    rect(cx + 3, yy + 13, 10, 1, '#3a3a4a');
    rect(cx + 6, yy + 13, 4, 2, sh);
  }
  rect(cx + 1, yy + 10, 2, 5, sh);
  rect(cx + 13, yy + 10, 2, 5, sh);
  rect(cx + 1, yy + 14, 2, 2, s);
  rect(cx + 13, yy + 14, 2, 2, s);
  rect(cx + 6, yy + 8, 4, 2, s);
  rect(cx + 3, yy + 2, 10, 7, s);
  if (longHair) {
    rect(cx + 2, yy, 12, 4, hr);
    rect(cx + 1, yy + 1, 2, 11, hr);
    rect(cx + 13, yy + 1, 2, 11, hr);
    rect(cx + 3, yy + 2, 3, 2, hr);
    rect(cx + 10, yy + 2, 3, 2, hr);
    rect(cx + 3, yy + 6, 1, 3, s);
    rect(cx + 12, yy + 6, 1, 3, s);
  } else {
    rect(cx + 2, yy, 12, 3, hr);
    rect(cx + 2, yy + 1, 1, 3, hr);
    rect(cx + 13, yy + 1, 1, 3, hr);
    rect(cx + 3, yy + 2, 1, 1, hr);
    rect(cx + 12, yy + 2, 1, 1, hr);
  }
  rect(cx + 4, yy + 4, 2, 1, hr);
  rect(cx + 10, yy + 4, 2, 1, hr);
  rect(cx + 5, yy + 5, 1, 1, PALETTE.void);
  rect(cx + 10, yy + 5, 1, 1, PALETTE.void);
  if (female) {
    rect(cx + 6, yy + 6, 1, 1, PALETTE.red);
    rect(cx + 9, yy + 6, 1, 1, PALETTE.red);
  }
  rect(cx + 6, yy + 7, 4, 1, '#8a4a4a');
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
    const skins = [SKIN_TONES.white, SKIN_TONES.tan, SKIN_TONES.brown];
    const genders = ['m', 'f'];
    for (let r = 1; r < this.ROWS - 1; r++) {
      const dir = (r % 2 === 0) ? 1 : -1;
      const speed = 0.04 + r * 0.006;
      const count = 2 + (r % 2);
      const gap = this.COLS / count;
      const workers = [];
      for (let i = 0; i < count; i++) {
        const g = genders[(r + i) % 2];
        workers.push({
          col: (i * gap + r * 0.7) % this.COLS,
          dir: dir, speed: speed,
          shirt: shirts[(r + i) % shirts.length],
          hair: hairs[(i + r) % hairs.length],
          skin: skins[(r + i * 2) % skins.length],
          gender: g,
          hairStyle: g === 'f' ? 'long' : 'short'
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
          if (Math.abs(ws[j].col + 0.5 - pfcol) < 0.7) { this.state = 'dead'; this.flash = 20; playSfx('lose'); break; }
        }
      }
      if (vrow <= 0) {
        this.state = 'win';
        addCoins(10); playSfx('win');
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
        drawPerson(this.cellX(w.col), this.cellY(lane.row), w);
      }
    }
    if (this.flash > 0 && (this.flash % 4) < 2) {
      drawPerson(this.px, this.py, { shirt: PALETTE.blue, hair: HAIR_COLORS.blonde, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short', flash: true });
    } else {
      drawPerson(this.px, this.py, { shirt: PALETTE.blue, hair: HAIR_COLORS.blonde, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short' });
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

const MINES = {
  COLS: 12, ROWS: 9, CELL: 18,
  NUM_HAZARDS: 12,
  OX: 4, OY: 22,
  get W() { return this.COLS * this.CELL; },
  get H() { return this.ROWS * this.CELL; },
  enter: function () { this.reset(); },
  reset: function () {
    this.state = 'play';
    this.grid = [];
    for (let r = 0; r < this.ROWS; r++) {
      this.grid.push([]);
      for (let c = 0; c < this.COLS; c++) {
        this.grid[r].push({ hazard: false, revealed: false, flagged: false, adj: 0 });
      }
    }
    this.firstClick = true;
    this.flags = 0;
    this.revealedCount = 0;
    this.startTime = 0;
    this.flashT = 0;
  },
  placeHazards: function (safeR, safeC) {
    const spots = [];
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
        spots.push([r, c]);
      }
    }
    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = spots[i]; spots[i] = spots[j]; spots[j] = tmp;
    }
    for (let i = 0; i < Math.min(this.NUM_HAZARDS, spots.length); i++) {
      const [r, c] = spots[i];
      this.grid[r][c].hazard = true;
    }
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.grid[r][c].hazard) continue;
        let n = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < this.ROWS && nc >= 0 && nc < this.COLS && this.grid[nr][nc].hazard) n++;
          }
        }
        this.grid[r][c].adj = n;
      }
    }
  },
  floodReveal: function (r, c) {
    const stack = [[r, c]];
    while (stack.length > 0) {
      const [cr, cc] = stack.pop();
      if (cr < 0 || cr >= this.ROWS || cc < 0 || cc >= this.COLS) continue;
      const cell = this.grid[cr][cc];
      if (cell.revealed || cell.flagged || cell.hazard) continue;
      cell.revealed = true;
      this.revealedCount++;
      if (cell.adj === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            stack.push([cr + dr, cc + dc]);
          }
        }
      }
    }
  },
  cellAt: function (px, py) {
    const c = Math.floor((px - this.OX) / this.CELL);
    const r = Math.floor((py - this.OY) / this.CELL);
    if (c < 0 || c >= this.COLS || r < 0 || r >= this.ROWS) return null;
    return { r: r, c: c };
  },
  update: function () {
    if (this.flashT > 0) this.flashT--;
    if (this.state === 'win' || this.state === 'dead') {
      if (click && pointIn(click.x, click.y, 96, 120, 80, 22)) this.reset();
      if (click && pointIn(click.x, click.y, 208, 120, 80, 22)) setScreen('map');
      return;
    }
    if (!click) return;
    const hit = this.cellAt(click.x, click.y);
    if (!hit) return;
    const cell = this.grid[hit.r][hit.c];
    const isRightClick = click.button === 2;
    if (isRightClick || (keys['Shift'] && !cell.revealed)) {
      if (!cell.revealed) {
        cell.flagged = !cell.flagged;
        this.flags += cell.flagged ? 1 : -1;
      }
      return;
    }
    if (cell.flagged || cell.revealed) return;
    if (this.firstClick) {
      this.firstClick = false;
      this.placeHazards(hit.r, hit.c);
      this.startTime = Date.now();
    }
    if (cell.hazard) {
      this.state = 'dead';
      this.flashT = 20;
      playSfx('lose');
      for (let r = 0; r < this.ROWS; r++) {
        for (let c = 0; c < this.COLS; c++) {
          if (this.grid[r][c].hazard) this.grid[r][c].revealed = true;
        }
      }
      return;
    }
    this.floodReveal(hit.r, hit.c);
    if (this.revealedCount >= this.COLS * this.ROWS - this.NUM_HAZARDS) {
      this.state = 'win';
      addCoins(30); playSfx('win');
    }
  },
  numColor: function (n) {
    const colors = [PALETTE.void, PALETTE.blue, PALETTE.dgreen, PALETTE.red, PALETTE.purple, PALETTE.orange, PALETTE.lblue, PALETTE.gray, PALETTE.cream];
    return colors[n] || PALETTE.cream;
  },
  draw: function () {
    rect(0, 0, VW, VH, PALETTE.bg);
    rect(0, 0, VW, 20, PALETTE.dgray);
    textCenter('OFFICE MINESWEEPER', 6, 8, PALETTE.gold);
    const remaining = this.NUM_HAZARDS - this.flags;
    text('hazards:' + remaining, 6, VH - 11, 6, PALETTE.orange);
    if (this.startTime > 0 && this.state === 'play') {
      const t = Math.floor((Date.now() - this.startTime) / 1000);
      text('time:' + t + 's', VW - 70, VH - 11, 6, PALETTE.cream);
    }
    drawHUD();
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const x = this.OX + c * this.CELL;
        const y = this.OY + r * this.CELL;
        const cell = this.grid[r][c];
        if (cell.revealed) {
          const isHaz = cell.hazard;
          rect(x, y, this.CELL, this.CELL, isHaz ? PALETTE.red : PALETTE.dgray);
          rect(x + 1, y + 1, this.CELL - 2, this.CELL - 2, isHaz ? '#7a2a35' : '#4a5570');
          if (isHaz) {
            rect(x + 5, y + 4, 8, 8, PALETTE.void);
            rect(x + 6, y + 5, 6, 6, PALETTE.red);
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = PALETTE.cream;
            ctx.fillText('!', x + this.CELL / 2, y + this.CELL / 2 + 1);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
          } else if (cell.adj > 0) {
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this.numColor(cell.adj);
            ctx.fillText(String(cell.adj), x + this.CELL / 2, y + this.CELL / 2 + 1);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
          }
        } else {
          rect(x, y, this.CELL, this.CELL, '#5a6a80');
          rect(x + 1, y + 1, this.CELL - 2, this.CELL - 2, '#6b7c94');
          rect(x + 1, y + this.CELL - 3, this.CELL - 2, 2, '#3a4458');
          rect(x + this.CELL - 3, y + 1, 2, this.CELL - 2, '#3a4458');
          if (cell.flagged) {
            rect(x + 3, y + 4, 10, 6, PALETTE.gold);
            rect(x + 3, y + 4, 3, 6, PALETTE.red);
            rect(x + 4, y + 10, 4, 4, PALETTE.void);
          }
        }
      }
    }
    const hover = this.cellAt(mouse.x, mouse.y);
    if (hover && this.state === 'play') {
      const x = this.OX + hover.c * this.CELL;
      const y = this.OY + hover.r * this.CELL;
      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, this.CELL - 1, this.CELL - 1);
    }
    if (this.state === 'win' || this.state === 'dead') {
      rect(70, 60, 244, 96, PALETTE.void);
      rect(72, 62, 240, 92, PALETTE.dgray);
      textCenter(this.state === 'win' ? '+30 COINS!' : 'BOOM!', 78, 12, PALETTE.gold);
      textCenter(this.state === 'win' ? 'office cleared!' : 'you hit a hazard', 98, 7, PALETTE.cream);
      uiButton('RETRY', 96, 120, 80, 22, PALETTE.dgreen);
      uiButton('MAP', 208, 120, 80, 22, PALETTE.purple);
    }
  }
};

const FIGHTERS = [
  { name: 'DAVID', role: 'CEO', shirt: PALETTE.blue, hair: HAIR_COLORS.blonde, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short',
    hp: 110, atk: 10, sp: 'EXEC ORDER', spType: 'dmg', spPow: 28 },
  { name: 'FEIFAN', role: 'Marketing', shirt: PALETTE.orange, hair: HAIR_COLORS.blonde, skin: SKIN_TONES.white, gender: 'f', hairStyle: 'long',
    hp: 90, atk: 9, sp: 'VIRAL CAMP', spType: 'drain', spPow: 18 },
  { name: 'NAO', role: 'Onboarding', shirt: PALETTE.dgreen, hair: HAIR_COLORS.black, skin: SKIN_TONES.white, gender: 'f', hairStyle: 'long',
    hp: 100, atk: 8, sp: 'TEAM BUILD', spType: 'buff', spPow: 6 },
  { name: 'MISAKI', role: 'Onboarding', shirt: PALETTE.purple, hair: HAIR_COLORS.black, skin: SKIN_TONES.white, gender: 'f', hairStyle: 'long',
    hp: 95, atk: 9, sp: 'HR REVIEW', spType: 'debuff', spPow: 5 },
  { name: 'MARIO', role: 'Engineer', shirt: PALETTE.red, hair: HAIR_COLORS.blonde, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short',
    hp: 100, atk: 11, sp: 'CODE PUSH', spType: 'dmg', spPow: 22 },
  { name: 'MATTHEW', role: 'Engineer', shirt: PALETTE.lblue, hair: HAIR_COLORS.blonde, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short',
    hp: 95, atk: 10, sp: 'MERGE CONFLICT', spType: 'dmg', spPow: 30 },
  { name: 'RAJ', role: 'Engineer', shirt: PALETTE.green, hair: HAIR_COLORS.brown, skin: SKIN_TONES.brown, gender: 'm', hairStyle: 'short',
    hp: 100, atk: 10, sp: 'CRASH REPORT', spType: 'dmg', spPow: 24 },
  { name: 'ATUL', role: 'Engineer', shirt: PALETTE.cream, hair: HAIR_COLORS.brown, skin: SKIN_TONES.brown, gender: 'm', hairStyle: 'short',
    hp: 105, atk: 9, sp: 'SYS REBOOT', spType: 'heal', spPow: 35 },
  { name: 'TETSUYA', role: 'Engineer', shirt: PALETTE.gray, hair: HAIR_COLORS.black, skin: SKIN_TONES.white, gender: 'm', hairStyle: 'short',
    hp: 90, atk: 12, sp: 'FINAL BUILD', spType: 'dmg', spPow: 26 }
];

const ENEMY_WAVES = [
  [{ name: 'SYNTAX ERROR', hp: 45, atk: 6, kind: 'glitch' }],
  [{ name: 'BUG REPORT', hp: 55, atk: 8, kind: 'glitch' }],
  [{ name: 'DEVIL BOSS', hp: 100, atk: 14, kind: 'devil' }]
];

function drawGlitchEnemy(x, y) {
  const cx = Math.floor(x), cy = Math.floor(y);
  const cols = [PALETTE.red, PALETTE.purple, PALETTE.orange, PALETTE.lblue];
  rect(cx + 3, cy + 10, 10, 6, PALETTE.dgray);
  rect(cx + 4, cy + 15, 3, 4, '#3a2a3a');
  rect(cx + 9, cy + 15, 3, 4, '#3a2a3a');
  rect(cx + 2, cy + 8, 12, 3, PALETTE.purple);
  rect(cx + 3, cy + 2, 10, 7, PALETTE.void);
  for (let i = 0; i < 6; i++) {
    const gx = cx + 3 + (i % 3) * 3;
    const gy = cy + 2 + Math.floor(i / 3) * 3;
    rect(gx, gy, 2, 2, cols[(i + ((cx | 0) % 4)) % cols.length]);
  }
  rect(cx + 4, cy + 5, 2, 1, PALETTE.gold);
  rect(cx + 9, cy + 5, 2, 1, PALETTE.gold);
  rect(cx + 5, cy + 8, 6, 1, PALETTE.void);
  rect(cx + 1, cy + 4, 2, 3, PALETTE.lblue);
  rect(cx + 13, cy + 4, 2, 3, PALETTE.lblue);
}

function drawDevilBoss(x, y) {
  const cx = Math.floor(x), cy = Math.floor(y);
  rect(cx + 4, cy + 14, 8, 5, PALETTE.red);
  rect(cx + 5, cy + 18, 2, 3, '#3a2a1a');
  rect(cx + 9, cy + 18, 2, 3, '#3a2a1a');
  rect(cx + 3, cy + 8, 10, 7, PALETTE.red);
  rect(cx + 2, cy + 10, 2, 4, PALETTE.red);
  rect(cx + 12, cy + 10, 2, 4, PALETTE.red);
  rect(cx + 3, cy + 3, 10, 6, PALETTE.red);
  rect(cx + 2, cy + 0, 3, 4, PALETTE.void);
  rect(cx + 3, cy + 0, 1, 2, PALETTE.red);
  rect(cx + 11, cy + 0, 3, 4, PALETTE.void);
  rect(cx + 12, cy + 0, 1, 2, PALETTE.red);
  rect(cx + 4, cy + 4, 2, 2, PALETTE.gold);
  rect(cx + 9, cy + 4, 2, 2, PALETTE.gold);
  rect(cx + 4, cy + 5, 1, 1, PALETTE.void);
  rect(cx + 10, cy + 5, 1, 1, PALETTE.void);
  rect(cx + 5, cy + 7, 5, 1, PALETTE.void);
  rect(cx + 6, cy + 8, 3, 1, '#8a2a2a');
}

function drawFighterPortrait(f, x, y, sel) {
  const cx = Math.floor(x), cy = Math.floor(y);
  rect(cx, cy, 36, 40, sel ? PALETTE.gold : PALETTE.dgray);
  rect(cx + 1, cy + 1, 34, 38, PALETTE.void);
  drawPerson(cx + 11, cy + 8, f);
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
    this.fighter = f;
    this.player = { name: f.name, hp: f.hp, maxhp: f.hp, atk: f.atk, buff: 0 };
    this.wave = 0; this.maxWave = ENEMY_WAVES.length;
    this.spCd = 0; this.state = 'play'; this.shake = 0;
    this.pflash = 0; this.eflash = 0;
    this.spAnim = null; this.slashAnim = null;
    this.lungeT = 0; this.elungeT = 0;
    this.spawnEnemy();
  },
  spawnEnemy: function () {
    const e = ENEMY_WAVES[this.wave][0];
    this.enemy = { name: e.name, hp: e.hp, maxhp: e.hp, atk: e.atk, debuff: 0, kind: e.kind };
    this.turn = 'player';
    this.log = ['Round ' + (this.wave + 1) + '/' + this.maxWave + ': ' + e.name + ' appears!'];
    this.logT = 0;
  },
  selectFighter: function (i) {
    this.selIdx = i; this.startBattle(); this.sub = 'battle';
  },
  doAttack: function () {
    if (this.turn !== 'player' || this.state !== 'play') return;
    const dmg = this.player.atk + this.player.buff + Math.floor(Math.random() * 4);
    this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
    this.eflash = 10; this.shake = 6; this.lungeT = 12;
    this.slashAnim = { t: 0, max: 16, fromPlayer: true };
    playSfx('hit');
    this.log = [this.player.name + ' attacks! ' + dmg + ' dmg'];
    this.logT = 0; this.endTurn();
  },
  doSpecial: function () {
    if (this.turn !== 'player' || this.state !== 'play' || this.spCd > 0) return;
    const f = this.fighter; let msg = '';
    this.spAnim = { type: f.spType, name: f.sp, t: 0, max: 40 };
    if (f.spType === 'dmg') {
      const dmg = f.spPow + Math.floor(Math.random() * 5);
      this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
      this.eflash = 14; this.shake = 10; this.lungeT = 16;
      msg = f.sp + '! ' + dmg + ' dmg!';
    } else if (f.spType === 'drain') {
      const dmg = f.spPow + Math.floor(Math.random() * 4);
      this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
      this.player.hp = Math.min(this.player.maxhp, this.player.hp + Math.floor(dmg / 2));
      this.eflash = 12; this.pflash = 6; this.lungeT = 14;
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
      this.wave++;
      if (this.wave >= this.maxWave) {
        this.state = 'win'; addCoins(50); playSfx('win'); return;
      }
      this.log = [this.enemy.name + ' defeated! Next round...'];
      this.logT = 0;
      this.state = 'wave';
      return;
    }
    if (this.player.hp <= 0) { this.state = 'lose'; playSfx('lose'); return; }
    this.turn = 'enemy'; this.logT = 0;
  },
  enemyTurn: function () {
    if (this.turn !== 'enemy' || this.state !== 'play') return;
    const dmg = Math.max(1, this.enemy.atk - this.enemy.debuff + Math.floor(Math.random() * 4) - 1);
    this.player.hp = Math.max(0, this.player.hp - dmg);
    this.pflash = 10; this.shake = 6; this.elungeT = 12;
    this.slashAnim = { t: 0, max: 16, fromPlayer: false };
    this.log = [this.enemy.name + ' hits! ' + dmg + ' dmg'];
    this.logT = 0; this.spCd = Math.max(0, this.spCd - 1);
    if (this.player.hp <= 0) { this.state = 'lose'; playSfx('lose'); return; }
    this.turn = 'player';
  },
  update: function () {
    if (this.shake > 0) this.shake--;
    if (this.pflash > 0) this.pflash--;
    if (this.eflash > 0) this.eflash--;
    if (this.lungeT > 0) this.lungeT--;
    if (this.elungeT > 0) this.elungeT--;
    if (this.spAnim) { this.spAnim.t++; if (this.spAnim.t >= this.spAnim.max) this.spAnim = null; }
    if (this.slashAnim) { this.slashAnim.t++; if (this.slashAnim.t >= this.slashAnim.max) this.slashAnim = null; }
    if (this.logT < 60) this.logT++;
    if (this.sub === 'select') {
      for (let i = 0; i < FIGHTERS.length; i++) {
        const col = i % 5, row = Math.floor(i / 5);
        const x = 14 + col * 74, y = 30 + row * 64;
        if (click && pointIn(click.x, click.y, x, y, 36, 40)) { this.selectFighter(i); return; }
      }
      return;
    }
    if (this.state === 'wave') {
      if (this.logT >= 45) { this.spawnEnemy(); this.state = 'play'; }
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
  drawSlashAnim: function (px, py, ex, ey) {
    if (!this.slashAnim) return;
    const a = this.slashAnim;
    const t = a.t;
    const p = t / a.max;
    const fromP = a.fromPlayer;
    const tx = fromP ? ex + 7 : px + 9;
    const ty = fromP ? ey + 9 : py + 9;
    const startX = fromP ? px + 20 : ex;
    const curX = startX + (tx - startX) * p;
    const arcY = ty - Math.sin(p * Math.PI) * 8;
    const angle = fromP ? 0.5 : -0.5;
    const len = 14;
    const dx = Math.cos(angle) * len / 2;
    const dy = Math.sin(angle) * len / 2;
    const alpha = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
    ctx.save();
    ctx.globalAlpha = alpha;
    const cols = [PALETTE.gray, PALETTE.cream, PALETTE.white];
    for (let i = 0; i < 3; i++) {
      const off = (i - 1) * 2;
      ctx.strokeStyle = cols[i];
      ctx.lineWidth = 3 - i;
      ctx.beginPath();
      ctx.moveTo(curX - dx + off, arcY - dy + off);
      ctx.lineTo(curX + dx + off, arcY + dy + off);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const sp = (i / 4 + p * 0.5) % 1;
      const sx = curX + (Math.random() - 0.5) * 6;
      const sy = arcY + (Math.random() - 0.5) * 6;
      rect(sx - 0.5, sy - 0.5, 1, 1, PALETTE.cream);
    }
    ctx.restore();
  },
  drawSpAnim: function (px, py, ex, ey) {
    if (!this.spAnim) return;
    const a = this.spAnim;
    const t = a.t;
    const p = t / a.max;
    const cx = VW / 2;
    if (a.type === 'dmg') {
      const numP = 8 + Math.floor(t / 3);
      for (let i = 0; i < numP; i++) {
        const ang = (i / numP) * Math.PI * 2 + t * 0.2;
        const rad = 4 + t * 1.2;
        const x = ex + 7 + Math.cos(ang) * rad;
        const y = ey + 9 + Math.sin(ang) * rad;
        const cols = [PALETTE.red, PALETTE.orange, PALETTE.gold, PALETTE.cream];
        rect(x - 1, y - 1, 2, 2, cols[i % cols.length]);
      }
      if (t > 8 && t < 24 && t % 4 < 2) {
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = PALETTE.gold;
        ctx.fillText('POW!', ex + 7, ey - 4);
        ctx.textAlign = 'left';
      }
    } else if (a.type === 'drain') {
      for (let i = 0; i < 6; i++) {
        const sp = (i / 6 + p) % 1;
        const x = ex + 7 + (px + 7 - (ex + 7)) * sp;
        const y = ey + 9 + (py + 9 - (ey + 9)) * sp - Math.sin(sp * Math.PI) * 20;
        rect(x - 1, y - 1, 2, 2, PALETTE.purple);
        rect(x - 2, y - 2, 4, 4, PALETTE.lblue);
      }
      if (t % 6 < 3) {
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = PALETTE.purple;
        ctx.fillText('DRAIN!', cx, ey - 12);
        ctx.textAlign = 'left';
      }
    } else if (a.type === 'buff') {
      for (let i = 0; i < 5; i++) {
        const sp = (i / 5 + p * 2) % 1;
        const x = px + 7 + Math.sin(t * 0.3 + i) * 12;
        const y = py + 20 - sp * 30;
        rect(x - 1, y - 1, 2, 2, PALETTE.gold);
        if (sp > 0.8) rect(x - 2, y - 2, 4, 4, PALETTE.cream);
      }
      if (t % 8 < 4) {
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = PALETTE.gold;
        ctx.fillText('BUFF UP!', px + 7, py - 12);
        ctx.textAlign = 'left';
      }
    } else if (a.type === 'debuff') {
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + t * 0.15;
        const rad = 10 + Math.sin(t * 0.2 + i) * 4;
        const x = ex + 7 + Math.cos(ang) * rad;
        const y = ey + 9 + Math.sin(ang) * rad;
        rect(x - 1, y - 1, 2, 2, PALETTE.gray);
      }
      if (t % 8 < 4) {
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = PALETTE.gray;
        ctx.fillText('WEAKEN!', ex + 7, ey - 12);
        ctx.textAlign = 'left';
      }
    } else if (a.type === 'heal') {
      for (let i = 0; i < 5; i++) {
        const sp = (i / 5 + p) % 1;
        const x = px + 3 + (i % 3) * 5 + Math.sin(t * 0.2 + i) * 3;
        const y = py + 20 - sp * 25;
        rect(x - 1, y - 1, 2, 2, PALETTE.green);
        if (sp > 0.7) {
          rect(x - 2, y - 3, 4, 2, PALETTE.green);
          rect(x - 1, y - 5, 2, 2, PALETTE.green);
        }
      }
      if (t % 8 < 4) {
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = PALETTE.green;
        ctx.fillText('+HEAL!', px + 7, py - 12);
        ctx.textAlign = 'left';
      }
    }
  },
  drawBattle: function () {
    const sx = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    rect(0, 0, VW, VH, PALETTE.bg);
    rect(0, 0, VW, 20, PALETTE.dgray);
    textCenter('OFFICE BRAWL', 6, 8, PALETTE.gold);
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText('Round ' + (this.wave + 1) + '/' + this.maxWave, VW / 2, 23);
    ctx.textAlign = 'left';
    rect(0, 110, VW, 2, PALETTE.dgray);
    const f = this.fighter;
    const baseY = 90;
    const plunge = this.lungeT > 0 ? Math.sin((this.lungeT / 12) * Math.PI) * 20 : 0;
    const elunge = this.elungeT > 0 ? Math.sin((this.elungeT / 12) * Math.PI) * -20 : 0;
    const py = baseY - (this.pflash > 0 && this.pflash % 4 < 2 ? 2 : 0);
    const px = 30 + plunge + sx;
    const ex = 320 + elunge + sx * -1;
    const ey = baseY - (this.eflash > 0 && this.eflash % 4 < 2 ? 2 : 0);
    if (this.pflash > 0 && this.pflash % 4 < 2) {
      drawPerson(px, py, { shirt: f.shirt, hair: f.hair, skin: f.skin, gender: f.gender, hairStyle: f.hairStyle, flash: true });
    } else {
      drawPerson(px, py, { shirt: f.shirt, hair: f.hair, skin: f.skin, gender: f.gender, hairStyle: f.hairStyle });
    }
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(f.name, px + 9, py - 8);
    ctx.textAlign = 'left';
    this.drawHpBar(20, 30, 80, this.player.hp, this.player.maxhp, PALETTE.green);
    text('YOU', 20, 20, 6, PALETTE.cream);
    if (this.player.buff > 0) text('ATK+' + this.player.buff, 20, 42, 5, PALETTE.gold);
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
    ctx.fillText(this.enemy.name, ex + 8, ey - 8);
    ctx.textAlign = 'left';
    this.drawHpBar(280, 30, 80, this.enemy.hp, this.enemy.maxhp, PALETTE.red);
    text('ENEMY', 280, 20, 6, PALETTE.cream);
    if (this.enemy.debuff > 0) text('ATK-' + this.enemy.debuff, 280, 42, 5, PALETTE.gray);
    this.drawSpAnim(px, py, ex, ey);
    this.drawSlashAnim(px, py, ex, ey);
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
      ctx.fillText(this.log[0], VW / 2, 114);
      ctx.textAlign = 'left';
    }
    drawHUD();
    if (this.state === 'win' || this.state === 'lose') {
      rect(70, 60, 244, 96, PALETTE.void);
      rect(72, 62, 240, 92, PALETTE.dgray);
      textCenter(this.state === 'win' ? '+50 COINS!' : 'DEFEATED', 78, 12, PALETTE.gold);
      textCenter(this.state === 'win' ? 'all rounds cleared!' : 'you were fired', 98, 7, PALETTE.cream);
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
      drawPerson(cx - 8, cy - 4, { shirt: pool.color, hair: charLooks(r.name).hair, skin: charLooks(r.name).skin, gender: charLooks(r.name).gender, hairStyle: charLooks(r.name).hairStyle });
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
            const cl = charLooks(pool.members[m]);
            drawPerson(x + 11, cellY + 6, { shirt: pool.color, hair: cl.hair, skin: cl.skin, gender: cl.gender, hairStyle: cl.hairStyle });
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
            drawPerson(x + 11, cellY + 6, { shirt: PALETTE.dgray, hair: PALETTE.dgray, skin: PALETTE.dgray, gender: 'm', hairStyle: 'short' });
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
      if (click && pointIn(click.x, click.y, VW / 2 - 34, 148, 68, 22)) { startMusic(); setScreen('map'); }
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
  mines: MINES,
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
    click = { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale, button: e.button };
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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
