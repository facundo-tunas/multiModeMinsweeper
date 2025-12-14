import { gameOptions, DOMelements } from "./config.js";

export function startTimer() {
  const startTime = Date.now();
  gameOptions.startTime = startTime;

  gameOptions.timerDisplay = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    const seconds = Math.floor((elapsedTime / 1000) % 60);
    const minutes = Math.floor((elapsedTime / 1000 / 60) % 60);
    const hours = Math.floor(elapsedTime / 1000 / 60 / 60);

    const formattedHours = hours > 1 ? hours.toString().padStart(2, "0") : "";
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");

    const totalSeconds = Math.floor(elapsedTime / 1000);
    DOMelements.timerDisplay.innerText = `${
      totalSeconds > 999 ? 999 : totalSeconds.toString().padStart(3, "0")
    }`;
    gameOptions.timer = elapsedTime;

    DOMelements.timerHeader.innerText = formattedHours
      ? `Time: ${formattedHours}:${formattedMinutes}:${formattedSeconds}`
      : `Time: ${formattedMinutes}:${formattedSeconds}`;
  }, 10);
}

export function endTimer() {
  clearInterval(gameOptions.timerDisplay);
}
