var ballX = 100;
var ballY = 100;
var ballSpeedX = 5;
var ballSpeedY = 5;
var ballRadius = 10;

const BRICK_W = 80;
const BRICK_H = 20;
const BRICK_GAP = 2;
const BRICK_COLS = 10;
const BRICK_ROWS = 14;
var brickGrid = new Array(BRICK_COLS * BRICK_ROWS);
var bricksLeft = 0;

const PADDLE_WIDTH = 100;
const PADDLE_THICKNESS = 10;
const PADDLE_DIST_FROM_EDGE = 60;
var paddleX = 400;

var canvas, ctx;

var mouseX = 0;
var mouseY = 0;

/**
 * Updates the mouse coordinates and updates the paddle position accordingly.
 * @param {*} evt The event that triggered this handler.
 */
function updateMousePos(evt) {
  var rect = canvas.getBoundingClientRect();
  var root = document.documentElement;

  mouseX = evt.clientX - rect.left - root.scrollLeft;
  mouseY = evt.clientY - rect.top - root.scrollTop;

  paddleX = mouseX - PADDLE_WIDTH / 2;

  // Hack to make ball follow mouse cursor.
  // ballX = mouseX;
  // ballY = mouseY;
  // ballSpeedX = 0;
  // ballSpeedY = 0;
}

/**
 * Set up the brick grid.
 */
function brickReset() {
  bricksLeft = 0;
  var i = 0;

  // Do not draw bricks on the first 3 rows of the canvas.
  for (; i < 3 * BRICK_COLS; i++) brickGrid[i] = false;

  var evenCol;
  var evenRow;
  for (; i < BRICK_COLS * BRICK_ROWS; i++) {
    evenRows = Math.floor(i / BRICK_COLS) % 2;
    evenCols = i % 2 === 0 ? false : true;
    alternateFirstFalse = (evenRows && evenCols) || (!evenRows && !evenCols);
    // alternateFirstTrue =  (!evenRows && evenCols) || (evenRows && !evenCols);

    brickGrid[i] = alternateFirstFalse;
    bricksLeft++;
  }
}

window.onload = function () {
  canvas = document.getElementById('gameCanvas'); // Get canvas; its width and height.
  ctx = canvas.getContext('2d'); // Get the graphics buffer. Where we can draw graphics.

  var framesPerSecond = 30;
  setInterval(updateAll, 1000 / framesPerSecond);

  canvas.addEventListener('mousemove', updateMousePos);

  brickReset();
  ballReset();
};

function updateAll() {
  moveAll();
  drawAll();
}

function ballReset() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
}

/**
 * Updates the ball position according to its current speed and reverses its
 * speed if it hits a canvas bound.
 */
function ballMove() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Bounce from left or right.
  if (
    (ballX < 0 && ballSpeedX < 0.0) ||
    (ballX > canvas.width && ballSpeedX > 0.0)
  )
    ballSpeedX *= -1;

  // Bounce from top
  if (ballY < 0 && ballSpeedY < 0.0) ballSpeedY *= -1;

  // If ball hits the bottom of the canvas, do not bounce back. Instead, it's
  // game over so reset everything.
  if (ballY > canvas.height) {
    ballReset();
    brickReset();
  }
}

/**
 * Converts the given column and row pair into the corresponding index needed to
 * access the desired value in the one-dimensional brickGrid array.
 * @param {Number} col
 * @param {Number} row
 */
function rowColToArrayIndex(col, row) {
  return col + BRICK_COLS * row;
}

/**
 * Determines whether there's a brick at the given column and row.
 * @param {Number} col column number in brick grid.
 * @param {Number} row row number in brick grid.
 */
function isBrickAtColRow(col, row) {
  if (col >= 0 && col < BRICK_COLS && row >= 0 && row < BRICK_ROWS) {
    var brickIndexUnderCoord = rowColToArrayIndex(col, row);
    return brickGrid[brickIndexUnderCoord];
  } else {
    return false;
  }
}

/**
 * Handles ball and brick collisions.
 */
