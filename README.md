# The Golden Ladle — Sizzle & Serve

[![Make the best cooking game](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/ahmed1813544/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/ahmed1813544/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

An original cooking game for the [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) bounty on make.fun.

## The game

You run the lunch rush at **The Golden Ladle**, your own little bistro. Order tickets land on the board with a patience bar — take each order, build the dish, and serve it before the customer walks out.

- **🧺 Ingredient counter** — click a bin (or press `1–6`) to grab an ingredient.
- **🔪 Chopping board** — lettuce, tomato and onion go to the board; click it 3 times to chop.
- **🔥 Grill** — patties cook for 6 seconds; take them when they read READY, before they burn.
- **🍽️ Plate & serve** — match an order ticket exactly, then hit SERVE (or `Space`). Fast serves earn a patience bonus; chained serves build a combo tip.
- **📖 Menu** — Garden Salad, Classic Burger, Cheese Melt and Crunch Burger. The last two unlock once the kitchen warms up.
- **⏱️ The shift** — 2½ minutes. Earn 30 coins for one star, 55 for two, 90 for three.

Everything is drawn and sounded in code: no image or audio files, no network requests, no libraries. All sound is synthesised with the Web Audio API.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` from any static server. Desktop keyboard + mouse.

## How it is built

- `game/index.html` — the page shell
- `game/styles.css` — the bistro look
- `game/src/recipes.js` — dishes, ingredients and prep times
- `game/src/kitchen.js` — orders, plate, grill, board and the shift clock
- `game/src/render.js` — draws the kitchen into the page
- `game/src/input.js` — mouse and keyboard controls
- `game/src/audio.js` — synthesised sounds (chop, sizzle, serve chime)
- `game/src/shots.js` — staged moments for the screenshots (`?shot=cover|assembly|serve|rush`)
- `game/src/main.js` — wires it together and runs the loop
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT — see [LICENSE](LICENSE).
