# NAWIA

A small top-down action adventure made for **GitHub Game Off 2026** (theme: **SHIFT**).

A village at the edge of the marshes. The bell of the drowned stronghold has been silent for years,
and the border between **Jawia** (the world of the living) and **Nawia** (the world of spirits) is cracking.
You carry a hag stone set in the hilt of your sword. Turn it, and the world turns with it.

One button switches between two worlds laid over each other. The same room exists in both, but not the same way:
where rubble blocks the living, the dead remember an open corridor. A bridge stands only on one side.
Some things can only be hurt in the world they belong to.

> Status: playable base. Five rooms, both worlds, sword, two enemies, a gate, a bell. All art and sound are
> generated in code as placeholders.

## Controls

| | Keyboard | Gamepad |
|---|---|---|
| Move | WASD / arrows | left stick / d-pad |
| Shift between worlds | **Shift**, Space, X or K | B, Y, bumpers, triggers |
| Strike | Z, J or Enter | A, X |
| Pause | Esc / P | Start |
| Mute / Fullscreen / Language | M / F / L (title screen) | |

Windows tip: pressing Shift five times in a row opens the Sticky Keys dialog. Space does the same thing in the game.

## Run it

Requires Node 22.18+ (developed on Node 24).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + dungeon check + static build in dist/ (upload to itch.io as HTML5)
```

Handy while working:

```bash
npm run rooms:check    # can the dungeon be finished? how many shifts does it take?
npm run art:export     # write all placeholder sheets as PNG into art-template/
npm run art:preview    # render tilesets, sprites and every room (both worlds) into art-template/preview/
```

Jump straight into a room while developing: `http://localhost:5173/?room=bridge&world=nawia`.

## How it is built

- **Phaser 4 + TypeScript + Vite**, static build, no backend.
- **Pixel perfect**: the game renders at 320x180 and is only ever enlarged by a whole number of device pixels.
- **Rooms are text files** (`src/world/rooms/*.room.txt`): one grid describes both worlds. See [docs/ROOMS.md](docs/ROOMS.md).
- **Art is replaceable**: every sheet is a PNG-shaped grid. Drop a PNG with the same name into `assets/` and it
  replaces the generated placeholder. See [docs/ART.md](docs/ART.md).
- **The shift** is instant in logic and a ring in pictures: both worlds of a room are pre-rendered, and a per-pixel
  ring composites one into the other (`src/fx/DualCanvas.ts`).
- **Light** is a CPU light map with dithered bands, multiplied over the scene (`src/fx/Lighting.ts`).
- **Sound** is synthesized with WebAudio (`src/audio/audio.ts`): no audio files.
- Feel tuning lives in one place: `TUNE` in `src/config.ts`.

```
src/
  config.ts          resolution, tuning
  core/              pixel buffer, input (keyboard + gamepad), rng
  art/               palettes, tiles, sprites, font, title picture (all drawn in code)
  world/             room format + parser, room painter, collision, rooms/*.room.txt
  entities/          Player, Enemy, Prop
  fx/                DualCanvas (the ring), Lighting, particles
  ui/                pixel text, HUD
  scenes/            Boot, Title (+ intro), Game, End
tools/               PNG export, previews, dungeon check
```

## Deploy

`.github/workflows/deploy.yml` builds on every push to `main`. To also publish to itch.io, add to the repository:

- secret `BUTLER_API_KEY` (itch.io -> Settings -> API keys),
- variable `ITCH_TARGET`, e.g. `your-user/nawia`.

The build is pushed to the `html5` channel. On itch.io set the project to "HTML", viewport 960x540 (or any multiple of 320x180),
and enable the fullscreen button.
