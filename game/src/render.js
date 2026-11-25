// Duskline Kitchen Rush — the renderer: every pixel the game shows, drawn in canvas.
// Original art only: no images, no fonts from the network (system fonts), warm dusk palette.
import { BINS, FLOOR, INGREDIENTS, RECIPES, STATIONS, VIEW } from './config.js';
import { recipeFor } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_DAY_END = 'dayend';
export const SCREEN_OVER = 'over';

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
function text(ctx, str, x, y, size, color, weight, align, font) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px ${font || 'Trebuchet MS, Verdana, sans-serif'}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}
function mmss(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** One ingredient's icon, drawn centred at (x, y) at size s. */
export function drawIngredientIcon(ctx, id, x, y, s) {
  const ing = INGREDIENTS[id] || INGREDIENTS.burnt;
  const c = ing.color;
  const d = ing.dark;
  ctx.save();
  ctx.translate(x, y);
  if (ing.shape === 'bun') {
    ctx.fillStyle = d; rr(ctx, -s * 0.42, -s * 0.08, s * 0.84, s * 0.3, s * 0.12); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, -s * 0.06, s * 0.44, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff2cf';
    ctx.beginPath(); ctx.arc(-s * 0.18, -s * 0.3, s * 0.05, 0, 7); ctx.arc(s * 0.12, -s * 0.38, s * 0.05, 0, 7); ctx.arc(s * 0.28, -s * 0.22, s * 0.04, 0, 7); ctx.fill();
  } else if (ing.shape === 'patty') {
    ctx.fillStyle = d; rr(ctx, -s * 0.46, -s * 0.14, s * 0.92, s * 0.3, s * 0.14); ctx.fill();
    ctx.fillStyle = c; rr(ctx, -s * 0.44, -s * 0.2, s * 0.88, s * 0.26, s * 0.12); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.arc(-s * 0.2, -s * 0.06, s * 0.05, 0, 7); ctx.arc(s * 0.16, -s * 0.08, s * 0.06, 0, 7); ctx.fill();
  } else if (ing.shape === 'leaf') {
    ctx.fillStyle = d;
    ctx.beginPath(); ctx.arc(-s * 0.2, 0, s * 0.26, 0, 7); ctx.arc(s * 0.2, 0, s * 0.26, 0, 7); ctx.fill();
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(-s * 0.18, -s * 0.04, s * 0.24, 0, 7); ctx.arc(s * 0.18, -s * 0.04, s * 0.24, 0, 7); ctx.fill();
    ctx.strokeStyle = d; ctx.lineWidth = s * 0.05;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.2); ctx.lineTo(0, s * 0.18); ctx.stroke();
  } else if (ing.shape === 'tomato') {
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, s * 0.04, s * 0.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff8a80'; ctx.beginPath(); ctx.arc(-s * 0.14, -s * 0.1, s * 0.12, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a7d22';
    ctx.beginPath(); ctx.moveTo(0, -s * 0.3); ctx.lineTo(-s * 0.16, -s * 0.44); ctx.lineTo(0, -s * 0.36); ctx.lineTo(s * 0.16, -s * 0.44); ctx.closePath(); ctx.fill();
  } else if (ing.shape === 'cheese') {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(-s * 0.44, s * 0.26); ctx.lineTo(s * 0.44, s * 0.26); ctx.lineTo(0, -s * 0.36); ctx.closePath(); ctx.fill();
    ctx.fillStyle = d;
    ctx.beginPath(); ctx.arc(-s * 0.1, s * 0.08, s * 0.07, 0, 7); ctx.arc(s * 0.14, -s * 0.1, s * 0.06, 0, 7); ctx.fill();
  } else if (ing.shape === 'onion') {
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, 7); ctx.fill();
    ctx.strokeStyle = d; ctx.lineWidth = s * 0.06;
    ctx.beginPath(); ctx.arc(0, 0, s * 0.26, 0, 7); ctx.arc(0, 0, s * 0.12, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#7dc242'; ctx.lineWidth = s * 0.07;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.38); ctx.lineTo(0, -s * 0.52); ctx.stroke();
  } else if (ing.shape === 'potato') {
    ctx.fillStyle = d; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, s * 0.3, 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -s * 0.03, s * 0.38, s * 0.26, 0.3, 0, 7); ctx.fill();
  } else if (ing.shape === 'fries') {
    ctx.fillStyle = '#d63c2f';
    ctx.beginPath(); ctx.moveTo(-s * 0.34, -s * 0.1); ctx.lineTo(s * 0.34, -s * 0.1); ctx.lineTo(s * 0.24, s * 0.42); ctx.lineTo(-s * 0.24, s * 0.42); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c;
    rr(ctx, -s * 0.3, -s * 0.5, s * 0.14, s * 0.5, s * 0.05); ctx.fill();
    rr(ctx, -s * 0.06, -s * 0.56, s * 0.14, s * 0.56, s * 0.05); ctx.fill();
    rr(ctx, s * 0.18, -s * 0.48, s * 0.14, s * 0.48, s * 0.05); ctx.fill();
  } else if (ing.shape === 'egg') {
    ctx.fillStyle = id === 'eggCooked' ? '#fff7d6' : '#fdf6e3';
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.44, s * 0.34, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffb020'; ctx.beginPath(); ctx.arc(s * 0.06, 0, s * 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffcf5c'; ctx.beginPath(); ctx.arc(s * 0.02, -s * 0.04, s * 0.08, 0, 7); ctx.fill();
  } else if (ing.shape === 'sauce') {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.46); ctx.quadraticCurveTo(s * 0.4, -s * 0.05, s * 0.3, s * 0.2);
    ctx.quadraticCurveTo(s * 0.2, s * 0.44, 0, s * 0.44); ctx.quadraticCurveTo(-s * 0.2, s * 0.44, -s * 0.3, s * 0.2);
    ctx.quadraticCurveTo(-s * 0.4, -s * 0.05, 0, -s * 0.46); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(-s * 0.12, -s * 0.05, s * 0.07, 0, 7); ctx.fill();
  } else { // burnt
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath(); ctx.arc(-s * 0.12, s * 0.05, s * 0.3, 0, 7); ctx.arc(s * 0.18, 0, s * 0.28, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(180,180,180,0.7)'; ctx.lineWidth = s * 0.05;
    ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.3); ctx.quadraticCurveTo(-s * 0.2, -s * 0.5, -s * 0.05, -s * 0.58); ctx.stroke();
  }
  ctx.restore();
}

