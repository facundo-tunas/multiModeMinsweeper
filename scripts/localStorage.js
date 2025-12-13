import { gameOptions, storage } from "./config.js";
import { generateStatisticsUI } from "./dom.js";

export function saveToStorage() {
  localStorage.setItem("storage", JSON.stringify(storage));
}

export function updateGameStats(result, time) {
  const { type, difficulty } = gameOptions;
  const stats = storage.stats[type][difficulty];

  stats.games++;

  if (result) {
    stats.wins++;

    if (time < stats.best) {
      stats.best = time;
    }
  }

  saveToStorage();
  generateStatisticsUI();
}


export function loadZoomLevel() {
  const savedZoom = localStorage.getItem("zoomLevel");
  return savedZoom ? parseFloat(savedZoom) : 1;
}

export function updateZoom(value) {
  storage.zoomLevel = value;
  saveToStorage();
}

export function loadFromLocalStorage() {
  const raw = localStorage.getItem("storage");
  if (!raw) return;

  const parsed = JSON.parse(raw);

  Object.assign(storage, parsed);
}

function setElement(key) {
  if (key.includes("Best")) {
    const seconds = Math.floor((storage[key] / 1000) % 60);
    const miliseconds = Math.floor(storage[key] % 1000);

    let result;
    if (storage[key] == Infinity) result = "";
    else result = seconds + "." + miliseconds;

    document.getElementById(key).innerHTML = result;
  } else if (document.getElementById(key)) {
    document.getElementById(key).innerHTML = storage[key];
  }
}
