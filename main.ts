// Duskline Kitchen Rush — Milo the cat chef runs a dusk-lit kitchen.
// ---------------------------------------------------------------------------
// This entrypoint hands the game in: it copies the finished kitchen (game/)
// and its screenshots to the output folder and writes the dossier.json the
// judge reads. The game itself is plain static files — canvas art, WebAudio
// bleeps, no assets, no network.
//
// What Milo does in a 150-second shift: tickets land on the order board with
// patience draining away; Milo grabs ingredients from nine bins, chops the
// greens three times on the board, fries patties, eggs and potatoes on two
// burners (leave them and they burn), stacks each recipe on one of two
// plates, and serves at the window before the ticket expires. Quick serves
// earn tips, back-to-back serves build a combo up to x1.75, and every expired
// ticket costs one of three hearts. Survive the shift and the next day gets
// harder — six recipes in all across days one to three, faster tickets,
// shorter patience. Controls: WASD/arrows or click-to-walk, E/Space to use a
// station, Q to bin something, P to pause, M to mute.
// A working best-game-01 entry (Node 22, standard library only): the game is this directory's
// game/ folder, plain static files a desktop browser loads offline (game/index.html and its ES
// modules, no library and no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. A starting point, not a winner: Block Dodger, a
// plain 2D canvas game where a paddle dodges falling blocks and catches coins, with a title screen,
// score, lives and levels, game over and restart, flat colours and no sound. Build your own game
// (any genre, any library you vendor under game/, or none), put your 3 or 4 PNG or JPEG screenshots
// in screenshots/ (the first by name is the cover) and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The game's title, as shown on the title screen (game/index.html) — kept
// here so the entrypoint and the game agree on one name.
export const GAME_TITLE = 'Duskline Kitchen Rush';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