export function createRenderer(canvas) {
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  const ctx = canvas.getContext('2d');

  function drawBackground() {
    // Dusk wall and window: the kitchen sits under a purple-orange evening sky.
    const wall = ctx.createLinearGradient(0, 0, 0, 180);
    wall.addColorStop(0, '#3b2b52');
    wall.addColorStop(1, '#6b3a5e');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, VIEW.width, 168);
    // Wall tiles.
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let x = 16; x < 1280; x += 64) ctx.fillRect(x, 152, 56, 10);
    // Floor: warm checker tiles.
    for (let y = FLOOR.y; y < FLOOR.y + FLOOR.height; y += 54) {
      for (let x = FLOOR.x; x < FLOOR.x + FLOOR.width; x += 54) {
        const odd = ((x - FLOOR.x) / 54 + (y - FLOOR.y) / 54) % 2 === 0;
        ctx.fillStyle = odd ? '#a4713f' : '#96622f';
        ctx.fillRect(x, y, 54, 54);
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;
    for (let y = FLOOR.y; y <= FLOOR.y + FLOOR.height; y += 54) { ctx.beginPath(); ctx.moveTo(FLOOR.x, y); ctx.lineTo(FLOOR.x + FLOOR.width, y); ctx.stroke(); }
    for (let x = FLOOR.x; x <= FLOOR.x + FLOOR.width; x += 54) { ctx.beginPath(); ctx.moveTo(x, FLOOR.y); ctx.lineTo(x, FLOOR.y + FLOOR.height); ctx.stroke(); }
    // Rug under the assembly counter.
    ctx.fillStyle = '#7a3b4f'; rr(ctx, 900, 470, 340, 110, 14); ctx.fill();
    ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 3; rr(ctx, 912, 482, 316, 86, 10); ctx.stroke();
  }

  function drawOrderBoard(state) {
    // Wooden board, top-left, with one ticket per open order.
    ctx.fillStyle = '#5d3a1a'; rr(ctx, 16, 64, 688, 92, 12); ctx.fill();
    ctx.fillStyle = '#7a4f26'; rr(ctx, 22, 70, 676, 80, 9); ctx.fill();
    text(ctx, 'ORDER BOARD', 36, 82, 13, '#ffd34d', 800);
    text(ctx, `${state.orders.length}/${3} tickets`, 640, 82, 12, '#e8cfa8', 600, 'right');
    if (state.orders.length === 0) {
      text(ctx, 'No orders yet — the evening rush is coming…', 36, 122, 16, '#f5e6c8', 600);
      return;
    }
    state.orders.forEach((order, i) => {
      const x = 30 + i * 222;
      const y = 92;
      const frac = Math.max(0, order.patience / order.max);
      ctx.fillStyle = '#fff8e7'; rr(ctx, x, y, 210, 52, 8); ctx.fill();
      ctx.fillStyle = order.recipe.color; rr(ctx, x, y, 6, 52, 3); ctx.fill();
      text(ctx, order.recipe.name.toUpperCase(), x + 14, y + 13, 13, '#33241a', 800);
      text(ctx, `$${order.recipe.price}`, x + 198, y + 13, 13, '#8a5a00', 800, 'right');
      order.recipe.needs.forEach((need, j) => drawIngredientIcon(ctx, need, x + 22 + j * 26, y + 33, 22));
      // Patience bar.
      ctx.fillStyle = '#e0d3bd'; rr(ctx, x + 14, y + 44, 182, 5, 2.5); ctx.fill();
      ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#ffb020' : '#e5484d';
      rr(ctx, x + 14, y + 44, 182 * frac, 5, 2.5); ctx.fill();
    });
  }

  function drawServeWindow(state) {
    const s = STATIONS.serve;
    // Striped awning.
    for (let i = 0; i < 8; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? '#d63c2f' : '#fff8e7';
      ctx.fillRect(s.x + i * 68, s.y, 68, 22);
    }
    ctx.fillStyle = '#4a2c14'; rr(ctx, s.x, s.y + 22, s.width, s.height - 22, 8); ctx.fill();
    ctx.fillStyle = '#6b4226'; rr(ctx, s.x + 6, s.y + 28, s.width - 12, s.height - 36, 6); ctx.fill();
    text(ctx, 'SERVE WINDOW', s.x + 18, s.y + 46, 16, '#ffd34d', 800);
    text(ctx, 'Deliver finished plates here  •  E', s.x + 18, s.y + 68, 12, '#f5e6c8', 600);
    // Service bell.
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(s.x + s.width - 46, s.y + 48, 16, Math.PI, 0); ctx.fill();
    ctx.fillRect(s.x + s.width - 62, s.y + 48, 32, 5);
    ctx.fillStyle = '#8a5a00'; ctx.beginPath(); ctx.arc(s.x + s.width - 46, s.y + 58, 4, 0, 7); ctx.fill();
    // Customers waiting at the window, one per open order, in a row on the
    // right of the sign so they never touch the text, the bell or the awning.
    const faces = ['#f2c89b', '#8a5a3b', '#e8b48a'];
    const hairs = ['#33241a', '#6b4226', '#1c1c1c'];
    state.orders.forEach((order, i) => {
      const cx = s.x + 280 + i * 80;
      const cy = s.y + 44;
      const worried = order.patience / order.max < 0.3;
      ctx.fillStyle = faces[i % 3]; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, 7); ctx.fill();
      ctx.fillStyle = hairs[i % 3]; ctx.beginPath(); ctx.arc(cx, cy - 6, 16, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#1c1c1c';
      ctx.beginPath(); ctx.arc(cx - 6, cy - 1, worried ? 2.2 : 1.8, 0, 7); ctx.arc(cx + 6, cy - 1, worried ? 2.2 : 1.8, 0, 7); ctx.fill();
      ctx.strokeStyle = '#1c1c1c'; ctx.lineWidth = 1.8;
      ctx.beginPath();
      if (worried) ctx.arc(cx, cy + 10, 4, Math.PI * 1.1, Math.PI * 1.9);
      else ctx.arc(cx, cy + 5, 5, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    });
  }

  function drawBins() {
    BINS.forEach((bin) => {
      ctx.fillStyle = '#3f6d8e'; rr(ctx, bin.x, bin.y, bin.width, bin.height, 10); ctx.fill();
      ctx.fillStyle = '#2c4f68'; rr(ctx, bin.x + 4, bin.y + 4, bin.width - 8, bin.height - 8, 8); ctx.fill();
      ctx.fillStyle = '#dceefb'; rr(ctx, bin.x + 8, bin.y + 8, bin.width - 16, 44, 6); ctx.fill();
      drawIngredientIcon(ctx, bin.item, bin.x + bin.width / 2, bin.y + 30, 36);
      text(ctx, bin.label, bin.x + bin.width / 2, bin.y + 68, 11, '#fff', 700, 'center');
    });
    const t = STATIONS.trash;
    ctx.fillStyle = '#555'; rr(ctx, t.x, t.y, t.width, t.height, 10); ctx.fill();
    ctx.fillStyle = '#333'; rr(ctx, t.x + 8, t.y + 8, t.width - 16, t.height - 16, 8); ctx.fill();
    ctx.strokeStyle = '#bbb'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(t.x + 40, t.y + 26); ctx.lineTo(t.x + t.width - 40, t.y + 26); ctx.stroke();
    text(ctx, 'TRASH', t.x + t.width / 2, t.y + 58, 13, '#ddd', 800, 'center');
    text(ctx, 'Q drops held item', t.x + t.width / 2, t.y + 74, 10, '#aaa', 600, 'center');
  }

  function drawBoard(state) {
    const b = STATIONS.board;
    ctx.fillStyle = '#8a6d4b'; rr(ctx, b.x - 6, b.y - 6, b.width + 12, b.height + 12, 10); ctx.fill();
    ctx.fillStyle = '#c9a06a'; rr(ctx, b.x, b.y, b.width, b.height, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 2;
    for (let i = 1; i < 4; i += 1) { ctx.beginPath(); ctx.moveTo(b.x + i * 55, b.y + 6); ctx.lineTo(b.x + i * 55, b.y + b.height - 6); ctx.stroke(); }
    text(ctx, b.label, b.x + b.width / 2, b.y - 14, 12, '#ffd9a0', 800, 'center');
    if (state.board.item) {
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2 + 6;
      drawIngredientIcon(ctx, state.board.item, cx, cy, 44);
      if (!state.board.done) {
        // Chop progress: three knife marks.
        for (let i = 0; i < 3; i += 1) {
          ctx.fillStyle = i < state.board.chops ? '#58b368' : '#e0d3bd';
          ctx.beginPath(); ctx.arc(cx - 26 + i * 26, cy + 26, 6, 0, 7); ctx.fill();
        }
        // Knife, bobbing while a chop lands.
        const bob = state.board.knife > 0 ? -14 * (state.board.knife / 0.25) : 0;
        ctx.save();
        ctx.translate(cx + 52, cy - 18 + bob);
        ctx.rotate(-0.5);
        ctx.fillStyle = '#cfd6dd'; rr(ctx, 0, -5, 46, 10, 4); ctx.fill();
        ctx.fillStyle = '#33241a'; rr(ctx, -22, -5, 24, 10, 4); ctx.fill();
        ctx.restore();
        text(ctx, 'Press E to chop!', cx, b.y + b.height + 16, 12, '#fff', 700, 'center');
      } else {
        text(ctx, 'CHOPPED — take it!', cx, b.y + b.height + 16, 12, '#8fd14f', 800, 'center');
      }
    } else {
      text(ctx, 'Chop lettuce • tomato • onion', b.x + b.width / 2, b.y + b.height / 2 + 4, 12, '#6b4a26', 600, 'center');
    }
  }

  function drawStove(state) {
    const s = STATIONS.stove;
    ctx.fillStyle = '#3a3f4a'; rr(ctx, s.x - 6, s.y - 6, s.width + 12, s.height + 12, 10); ctx.fill();
    ctx.fillStyle = '#23262e'; rr(ctx, s.x, s.y, s.width, s.height, 8); ctx.fill();
    text(ctx, s.label, s.x + s.width / 2, s.y - 14, 12, '#ffd9a0', 800, 'center');
    state.burners.forEach((burner) => {
      const { x, y } = burner;
      // Pan.
      ctx.fillStyle = '#14161c'; ctx.beginPath(); ctx.arc(x, y, 30, 0, 7); ctx.fill();
      ctx.fillStyle = '#2c2f38'; ctx.beginPath(); ctx.arc(x, y, 25, 0, 7); ctx.fill();
      // Flame licking the pan's base, drawn after the pan so it shows.
      if (burner.state === 'cooking') {
        const flick = Math.sin(state.steam * 9 + x) * 3;
        ctx.fillStyle = '#ff7b24';
        ctx.beginPath(); ctx.moveTo(x - 20, y + 22);
        ctx.quadraticCurveTo(x - 14, y + 36 + flick, x - 4, y + 24);
        ctx.quadraticCurveTo(x, y + 38 + flick, x + 4, y + 24);
        ctx.quadraticCurveTo(x + 14, y + 36 + flick, x + 20, y + 22);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffd34d';
        ctx.beginPath(); ctx.moveTo(x - 9, y + 23);
        ctx.quadraticCurveTo(x - 5, y + 32, x, y + 24);
        ctx.quadraticCurveTo(x + 5, y + 32, x + 9, y + 23);
        ctx.closePath(); ctx.fill();
      }
      if (burner.item) {
        drawIngredientIcon(ctx, burner.state === 'burnt' ? 'burnt' : burner.item, x, y, 34);
        if (burner.state === 'cooking' || burner.state === 'done') {
          const frac = Math.min(1, burner.progress);
          ctx.fillStyle = '#e0d3bd'; rr(ctx, x - 26, y + 42, 52, 6, 3); ctx.fill();
          ctx.fillStyle = burner.state === 'done' ? '#58b368' : '#ff9d5c';
          rr(ctx, x - 26, y + 42, 52 * frac, 6, 3); ctx.fill();
        }
        if (burner.state === 'done') text(ctx, 'READY!', x, y - 40, 12, '#8fd14f', 800, 'center');
        if (burner.state === 'burnt') text(ctx, 'BURNT!', x, y - 40, 12, '#ff6b6b', 800, 'center');
      } else {
        text(ctx, 'empty', x, y, 11, '#777', 600, 'center');
      }
    });
    text(ctx, 'Cook patty • egg • potato — don\'t burn it!', s.x + s.width / 2, s.y + s.height + 16, 12, '#fff', 600, 'center');
  }

  function drawPlates(state) {
    const p = STATIONS.plates;
    ctx.fillStyle = '#7d8894'; rr(ctx, p.x - 6, p.y - 6, p.width + 12, p.height + 12, 10); ctx.fill();
    ctx.fillStyle = '#aeb8c2'; rr(ctx, p.x, p.y, p.width, p.height, 8); ctx.fill();
    text(ctx, p.label, p.x + p.width / 2, p.y - 14, 12, '#ffd9a0', 800, 'center');
    state.plates.forEach((plate) => {
      const ready = recipeFor(plate.items);
      if (ready) {
        const pulse = 0.5 + 0.5 * Math.sin(state.steam * 5);
        ctx.strokeStyle = `rgba(255,211,77,${0.5 + pulse * 0.5})`;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(plate.x, plate.y + 8, 66, 30, 0, 0, 7); ctx.stroke();
      }
      // Plate.
      ctx.fillStyle = '#f4f1ea'; ctx.beginPath(); ctx.ellipse(plate.x, plate.y + 8, 58, 24, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#c9c2b2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(plate.x, plate.y + 8, 58, 24, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = '#e8e2d4'; ctx.beginPath(); ctx.ellipse(plate.x, plate.y + 4, 44, 17, 0, 0, 7); ctx.fill();
      // The stack, mid-assembly, in the order it was added.
      plate.items.forEach((item, i) => {
        drawIngredientIcon(ctx, item, plate.x, plate.y - 4 - i * 13, 30);
      });
      if (plate.items.length === 0) text(ctx, 'empty plate', plate.x, plate.y - 8, 11, '#8a8578', 600, 'center');
      if (ready) {
        text(ctx, `${ready.name.toUpperCase()} READY!`, plate.x, plate.y + 52, 11, '#7a4a00', 800, 'center');
        ctx.fillStyle = '#ffd34d';
        [[-52, -30], [52, -34], [-44, -52]].forEach(([dx, dy]) => {
          const tw = 0.5 + 0.5 * Math.sin(state.steam * 6 + dx);
          ctx.globalAlpha = 0.5 + tw * 0.5;
          ctx.beginPath(); ctx.arc(plate.x + dx, plate.y + dy, 3, 0, 7); ctx.fill();
        });
        ctx.globalAlpha = 1;
      } else if (plate.items.length > 0) {
        let names = plate.items.map((i) => INGREDIENTS[i].name).join(' + ');
        if (names.length > 26) names = `${names.slice(0, 24)}…`;
        text(ctx, names, plate.x, plate.y + 52, 11, '#4a4438', 600, 'center');
      }
    });
  }

  function drawChef(state) {
    const chef = state.chef;
    const bob = chef.moving ? Math.sin(chef.walkPhase) * 3 : 0;
    const x = chef.x;
    const y = chef.y + bob * 0.4;
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(chef.x, chef.y + 26, 24, 8, 0, 0, 7); ctx.fill();
    // Move-target marker.
    if (chef.moveX !== null && chef.moveY !== null) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(chef.moveX, chef.moveY, 8 + Math.sin(state.steam * 6) * 2, 0, 7); ctx.stroke();
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(chef.dir, 1);
    // Tail.
    ctx.strokeStyle = '#e8862e'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-16, 8); ctx.quadraticCurveTo(-34, 2, -30, -14 + bob); ctx.stroke();
    // Legs.
    ctx.fillStyle = '#c96f1e';
    const step = chef.moving ? Math.sin(chef.walkPhase) * 4 : 0;
    ctx.beginPath(); ctx.ellipse(-8, 24, 7, 5, 0, 0, 7); ctx.ellipse(8 + step, 24, 7, 5, 0, 0, 7); ctx.fill();
    // Body + apron.
    ctx.fillStyle = '#f59a2e'; ctx.beginPath(); ctx.ellipse(0, 8, 20, 20, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff8e7'; ctx.beginPath(); ctx.ellipse(4, 12, 13, 13, 0, 0, 7); ctx.fill();
    // Arms.
    ctx.strokeStyle = '#f59a2e'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(12, 2); ctx.lineTo(24, -6 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(-22, -4 - bob); ctx.stroke();
    // Head.
    ctx.fillStyle = '#f59a2e'; ctx.beginPath(); ctx.arc(2, -20, 17, 0, 7); ctx.fill();
    // Ears.
    ctx.fillStyle = '#f59a2e';
    ctx.beginPath(); ctx.moveTo(-10, -32); ctx.lineTo(-14, -46); ctx.lineTo(-2, -36); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, -34); ctx.lineTo(16, -47); ctx.lineTo(20, -33); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffcf9e';
    ctx.beginPath(); ctx.moveTo(-10, -34); ctx.lineTo(-12, -42); ctx.lineTo(-5, -36); ctx.closePath(); ctx.fill();
    // Chef hat.
    ctx.fillStyle = '#fff'; rr(ctx, -12, -52, 30, 12, 6); ctx.fill();
    ctx.beginPath(); ctx.arc(-6, -52, 9, 0, 7); ctx.arc(4, -55, 10, 0, 7); ctx.arc(14, -52, 9, 0, 7); ctx.fill();
    // Face.
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath(); ctx.arc(8, -22, 2.4, 0, 7); ctx.arc(16, -22, 2.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#d63c2f'; ctx.beginPath(); ctx.arc(12, -16, 2.6, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a5a3b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(12, -14); ctx.quadraticCurveTo(8, -10, 4, -12); ctx.moveTo(12, -14); ctx.quadraticCurveTo(16, -10, 20, -12); ctx.stroke();
    // Whiskers.
    ctx.strokeStyle = 'rgba(60,30,10,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-12, -18); ctx.lineTo(-24, -20); ctx.moveTo(-12, -14); ctx.lineTo(-24, -12); ctx.stroke();
    ctx.restore();
    // Held item floats above the chef's paws.
    if (chef.held) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(x, y - 52, 18, 0, 7); ctx.fill();
      drawIngredientIcon(ctx, chef.held, x, y - 52, 32);
      text(ctx, INGREDIENTS[chef.held].name, x, y - 76, 12, '#fff', 700, 'center');
    }
  }

  function drawHud(state) {
    // Top bar.
    ctx.fillStyle = '#241a33'; ctx.fillRect(0, 0, VIEW.width, 56);
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(30, 26, 4, 0, 7); ctx.arc(38, 22, 5, 0, 7); ctx.arc(46, 26, 4, 0, 7); ctx.fill();
    ctx.fillRect(26, 26, 24, 6);
    text(ctx, 'DUSKLINE KITCHEN RUSH', 60, 22, 20, '#ffd34d', 800);
    text(ctx, 'Milo the cat chef  •  WASD move  •  E interact  •  Q trash  •  P pause', 60, 42, 11, '#c9b8e8', 600);
    // Shift timer, centre.
    const t = mmss(state.shiftLeft);
    const tFrac = state.shiftLeft / 150;
    ctx.fillStyle = '#3a2c52'; rr(ctx, 500, 12, 280, 32, 8); ctx.fill();
    ctx.fillStyle = tFrac > 0.3 ? '#58b368' : '#e5484d';
    rr(ctx, 500, 12, 280 * tFrac, 32, 8); ctx.fill();
    text(ctx, `SHIFT ${t}`, 640, 28, 18, '#fff', 800, 'center');
    // Coins, hearts, day, combo.
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(820, 28, 11, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a5a00'; text(ctx, '$', 820, 29, 13, '#8a5a00', 800, 'center');
    text(ctx, `${state.coins}`, 838, 28, 20, '#fff', 800);
    text(ctx, `DAY ${state.day}`, 920, 28, 16, '#fff', 800);
    for (let i = 0; i < 3; i += 1) {
      const hx = 1010 + i * 30;
      ctx.fillStyle = i < state.hearts ? '#ff5c7a' : 'rgba(255,255,255,0.2)';
      ctx.beginPath(); ctx.arc(hx - 5, 24, 7, 0, 7); ctx.arc(hx + 5, 24, 7, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(hx - 11, 26); ctx.lineTo(hx, 40); ctx.lineTo(hx + 11, 26); ctx.closePath(); ctx.fill();
    }
    if (state.combo >= 2) {
      ctx.fillStyle = '#ff9d5c';
      ctx.beginPath(); ctx.moveTo(1150, 14); ctx.quadraticCurveTo(1168, 26, 1162, 36); ctx.quadraticCurveTo(1158, 42, 1150, 42); ctx.quadraticCurveTo(1142, 42, 1138, 36); ctx.quadraticCurveTo(1132, 26, 1150, 14); ctx.fill();
      text(ctx, `COMBO x${state.combo}`, 1172, 28, 15, '#ff9d5c', 800);
    }
  }

  function drawParticles(state) {
    // Steam over cooking burners.
    for (const burner of state.burners) {
      if (burner.state !== 'cooking' && burner.state !== 'done') continue;
      for (let i = 0; i < 2; i += 1) {
        const age = ((state.steam * 0.7 + i * 0.5 + burner.x * 0.01) % 1);
        ctx.globalAlpha = 0.35 * (1 - age);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(burner.x + Math.sin(age * 9 + i) * 8, burner.y - 20 - age * 46, 4 + age * 7, 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const f of state.floaters) {
      ctx.globalAlpha = Math.min(1, f.life);
      text(ctx, f.text, f.x, f.y, 18, f.color, 800, 'center');
    }
    ctx.globalAlpha = 1;
    if (state.messageLeft > 0 && state.message) {
      ctx.fillStyle = 'rgba(20,12,32,0.85)'; rr(ctx, 340, 556, 600, 34, 10); ctx.fill();
      text(ctx, state.message, 640, 574, 15, '#ffd34d', 700, 'center');
    }
  }

  function overlayPanel(title, lines, accent, footer) {
    ctx.fillStyle = 'rgba(18,10,30,0.78)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#241a33'; rr(ctx, 340, 130, 600, 460, 18); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 3; rr(ctx, 340, 130, 600, 460, 18); ctx.stroke();
    text(ctx, title, 640, 180, 40, accent, 800, 'center');
    lines.forEach((line, i) => text(ctx, line.text, 640, 240 + i * 36, line.size || 18, line.color || '#f5e6c8', line.weight || 600, 'center'));
    if (footer) text(ctx, footer, 640, 540, 17, '#ffd34d', 700, 'center');
  }

  function draw(state, screen, best) {
    drawBackground();
    drawOrderBoard(state);
    drawServeWindow(state);
    drawBins();
    drawBoard(state);
    drawStove(state);
    drawPlates(state);
    drawChef(state);
    drawParticles(state);
    drawHud(state);

    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(18,10,30,0.62)';
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      text(ctx, 'DUSKLINE', 640, 190, 84, '#ffd34d', 800, 'center');
      text(ctx, 'KITCHEN RUSH', 640, 268, 84, '#ff9d5c', 800, 'center');
      text(ctx, 'Milo the cat chef runs the busiest kitchen on Duskline Lane.', 640, 340, 20, '#fff', 600, 'center');
      text(ctx, 'Chop it. Fry it. Stack it. Serve it — before the ticket walks out.', 640, 372, 18, '#e8cfa8', 600, 'center');
      text(ctx, 'WASD / arrows — run around the kitchen', 640, 430, 17, '#fff', 600, 'center');
      text(ctx, 'E or click — grab, chop, cook, plate, serve', 640, 458, 17, '#fff', 600, 'center');
      text(ctx, 'Q — trash what you hold    •    P — pause    •    M — mute', 640, 486, 17, '#fff', 600, 'center');
      text(ctx, 'CLICK or press SPACE to start the shift', 640, 540, 22, '#ffd34d', 800, 'center');
      if (best > 0) text(ctx, `Best shift: $${best}`, 640, 580, 16, '#c9b8e8', 600, 'center');
    } else if (screen === SCREEN_PAUSED) {
      overlayPanel('PAUSED', [
        { text: 'The stove is off. The tickets are waiting.', size: 18 },
        { text: `Day ${state.day}  •  $${state.coins} earned  •  ${state.served} served`, size: 18 },
      ], '#ffd34d', 'Press P or SPACE to get back to the rush');
    } else if (screen === SCREEN_DAY_END) {
      overlayPanel(`DAY ${state.day} COMPLETE!`, [
        { text: `Dishes served: ${state.served}`, size: 20 },
        { text: `Coins earned so far: $${state.coins}`, size: 20 },
        { text: `Best shift: $${Math.max(best, state.coins)}`, size: 18, color: '#c9b8e8' },
        { text: `Day ${state.day + 1} brings new recipes and faster tickets.`, size: 17, color: '#ff9d5c' },
      ], '#58b368', 'Press SPACE for the next shift');
    } else if (screen === SCREEN_OVER) {
      overlayPanel('KITCHEN CLOSED', [
        { text: 'Three tickets walked out. The rush beat Milo tonight.', size: 18 },
        { text: `Dishes served: ${state.served}`, size: 20 },
        { text: `Coins earned: $${state.coins}`, size: 20 },
        { text: `Best shift: $${Math.max(best, state.coins)}`, size: 18, color: '#c9b8e8' },
      ], '#ff6b6b', 'Press SPACE to open the kitchen again');
    }
  }

  return { draw };
}
