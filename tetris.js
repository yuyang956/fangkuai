const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('start-btn');
const startScreen = document.querySelector('.start-screen');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const COLORS = [
  null, '#1abc9c', '#3498db', '#9b59b6', 
  '#f1c40f', '#e67e22', '#e74c3c', '#2ecc71'
];

let score = 0;
let board = createBoard();
let dropCounter = 0;
let lastTime = performance.now();
let isPlaying = false;

const pieces = [
  [[0, 1, 0, 0],
   [0, 1, 0, 0],
   [0, 1, 0, 0],
   [0, 1, 0, 0]], // I

  [[0, 2, 0],
   [0, 2, 0],
   [2, 2, 0]], // L

  [[0, 3, 0],
   [0, 3, 0],
   [0, 3, 3]], // J

  [[4, 4],
   [4, 4]], // O

  [[0, 5, 5],
   [5, 5, 0],
   [0, 0, 0]], // S

  [[6, 6, 0],
   [0, 6, 6],
   [0, 0, 0]], // Z

  [[0, 7, 0],
   [7, 7, 7],
   [0, 0, 0]] // T
];

let currentPiece = createPiece();
let nextPiece = createPiece();

function createBoard() {
  return Array.from({length: ROWS}, () => Array(COLS).fill(0));
}

function createPiece() {
  const piece = pieces[Math.floor(Math.random() * pieces.length)];
  return {
    pos: {x: Math.floor(COLS / 2) - 2, y: 0},
    shape: piece,
    color: piece.find(cell => cell !== 0)
  };
}

function drawPiece(piece, context) {
  const shapeSize = piece.shape.length;
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        context.fillStyle = COLORS[value];
        context.fillRect(
          (piece.pos.x + x) * BLOCK_SIZE,
          (piece.pos.y + y) * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
      }
    });
  });
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  board.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        context.fillStyle = COLORS[value];
        context.fillRect(
          x * BLOCK_SIZE,
          y * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
      }
    });
  });

  drawPiece(currentPiece, context);
  drawNextPiece();
}

function drawNextPiece() {
  nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  drawPiece({
    pos: {x: 1, y: 1},
    shape: nextPiece.shape,
    color: nextPiece.color
  }, nextContext);
}

function update() {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  dropCounter += deltaTime;
  if (dropCounter > 1000) {
    drop();
    dropCounter = 0;
  }

  draw();
  requestAnimationFrame(update);
}

function drop() {
  currentPiece.pos.y++;
  if (collide()) {
    currentPiece.pos.y--;
    merge();
    clearLines();
    if (currentPiece.pos.y <= 1) {
      alert('游戏结束！得分：' + score);
      board = createBoard();
      score = 0;
      scoreElement.textContent = score;
      isPlaying = false;
      startScreen.style.display = 'block';
      return;
    }
    currentPiece = nextPiece;
    nextPiece = createPiece();
    currentPiece.pos = {x: Math.floor(COLS / 2) - 2, y: 0};
    draw(); // 立即绘制新方块
  }
}

function collide() {
  const shapeSize = currentPiece.shape.length;
  for (let y = 0; y < shapeSize; y++) {
    for (let x = 0; x < shapeSize; x++) {
      if (currentPiece.shape[y][x]) {
        const boardX = currentPiece.pos.x + x;
        const boardY = currentPiece.pos.y + y;
        
        // 检查是否超出边界
        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
          return true;
        }
        
        // 检查是否与其他方块碰撞
        if (boardY >= 0 && board[boardY] && board[boardY][boardX]) {
          return true;
        }
      }
    }
  }
  return false;
}

function merge() {
  const shapeSize = currentPiece.shape.length;
  for (let y = 0; y < shapeSize; y++) {
    for (let x = 0; x < shapeSize; x++) {
      if (currentPiece.shape[y][x]) {
        const boardY = currentPiece.pos.y + y;
        const boardX = currentPiece.pos.x + x;
        if (boardY >= 0 && boardX >= 0) {
          board[boardY][boardX] = currentPiece.color;
        }
      }
    }
  }
}

function clearLines() {
  let linesCleared = 0;
  board.forEach((row, y) => {
    if (row.every(value => value !== 0)) {
      linesCleared++;
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
    }
  });

  if (linesCleared > 0) {
    score += linesCleared * 100;
    scoreElement.textContent = score;
  }
}

document.addEventListener('keydown', event => {
  if (!isPlaying) return;
  
  if (event.key === 'ArrowLeft') {
    currentPiece.pos.x--;
    if (collide()) {
      currentPiece.pos.x++;
    }
  } else if (event.key === 'ArrowRight') {
    currentPiece.pos.x++;
    if (collide()) {
      currentPiece.pos.x--;
    }
  } else if (event.key === 'ArrowDown') {
    drop();
  } else if (event.key === 'ArrowUp') {
    rotate();
  }
});

function rotate() {
  if (!isPlaying) return;
  
  const originalShape = currentPiece.shape;
  const size = currentPiece.shape.length;
  const rotated = Array.from({length: size}, (_, i) => 
    Array.from({length: size}, (_, j) => 
      currentPiece.shape[size - j - 1][i]
    )
  );
  
  // 保存当前位置
  const originalPos = {x: currentPiece.pos.x, y: currentPiece.pos.y};
  
  // 尝试旋转
  currentPiece.shape = rotated;
  
  // 如果旋转后发生碰撞，尝试左右移动
  if (collide()) {
    // 尝试右移
    currentPiece.pos.x++;
    if (collide()) {
      // 尝试左移
      currentPiece.pos.x -= 2;
      if (collide()) {
        // 恢复原状
        currentPiece.pos.x = originalPos.x;
        currentPiece.shape = originalShape;
        return;
      }
    }
  }
  
  draw(); // 立即重绘旋转后的方块
}

startBtn.addEventListener('click', () => {
  startScreen.style.display = 'none';
  canvas.style.display = 'block';
  nextCanvas.style.display = 'block';
  isPlaying = true;
  board = createBoard();
  score = 0;
  scoreElement.textContent = score;
  currentPiece = createPiece();
  nextPiece = createPiece();
  context.clearRect(0, 0, canvas.width, canvas.height);
  nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  draw();
  lastTime = performance.now();
  update();
});

// 添加移动设备控制按钮事件
document.querySelector('.control-btn.left').addEventListener('click', () => {
  if (!isPlaying) return;
  currentPiece.pos.x--;
  if (collide()) {
    currentPiece.pos.x++;
  }
  draw();
});

document.querySelector('.control-btn.right').addEventListener('click', () => {
  if (!isPlaying) return;
  currentPiece.pos.x++;
  if (collide()) {
    currentPiece.pos.x--;
  }
  draw();
});

document.querySelector('.control-btn.rotate').addEventListener('click', () => {
  if (!isPlaying) return;
  rotate();
});

document.querySelector('.control-btn.drop').addEventListener('click', () => {
  if (!isPlaying) return;
  drop();
});
