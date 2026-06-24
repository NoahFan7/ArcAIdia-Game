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

function placeholderScreen(name, hint, next) {
  return {
    draw: function () {
      rect(0, 0, VW, VH, PALETTE.bg);
      textCenter(name, 60, 12, PALETTE.gold);
      textCenter(hint, 110, 8, PALETTE.cream);
      textCenter('[SPACE] next  [ESC] map', 160, 8, PALETTE.gray);
      drawHUD();
    },
    update: function () {
      if (justPressed[' ']) setScreen(next || 'map');
    }
  };
}

const SCREENS = {
  intro: placeholderScreen('ArcAIdia', 'press PLAY to begin', 'map'),
  map: placeholderScreen('WORLD MAP', 'choose a game', 'crossy'),
  crossy: placeholderScreen('CROSSY ROAD', 'reach the top', 'rush'),
  rush: placeholderScreen('RUSH HOUR', 'free the target car', 'fight'),
  fight: placeholderScreen('TURN FIGHTER', 'defeat the enemy', 'shop'),
  shop: placeholderScreen('SHOP', 'buy lootboxes', 'collection'),
  collection: placeholderScreen('COLLECTION', 'your plushies', 'intro')
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
