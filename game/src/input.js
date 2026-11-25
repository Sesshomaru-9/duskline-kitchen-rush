// Keyboard + mouse input for Duskline Kitchen Rush.
// WASD / arrows move the chef, E or Space interacts, Q trashes the held item,
// M mutes, P / Esc pauses. Clicking walks the chef there (a station click also
// interacts on arrival — world.js owns that). All coordinates are canvas pixels.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_TRASH = 8;

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let interactQueued = false;
  let click = null;

  function scaleEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const dir = KEYMAP[event.code];
    if (dir) { keys.add(dir); event.preventDefault(); return; }
    if (event.code === 'KeyE' || event.code === 'Space') {
      interactQueued = true;
      // Space also confirms (starts the game from the title / over screens).
      if (event.code === 'Space') actions |= ACTION_CONFIRM;
      event.preventDefault();
    }
    else if (event.code === 'Enter') actions |= ACTION_CONFIRM;
    else if (event.code === 'KeyP' || event.code === 'Escape') actions |= ACTION_PAUSE;
    else if (event.code === 'KeyM') actions |= ACTION_MUTE;
    else if (event.code === 'KeyQ') actions |= ACTION_TRASH;
  });
  window.addEventListener('keyup', (event) => {
    const dir = KEYMAP[event.code];
    if (dir) keys.delete(dir);
  });
  canvas.addEventListener('mousedown', (event) => {
    click = scaleEvent(event);
    event.preventDefault();
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    /** Movement vector for this frame, from held keys. */
    direction() {
      let mx = 0;
      let my = 0;
      if (keys.has('left')) mx -= 1;
      if (keys.has('right')) mx += 1;
      if (keys.has('up')) my -= 1;
      if (keys.has('down')) my += 1;
      return { mx, my };
    },
    /** True once when E / Space was pressed since the last read. */
    takeInteract() {
      const value = interactQueued;
      interactQueued = false;
      return value;
    },
    /** The last click point (canvas pixels), once. */
    takeClick() {
      const value = click;
      click = null;
      return value;
    },
    /** One-shot actions (confirm / pause / mute / trash) since the last read. */
    takeActions() {
      const value = actions;
      actions = 0;
      return value;
    },
    /** Any held movement key cancels a click-to-walk target. */
    hasMoveKey() { return keys.size > 0; },
  };
}
