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

function drawFantasyMap() {
  for (let ty = 0; ty < VH; ty += 8) {
    for (let tx = 0; tx < VW; tx += 8) {
      const c = (((tx + ty) / 8) | 0) % 2 === 0 ? PALETTE.dgreen : PALETTE.green;
      rect(tx, ty, 8, 8, c);
    }
  }
  // pond
  rect(150, 70, 64, 30, PALETTE.blue);
  rect(154, 74, 56, 22, PALETTE.lblue);
  rect(156, 76, 12, 3, PALETTE.cream);
  // main dirt path
  rect(0, 102, VW, 6, PALETTE.gold);
  rect(0, 108, VW, 2, PALETTE.orange);
  // decorative bushes/trees
  const trees = [[18,18],[300,18],[60,170],[312,156],[210,28],[100,160]];
  trees.forEach(function (t) {
    rect(t[0] + 3, t[1] + 6, 4, 4, PALETTE.purple);
    rect(t[0], t[1], 10, 8, PALETTE.dgreen);
    rect(t[0] + 1, t[1] - 2, 8, 4, PALETTE.green);
  });
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
  { id: 'crossy', x: 14, y: 28, w: 80, h: 58, label: 'CROSSY', icon: 'road', color: PALETTE.green },
  { id: 'rush', x: 286, y: 26, w: 80, h: 58, label: 'RUSH HR', icon: 'cars', color: PALETTE.orange },
  { id: 'fight', x: 144, y: 134, w: 88, h: 58, label: 'FIGHTER', icon: 'sword', color: PALETTE.red }
];

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
      drawFantasyMap();
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
  crossy: placeholderScreen('CROSSY ROAD', 'reach the top   [ESC] map'),
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
