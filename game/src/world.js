// Duskline Kitchen Rush — the world: orders, stations, the chef, and the rules.
// Pure game logic: no drawing here, no DOM. main.js feeds it input, render.js paints it.
import {
  BINS, CHOP, COOK, FLOOR, INGREDIENTS, INTERACT_RANGE, MAX_HEARTS, MAX_ORDERS,
  RECIPES, SHIFT_SECONDS, STATIONS, CHEF_RADIUS, CHEF_SPEED, dayTuning,
} from './config.js';

export const EVENT_SERVE = 1;
export const EVENT_EXPIRE = 2;
export const EVENT_OVER = 4;
export const EVENT_DAY_END = 8;
export const EVENT_CHOP_DONE = 16;
export const EVENT_COOK_DONE = 32;
export const EVENT_BURNT = 64;
export const EVENT_ERROR = 128;
export const EVENT_PICKUP = 256;

const CHOPS_TO_FINISH = 3;
let orderSerial = 1;

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
/** Closest point on a rectangle to (x, y), and the distance to it. */
function closestPoint(rect, x, y) {
  const cx = clamp(x, rect.x, rect.x + rect.width);
  const cy = clamp(y, rect.y, rect.y + rect.height);
  return { x: cx, y: cy, d: dist(x, y, cx, cy) };
}
function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const rest = [...b];
  return a.every((item) => {
    const i = rest.indexOf(item);
    if (i === -1) return false;
    rest.splice(i, 1);
    return true;
  });
}
export function recipeFor(items) {
  return RECIPES.find((r) => sameMultiset(items, r.needs)) || null;
}

