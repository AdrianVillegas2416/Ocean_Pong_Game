# 🌊 Ocean Pong

A Pokémon-themed pong game set underwater. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no libraries.

---

## 🎮 How to Play

- Choose your game mode: **AI vs Player** or **Multiplayer**
- Pick your ocean theme: **Dark Ocean** or **Sunny Ocean**
- Select a **Water Pokémon** as your paddle
- First to reach the score limit wins!

| Action      | Player 1 | Player 2 |
|-------------|----------|----------|
| Move Up     | W        | ↑        |
| Move Down   | S        | ↓        |
| Speed Boost | Shift    | Shift    |
| Pause       | Space / Esc | Space / Esc |

---

## 🕹️ Game Modes
- **AI vs Player** — Choose difficulty (1–10) and face the computer
- **Multiplayer** — Two players on the same keyboard, head to head

Score limit is **10 points** by default — but you can change it to 5, 15, or any custom number before the game starts.

---

## 🌐 APIs Used

### 1. Canvas API (Browser Built-in)
Used to draw everything in the game — paddles, ball, fish, bubbles, background.
```js
const context = theCanvas.getContext('2d');
context.fillRect(...);   // draws rectangles
context.arc(...);        // draws circles (bubbles, ball)
context.drawImage(...);  // draws Pokémon paddle images
```
The entire game runs inside a `<canvas>` element. Every frame, the canvas is cleared and redrawn — this is what creates the animation.

---

### 2. Web Audio API (Browser Built-in)
Used to generate the button click sound in code — no audio file needed.
```js
const audioCtx = new AudioContext();
const oscillator = audioCtx.createOscillator();
const gainNode = audioCtx.createGain();
oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);
```
- **OscillatorNode** — generates a tone (starts at 680Hz, drops to 320Hz)
- **GainNode** — controls volume (fades from 0.28 to near-silent in 0.1s)
- The result is a short "blip" arcade sound, shaped entirely by code

---

