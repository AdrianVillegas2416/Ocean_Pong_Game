let theCanvas; // to reference the canvas
let context; // what will provide all of the functions that will be drawn
let winningScore = 10; //how many points needed to win (user can change this)
let aiDifficulty = 5; //Default difficulty
let currentMode = 'ai';
let currentTheme = 'dark'; // 'dark' or 'sunny'
let paddleHitSound = new Audio('mixkit-arcade-game-jump-coin-216.wav');
let backgroundMusic  = new Audio('music/pokemon-theme.mp3');
let backgroundMusic2 = new Audio('music/pokemon-theme2.mp3');
let backgroundMusic3 = new Audio('music/pokemon-theme3.wav');
let currentMusicChoice = 'song1'; // 'none' | 'song1' | 'song2' | 'song3'
let musicVolume = 0.4; // 0.0 – 1.0, controlled by slider
let currentScreen = 'menu';

// ── Button Click Sound (Web Audio API — no file needed) ───────
let audioCtx = null; // shared AudioContext (created once, reused forever)

function getAudioContext() {
    // Create the AudioContext only once; reuse it on every call
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

//keywords such as .connect., .gain, .frequency came from the Web Audio API
function playButtonClickSound() {
    try {
        const ctx = getAudioContext();
        // AudioContext can be suspended by the browser until the user interacts
        if (ctx.state === 'suspended') ctx.resume();

        // oscillator = generates the actual tone (a wave)
        const oscillator = ctx.createOscillator(); //when we call this ctx.createOscillator() -- the browser gives you an OscillatorNode with a built-in .frequency property (also an AudioParam). It controls the pitch in Hz.
        // gainNode = controls the volume envelope (how loud over time)
        const gainNode = ctx.createGain();

        // Chain: oscillator → volume → speakers
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Shape the pitch: starts at 680Hz, quickly drops to 320Hz
        // This creates a short "blip/bloop" arcade feel
        oscillator.type = 'sine'; // smooth, clean wave
        oscillator.frequency.setValueAtTime(680, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.09);
        // exponentialRampToValueAtTime = smoothly slides the pitch down

        // Shape the volume: starts at 0.28, fades to near-silent in 0.1s
        gainNode.gain.setValueAtTime(0.28, ctx.currentTime); //.gain is an object -- it's an AudioParam object that controls volume (0 = silent, 1 = full volume).
        //Instantly sets the value at a specific time
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); //Smoothly slides to a value using a curved (natural-sounding) fade
        // exponentialRamp sounds more natural than a linear fade

        // Play for 0.1 seconds then stop (auto-cleanup)
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
        console.log('Button sound error:', e);
    }
}
// ──────────────────────────────────────────────────────────────

let DIRECTION = {//This is for the movements
    STOPPED: 0, //no movement
    UP: 1,      //move up
    DOWN: 2,    //move down
    LEFT: 3,    //move left
    RIGHT: 4    //move right
}

// Water Pokémon roster for the picker
const waterPokemon = [
    { id: 7,   name: 'Squirtle'  },
    { id: 54,  name: 'Psyduck'   },
    { id: 60,  name: 'Poliwag'   },
    { id: 79,  name: 'Slowpoke'  },
    { id: 116, name: 'Horsea'    },
    { id: 129, name: 'Magikarp'  },
    { id: 131, name: 'Lapras'    },
    { id: 134, name: 'Vaporeon'  },
    { id: 158, name: 'Totodile'  },
    { id: 183, name: 'Marill'    },
    { id: 258, name: 'Mudkip'    },
    { id: 393, name: 'Piplup'    },
    { id: 501, name: 'Oshawott'  },
    { id: 656, name: 'Froakie'   },
    { id: 728, name: 'Popplio'   },
    { id: 816, name: 'Sobble'    },
];

// Selected Pokémon IDs (default: Oshawott / Squirtle)
let selectedP1 = 501;
let selectedP2 = 7;

// Pokemon paddle images (loaded dynamically on game start)
let playerImg = new Image();
let otherPlayerImg = new Image();

const bubbles = [];
for (let i = 0; i < 100; i++) {
  bubbles.push({ 
    x: Math.random() * 1400,   
    y: Math.random() * 1000,   
    radius: Math.random() * 10 + 3,
    speed : Math.random() * 0.5 + 0.5
  });
}

const fishes = [];
for(let i = 0; i < 25; i++){
    fishes.push({
        x: Math.random() * 1400,
        y: Math.random() * 800,
        width: 60,
        height: 40,
        speed: Math.random() * 1 + 0.5,
        direction: Math.random() < 0.5 ? 'left' : 'right',
        color : getRandomColor(),
        tailAngle: 0,
        tailDirection: 1,
    })
}


class Paddle{
    //this constuctor (funcion) will be called whenever 
    constructor(side){
        this.width = 15; //width of my paddles
        this.height = 65; //height of my paddles
        //X position: responsive — 10% from each edge, min 60px
        const inset = Math.max(60, Math.floor(theCanvas.width * 0.1));
        this.x = side == 'left' ? inset : theCanvas.width - inset; //
        //Y position: start at the center of the canvas
        this.y = theCanvas.height / 2; 
        this.score = 0; //player score
        this.move = DIRECTION.STOPPED; //initial movement state
        this.speed = 8; //paddle speed

    }
}