export function createWorld(random) {
  const state = freshState();

  function freshState() {
    return {
      day: 1, shiftLeft: SHIFT_SECONDS, coins: 0, score: 0, served: 0, earned: 0,
      combo: 0, comboLeft: 0, hearts: MAX_HEARTS, over: false, dayOver: false,
      orders: [], spawnIn: 6, orderSeq: 0,
      chef: { x: 640, y: 400, dir: 1, held: null, moveX: null, moveY: null, waypoints: [], pendingInteract: false, targetKind: null, targetItem: null, walkPhase: 0, moving: false },
      board: { item: null, chops: 0, done: false, knife: 0 },
      burners: [
        { item: null, progress: 0, state: 'empty', x: 105, y: 392 },
        { item: null, progress: 0, state: 'empty', x: 195, y: 392 },
      ],
      plates: [
        { items: [], x: 990, y: 360 },
        { items: [], x: 1150, y: 360 },
      ],
      particles: [], floaters: [], steam: 0,
      sizzle: false, message: '', messageLeft: 0,
    };
  }

  function reset() {
    const keep = state;
    Object.assign(keep, freshState());
    keep.particles = [];
    keep.floaters = [];
  }

  function floater(x, y, text, color) {
    state.floaters.push({ x, y, text, color: color || '#fff', life: 1.4 });
  }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i += 1) {
      state.particles.push({
        x, y, vx: random.range(-50, 50), vy: random.range(-90, -20),
        life: random.range(0.4, 0.9), max: 0.9, color, size: random.range(2, 5),
      });
    }
  }
  function say(text, seconds) {
    state.message = text;
    state.messageLeft = seconds || 2;
  }

  function spawnOrder() {
    const tuning = dayTuning(state.day);
    const recipe = random.pick(tuning.recipes);
    state.orders.push({
      id: orderSerial += 1, recipe,
      patience: tuning.patience, max: tuning.patience,
    });
    state.spawnIn = tuning.spawnGap * random.range(0.85, 1.2);
  }

  /** The station the chef can reach right now, or null. */
  function nearestStation() {
    const chef = state.chef;
    let best = null;
    let bestD = INTERACT_RANGE;
    const consider = (station, extra) => {
      const p = closestPoint(station, chef.x, chef.y);
      if (p.d < bestD) { bestD = p.d; best = { ...station, ...extra, px: p.x, py: p.y }; }
    };
    consider(STATIONS.board);
    consider(STATIONS.stove);
    consider(STATIONS.plates);
    consider(STATIONS.serve);
    consider(STATIONS.trash);
    for (const bin of BINS) consider(bin);
    // Plates are two spots on one counter: refine to the nearer plate.
    if (best && best.kind === 'plates') {
      const p0 = state.plates[0];
      const p1 = state.plates[1];
      const d0 = dist(chef.x, chef.y, p0.x, p0.y);
      const d1 = dist(chef.x, chef.y, p1.x, p1.y);
      best.plateIndex = d0 <= d1 ? 0 : 1;
      best.plate = state.plates[best.plateIndex];
    }
    return best;
  }

  function serveReadyPlate() {
    // A plate is servable when its stack is exactly a recipe an open order wants.
    for (const plate of state.plates) {
      const recipe = recipeFor(plate.items);
      if (!recipe) continue;
      const order = state.orders.find((o) => o.recipe.id === recipe.id);
      if (!order) continue;
      state.orders.splice(state.orders.indexOf(order), 1);
      plate.items = [];
      const tip = Math.round((order.patience / order.max) * 10);
      const comboBefore = state.combo;
      state.combo = state.comboLeft > 0 ? state.combo + 1 : 1;
      state.comboLeft = 12;
      const mult = 1 + Math.min(3, state.combo - 1) * 0.25;
      const earned = Math.round((recipe.price + tip) * mult);
      state.coins += earned;
      state.score += earned;
      state.earned += earned;
      state.served += 1;
      floater(1070, 150, `+$${earned} ${recipe.name}!`, '#ffd34d');
      if (state.combo >= 3) floater(1070, 180, `COMBO x${state.combo}!`, '#ff9d5c');
      burst(1070, 150, '#ffd34d', 14);
      return { served: true, comboBefore };
    }
    // A finished plate with no matching order, or nothing finished at all.
    const ready = state.plates.some((p) => recipeFor(p.items));
    say(ready ? 'No order wants that dish right now!' : 'No dish is ready to serve yet!');
    return { served: false };
  }

  /** Click-to-walk pathfinding: straight lines, routed around the counters. */
  const BLOCKERS = [STATIONS.board, STATIONS.stove, STATIONS.plates];
  function expanded(rect) {
    const m = CHEF_RADIUS + 2;
    return { x: rect.x - m, y: rect.y - m, width: rect.width + 2 * m, height: rect.height + 2 * m };
  }
  function segmentHitsRect(ax, ay, bx, by, r) {
    if (ax >= r.x && ax <= r.x + r.width && ay >= r.y && ay <= r.y + r.height) return true;
    if (bx >= r.x && bx <= r.x + r.width && by >= r.y && by <= r.y + r.height) return true;
    for (let i = 1; i < 40; i += 1) {
      const t = i / 40;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) return true;
    }
    return false;
  }
  function planPath(from, to, depth) {
    if ((depth || 0) > 6) return [to];
    for (const blocker of BLOCKERS) {
      const e = expanded(blocker);
      // The target itself may sit on a counter's edge: never route around the goal.
      const goalInside = to.x >= e.x && to.x <= e.x + e.width && to.y >= e.y && to.y <= e.y + e.height;
      if (goalInside) continue;
      if (!segmentHitsRect(from.x, from.y, to.x, to.y, e)) continue;
      const corners = [
        { x: e.x, y: e.y }, { x: e.x + e.width, y: e.y },
        { x: e.x, y: e.y + e.height }, { x: e.x + e.width, y: e.y + e.height },
      ];
      let best = corners[0];
      let bestD = Infinity;
      for (const c of corners) {
        const d = Math.hypot(c.x - from.x, c.y - from.y) + Math.hypot(to.x - c.x, to.y - c.y);
        if (d < bestD) { bestD = d; best = c; }
      }
      return [best, ...planPath(best, to, (depth || 0) + 1)];
    }
    return [to];
  }

  /**
   * Where the chef stands to use a station: the closest point on its rect,
   * pushed out by a chef-radius so the spot is actually reachable, then
   * clamped onto the floor. Clicking a station walks here, then interacts.
   */
  function approachPoint(station, fromX, fromY) {
    const p = closestPoint(station, fromX, fromY);
    const cx = station.x + station.width / 2;
    const cy = station.y + station.height / 2;
    let dx = p.x - cx;
    let dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const m = CHEF_RADIUS + 6;
    return {
      x: clamp(p.x + dx * m, FLOOR.x + CHEF_RADIUS, FLOOR.x + FLOOR.width - CHEF_RADIUS),
      y: clamp(p.y + dy * m, FLOOR.y + CHEF_RADIUS, FLOOR.y + FLOOR.height - CHEF_RADIUS),
    };
  }

  /** The station object for a kind (and bin item), for click-target distances. */
  function stationByKind(kind, item) {
    if (kind === 'bin') return BINS.find((b) => b.item === item) || null;
    return STATIONS[kind] || null;
  }

  function interact(forcedStation) {
    const chef = state.chef;
    const station = forcedStation || nearestStation();
    if (!station) return 0;
    // A plates interaction needs the nearer plate resolved.
    if (station.kind === 'plates' && !station.plate) {
      const p0 = state.plates[0];
      const p1 = state.plates[1];
      const d0 = dist(chef.x, chef.y, p0.x, p0.y);
      const d1 = dist(chef.x, chef.y, p1.x, p1.y);
      station.plateIndex = d0 <= d1 ? 0 : 1;
      station.plate = state.plates[station.plateIndex];
    }
    let events = 0;
    if (station.kind === 'bin') {
      if (chef.held) { say('Hands full — serve or trash it first!'); return EVENT_ERROR; }
      chef.held = station.item;
      events |= EVENT_PICKUP;
      return events;
    }
    if (station.kind === 'board') {
      const board = state.board;
      if (!board.item) {
        if (chef.held && CHOP[chef.held]) {
          board.item = chef.held; board.chops = 0; board.done = false;
          chef.held = null; events |= EVENT_PICKUP;
        } else if (chef.held) { say('That cannot be chopped — try lettuce, tomato or onion!'); return EVENT_ERROR; }
        else say('Grab lettuce, tomato or onion from the bins below!');
        return events;
      }
      if (!board.done) {
        board.chops += 1; board.knife = 0.25;
        burst(station.px, station.py - 10, INGREDIENTS[board.item].color, 6);
        if (board.chops >= CHOPS_TO_FINISH) {
          board.done = true;
          events |= EVENT_CHOP_DONE;
          floater(station.px, station.py - 24, 'Chopped!', '#8fd14f');
        }
        return events;
      }
      if (!chef.held) {
        chef.held = CHOP[board.item].into;
        board.item = null; board.chops = 0; board.done = false;
        events |= EVENT_PICKUP;
      } else { say('Hands full!'); return EVENT_ERROR; }
      return events;
    }
    if (station.kind === 'stove') {
      // Place raw food on a free burner, else take a finished (or burnt) burner.
      if (chef.held && COOK[chef.held]) {
        const free = state.burners.find((b) => b.item === null);
        if (free) {
          free.item = chef.held; free.progress = 0; free.state = 'cooking';
          chef.held = null; events |= EVENT_PICKUP;
          return events;
        }
        say('Both burners are busy!');
        return EVENT_ERROR;
      }
      if (!chef.held) {
        const done = state.burners.find((b) => b.state === 'done' || b.state === 'burnt');
        if (done) {
          chef.held = done.state === 'burnt' ? 'burnt' : COOK[done.item].into;
          if (done.state === 'burnt') floater(done.x, done.y - 30, 'Burnt! Trash it.', '#888');
          done.item = null; done.progress = 0; done.state = 'empty';
          events |= EVENT_PICKUP;
          return events;
        }
        const cooking = state.burners.find((b) => b.state === 'cooking');
        if (cooking) say('Still cooking — watch the ring!');
        else if (chef.held) { /* unreachable */ }
        else say('Grab patty, egg or potato from the bins!');
        return events;
      }
      say('The stove only takes patty, egg or potato!');
      return EVENT_ERROR;
    }
    if (station.kind === 'plates') {
      const plate = station.plate;
      if (chef.held) {
        if (plate.items.length >= 6) { say('That plate is full!'); return EVENT_ERROR; }
        plate.items.push(chef.held);
        chef.held = null;
        events |= EVENT_PICKUP;
        const recipe = recipeFor(plate.items);
        if (recipe) {
          floater(plate.x, plate.y - 46, `${recipe.name} READY!`, '#ffd34d');
          burst(plate.x, plate.y - 20, '#ffd34d', 10);
        }
        return events;
      }
      // Empty hands: take the top ingredient back off the plate.
      if (plate.items.length > 0) {
        chef.held = plate.items.pop();
        events |= EVENT_PICKUP;
      } else say('Add ingredients to build a dish here!');
      return events;
    }
    if (station.kind === 'serve') {
      const result = serveReadyPlate();
      if (result.served) return EVENT_SERVE;
      return EVENT_ERROR;
    }
    if (station.kind === 'trash') {
      if (chef.held) {
        floater(chef.x, chef.y - 40, 'Trashed', '#aaa');
        chef.held = null;
        events |= EVENT_PICKUP;
        return events;
      }
      const fullest = state.plates.reduce((a, b) => (a.items.length >= b.items.length ? a : b));
      if (fullest.items.length > 0) {
        fullest.items = [];
        floater(fullest.x, fullest.y - 46, 'Plate cleared', '#aaa');
        events |= EVENT_PICKUP;
        return events;
      }
      say('Nothing to throw away!');
      return events;
    }
    return events;
  }

  function pushOutOf(rect) {
    const chef = state.chef;
    const nx = clamp(chef.x, rect.x, rect.x + rect.width);
    const ny = clamp(chef.y, rect.y, rect.y + rect.height);
    const dx = chef.x - nx;
    const dy = chef.y - ny;
    const d = Math.hypot(dx, dy);
    if (d >= CHEF_RADIUS || d === 0) return;
    if (d === 0) { chef.y = rect.y - CHEF_RADIUS; return; }
    chef.x = nx + (dx / d) * CHEF_RADIUS;
    chef.y = ny + (dy / d) * CHEF_RADIUS;
  }

  /** Advance the world one fixed step. `input` = {mx, my, interact, click}. */
  function step(dt, input) {
    let events = 0;
    const chef = state.chef;
    if (state.over || state.dayOver) return events;

    // Timers.
    state.shiftLeft -= dt;
    if (state.shiftLeft <= 0) {
      state.shiftLeft = 0;
      state.dayOver = true;
      return EVENT_DAY_END;
    }
    if (state.comboLeft > 0) {
      state.comboLeft -= dt;
      if (state.comboLeft <= 0) state.combo = 0;
    }
    if (state.messageLeft > 0) state.messageLeft -= dt;
    state.spawnIn -= dt;
    if (state.spawnIn <= 0 && state.orders.length < MAX_ORDERS) spawnOrder();

    // Orders lose patience; an expired order costs a heart.
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(i, 1);
        state.hearts -= 1;
        state.combo = 0;
        state.comboLeft = 0;
        events |= EVENT_EXPIRE;
        floater(300, 120, 'Order walked out!', '#ff6b6b');
        if (state.hearts <= 0) {
          state.over = true;
          return events | EVENT_OVER;
        }
      }
    }

    // Chopping knife animation.
    if (state.board.knife > 0) state.board.knife = Math.max(0, state.board.knife - dt);

    // Burners cook; left too long they burn.
    state.sizzle = false;
    for (const burner of state.burners) {
      if (burner.state === 'cooking') {
        state.sizzle = true;
        burner.progress += dt / COOK[burner.item].seconds;
        if (burner.progress >= 1) {
          burner.state = 'done';
          events |= EVENT_COOK_DONE;
        }
      } else if (burner.state === 'done') {
        burner.progress += dt / COOK[burner.item].burnAfter;
        if (burner.progress >= 2) {
          burner.state = 'burnt';
          events |= EVENT_BURNT;
        }
      }
    }

    // Chef movement: keys, or a click-to-walk target (with waypoints around counters).
    let mx = input.mx || 0;
    let my = input.my || 0;
    if (mx === 0 && my === 0 && chef.moveX !== null && chef.moveY !== null) {
      const dx = chef.moveX - chef.x;
      const dy = chef.moveY - chef.y;
      const d = Math.hypot(dx, dy);
      if (d < 8) {
        if (chef.waypoints && chef.waypoints.length > 0) {
          const next = chef.waypoints.shift();
          chef.moveX = next.x; chef.moveY = next.y;
        } else {
          chef.moveX = null; chef.moveY = null;
          if (chef.pendingInteract) {
            chef.pendingInteract = false;
            const target = stationByKind(chef.targetKind, chef.targetItem);
            chef.targetKind = null; chef.targetItem = null;
            events |= interact(target ? { ...target } : undefined);
          }
        }
      } else {
        mx = dx / d; my = dy / d;
      }
    }
    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my) || 1;
      chef.x += (mx / len) * CHEF_SPEED * dt;
      chef.y += (my / len) * CHEF_SPEED * dt;
      chef.dir = mx < 0 ? -1 : mx > 0 ? 1 : chef.dir;
      chef.moving = true;
      chef.walkPhase += dt * 11;
    } else chef.moving = false;
    chef.x = clamp(chef.x, FLOOR.x + CHEF_RADIUS, FLOOR.x + FLOOR.width - CHEF_RADIUS);
    chef.y = clamp(chef.y, FLOOR.y + CHEF_RADIUS, FLOOR.y + FLOOR.height - CHEF_RADIUS);
    pushOutOf(STATIONS.board);
    pushOutOf(STATIONS.stove);
    pushOutOf(STATIONS.plates);

    if (input.interact) events |= interact();
    if (input.click) {
      // Click a station: walk to its approach point and interact on arrival.
      // Click floor: just walk (routed around the counters).
      const station = stationAt(input.click.x, input.click.y);
      if (station) {
        const target = approachPoint(station, chef.x, chef.y);
        const path = planPath({ x: chef.x, y: chef.y }, target);
        chef.moveX = path[0].x; chef.moveY = path[0].y;
        chef.waypoints = path.slice(1);
        chef.pendingInteract = true;
        chef.targetKind = station.kind;
        chef.targetItem = station.item || null;
      } else {
        const tx = clamp(input.click.x, FLOOR.x, FLOOR.x + FLOOR.width);
        const ty = clamp(input.click.y, FLOOR.y, FLOOR.y + FLOOR.height);
        const path = planPath({ x: chef.x, y: chef.y }, { x: tx, y: ty });
        chef.moveX = path[0].x; chef.moveY = path[0].y;
        chef.waypoints = path.slice(1);
        chef.pendingInteract = false;
      }
    }

    // Particles and floaters.
    state.steam += dt;
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
      const f = state.floaters[i];
      f.life -= dt;
      f.y -= 28 * dt;
      if (f.life <= 0) state.floaters.splice(i, 1);
    }
    return events;
  }

  function stationAt(x, y) {
    const all = [STATIONS.board, STATIONS.stove, STATIONS.plates, STATIONS.serve, STATIONS.trash, ...BINS];
    return all.find((s) => x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) || null;
  }

  /** Next shift: harder day, fresh timer, one heart back. */
  function nextDay() {
    state.day += 1;
    state.shiftLeft = SHIFT_SECONDS;
    state.orders = [];
    state.spawnIn = 5;
    state.dayOver = false;
    state.hearts = Math.min(MAX_HEARTS, state.hearts + 1);
    state.board = { item: null, chops: 0, done: false, knife: 0 };
    state.burners.forEach((b) => { b.item = null; b.progress = 0; b.state = 'empty'; });
    state.plates.forEach((p) => { p.items = []; });
    state.chef.held = null;
    state.chef.x = 640; state.chef.y = 400;
    state.combo = 0; state.comboLeft = 0;
  }

  /**
   * Dress a scene for a screenshot: real state, set through the world's own fields,
   * then stepped a few frames so steam and particles are alive when painted.
   * Scenes: 'start' (title over a calm kitchen), 'play' (burger mid-assembly),
   * 'serve' (a finished plate glowing at the window), 'rush' (day 3, full board).
   */
  function dressScene(name) {
    reset();
    const tuning = dayTuning(name === 'rush' ? 3 : name === 'serve' ? 2 : 1);
    if (name === 'start') {
      state.orders.push({ id: 1, recipe: tuning.recipes[1], patience: 44, max: 52 });
      state.orders.push({ id: 2, recipe: tuning.recipes[0], patience: 30, max: 52 });
      state.chef.x = 620; state.chef.y = 380;
      state.chef.held = 'tomato';
    } else if (name === 'play') {
      state.day = 2;
      state.shiftLeft = 96;
      state.coins = 47; state.score = 47; state.served = 4; state.earned = 47;
      state.combo = 2; state.comboLeft = 8;
      state.orders.push({ id: 1, recipe: RECIPES[3], patience: 34, max: 47 });
      state.orders.push({ id: 2, recipe: RECIPES[4], patience: 22, max: 47 });
      state.orders.push({ id: 3, recipe: RECIPES[1], patience: 41, max: 47 });
      state.board.item = 'lettuce'; state.board.chops = 2; state.board.done = false;
      state.burners[0].item = 'patty'; state.burners[0].progress = 0.62; state.burners[0].state = 'cooking';
      state.burners[1].item = 'potato'; state.burners[1].progress = 0.85; state.burners[1].state = 'cooking';
      state.plates[0].items = ['bun', 'pattyCooked', 'lettuceChopped'];
      state.plates[1].items = ['fries'];
      state.chef.x = 880; state.chef.y = 330; state.chef.dir = 1;
      state.chef.held = 'tomatoChopped';
    } else if (name === 'serve') {
      state.day = 2;
      state.shiftLeft = 74;
      state.coins = 86; state.score = 86; state.served = 7; state.earned = 86;
      state.combo = 3; state.comboLeft = 9;
      state.orders.push({ id: 1, recipe: RECIPES[3], patience: 28, max: 47 });
      state.orders.push({ id: 2, recipe: RECIPES[2], patience: 15, max: 47 });
      state.plates[0].items = ['bun', 'pattyCooked', 'lettuceChopped', 'tomatoChopped', 'cheese'];
      state.plates[1].items = ['bun', 'pattyCooked', 'cheese'];
      state.burners[0].item = 'egg'; state.burners[0].progress = 1; state.burners[0].state = 'done';
      state.chef.x = 850; state.chef.y = 320; state.chef.dir = 1;
      state.chef.held = null;
      state.message = 'Duskline Burger READY — serve it at the window!';
      state.messageLeft = 3;
    } else { // rush
      state.day = 3;
      state.shiftLeft = 41;
      state.coins = 132; state.score = 132; state.served = 11; state.earned = 132;
      state.combo = 4; state.comboLeft = 6;
      state.hearts = 2;
      state.orders.push({ id: 1, recipe: RECIPES[5], patience: 18, max: 42 });
      state.orders.push({ id: 2, recipe: RECIPES[3], patience: 12, max: 42 });
      state.orders.push({ id: 3, recipe: RECIPES[4], patience: 26, max: 42 });
      state.board.item = 'onion'; state.board.chops = 1; state.board.done = false;
      state.burners[0].item = 'patty'; state.burners[0].progress = 1.4; state.burners[0].state = 'done';
      state.burners[1].item = 'potato'; state.burners[1].progress = 0.95; state.burners[1].state = 'cooking';
      state.plates[0].items = ['bun', 'pattyCooked', 'fries'];
      state.plates[1].items = ['eggCooked', 'cheese'];
      state.chef.x = 300; state.chef.y = 470; state.chef.dir = -1;
      state.chef.held = 'onionChopped';
    }
    // Let the world breathe: steam rises, the clock ticks, the board stays live.
    for (let i = 0; i < 45; i += 1) step(1 / 60, { mx: 0, my: 0, interact: false, click: null });
    // Stepping may have spawned an order or ticked the clock; restore the staged values.
    if (name === 'play') { state.shiftLeft = 96; state.comboLeft = 8; }
    if (name === 'serve') { state.shiftLeft = 74; state.comboLeft = 9; state.messageLeft = 3; state.message = 'Duskline Burger READY — serve it at the window!'; }
    if (name === 'rush') { state.shiftLeft = 41; state.comboLeft = 6; }
  }

  return { state, reset, step, interact, nearestStation, recipeFor, nextDay, dressScene, spawnOrder };
}