### 3. PokeAPI — Pokémon Sprites
Pokémon images are fetched from the **[PokeAPI](https://pokeapi.co/)** sprite repository on GitHub.
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png
```
Example — Oshawott (ID 501):
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/501.png
```
> **Note:** An internet connection is required to load Pokémon images.

---

### 4. requestAnimationFrame API (Browser Built-in)
Powers the game loop — calls the `GameLoop` function ~60 times per second.
```js
animationFrameId = window.requestAnimationFrame(GameLoop);
```
When the player pauses or goes back, `cancelAnimationFrame(animationFrameId)` stops the loop cleanly.

---

### 5. HTML Audio API (Browser Built-in)
Used to play the background music tracks.
```js
let backgroundMusic = new Audio('music/pokemon-theme.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.4;
backgroundMusic.play();
```

---

## 🧠 How the Key Functions Work

### `SettingUpCanvas()`
Initialises the canvas, creates the paddles and ball, registers keyboard listeners, and starts the game loop. Called every time a new game begins — including Play Again.

---

### `GameLoop()`
The heartbeat of the game. Runs ~60 times per second via `requestAnimationFrame`. Each frame it calls:
- `Update()` — moves everything (ball, paddles, fish, bubbles)
- `Draw()` — redraws everything onto the canvas

---

### `Update()`
Handles all game logic each frame:
- Moves player and AI paddles based on key state
- Moves the ball horizontally and vertically
- Detects ball collisions with paddles and walls
- Detects scoring (ball goes past a paddle)
- Keeps paddles within the canvas bounds

---

### `Draw()`
Renders the current game state onto the canvas each frame:
- Draws the ocean background gradient
- Draws animated fish and rising bubbles
- Draws Pokémon images as paddles (flipped for Player 1 to face right)
- Draws the ball, scores, and "First to X" label

---

### `MovePlayerPaddle(key)` / `StopPlayerPaddle(key)`
Keyboard event handlers. `MovePlayerPaddle` sets the paddle's `move` direction when a key is pressed. `StopPlayerPaddle` resets it to `DIRECTION.STOPPED` when the key is released. Holding **Shift** multiplies paddle speed for a boost.

---

### `buildPokemonGrid(containerId, playerNum)`
Dynamically builds the Pokémon picker UI using JavaScript. Loops through the `waterPokemon` array and creates a clickable card for each one using `document.createElement`. Highlights the currently selected Pokémon. When a card is clicked, it updates `selectedP1` or `selectedP2` with the chosen Pokémon's ID.

---

### `getSpeedMultiplier()`
Returns a speed scaling factor based on screen width so the game feels fair on smaller devices:
```js
if (w < 480)  return 0.30;  // small phones
if (w < 768)  return 0.42;  // large phones
if (w < 1024) return 0.60;  // tablets
return 1.0;                 // desktop
```
Applied to both ball speed and paddle speed when the game starts.

---

### `playButtonClickSound()`
Generates a short arcade "blip" sound using the Web Audio API without any audio file. Creates an oscillator, shapes the pitch from 680Hz → 320Hz, and fades the volume out — all in 0.1 seconds.

---

### `showGameOverScreen()`
Checks who reached the winning score, fills in the game-over overlay with the winner's name and Pokémon image, then displays it. Re-triggers CSS animations using the `animation = 'none'` → force reflow → `animation = ''` trick.

---

## 🎨 Themes

| Theme | Description |
|-------|-------------|
| 🌑 Dark Ocean | Deep navy underwater scene with dark fish and bubbles |
| ☀️ Sunny Ocean | Bright teal ocean with sunny background and clouds |

---

## 🐟 Water Pokémon Roster

| Pokémon  | ID  | Pokémon  | ID  |
|----------|-----|----------|-----|
| Squirtle | 7   | Totodile | 158 |
| Psyduck  | 54  | Marill   | 183 |
| Poliwag  | 60  | Mudkip   | 258 |
| Slowpoke | 79  | Piplup   | 393 |
| Horsea   | 116 | Oshawott | 501 |
| Magikarp | 129 | Froakie  | 656 |
| Lapras   | 131 | Popplio  | 728 |
| Vaporeon | 134 | Sobble   | 816 |

---

## 🛠️ Built With

- **HTML5 Canvas** — game rendering
- **Vanilla JavaScript** — all game logic
- **CSS3** — UI, animations, ocean themes
- **Web Audio API** — button sound effects
- **PokeAPI** — Pokémon sprites
- **Press Start 2P** (Google Fonts) — pixel font

---

## 🎵 Music Credits

All Pokémon background music remixes are sourced from:
> [SoundCloud — Chill Non-Copyright Pokémon Remixes](https://soundcloud.com/lavasweeper/sets/chill-non-copyright-pokemon)

| # | Song | Game | Artist | File |
|---|------|------|--------|------|
| Song 1 | Zinnia Battle Remix | Pokémon OmegaRuby & AlphaSapphire | GlitchxCity | `pokemon-theme.mp3` |
| Song 2 | Champion Cynthia Battle Remix | Pokémon Diamond, Pearl & Platinum | GlitchxCity | `pokemon-theme2.mp3` |
| Song 3 | Ecruteak City Remix | Pokémon HeartGold & SoulSilver | — | `pokemon-theme3.wav` |

**Sound Effects**
- Paddle hit sound: [Mixkit Free Arcade Sound Effects](https://mixkit.co/free-sound-effects/arcade/)

> All music is used for personal/educational purposes. Rights belong to their respective owners.

---

## 📁 Project Structure

```
Ping pong project/
├── index.html             # Game layout and popups
├── script.js              # All game logic
├── style.css              # Styling and animations
├── music/
│   ├── pokemon-theme.mp3  # Song 1 — Zinnia Battle Remix
│   ├── pokemon-theme2.mp3 # Song 2 — Champion Cynthia Battle Remix
│   └── pokemon-theme3.wav # Song 3 — Ecruteak City Remix
└── mixkit-arcade-game-jump-coin-216.wav  # Paddle hit sound
```

---

## 💡 Skills Demonstrated

This project was built using **no frameworks or libraries** — purely vanilla HTML, CSS, and JavaScript. Every feature was implemented from scratch, which required a deep understanding of how the browser and the language actually work.

| Skill | What it shows |
|---|---|
| Canvas API | Game rendering & animation loops |
| Web Audio API | Working with browser APIs directly |
| DOM Manipulation | Creating/modifying elements in JS |
| Event Handling | Keyboard, click, resize events |
| OOP (Classes) | `Paddle`, `Ball` classes |
| Responsive Design | Speed scaling, viewport adjustments |
| State Management | Game states without a framework |
| External APIs | PokeAPI integration |

Building at this level — without a framework doing the heavy lifting — means the fundamentals are solid. Concepts like the **event loop**, **DOM tree**, **object-oriented design**, **API calls**, and **state management** are the same building blocks used in React, Vue, Node.js, and beyond.

Because of this foundation, picking up any modern framework or language is just learning new **syntax and patterns** — the underlying thinking is already there. Whether that's React components (which are just functions + state), Node.js (which is just JavaScript on a server), or TypeScript (which is just JavaScript with types) — the core is the same.

> *Good fundamentals don't lock you into one technology — they make every new technology easier to learn.*
