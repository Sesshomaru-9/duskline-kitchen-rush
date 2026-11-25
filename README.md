# Duskline Kitchen Rush

An original timed cooking game for the make.fun bounty
**“Make the best cooking game”** (`best-cooking-game-20261125-0137`).

Milo the cat chef runs the busiest kitchen on Duskline Lane. Tickets come in
on the order board, patience drains, and only a finished plate earns coins.
Chop it. Fry it. Stack it. Serve it — before the ticket walks out.

## How to play

- **Move:** WASD / arrow keys, or click anywhere — Milo walks there, routed
  around the counters. Clicking a station walks Milo to it and uses it.
- **Interact:** `E` (or `Space`) — grab an ingredient, place it on the board
  or stove, chop, take cooked food, stack it on a plate, serve at the window.
- **Trash:** `Q` drops what Milo holds. **Pause:** `P` / `Esc`. **Mute:** `M`.

The loop: grab from the bins → chop lettuce/tomato/onion on the board
(3 chops) → cook patty/egg/potato on the stove (don’t leave it — it burns)
→ stack the recipe on a plate → serve at the window when the plate matches
an open ticket. Serving fast earns a tip; serving in a row builds a combo
multiplier. A ticket that runs out of patience walks out and costs a heart.
Three lost hearts close the kitchen. Finish a 150-second shift to open the
next day: new recipes, faster tickets, less patience.

## Menu

| Dish | Recipe | Day |
| --- | --- | --- |
| Garden Salad | chopped lettuce + chopped tomato | 1 |
| Golden Fries | fried potato + dusk sauce | 1 |
| Cheese Melt | bun + grilled patty + cheese | 1 |
| Duskline Burger | bun + grilled patty + chopped lettuce + chopped tomato + cheese | 2 |
| Sunrise Omelette | fried egg + cheese + chopped onion | 2 |
| Duskline Platter | bun + grilled patty + fries + chopped onion + dusk sauce | 3 |

## Run it

```sh
node serve.ts            # serves game/ on http://localhost:8080
```

No build step, no network: open `game/index.html` from any static server in
desktop Chrome. All art is drawn in canvas and all sounds are synthesised
with WebAudio — no asset files.

Screenshots are staged scenes of the real game:
`?shot=start|play|serve|rush&seed=N`.

## Structure

- `game/index.html`, `game/style.css` — page and styles
- `game/src/config.js` — layout, ingredients, recipes, difficulty
- `game/src/world.js` — orders, stations, chef, rules, click pathfinding
- `game/src/render.js` — all canvas drawing
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — synthesised sound effects
- `game/src/shots.js` — staged screenshot scenes
- `game/src/main.js` — boot, fixed-step loop, screens
- `game/src/random.js` — seeded RNG
- `main.ts` — the entry program: copies `game/` + `screenshots/` to
  `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit’s dossier library, unchanged

## License

MIT — see `LICENSE`.
