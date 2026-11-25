// The screenshot scenes behind ?shot=start|play|serve|rush.
// Each one dresses the world through its own dressScene (real state, real rules),
// steps it a few frames so steam and particles are alive, then paints it twice.
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

export function stageShot(name, world) {
  const scene = name === 'start' ? 'start' : name === 'serve' ? 'serve' : name === 'rush' ? 'rush' : 'play';
  world.dressScene(scene);
  return { screen: scene === 'start' ? SCREEN_TITLE : SCREEN_PLAY, best: world.state.coins };
}
