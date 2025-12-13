import { storage, gameOptions, DOMelements } from "./config.js";
import {
  calculateNeighborFlags,
  checkWin,
  flagCell,
  generateGame,
  isInside,
  resolveCoord,
  revealCell,
  revealNeighbors,
  setDifficulty,
  start,
} from "./game.js";
import { loadFromLocalStorage } from "./localStorage.js";
import { startTimer } from "./timer.js";

export function initializeEventListeners() {
  generateGame(DOMelements.board);
  loadFromLocalStorage();

  updateSelected();

  function hoveredCell() {
    const hoveredCell = document.querySelector(".hovered");
    if (!hoveredCell) {
      return [null, null, null];
    }
    const hoveredCol = +hoveredCell.dataset.col;
    const hoveredRow = +hoveredCell.dataset.row;

    return [hoveredRow, hoveredCol, hoveredCell];
  }

  function keyStrokesListener(e) {
    if (gameOptions.gameState > 1) return;

    const [row, col, cell] = hoveredCell();
    if (row === null || col === null || cell === null) return;

    if ((e.key !== "g" && e.key !== " ") || !cell) return;
    e.preventDefault();

    // reveal only if number of mines is flagged
    calculateNeighborFlags(gameOptions.board, row, col);

    if (
      cell.classList.contains("revealed") &&
      gameOptions.board[row][col].neighborFlags ===
        gameOptions.board[row][col].neighborMines
    ) {
      revealNeighbors(gameOptions.board, row, col);
      checkWin(gameOptions.board);
    } else if (!cell.classList.contains("revealed")) {
      flagCell(gameOptions.board, row, col, cell);
      updateHeaders();
    }
  }

  DOMelements.settingsButton.addEventListener("click", () => {
    DOMelements.settingsModal.style.display = "flex";
    DOMelements.settingsModal.style.animation = "appear 0.3s linear forwards";

    setTimeout(() => {
      DOMelements.settingsModal.style.animation = "none";
    }, 600);
  });

  DOMelements.statisticsButton.addEventListener("click", () => {
    DOMelements.statisticsModal.style.display = "flex";
    DOMelements.statisticsModal.style.animation = "appear 0.3s linear forwards";

    setTimeout(() => {
      DOMelements.statisticsModal.style.animation = "none";
    }, 300);
  });

  DOMelements.helpButton.addEventListener("click", () => {
    DOMelements.helpModal.style.display = "flex";
    DOMelements.helpModal.style.animation = "appear 0.3s linear forwards";

    setTimeout(() => {
      DOMelements.helpModal.style.animation = "none";
    }, 600);
  });

  DOMelements.closeButton.forEach((item) =>
    item.addEventListener("click", () => {
      DOMelements.settingsModal.style.animation =
        "disappear 0.3s linear forwards";
      DOMelements.statisticsModal.style.animation =
        "disappear 0.3s linear forwards";
      DOMelements.helpModal.style.animation = "disappear 0.3s linear forwards";

      setTimeout(() => {
        DOMelements.settingsModal.style.display = "none";
        DOMelements.statisticsModal.style.display = "none";
        DOMelements.helpModal.style.display = "none";
      }, 300);
    }),
  );
  DOMelements.startButton.addEventListener("click", start);

  const difficultyOptions = document.querySelectorAll(".settings-modal li");
  difficultyOptions.forEach((option) => {
    option.addEventListener("click", () => {
      setDifficulty(option.dataset.difficulty);
      DOMelements.settingsModal.style.display = "none";
    });
  });

  const modeOptions = document.querySelectorAll(".settings-modal [data-mode]");
  modeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      setMode(option.dataset.mode);
      DOMelements.settingsModal.style.display = "none";

      updateSelected();
    });
  });

  document.addEventListener("keydown", keyStrokesListener);

  // right click
  document.addEventListener("mousedown", (e) => {
    if (e.button !== 2) return;
    if (gameOptions.gameState > 1) return;
    e.preventDefault();

    const [row, col, cell] = hoveredCell();
    if (row !== null && col !== null && cell !== null) {
      flagCell(gameOptions.board, row, col, cell);
      updateHeaders();
    }
  });

  // this is so you cant accidentally right click in the gaps
  DOMelements.board.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // left click
  document.addEventListener("mousedown", (e) => {
    const [row, col, cell] = hoveredCell();
    if (row === null || col === null || cell === null) return;

    if (e.button !== 0) return;
    if (gameOptions.gameState > 1) return;

    cell.classList.add("pressed");

    if (cell.classList.contains("revealed")) {
      pressNeighbours(row, col);
      gameOptions.pressedNeighbours = true;
    } else {
      gameOptions.pressedNeighbours = false;
    }

    gameOptions.mouseDown = true;
  });
  document.addEventListener("mouseup", (e) => {
    const [row, col, cell] = hoveredCell();
    if (row === null || col === null || cell === null) return;

    if (e.button !== 0) return;
    if (gameOptions.gameState > 1) return;

    // reveal only if number of mines is flagged
    calculateNeighborFlags(gameOptions.board, row, col);

    if (
      cell.classList.contains("revealed") &&
      gameOptions.board[row][col].neighborFlags ==
        gameOptions.board[row][col].neighborMines
    ) {
      revealNeighbors(gameOptions.board, row, col);
      gameOptions.mouseDown = false;

      return;
    }

    if (gameOptions.gameState !== 1) {
      gameOptions.gameState = 1;
      startTimer();
      updateHeaders();
    }
    revealCell(gameOptions.board, row, col, cell);
    gameOptions.mouseDown = false;
  });
  /* this one is so it recognizes if you stop clicking outside from the board */
  document.addEventListener("mouseup", () => {
    gameOptions.mouseDown = false;
    if (gameOptions.pressedNeighbours) {
      unpressCells();
      gameOptions.pressedNeighbours = false;
    }
  });
}

