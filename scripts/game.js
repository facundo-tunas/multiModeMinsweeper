import { DOMelements, gameOptions } from "./config.js";
import { updateHeaders } from "./dom.js";
import { endTimer, startTimer } from "./timer.js";
import { renderBoard } from "./render.js";
import { updateGameStats } from "./localStorage.js";

export function updateBoardSize() {
  document.documentElement.style.setProperty(
    "--board-width",
    gameOptions.width,
  );
  document.documentElement.style.setProperty(
    "--board-height",
    gameOptions.height,
  );
}

export function generateGame(board) {
  const gameBoard = generateBoard();
  gameOptions.board = gameBoard;

  updateHeaders();
  placeMines(gameBoard);
  calculateMineNeighbors(gameBoard);
  renderBoard(board, gameBoard);

  if (gameOptions.startRow !== null && gameOptions.startCol !== null) {
    const startCell = document.querySelector(
      `.cell[data-row='${gameOptions.startRow}'][data-col='${gameOptions.startCol}']`,
    );
    if (startCell) {
      revealCell(
        gameBoard,
        gameOptions.startRow,
        gameOptions.startCol,
        startCell,
      );
    }

    startTimer();
    gameOptions.startRow = null;
    gameOptions.startCol = null;
  }
}

export function resolveCoord(value, max) {
  if (gameOptions.type !== "edgeless") return value;
  return (value + max) % max;
}

export function isInside(row, col) {
  if (gameOptions.type === "edgeless") return true;

  return (
    row >= 0 && row < gameOptions.height && col >= 0 && col < gameOptions.width
  );
}

export function setDifficulty(level) {
  switch (level) {
    case "beginner":
      gameOptions.width = 8;
      gameOptions.height = 8;
      gameOptions.mineCount = 10;

      gameOptions.difficulty = "beginner";
      break;
    case "intermediate":
      gameOptions.width = 16;
      gameOptions.height = 16;
      gameOptions.mineCount = 40;

      gameOptions.difficulty = "intermediate";
      break;
    case "advanced":
      gameOptions.width = 30;
      gameOptions.height = 16;
      gameOptions.mineCount = 99;

      gameOptions.difficulty = "advanced";
      break;
    default:
      gameOptions.width = 16;
      gameOptions.height = 16;
      gameOptions.mineCount = 40;

      gameOptions.difficulty = "intermediate";
  }
  updateBoardSize();
  console.log(
    `Difficulty set to ${level}: ${gameOptions.width}x${gameOptions.height}, ${gameOptions.mineCount} mines`,
  );
  reset();
}

export function start() {
  gameOptions.flags = 0;
  gameOptions.gameState = 1;

  DOMelements.timerDisplay.textContent = "000";
  endTimer();

  updateHeaders();
  generateGame(DOMelements.board);
}

export function reset() {
  gameOptions.flags = 0;
  gameOptions.gameState = 0;
  gameOptions.board = null;

  DOMelements.timerDisplay.textContent = "000";
  endTimer();

  updateHeaders();
  renderBoard(DOMelements.board, null);
}

function generateBoard() {
  const board = [];
  for (let i = 0; i < gameOptions.height; i++) {
    const row = [];
    for (let j = 0; j < gameOptions.width; j++) {
      row.push({
        mine: false,
        neighborMines: 0,
        revealed: false,
        flagged: false,
        neighborFlags: null,
      });
    }
    board.push(row);
  }
  return board;
}

function placeMines(board) {
  let minesPlaced = 0;
  while (minesPlaced < gameOptions.mineCount) {
    const row = Math.floor(Math.random() * gameOptions.height);
    const col = Math.floor(Math.random() * gameOptions.width);
    if (
      !board[row][col].mine &&
      !(row === gameOptions.startRow && col === gameOptions.startCol)
    ) {
      board[row][col].mine = true;
      minesPlaced++;
    }
  }
}

export function calculateMineNeighbors(board) {
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (let row = 0; row < gameOptions.height; row++) {
    for (let col = 0; col < gameOptions.width; col++) {
      if (board[row][col].mine) continue;

      let mineCount = 0;
      for (const [dx, dy] of directions) {
        const r = resolveCoord(row + dx, gameOptions.height);
        const c = resolveCoord(col + dy, gameOptions.width);

        if (!isInside(r, c)) continue;
        if (board[r][c].mine) {
          mineCount++;
        }
      }
      board[row][col].neighborMines = mineCount;
    }
  }
}

export function calculateNeighborFlags(board, row, col) {
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  let flagCount = 0;

  for (const [dx, dy] of directions) {
    const r = resolveCoord(row + dx, gameOptions.height);
    const c = resolveCoord(col + dy, gameOptions.width);

    if (!isInside(r, c)) continue;

    if (board[r][c].flagged) {
      flagCount++;
    }
  }
  board[row][col].neighborFlags = flagCount;
}

export function revealCell(board, row, col, cellElement) {
  if (board[row][col].revealed || board[row][col].flagged) return;
  board[row][col].revealed = true;

  if (board[row][col].mine) {
    cellElement.classList.add("mine");
    revealAllMines(board);
  } else {
    cellElement.classList.add("revealed");
    const neighborMines = board[row][col].neighborMines;
    cellElement.classList.add(`n${neighborMines}`);

    cellElement.innerText = neighborMines > 0 ? neighborMines : "";
    if (neighborMines === 0) {
      revealNeighbors(board, row, col);
    }

    checkWin(gameOptions.board);
  }
}

export function revealNeighbors(board, row, col) {
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (const [dx, dy] of directions) {
    const r = resolveCoord(row + dx, gameOptions.height);
    const c = resolveCoord(col + dy, gameOptions.width);

    if (!isInside(r, c)) continue;

    const cellElement = document.querySelector(
      `.cell[data-row='${r}'][data-col='${c}']`,
    );

    revealCell(board, r, c, cellElement);
  }
}

export function flagCell(board, row, col, cellElement) {
  if (board[row][col].revealed) return;

  if (board[row][col].flagged) {
    board[row][col].flagged = false;
    cellElement.classList.remove("flagged");
    gameOptions.flags--;
  } else {
    board[row][col].flagged = true;
    cellElement.classList.add("flagged");
    gameOptions.flags++;
  }
}

export function checkWin(board) {
  for (let row = 0; row < gameOptions.height; row++) {
    for (let col = 0; col < gameOptions.width; col++) {
      if (!board[row][col].mine && !board[row][col].revealed) {
        return false;
      }
    }
  }
  gameOptions.flags = gameOptions.mineCount;
  gameOptions.gameState = 3;
  updateHeaders();
  endTimer();
  flagAllMines(board);

  const endTime = Date.now();

  updateGameStats(true, gameOptions.startTime, endTime);
  return true;
}

function revealAllMines(board) {
  for (let row = 0; row < gameOptions.height; row++) {
    for (let col = 0; col < gameOptions.width; col++) {
      const cellElement = document.querySelector(
        `.cell[data-row='${row}'][data-col='${col}']`,
      );
      if (board[row][col].mine) {
        console.log(row,col)
        cellElement.classList.add("mine2");
      } else {
        cellElement.classList.add("safe")
      }
    }
  }
  gameOptions.gameState = 2;
  endTimer();
  updateHeaders();
  updateGameStats(false);
}

function flagAllMines(board) {
  for (let row = 0; row < gameOptions.height; row++) {
    for (let col = 0; col < gameOptions.width; col++) {
      if (board[row][col].mine) {
        const cellElement = document.querySelector(
          `.cell[data-row='${row}'][data-col='${col}']`,
        );
        cellElement.classList.add("flagged");
      }
    }
  }
}