class Ball{
    constructor(newSpeed){
        this.width = 15; //width of the ball
        this.height = 15; //height of the ball
        //Start at the center of the canvas
        this.x = theCanvas.width / 2;  
        this.y = theCanvas.height / 2;
        this.moveX = DIRECTION.STOPPED;//horizontal direction
        this.moveY= DIRECTION.STOPPED; //vertical direction
        this.speed = newSpeed; // ball speed
        this.color = 'white';
    }
}

//Game State Variables
let player; //left paddle
let otherPlayer; //right paddle
let ball; //ball instance
let running = false; //flag to check if the game loop started
let gameOver = false; //flag to end game when someone wins
let delayAmount; //used to create a delay after each point scored
let targetForBall; //tells which side ball should go after reset
let beepSound; //reference to audio element for sound effects
let animationFrameId = null; //track the animation frame so we can cancel it
let paused = false; //pause state
let gameOverTimeoutId = null; //track the game-over delay so we can cancel it



// ── Game Over Screen ─────────────────────────────────────────
function showGameOverScreen() {
    if (!gameOver) return;
    const screen    = document.getElementById('gameOverScreen');
    const winnerEl  = document.getElementById('gameOverWinnerText');
    const playerEl  = document.getElementById('gameOverPlayerText');
    const winnerImg = document.getElementById('goWinnerImg');

    if (player.score >= winningScore) {
        winnerEl.textContent  = 'You Win! 🎉';
        playerEl.textContent  = currentMode === 'pvp' ? 'Player 1' : 'Player';
        winnerImg.src         = playerImg.src;
    } else {
        winnerEl.textContent  = currentMode === 'ai' ? 'AI Wins! 🤖' : 'Player 2 Wins! 🎉';
        playerEl.textContent  = currentMode === 'ai' ? 'AI' : 'Player 2';
        winnerImg.src         = otherPlayerImg.src;
    }

    // Reset animations by re-triggering (remove + add class trick)
    const img = winnerImg;
    img.style.animation = 'none';
    img.offsetHeight;   // force reflow
    img.style.animation = '';

    screen.style.display = 'flex';
}
// ─────────────────────────────────────────────────────────────

// ── Music helpers ────────────────────────────────────────────
function getActiveMusic() {
    if (currentMusicChoice === 'song1') return backgroundMusic;
    if (currentMusicChoice === 'song2') return backgroundMusic2;
    if (currentMusicChoice === 'song3') return backgroundMusic3;
    return null;
}
function playCurrentMusic() {
    const m = getActiveMusic();
    if (m) { m.loop = true; m.volume = musicVolume; m.play().catch(e => console.log('Audio blocked:', e)); }
}
function pauseCurrentMusic() {
    backgroundMusic.pause();
    backgroundMusic2.pause();
    backgroundMusic3.pause();
}
function stopCurrentMusic() {
    backgroundMusic.pause();  backgroundMusic.currentTime  = 0;
    backgroundMusic2.pause(); backgroundMusic2.currentTime = 0;
    backgroundMusic3.pause(); backgroundMusic3.currentTime = 0;
}
// ─────────────────────────────────────────────────────────────

  //Hide the Canvas until any menu button is clicked
