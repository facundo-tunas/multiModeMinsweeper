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

function getMineMultiplier() {
  const maxMines = getMaxMines();
  if (maxMines === 1) return 1;

  return 1 + (maxMines - 1) * 0.5;
}

export function setDifficulty(level) {
  const multiplier = getMineMultiplier();

  switch (level) {
    case "beginner":
      gameOptions.width = 8;
      gameOptions.height = 8;
      gameOptions.mineCount = Math.floor(10 * multiplier);
      gameOptions.difficulty = "beginner";
      break;
    case "intermediate":
      gameOptions.width = 16;
      gameOptions.height = 16;
      gameOptions.mineCount = Math.floor(40 * multiplier);

      gameOptions.difficulty = "intermediate";
      break;
    case "advanced":
      gameOptions.width = 30;
      gameOptions.height = 16;
      gameOptions.mineCount = Math.floor(99 * multiplier);
      gameOptions.difficulty = "advanced";
      break;
    default:
      gameOptions.width = 16;
      gameOptions.height = 16;
      gameOptions.mineCount = Math.floor(40 * multiplier);
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
        mine: 0,
        neighborMines: 0,
        revealed: false,
        flagged: 0,
        neighborFlags: null,
      });
    }
    board.push(row);
  }
  return board;
}

function getMaxMines() {
  if (gameOptions.type === "twoMines") return 2;
  if (gameOptions.type === "threeMines") return 3;

  return 1;
}

function placeMines(board) {
  let minesPlaced = 0;
  const maxMinesPerCell = getMaxMines();

  while (minesPlaced < gameOptions.mineCount) {
    const row = Math.floor(Math.random() * gameOptions.height);
    const col = Math.floor(Math.random() * gameOptions.width);

    if (row === gameOptions.startRow && col === gameOptions.startCol) {
      continue;
    }

    if (board[row][col].mine < maxMinesPerCell) {
      board[row][col].mine++;
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
      if (board[row][col].mine > 0) continue;

      let mineCount = 0;
      for (const [dx, dy] of directions) {
        const r = resolveCoord(row + dx, gameOptions.height);
        const c = resolveCoord(col + dy, gameOptions.width);

        if (!isInside(r, c)) continue;

        mineCount += board[r][c].mine;
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

    flagCount += board[r][c].flagged;
  }
  board[row][col].neighborFlags = flagCount;
}

export function revealCell(board, row, col, cellElement) {
  if (board[row][col].revealed || board[row][col].flagged > 0) return;
  board[row][col].revealed = true;

  // there is a mine
  if (board[row][col].mine > 0) {
    cellElement.classList.add("mine-hit");
    if (board[row][col].mine === 2) {
      cellElement.classList.add("double-mine");
    }
    if (board[row][col].mine === 3) {
      cellElement.classList.add("triple-mine");
    }
    revealAllMines(board);
    return;
  }

  // there is no mine
  cellElement.classList.add("revealed");
  const neighborMines = board[row][col].neighborMines;
  cellElement.classList.add(`n${neighborMines}`);

  cellElement.innerText = neighborMines > 0 ? neighborMines : "";
  if (neighborMines === 0) {
    revealNeighbors(board, row, col);
  }

  checkWin(gameOptions.board);
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

  const maxFlagsPerCell = getMaxMines();
  const previousFlags = board[row][col].flagged;

  board[row][col].flagged =
    (board[row][col].flagged + 1) % (maxFlagsPerCell + 1);

  cellElement.classList.remove("flagged", "double-flagged", "triple-flagged");

  if (board[row][col].flagged === 1) {
    cellElement.classList.add("flagged");
  } else if (board[row][col].flagged === 2) {
    cellElement.classList.add("double-flagged");
  } else if (board[row][col].flagged === 3) {
    cellElement.classList.add("triple-flagged");
  }

  gameOptions.flags += board[row][col].flagged - previousFlags;
}

export function checkWin(board) {
  for (let row = 0; row < gameOptions.height; row++) {
    for (let col = 0; col < gameOptions.width; col++) {
      if (board[row][col].mine === 0 && !board[row][col].revealed) {
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
      if (board[row][col].mine > 0) {
        cellElement.classList.add("mine");
        if (board[row][col].mine === 2) {
          cellElement.classList.add("double-mine");
        }
        if (board[row][col].mine === 3) {
          cellElement.classList.add("triple-mine");
        }
      }
      if (board[row][col].flagged > 0 && board[row][col].mine === 0) {
        cellElement.classList.add("safe");
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
      if (board[row][col].mine > 0) {
        const cellElement = document.querySelector(
          `.cell[data-row='${row}'][data-col='${col}']`,
        );
        if (board[row][col].mine === 2) {
          cellElement.classList.add("double-flagged");
        } else if (board[row][col].mine === 3) {
          cellElement.classList.add("triple-flagged");
        } else {
          cellElement.classList.add("flagged");
        }
      }
    }
  }
}
