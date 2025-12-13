import { storage } from "./config.js";
import { generateStatisticsUI, initializeEventListeners, updateHeaders } from "./dom.js";
import { saveToStorage } from "./localStorage.js";

document.addEventListener("DOMContentLoaded", () => {
  updateHeaders();
  initializeEventListeners();
  checkTheme();

  generateStatisticsUI();

  const themeToggleButton = document.getElementById("theme-toggle");
  themeToggleButton?.addEventListener("click", toggleTheme);

  document.body.style.opacity = "1";
});

function checkTheme() {
  const theme = storage.theme || "dark";
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function toggleTheme() {
  storage.theme = storage.theme === "dark" ? "light" : "dark";
  saveToStorage();
  checkTheme();
}