document.addEventListener('DOMContentLoaded', () => {
    const menu  = document.querySelector('.menu');               // ← correct selector
    const canvas = document.getElementById('the-canvas');
    const popup = document.getElementById('popup');
    const closePopupBtn = document.getElementById('closePopup');
    const aiBackBtn = document.getElementById('aiBackBtn');

    // Splash screen dismiss
    const splashScreen = document.getElementById('splashScreen');
    splashScreen.addEventListener('click', () => {
        playCurrentMusic();
        splashScreen.classList.add('fade-out');
        setTimeout(() => { splashScreen.style.display = 'none'; }, 800);
    });

    // Build a pokemon grid into a container element
    function buildPokemonGrid(containerId, playerNum){
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        const defaultId = playerNum === 1 ? selectedP1 : selectedP2;
        waterPokemon.forEach(poke => {
            const item = document.createElement('div');
            item.classList.add('pokemon-item');
            if(poke.id === defaultId) item.classList.add('selected');
            item.dataset.id = poke.id;
            const img = document.createElement('img');
            img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${poke.id}.png`;
            img.alt = poke.name;
            const label = document.createElement('span');
            label.textContent = poke.name;
            item.appendChild(img);
            item.appendChild(label);
            item.addEventListener('click', () => {
                // Deselect all in this grid
                container.querySelectorAll('.pokemon-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                if(playerNum === 1) selectedP1 = poke.id;
                else selectedP2 = poke.id;
            });
            container.appendChild(item);
        });
    }

    function showPokemonPicker(){
        const pickerPopup = document.getElementById('pokemonPickerPopup');
        const p1Label = document.getElementById('p1Label');
        const p2Label = document.getElementById('p2Label');
        if(currentMode === 'pvp'){
            p1Label.textContent = 'Player 1';
            p2Label.textContent = 'Player 2';
        } else {
            p1Label.textContent = 'Your Pokémon';
            p2Label.textContent = "AI's Pokémon";
        }
        buildPokemonGrid('p1Grid', 1);
        buildPokemonGrid('p2Grid', 2);
        document.getElementById('pickerError').style.display = 'none';
        pickerPopup.style.display = 'flex';
    }

    //Player vs Player mode
    document.getElementById('playerVsPlayerBtn').addEventListener('click', () => {
        menu.style.display = 'none';
        currentMode = 'pvp';
        document.getElementById('themePickerPopup').style.display = 'flex';
    });

    document.getElementById('howToPlayBtn').addEventListener('click', ()=> {
        popup.style.display = 'flex';
    });

    closePopupBtn.addEventListener('click', () => {
        popup.style.display = 'none';
    });

    //Ai vs Player Mode
    document.getElementById('aiVsPlayerBtn').addEventListener('click', () => {
        menu.style.display = 'none';
        currentMode = 'ai';
        document.getElementById('themePickerPopup').style.display = 'flex';
    });

    const aibackBtn = document.getElementById('aiBackBtn');
    aibackBtn.addEventListener('click', () => {
        document.getElementById('aiDifficultyPopup').style.display = 'none';
        document.getElementById('themePickerPopup').style.display = 'flex';
    });
    
    document.getElementById('aiDifficultyConfirm').addEventListener('click', () => {
        const input = document.getElementById('aiDifficultyInput');
        const level = parseInt(input.value, 10);
        if(isNaN(level) || level < 1 || level > 10){
            alert('Defaulting to 5');
            aiDifficulty = 5;
        }
        else{
            aiDifficulty = level;
        }
        document.getElementById('aiDifficultyPopup').style.display = 'none';
        currentMode = 'ai';
        showPokemonPicker();
    });

    document.getElementById('pokemonPickerConfirm').addEventListener('click', () => {
        if(!selectedP1 || !selectedP2){
            document.getElementById('pickerError').style.display = 'block';
            return;
        }
        if(selectedP1 === selectedP2){
            document.getElementById('pickerError').textContent = 'Each player must pick a different Pokémon!';
            document.getElementById('pickerError').style.display = 'block';
            return;
        }
        document.getElementById('pickerError').style.display = 'none';
        document.getElementById('pokemonPickerPopup').style.display = 'none';
        // Load the chosen images
        playerImg = new Image();
        playerImg.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${selectedP1}.png`;
        otherPlayerImg = new Image();
        otherPlayerImg.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${selectedP2}.png`;
        canvas.style.display = 'block';
        if(currentMode === 'ai') startOceanPong();
        else startPlayerVsPlayer();
    });

    document.getElementById('pokemonPickerBack').addEventListener('click', () => {
        document.getElementById('pokemonPickerPopup').style.display = 'none';
        if(currentMode === 'ai'){
            document.getElementById('aiDifficultyPopup').style.display = 'flex';
        } else {
            document.getElementById('themePickerPopup').style.display = 'flex';
        }
    });

    // ── Score selector ────────────────────────────────────────
    document.querySelectorAll('.score-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.score-opt').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            winningScore = parseInt(btn.dataset.score);
            document.getElementById('customScoreInput').value = '';
        });
    });

    document.getElementById('customScoreInput').addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val >= 1 && val <= 99) {
            winningScore = val;
            document.querySelectorAll('.score-opt').forEach(b => b.classList.remove('selected'));
        }
    });
    // ─────────────────────────────────────────────────────────

    // Theme picker
    document.getElementById('darkThemeBtn').addEventListener('click', () => {
        currentTheme = 'dark';
        document.getElementById('themePickerPopup').style.display = 'none';
        if(currentMode === 'ai') document.getElementById('aiDifficultyPopup').style.display = 'flex';
        else showPokemonPicker();
    });
    document.getElementById('sunnyThemeBtn').addEventListener('click', () => {
        currentTheme = 'sunny';
        document.getElementById('themePickerPopup').style.display = 'none';
        if(currentMode === 'ai') document.getElementById('aiDifficultyPopup').style.display = 'flex';
        else showPokemonPicker();
    });
    document.getElementById('themeBackBtn').addEventListener('click', () => {
        document.getElementById('themePickerPopup').style.display = 'none';
        menu.style.display = 'flex';
    });
    
    const gameBackBtn = document .getElementById('gameBackBtn');

    gameBackBtn.addEventListener('click', () => {
        // Stop the game loop before going back
        if(animationFrameId !== null){
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        // Cancel any pending game over screen
        if(gameOverTimeoutId !== null){
            clearTimeout(gameOverTimeoutId);
            gameOverTimeoutId = null;
        }
        document.getElementById('gameOverScreen').style.display = 'none';
        running = false;
        gameOver = false;
        paused = false;
        stopCurrentMusic();
        playCurrentMusic();
        canvas.style.display = 'none';
        gameBackBtn.style.display = 'none';
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.style.display = 'none';
        pauseBtn.textContent = '⏸ Pause';
        pauseBtn.classList.remove('paused');
        document.getElementById('inGameMusicBtn').style.display = 'none';
        menu.style.display = 'flex';
        showBackgroundElements();
    })

    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.addEventListener('click', () => {
        if(!paused){
            paused = true;
            if(animationFrameId !== null){
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            pauseCurrentMusic();
            pauseBtn.textContent = '▶ Resume';
            pauseBtn.classList.add('paused');
        } else {
            paused = false;
            playCurrentMusic();
            animationFrameId = requestAnimationFrame(GameLoop);
            pauseBtn.textContent = '⏸ Pause';
            pauseBtn.classList.remove('paused');
        }
    });


    //This is for the name
    // const playerNamePopup = document.getElementById('playerNamePopup');
    // const player1Name = document.getElementById('')

    // ── Mobile Touch Controls ────────────────────────────────────
    let touchP1Id = null, touchP2Id = null;

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!running) return;
        Array.from(e.changedTouches).forEach(touch => {
            const rect = canvas.getBoundingClientRect();
            const tx = (touch.clientX - rect.left) * (canvas.width / rect.width);
            if (tx < canvas.width / 2 && touchP1Id === null) {
                touchP1Id = touch.identifier;
            } else if (tx >= canvas.width / 2 && currentMode === 'pvp' && touchP2Id === null) {
                touchP2Id = touch.identifier;
            }
        });
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!running || !player) return;
        Array.from(e.changedTouches).forEach(touch => {
            const rect = canvas.getBoundingClientRect();
            const ty = (touch.clientY - rect.top) * (canvas.height / rect.height);
            if (touch.identifier === touchP1Id) {
                player.y = Math.max(0, Math.min(ty - player.height / 2, canvas.height - player.height));
            } else if (touch.identifier === touchP2Id) {
                otherPlayer.y = Math.max(0, Math.min(ty - otherPlayer.height / 2, canvas.height - otherPlayer.height));
            }
        });
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        Array.from(e.changedTouches).forEach(touch => {
            if (touch.identifier === touchP1Id) touchP1Id = null;
            if (touch.identifier === touchP2Id) touchP2Id = null;
        });
    });
    // ─────────────────────────────────────────────────────────────

    // ── Global Button Click Sound ─────────────────────────────
    // One listener covers ALL buttons — past and future ones
    document.addEventListener('click', (e) => {
        // e.target = the exact element clicked
        // .closest('button') = walks up the DOM tree to find a <button> ancestor
        // This handles clicks on text/emoji INSIDE a button too
        if (e.target.closest('button')) {
            playButtonClickSound();
        }
    });
    // ─────────────────────────────────────────────────────────

    // ── Music Settings ─────────────────────────────────────────
    document.getElementById('musicSettingsBtn').addEventListener('click', () => {
        // Sync visual selection to current choice
        document.querySelectorAll('.music-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.choice === currentMusicChoice);
        });
        document.getElementById('musicSettingsPopup').style.display = 'flex';
    });

    document.querySelectorAll('.music-option').forEach(option => {
        option.addEventListener('click', () => {
            const choice = option.dataset.choice;
            if (choice === currentMusicChoice) return; // already selected

            stopCurrentMusic();
            currentMusicChoice = choice;

            // Update visual selection
            document.querySelectorAll('.music-option').forEach(el => {
                el.classList.toggle('selected', el.dataset.choice === choice);
            });

            // Start new track (music is playing on menu from splash click)
            if (choice !== 'none') playCurrentMusic();
        });
    });

    document.getElementById('musicSettingsClose').addEventListener('click', () => {
        document.getElementById('musicSettingsPopup').style.display = 'none';
        // Resume game if the music button auto-paused it
        if (pausedByMusicBtn && running && paused) {
            pausedByMusicBtn = false;
            paused = false;
            playCurrentMusic();
            animationFrameId = requestAnimationFrame(GameLoop);
            const pauseBtn = document.getElementById('pauseBtn');
            pauseBtn.textContent = '⏸ Pause';
            pauseBtn.classList.remove('paused');
        }
    });

    let pausedByMusicBtn = false;
    document.getElementById('inGameMusicBtn').addEventListener('click', () => {
        playButtonClickSound();
        // Auto-pause if game is running and not already paused
        if (running && !paused && !gameOver) {
            pausedByMusicBtn = true;
            paused = true;
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            const pauseBtn = document.getElementById('pauseBtn');
            pauseBtn.textContent = '▶ Resume';
            pauseBtn.classList.add('paused');
        } else {
            pausedByMusicBtn = false;
        }
        // Sync music option highlights and volume slider
        document.querySelectorAll('.music-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.choice === currentMusicChoice);
        });
        updateSliderFill(volSlider);
        document.getElementById('musicSettingsPopup').style.display = 'flex';
    });

    // ── Volume slider ──────────────────────────────────────────
    const volSlider = document.getElementById('musicVolume');
    function updateSliderFill(slider) {
        const pct = (parseFloat(slider.value) / parseFloat(slider.max)) * 100;
        slider.style.background = `linear-gradient(to right, #0072ff 0%, #0072ff ${pct}%, #c8d8f0 ${pct}%, #c8d8f0 100%)`;
    }
    updateSliderFill(volSlider); // set initial fill

    volSlider.addEventListener('input', (e) => {
        musicVolume = parseFloat(e.target.value);
        updateSliderFill(e.target);
        // Apply to whichever track is currently playing
        [backgroundMusic, backgroundMusic2, backgroundMusic3].forEach(m => {
            m.volume = musicVolume;
        });
    });
    // ─────────────────────────────────────────────────────────
    // ───────────────────────────────────────────────────────────

    // ── Keyboard Shortcut: Space / Esc to pause ───────────────
    document.addEventListener('keydown', (e) => {
        if ((e.code === 'Space' || e.code === 'Escape') && running && !gameOver) {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            e.preventDefault();
            document.getElementById('pauseBtn').click();
        }
    });
    // ─────────────────────────────────────────────────────────

    // ── Auto-pause when tab is hidden ────────────────────────
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && running && !paused && !gameOver) {
            document.getElementById('pauseBtn').click();
        }
    });
    // ─────────────────────────────────────────────────────────

    // ── Play Again / Main Menu buttons ───────────────────────
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        document.getElementById('gameOverScreen').style.display = 'none';
        if (currentMode === 'ai') startOceanPong();
        else startPlayerVsPlayer();
    });

    document.getElementById('mainMenuBtn').addEventListener('click', () => {
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('gameBackBtn').click();
    });
    // ─────────────────────────────────────────────────────────

});

    //Cloud Movements
    function createClouds(numClouds){
        const container = document.querySelector(".game-container");

        for(let i = 0; i < numClouds; i++){
            const cloud = document.createElement("div");
            cloud.classList.add("cloud");
        

        //To generate random sizes for clouds
        const width = Math.floor(Math.random() * 150) + 80;
        const height = Math.floor(width / 2);
        cloud.style.width = width + "px";
        cloud.style.height = height + "px";

        //Random vertical position
        cloud.style.top = Math.floor(Math.random() * 200 + 50) + "px";

        //Random starting position
        cloud.style.left = Math.floor(Math.random() * window.innerWidth) + "px";

        //Random speed
        const speed = Math.random() * 30 + 30;
        cloud.style.animationDuration = speed + "s";

        //animation direction
        const direction = Math.random() < 0.5 ? 'normal' : 'reverse';

        cloud.style.animationDirection = direction;

        container.appendChild(cloud);
        }
    }


    document.addEventListener("DOMContentLoaded", function(){
        createClouds(50);
    });

    function hideBackgroundElements(){
        const sun = document.querySelector('.sun');
        if(sun) sun.style.display = 'none';
    
    //Hide Clouds
    const clouds = document.querySelectorAll('.cloud');
    clouds.forEach(cloud => cloud.style.display = 'none');

    const sand = document.querySelector('.sand');
    if(sand) sand.style.display = 'none';

    // const seashells = document.querySelectorAll('.seashell');
    // seashells.forEach(shell => shell.style.display = 'none');

    }

   function startOceanPong(){
        currentMode = 'ai';
        paused = false;
        console.log('Starting Ocean Pong');
        hideBackgroundElements();
        // Cancel any existing loop before starting a new one
        if(animationFrameId !== null){
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        SettingUpCanvas();
        running = true;
        playCurrentMusic();
        animationFrameId = window.requestAnimationFrame(GameLoop);
        document.getElementById('gameBackBtn').style.display = 'block';
        document.getElementById('inGameMusicBtn').style.display = 'block';
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.style.display = 'block';
        pauseBtn.textContent = '⏸ Pause';
        pauseBtn.classList.remove('paused');
    }

    function startPlayerVsPlayer(){
        currentMode = 'pvp';
        paused = false;
        console.log('Starting Player vs Player mode');
        hideBackgroundElements();
        // Cancel any existing loop before starting a new one
        if(animationFrameId !== null){
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        SettingUpCanvas();
        running = true;
        playCurrentMusic();
        animationFrameId = window.requestAnimationFrame(GameLoop);
        document.getElementById('gameBackBtn').style.display = 'block';
        document.getElementById('inGameMusicBtn').style.display = 'block';
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.style.display = 'block';
        pauseBtn.textContent = '⏸ Pause';
        pauseBtn.classList.remove('paused');
    }


//STEPS TO DO

// Returns a speed multiplier based on screen width
// Smaller screens get slower speeds so the game feels fair
function getSpeedMultiplier() {
    const w = window.innerWidth;
    if (w < 480)  return 0.30;  // small phones
    if (w < 768)  return 0.42;  // large phones / small tablets
    if (w < 1024) return 0.60;  // tablets
    return 1.0;                 // desktops — full speed
}

//SETup Canvas
function SettingUpCanvas(){
    theCanvas = document.getElementById('the-canvas');  //get canvas element
    context = theCanvas.getContext('2d');               //get 2D drawing context

    function resizeTheCanvas(){
        theCanvas.width = window.innerWidth;
        theCanvas.height = window.innerHeight;
        // Reposition paddles to correct edges after resize
        if (player && otherPlayer) {
            const inset = Math.max(60, Math.floor(theCanvas.width * 0.1));
            player.x = inset;
            otherPlayer.x = theCanvas.width - inset;
        }
    }

    resizeTheCanvas();
    window.addEventListener('resize', resizeTheCanvas);
   

 
    player = new Paddle('left');                        //create left paddle
    otherPlayer = new Paddle('right');                  //create right paddle
    const speedMult = getSpeedMultiplier();             // scale speeds for screen size
    const baseSpeed = (currentMode === 'pvp' ? 6 : 5) * speedMult;
    ball = new Ball(baseSpeed); //pvp is slightly faster than ai mode
    if(currentTheme === 'sunny') ball.color = '#01579B'; // dark navy visible on light bg
    player.speed = Math.round(8 * speedMult);           // scale paddle speed too
    otherPlayer.speed = Math.round(8 * speedMult);      // Other player paddle speed
    targetForBall = player;                             //Ball initially goes to player side
    delayAmount = (new Date()).getTime();               //start delay timer
    gameOver = false;                                   //reset game over flag
    // Remove old listeners before adding to avoid stacking
    document.removeEventListener('keydown', MovePlayerPaddle);
    document.removeEventListener('keyup', StopPlayerPaddle);
    document.addEventListener('keydown', MovePlayerPaddle);  //handle key down
    document.addEventListener('keyup', StopPlayerPaddle);    //handle key up
    Draw() ;
}
 
//Drawing Everything 
function Draw(){
    //clear entire canvas
    context.clearRect(0,0, theCanvas.width, theCanvas.height);

    const oceanBackground = context.createLinearGradient(0,0,0,theCanvas.height);
    if(currentTheme === 'sunny'){
        oceanBackground.addColorStop(0,    '#E0F7FA'); // bright aqua surface
        oceanBackground.addColorStop(0.25, '#4DD0E1'); // tropical cyan
        oceanBackground.addColorStop(0.6,  '#0097A7'); // medium teal
        oceanBackground.addColorStop(1,    '#004D55'); // deep teal
    } else {
        oceanBackground.addColorStop(0,    '#A8D8F0'); // bright surface
        oceanBackground.addColorStop(0.25, '#2980B9'); // mid water
        oceanBackground.addColorStop(0.6,  '#1A5276'); // deeper
        oceanBackground.addColorStop(1,    '#050E1A'); // near-black floor
    }
    context.fillStyle = oceanBackground;
    context.fillRect(0, 0, theCanvas.width, theCanvas.height);

    // draw bubbles (static)
    for (const b of bubbles) {
        //to make the bubbles move up
        b.y -= b.speed;
        if(b.y + b.radius < 0){ //if the bubbles moves up from the canvas
            b.y = theCanvas.height + b.radius; // reset it from the bottom
            b.x = Math.random() * theCanvas.width; //give it a new random x position
        }
        context.beginPath();
        context.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        const bubbleGrad = context.createRadialGradient(
            b.x - b.radius * 0.3, b.y - b.radius * 0.35, b.radius * 0.05,
            b.x, b.y, b.radius);
        bubbleGrad.addColorStop(0,   'rgba(255,255,255,0.8)');
        bubbleGrad.addColorStop(0.4, 'rgba(200,230,255,0.2)');
        bubbleGrad.addColorStop(1,   'rgba(150,200,255,0.04)');
        context.fillStyle = bubbleGrad;
        context.fill();
        context.strokeStyle = 'rgba(255,255,255,0.25)';
        context.lineWidth = 0.5;
        context.stroke();
   }

    for(const f of fishes){
    //Move Fish
    f.x += f.direction === 'right' ? f.speed : -f.speed; //moves the fish left or right depending on its direction
    if(f.x > theCanvas.width + f.width) f.x = -f.width;  //if the fish moves outside of the canvas (like going to the right -- it will go back but moving in the left direction)
    if(f.x < -f.width) f.x = theCanvas.width + f.width; //if the fish moves to the left (outside of the canvas - it will go back coming form the left towards right)

    f.tailAngle += f.tailDirection * 0.2;
    if(f.tailAngle > 0.5 || f.tailAngle < -0.5) f.tailDirection *= -1;

    context.fillStyle = f.color;
    context.beginPath();
    context.ellipse(f.x, f.y, f.width / 2, f.height / 2, 0, 0, Math.PI * 2);
    context.fill();

    // Draw fish body
    context.fillStyle = f.color;
    context.beginPath();
    context.ellipse(f.x, f.y, f.width / 2, f.height / 2, 0, 0, Math.PI * 2);
    context.fill();


    context.beginPath();
        const tailLength = 10;
        if (f.direction === 'right') {
            context.moveTo(f.x - f.width / 2, f.y);
            context.lineTo(f.x - f.width / 2 - tailLength * Math.cos(f.tailAngle),
                           f.y - tailLength * Math.sin(f.tailAngle));
            context.lineTo(f.x - f.width / 2 - tailLength * Math.cos(f.tailAngle),
                           f.y + tailLength * Math.sin(f.tailAngle));
        } else {
            context.moveTo(f.x + f.width / 2, f.y);
            context.lineTo(f.x + f.width / 2 + tailLength * Math.cos(f.tailAngle),
                           f.y - tailLength * Math.sin(f.tailAngle));
            context.lineTo(f.x + f.width / 2 + tailLength * Math.cos(f.tailAngle),
                           f.y + tailLength * Math.sin(f.tailAngle));
        }
        context.closePath();
        context.fill();
    }

    // Vignette — darkens edges to give sense of depth
    const vignette = context.createRadialGradient(
        theCanvas.width * 0.5, theCanvas.height * 0.4, theCanvas.height * 0.15,
        theCanvas.width * 0.5, theCanvas.height * 0.5, theCanvas.width * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, currentTheme === 'sunny' ? 'rgba(0,30,40,0.15)' : 'rgba(0,5,20,0.65)');
    context.fillStyle = vignette;
    context.fillRect(0, 0, theCanvas.width, theCanvas.height);

    // Draw Pokémon paddles — size scales with screen width
    const pokeSize = Math.min(90, Math.floor(theCanvas.width * 0.13));

    // Left paddle, flipped to face right (toward center)
    const p1X = player.x + player.width / 2 - pokeSize / 2;
    const p1Y = player.y + player.height / 2 - pokeSize / 2;
    if(playerImg.complete && playerImg.naturalHeight !== 0){
        context.save();
        context.scale(-1, 1);
        context.drawImage(playerImg, -(p1X + pokeSize), p1Y, pokeSize, pokeSize);
        context.restore();
    } else {
        context.fillStyle = 'white';
        context.fillRect(player.x, player.y, player.width, player.height);
    }

    // Right paddle, drawn normally (faces left toward center)
    const p2X = otherPlayer.x + otherPlayer.width / 2 - pokeSize / 2;
    const p2Y = otherPlayer.y + otherPlayer.height / 2 - pokeSize / 2;
    if(otherPlayerImg.complete && otherPlayerImg.naturalHeight !== 0){
        context.drawImage(otherPlayerImg, p2X, p2Y, pokeSize, pokeSize);
    } else {
        context.fillStyle = 'white';
        context.fillRect(otherPlayer.x, otherPlayer.y, otherPlayer.width, otherPlayer.height);
    }

    context.fillStyle = ball.color;
    context.fillRect(ball.x, ball.y, ball.width, ball.height);

    //Draw Scores — fully responsive
    context.fillStyle = currentTheme === 'sunny' ? '#01579B' : 'white';
    const scoreFontSize = Math.max(28, Math.min(80, Math.floor(theCanvas.width * 0.065)));
    context.font = `${scoreFontSize}px Arial`;
    context.textAlign = 'center';
    const scoreOffset = theCanvas.width * 0.22;
    const scoreY = Math.max(55, theCanvas.height * 0.09);
    context.fillText(player.score.toString(),      theCanvas.width / 2 - scoreOffset, scoreY);
    context.fillText(otherPlayer.score.toString(), theCanvas.width / 2 + scoreOffset, scoreY);

    // ── "First to X" indicator ────────────────────────────────
    const labelFontSize = Math.max(12, Math.min(22, Math.floor(theCanvas.width * 0.018)));
    context.font = `bold ${labelFontSize}px Arial`;
    context.textAlign = 'center';
    context.fillStyle = currentTheme === 'sunny'
        ? 'rgba(1,87,155,0.55)'
        : 'rgba(255,255,255,0.4)';
    context.fillText(`★ First to ${winningScore} ★`, theCanvas.width / 2, scoreY + labelFontSize + 6);
    // ─────────────────────────────────────────────────────────

    // ── 2-1 Countdown display ─────────────────────────────────
    if (targetForBall !== null && !gameOver) {
        const elapsed = (new Date()).getTime() - delayAmount;
        const remaining = Math.ceil((2000 - elapsed) / 1000);
        if (remaining >= 1) {
            const cSize = Math.max(60, Math.min(160, Math.floor(theCanvas.width * 0.12)));
            context.save();
            context.textAlign = 'center';
            context.font = `bold ${cSize}px Arial`;
            context.fillStyle = 'rgba(255, 255, 255, 0.88)';
            context.shadowColor = 'rgba(0, 0, 0, 0.6)';
            context.shadowBlur = 24;
            context.fillText(remaining.toString(), theCanvas.width / 2, theCanvas.height / 2 + cSize * 0.35);
            context.restore();
        }
    }
    // ─────────────────────────────────────────────────────────

    //Display winner message when winning score reached
    const winFontSize = Math.max(22, Math.min(60, Math.floor(theCanvas.width * 0.045)));
    context.font = `${winFontSize}px Arial`;
    if(player.score >= winningScore){
        context.fillText("Player Wins!", theCanvas.width/2, theCanvas.height * 0.35);
        gameOver = true;
    }
    if(otherPlayer.score >= winningScore){
        context.fillText("Other Player Wins!", theCanvas.width/2, theCanvas.height * 0.35);
        gameOver = true;
    }
}

function getRandomColor(){
    const hueColor = Math.random() * 360;
    const saturationColor = 70;
    const lightness = 60;
    return `hsl(${hueColor}, ${saturationColor}%, ${lightness}%)`;
}

//Update Game State Each Frame

function Update(){
    // Always snap paddles to correct horizontal edges every frame
    if (player && otherPlayer) {
        const inset = Math.max(60, Math.floor(theCanvas.width * 0.1));
        player.x = inset;
        otherPlayer.x = theCanvas.width - inset;
    }

    if(!gameOver){
        //if ball passes left edge, right player scores
        if(ball.x <= 0){
            ResetBall(otherPlayer, player);
        }
        //if ball passes right edge, left player scores
        if(ball.x >= theCanvas.width - ball.width){
            ResetBall(player, otherPlayer);
        }

        // --   Ball Collision with top / bottom ---
        //if the ball bounce top edge -> the ball should go down
        if(ball.y <= 0){
            ball.moveY = DIRECTION.DOWN;
        }
        //if the ball bounce bottom edge -> ball should go up
        if(ball.y >= theCanvas.height - ball.height){
            ball.moveY = DIRECTION.UP
        }


        // -- Move player paddle up/down --
        if(player.move === DIRECTION.DOWN){
            player.y += player.speed;
        }
        else if(player.move === DIRECTION.UP){
            player.y -= player.speed;
        }


        // --  Move player paddle ---
        if(currentMode === 'pvp'){
            if(otherPlayer.move === DIRECTION.DOWN) otherPlayer.y += otherPlayer.speed;
            else if(otherPlayer.move === DIRECTION.UP) otherPlayer.y -= otherPlayer.speed;
        }
        else if(currentMode === 'ai'){
            const offset = (Math.random() - 0.5) * (50 - aiDifficulty * 4);
            //higher difficulty means smaller random offset (more precise AI)
            //calculates where the AI paddle should aim to move
             const targetY = ball.y - (otherPlayer.height / 2) + offset;
             //offset -- adds the random variation to make AI imperfect 
             if(ball.moveX === DIRECTION.RIGHT){
                //if paddle is above target: move down
                //if paddle is below target: move up
                //Movement 
                if(otherPlayer.y > targetY){
                    otherPlayer.y -= otherPlayer.speed * (aiDifficulty / 10);
                }
                else if(otherPlayer.y < targetY){
                    otherPlayer.y += otherPlayer.speed * (aiDifficulty / 10);
                }
             }
        }


        //This is to prevent each player's paddles to go off screen
        if(player.y < 0 ){
            player.y = 0;
        }
        else if(player.y >= (theCanvas.height - player.height)){
            player.y = theCanvas.height - player.height
        }
        //After a delay, launch ball toward target player
        if(AddADelay() && targetForBall){
            ball.moveX = targetForBall === player ? DIRECTION.LEFT:
            DIRECTION.RIGHT;
            //Randomly choose up or down after the delay
            ball.moveY = [DIRECTION.UP, DIRECTION.DOWN][Math.round(Math.random())];
            ball.y = theCanvas.height/2; //reset y
            targetForBall = null; //clear target
        }
        //move ball vertically
        if(ball.moveY === DIRECTION.UP){
            ball.y -= ball.speed;
        }
        else if(ball.moveY === DIRECTION.DOWN){
            ball.y += ball.speed;
        }
        //move the ball horizontally
        if(ball.moveX === DIRECTION.LEFT){
            ball.x -= ball.speed;
        }

        else if(ball.moveX === DIRECTION.RIGHT){
            ball.x += ball.speed
        }

        }

        //This is to prevent AI paddle from going offscreen
        if(otherPlayer.y < 0 ){
            otherPlayer.y = 0;
        }
        else if(otherPlayer.y >= (theCanvas.height - otherPlayer.height)){
            otherPlayer.y = theCanvas.height - otherPlayer.height
        }
        //Ball collision with player paddle -> bounce right 
        if(ball.x - ball.width <= player.x && ball.x >= player.x - player.width){
            if(ball.y <= player.y + player.height && ball.y + ball.height >= player.y){
                ball.moveX = DIRECTION.RIGHT;
                ball.color = getRandomColor();
                paddleHitSound.play();
                // beepSound.play();
            }
        }

        //Ball Collsion with AI paddle -> bounce left 
        if(ball.x - ball.width <= otherPlayer.x && ball.x >= otherPlayer.x - otherPlayer.width){
            if(ball.y <= otherPlayer.y + otherPlayer.height && ball.y + ball.height >= otherPlayer.y){
                ball.moveX = DIRECTION.LEFT;
                ball.color = getRandomColor();
                paddleHitSound.play();
                // beepSound.play();
            }
        }
    }


//MovePlayerPaddle
function MovePlayerPaddle(key){

    if(currentMode === 'ai'){
        if(key.keyCode === 87 || key.keyCode ===38 ) player.move = DIRECTION.UP; //W
        if(key.keyCode === 83 || key.keyCode ===40) player.move = DIRECTION.DOWN; //S
    }

    if(currentMode ==='pvp'){

        //Player 1
        if(key.keyCode === 87) player.move = DIRECTION.UP; //W
        if(key.keyCode === 83) player.move = DIRECTION.DOWN; //S

        if(key.keyCode === 38) otherPlayer.move = DIRECTION.UP;
        if(key.keyCode === 40) otherPlayer.move = DIRECTION.DOWN;

    }
    
    const m = getSpeedMultiplier();
    if(key.shiftKey) {
        player.speed = Math.round(12 * m);
        otherPlayer.speed = Math.round(12 * m);
    }
    else{
        player.speed = Math.round(8 * m);
        otherPlayer.speed = Math.round(8 * m);
    }
}

//StopPlayerPaddle
function StopPlayerPaddle(evt){
    //stop paddle when key released
    if(currentMode === 'ai'){
        if([87,83,38,40].includes(evt.keyCode)){
            player.move = DIRECTION.STOPPED;
        }
    }

    if(currentMode === 'pvp'){
        if(evt.keyCode === 87 || evt.keyCode === 83){
            player.move = DIRECTION.STOPPED;
        }
        if(evt.keyCode === 38 || evt.keyCode === 40){
            otherPlayer.move = DIRECTION.STOPPED;
        }
    }
}

//show the background again
function showBackgroundElements(){
    const sun = document.querySelector('.sun');
    if(sun) sun.style.display = 'block';

    const clouds = document.querySelectorAll('.cloud');
    clouds.forEach(cloud => cloud.style.display = 'block');

    const sand = document.querySelector('.sand');
    if(sand) sand.style.display = 'block';
}

//GameLoop
function GameLoop(){
    Update();
    Draw();
    if(!gameOver){
        animationFrameId = requestAnimationFrame(GameLoop); //keep looping until game over
    } else {
        animationFrameId = null;
        // Show game over overlay after a short pause so winner text is visible
        gameOverTimeoutId = setTimeout(showGameOverScreen, 1200);
    }
}
 
//Reset Ball After Score
function ResetBall(scored, lost){
    scored.score++;                      //increase scorer's score
    let newBallSpeed = ball.speed + 0.2;//slightly increase ball speed each point
    ball = new Ball(newBallSpeed);       //create a new ball
    targetForBall = lost;                //set ball to go toward loser
    delayAmount = (new Date()).getTime();//start delay timer
}


//AddADelay function
function AddADelay(){
    //returns true if 2 seconds passed (matches the 2-1 countdown)
    return ((new Date()).getTime() - delayAmount >= 2000);

}



