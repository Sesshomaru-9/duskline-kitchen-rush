// Duskline Kitchen Rush — boot and the one loop.
// Fixed 1/60 s steps, four screens (title, play, paused, day end, game over).
// ?seed=N fixes the order deck. ?shot=start|play|serve|rush (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets window.__shotReady.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_BURNT, EVENT_CHOP_DONE, EVENT_COOK_DONE, EVENT_DAY_END, EVENT_ERROR, EVENT_EXPIRE, EVENT_OVER, EVENT_PICKUP, EVENT_SERVE } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_TRASH, createInput } from './input.js';
import { createRenderer, SCREEN_DAY_END, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
// Debug handle for local play-testing (read-only state inspection).
window.__duskline = world;
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* storage can be off */ }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  window.__dusklineScreen = () => screen;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let lastChops = 0;

  function announce(message) { status.textContent = message; }

  function startGame() {
    world.reset();
    accumulator = 0;
    lastChops = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve the tickets before they walk out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    audio.gameOver();
    audio.stopSizzle();
    if (world.state.coins > best) { best = world.state.coins; saveBest(best); }
    announce(`Kitchen closed. Served ${world.state.served}, earned $${world.state.coins}. Best $${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_TRASH && screen === SCREEN_PLAY && world.state.chef.held) {
      world.state.chef.held = null;
      world.state.message = 'Trashed!';
      world.state.messageLeft = 1.2;
    }
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
      else if (screen === SCREEN_DAY_END) { world.nextDay(); screen = SCREEN_PLAY; announce(`Day ${world.state.day}. New recipes on the board.`); }
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      return;
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; audio.stopSizzle(); announce('Paused.'); }
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
    // Clicks on the title / over / day-end screens start the next shift. Clicks
    // during play are NOT consumed here: step() reads them as walk targets.
    const click = (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_DAY_END)
      ? input.takeClick()
      : null;
    if (click) {
      audio.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
      else if (screen === SCREEN_DAY_END) { world.nextDay(); screen = SCREEN_PLAY; }
    }
  }

  function handleEvents(events) {
    if (events & EVENT_SERVE) { audio.coin(); audio.ding(); }
    if (events & EVENT_EXPIRE) audio.expired();
    if (events & EVENT_CHOP_DONE) audio.chopDone();
    if (events & EVENT_COOK_DONE) audio.ding();
    if (events & EVENT_BURNT) audio.error();
    if (events & EVENT_ERROR) audio.error();
    if (events & EVENT_PICKUP) audio.pickup();
    if (world.state.board.chops !== lastChops) {
      if (world.state.board.chops > lastChops) audio.chop();
      lastChops = world.state.board.chops;
    }
    if (world.state.sizzle) audio.sizzleStart();
    else audio.stopSizzle();
    if (events & EVENT_DAY_END) {
      screen = SCREEN_DAY_END;
      audio.dayClear();
      audio.stopSizzle();
      if (world.state.coins > best) { best = world.state.coins; saveBest(best); }
      announce(`Day ${world.state.day} complete. ${world.state.served} served, $${world.state.coins} earned.`);
    }
    if (events & EVENT_OVER) endGame();
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      // The title screen simmers: orders drift in behind the logo.
      world.step(STEP, { mx: 0, my: 0, interact: false, click: null });
      return;
    }
    const dir = input.direction();
    if (input.hasMoveKey()) {
      world.state.chef.moveX = null; world.state.chef.moveY = null;
      world.state.chef.waypoints = [];
      world.state.chef.pendingInteract = false;
      world.state.chef.targetKind = null; world.state.chef.targetItem = null;
    }
    const click = input.takeClick();
    const events = world.step(STEP, { mx: dir.mx, my: dir.my, interact: input.takeInteract(), click });
    handleEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else accumulator = 0;
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopSizzle();
      announce('Paused.');
    }
  });

  // Title screen: dress a calm kitchen behind the logo.
  world.dressScene('start');
  announce('Duskline Kitchen Rush. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