export function unpressCells() {
  const pressed = document.querySelectorAll(".pressed");

  pressed.forEach((element) => {
    element.classList.remove("pressed");
  });
}

export function pressNeighbours(row, col) {
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
    pressCell(cellElement);
  }

  function pressCell(cellElement) {
    cellElement.classList.add("pressed");
  }
}

export function updateHeaders() {
  DOMelements.minesDisplay.textContent = (
    gameOptions.mineCount - gameOptions.flags
  )
    .toString()
    .padStart(3, "0");

  // change divider color depending on game state
  document.documentElement.style.setProperty("--board-divider", returnColor());
  function returnColor() {
    switch (gameOptions.gameState) {
      case 1:
        return "yellow";
      case 2:
        return "red";
      case 3:
        return "#06e206";
      case 0:
        return "#acf9ff";
    }
  }
}

export function generateStatisticsUI() {
  const container = document.getElementById("statistics-content");
  if (!container) return;

  container.innerHTML = "";

  const type = gameOptions.type;

  const typeSection = document.createElement("section");
  typeSection.className = "stats-type";

  const typeTitle = document.createElement("p");
  typeTitle.className = "options-title";
  typeTitle.textContent = capitalize(type) + " Stats";
  typeSection.appendChild(typeTitle);

  for (const difficulty in storage.stats[type]) {
    const stats = storage.stats[type][difficulty];

    const ul = document.createElement("ul");
    ul.className = `stats ${difficulty}`;

    ul.innerHTML = `
        <p class="subtitle">${capitalize(difficulty)}</p>

        <div class="double">
          <p>Games Played:</p>
          <li id="${type}-${difficulty}-games">${stats.games}</li>
        </div>

        <div class="double">
          <p>Games Won:</p>
          <li id="${type}-${difficulty}-wins">${stats.wins}</li>
        </div>

        <div class="double">
          <p>Best Time:</p>
          <li id="${type}-${difficulty}-best">
            ${formatBest(stats.best)}
          </li>
        </div>
      `;

    typeSection.appendChild(ul);
  }

  container.appendChild(typeSection);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatBest(value) {
  if (value === Infinity) return "";

  const seconds = Math.floor((value / 1000) % 60);
  const milliseconds = Math.floor(value % 1000);
  return `${seconds}.${milliseconds}`;
}

export function setMode(mode) {
  if (gameOptions.type === mode) return;

  gameOptions.type = mode;

  start();
  updateSelected();
  generateStatisticsUI();
}

export function updateSelected() {
  const modeOptions = document.querySelectorAll(".settings-modal [data-mode]");
  modeOptions.forEach((option) => {
    if (gameOptions.type == option.dataset.mode)
      option.classList.add("selected");
    else option.classList.remove("selected");
  });
}
