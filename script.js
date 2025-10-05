let theCanvas; // to reference the canvas
let context; // what will provide all of the functions that will be drawn
const winningScore = 10; //how many points needed to win
let aiDifficulty = 5; //Default difficulty
let currentMode = 'ai';
let paddleHitSound = new Audio('mixkit-arcade-game-jump-coin-216.wav');
let backgroundMusic = new Audio('music/Bit Shift.mp3');
let currentScreen = 'menu';

let DIRECTION = {//This is for the movements
    STOPPED: 0, //no movement
    UP: 1,      //move up
    DOWN: 2,    //move down
    LEFT: 3,    //move left
    RIGHT: 4    //move right
}

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
        //X position: if left paddle, at 150 px, if right paddle , 150 px from the right edge 
        this.x = side == 'left'? 150 : theCanvas.width - 150; //
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



  //Hide the Canvas until any menu button is clicked 
document.addEventListener('DOMContentLoaded', () => {
    const menu  = document.querySelector('.menu');               // ← correct selector
    const canvas = document.getElementById('the-canvas');
    const popup = document.getElementById('popup');
    const closePopupBtn = document.getElementById('closePopup');
    const aiBackBtn = document.getElementById('aiBackBtn');

    //Player vs Player mode
    document.getElementById('playerVsPlayerBtn').addEventListener('click', () => {
        menu.style.display = 'none';
        canvas.style.display = 'block';
        startPlayerVsPlayer();
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
        const aiPopup = document.getElementById('aiDifficultyPopup');
        aiPopup.style.display = 'flex';
    });

    const aibackBtn = document.getElementById('aiBackBtn');
    aibackBtn.addEventListener('click', () => {
        document.getElementById('aiDifficultyPopup').style.display = 'none';
        menu.style.display = 'flex';
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
        document.getElementById('the-canvas').style.display = 'block';
        startOceanPong();
    });
    
    const gameBackBtn = document .getElementById('gameBackBtn');

    gameBackBtn.addEventListener('click', () => {
        canvas.style.display = 'none';
        gameBackBtn.style.display = 'none' ;
        menu.style.display = 'flex';
        showBackgroundElements();
    })


    //This is for the name
    // const playerNamePopup = document.getElementById('playerNamePopup');
    // const player1Name = document.getElementById('')



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
        console.log('Starting Ocean Pong');
        hideBackgroundElements();
        SettingUpCanvas();
        running = true;
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.5;
        backgroundMusic.play().catch(e => console.log("User interaction required to play audio", e));
        window.requestAnimationFrame(GameLoop);
        document.getElementById('gameBackBtn').style.display = 'block';
    }

    function startPlayerVsPlayer(){
        currentMode = 'pvp';
        console.log('Starting Player vs Player mode');
        hideBackgroundElements();
        SettingUpCanvas();
        running = true;
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.5;
        backgroundMusic.play().catch(e => console.log("User interaction required to play audio", e));
        // document.getElementsById('gameBackBtn').style.display = 'block';
        window.requestAnimationFrame(GameLoop);
        document.getElementById('gameBackBtn').style.display = 'block';
    }

  

//STEPS TO DO

//SETup Canvas
function SettingUpCanvas(){
    theCanvas = document.getElementById('the-canvas');  //get canvas element
    context = theCanvas.getContext('2d');               //get 2D drawing context

    function resizeTheCanvas(){
        theCanvas.width = window.innerWidth;
        theCanvas.height = window.innerHeight;
    }

    resizeTheCanvas();
    window.addEventListener('resize', resizeTheCanvas);
   

 
    player = new Paddle('left');                        //create left paddle
    otherPlayer = new Paddle('right');                  //create right paddle
    ball = new Ball(5);                                 //create ball with speed 2
    otherPlayer.speed = 8;                              // Other player paddle speed 
    targetForBall = player;                             //Balll initially goes to player side
    delayAmount = (new Date()).getTime();               //start delay timer
    document.addEventListener('keydown', MovePlayerPaddle);  //handle key down
    document.addEventListener('keyup', StopPlayerPaddle);    //handle key up
    Draw() ;
}
 
//Drawing Everything 
function Draw(){
    //clear entire canvas
    context.clearRect(0,0, theCanvas.width, theCanvas.height);

    const oceanBackground = context.createLinearGradient(0,0,0,theCanvas.height);
    oceanBackground.addColorStop(0, '#87CEFA'); 
    oceanBackground.addColorStop(1, '#1E3F66'); 
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
        context.beginPath(); //this is to start making new shape
        context.arc(b.x, b.y, b.radius, 0, Math.PI * 2); //this is to make a circle
        context.fillStyle = 'rgba(255,255,255,0.3)'; //this is the color of the bubbles
        context.fill(); //this is to put color
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


    //draw paddles and ball in white
    context.fillStyle = 'white'
    context.fillRect(player.x, player.y, player.width, player.height);
    context.fillRect(otherPlayer.x, otherPlayer.y, otherPlayer.width, otherPlayer.height);

    context.fillStyle = ball.color;
    context.fillRect(ball.x, ball.y, ball.width, ball.height);

    //Draw Scores
    context.fillStyle = 'white';
    context.font = '80px Arial';
    context.textAlign = 'center';
    context.fillText(player.score.toString(), (theCanvas.width / 2) - 300, 100 );
    context.fillText(otherPlayer.score.toString(), (theCanvas.width / 2) + 300, 100 );
    //Display winner message when winning score reached 
    if(player.score >= winningScore){
        context.fillText("Player Wins", theCanvas.width/2, 300);
        gameOver = true;
    }
    
    if(otherPlayer.score >= winningScore){
        context.fillText("Other Player Wins", theCanvas.width/2, 300);
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
    
    if(key.shiftKey) {
        player.speed = 12;
        otherPlayer.speed = 12;
    }
    else{
        player.speed = 8;
        otherPlayer.speed = 8;
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
    if(!gameOver) requestAnimationFrame(GameLoop); //keep looping until game over
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
    //returns true if atleast 1 second passed
    return ((new Date()).getTime() - delayAmount >= 1000);

}



