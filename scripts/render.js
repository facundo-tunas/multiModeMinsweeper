import { gameOptions } from "./config.js";
import { pressNeighbours, unpressCells } from "./dom.js";
import { start } from "./game.js";

let counter = 0;

export function renderBoard(boardElement, board) {
  boardElement.innerHTML = "";

  for (let row = 0; row < gameOptions.height; row++) {
    for (let col = 0; col < gameOptions.width; col++) {
      const div = document.createElement("div");
      div.classList.add("cell");
      div.dataset.row = row;
      div.dataset.col = col;

      if (board) {
        div.addEventListener("mouseleave", () => {
          div.classList.remove("pressed");
          div.classList.remove("hovered");

          if (gameOptions.pressedNeighbours) {
            unpressCells();
            gameOptions.pressedNeighbours = false;
          }
        });

        div.addEventListener("mouseenter", () => {
          if (gameOptions.mouseDown) {
            div.classList.add("pressed");

            if (div.classList.contains("revealed")) {
              pressNeighbours(row, col);
              gameOptions.pressedNeighbours = true;
            } else {
              gameOptions.pressedNeighbours = false;
            }
          }
          div.classList.add("hovered");
        });
      } else {
        div.addEventListener("mouseleave", () => {
          div.classList.remove("pressed");
          div.classList.remove("hovered");
        });
        div.addEventListener("mouseenter", () => {
          if (gameOptions.mouseDown) {
            div.classList.add("pressed");
          }
          div.classList.add("hovered");
        });


        div.addEventListener("mouseup", (e) => {
          e.preventDefault();
          if (e.button !== 0) return;

          gameOptions.startRow = row;
          gameOptions.startCol = col;

          start();
        });
      }

      boardElement.appendChild(div);
    }
  }
}