function ballBrickHandling() {
  var ballBrickCol = Math.floor(ballX / BRICK_W);
  var ballBrickRow = Math.floor(ballY / BRICK_H);
  var brickIndexUnderBall = rowColToArrayIndex(ballBrickCol, ballBrickRow);

  if (
    ballBrickCol >= 0 &&
    ballBrickCol < BRICK_COLS &&
    ballBrickRow >= 0 &&
    ballBrickRow < BRICK_ROWS
  ) {
    if (isBrickAtColRow(ballBrickCol, ballBrickRow)) {
      brickGrid[brickIndexUnderBall] = false;
      bricksLeft--;
      // console.log(bricksLeft);

      var prevBallX = ballX - ballSpeedX;
      var prevBallY = ballY - ballSpeedY;
      var prevBrickCol = Math.floor(prevBallX / BRICK_W);
      var prevBrickRow = Math.floor(prevBallY / BRICK_H);

      var bothTestsFailed = true;

      if (prevBrickCol != ballBrickCol) {
        if (isBrickAtColRow(ballBrickCol, ballBrickRow) == false) {
          ballSpeedX *= -1;
          bothTestsFailed = false;
        }
      }
      if (prevBrickRow != ballBrickCol) {
        if (isBrickAtColRow(ballBrickCol, ballBrickRow) == false) {
          ballSpeedY *= -1;
          bothTestsFailed = false;
        }
      }
      if (bothTestsFailed) {
        // armpit case, prevents ball from going right through.
        ballSpeedX *= -1;
        ballSpeedY *= -1;
      }
    }
  }
}

/**
 * Handles ball and paddle collisions.
 */
function ballPaddleHandling() {
  var paddleTopEdgeY = canvas.height - PADDLE_DIST_FROM_EDGE;
  var paddleBottomEdgeY = paddleTopEdgeY + PADDLE_THICKNESS;
  var paddleLeftEdgeX = paddleX;
  var paddleRightEdgeX = paddleX + PADDLE_WIDTH;

  if (
    ballY > paddleTopEdgeY && // below the top of paddle.
    ballY < paddleBottomEdgeY && // above bottom of paddle.
    ballX > paddleLeftEdgeX && // right of the left side of paddle.
    ballX < paddleRightEdgeX // left of the right side of the paddle.
  ) {
    ballSpeedY *= -1; // Then bounce back vertically.

    var centerOfPaddleX = paddleX + PADDLE_WIDTH / 2;
    var ballDistFromPaddleCenterX = ballX - centerOfPaddleX;

    /* The greater the distance between the ball and the middle of the paddle,
       the greater the ball's bounce speed horizontally. */
    ballSpeedX = ballDistFromPaddleCenterX * 0.35;

    // If no more bricks, it's game over so reset the bricks.
    if (bricksLeft == 0) brickReset();
  }
}

function moveAll() {
  ballMove();
  ballBrickHandling();
  ballPaddleHandling();
}

/*******************************************************************************
  Drawing logic
*******************************************************************************/

function drawBricks() {
  for (var row = 0; row < BRICK_ROWS; row++) {
    for (var col = 0; col < BRICK_COLS; col++) {
      var i = rowColToArrayIndex(col, row);

      if (brickGrid[i]) {
        colorRect(
          BRICK_W * col,
          BRICK_H * row,
          BRICK_W - BRICK_GAP,
          BRICK_H - BRICK_GAP,
          'blue'
        );
      }
    }
  }
}

function drawAll() {
  colorRect(0, 0, canvas.width, canvas.height, 'black');
  colorCircle(ballX, ballY, ballRadius, 'white');
  colorRect(
    paddleX,
    canvas.height - PADDLE_DIST_FROM_EDGE,
    PADDLE_WIDTH,
    PADDLE_THICKNESS,
    'white'
  );

  drawBricks();

  // Draw coordinates alongside mouse cursor.
  var mouseBrickCol = Math.floor(mouseX / BRICK_W);
  var mouseBrickRow = Math.floor(mouseY / BRICK_H);
  var mouseBrickIndex = rowColToArrayIndex(mouseBrickCol, mouseBrickRow);
  colorText(
    mouseBrickCol + ',' + mouseBrickRow + ' : ' + mouseBrickIndex,
    mouseX + ballRadius,
    mouseY + ballRadius,
    'yellow'
  );
}

function colorRect(topLeftX, topLeftY, boxWidth, boxHeight, fillColor) {
  ctx.fillStyle = fillColor;
  ctx.fillRect(topLeftX, topLeftY, boxWidth, boxHeight);
}

function colorCircle(centerX, centerY, radius, fillColor) {
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
  ctx.fill();
}

function colorText(showWords, textX, textY, fillColor) {
  ctx.fillStyle = fillColor;
  ctx.fillText(showWords, textX, textY);
}
