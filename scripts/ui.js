import { flickVelocity, resetStats, score, setShootingPosition } from './game.js';

const powerFill = document.getElementById('powerFill');

// Max expected velocity magnitude (tweak based on gameplay)
const maxPower = 15;

function updatePowerGauge() {
  const power = Math.min(flickVelocity.length(), maxPower); // Clamp value
  const percent = (power / maxPower) * 100;

  powerFill.style.height = `${percent}%`;

  requestAnimationFrame(updatePowerGauge);
}

updatePowerGauge();

// Timer elements
const startTimerBtn = document.getElementById('startTimerBtn');
const timerDisplay = document.getElementById('timerDisplay');

let timerInterval = null;
let remainingTime = 30;

startTimerBtn.addEventListener('click', () => {
  if (timerInterval) return; // Prevent multiple timers
  
  resetStats();
  remainingTime = 30;
  timerDisplay.textContent = remainingTime;
  startTimerBtn.disabled = true;

  timerInterval = setInterval(() => {
    remainingTime--;
    timerDisplay.textContent = remainingTime;

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;

      console.log("Final Score:", score);
      document.getElementById('bestDisplay').textContent = `Best Score: ${score}`;
      resetStats();

      timerDisplay.textContent = "Done!";
      setTimeout(() => {
        timerDisplay.textContent = "30";
        startTimerBtn.disabled = false;
      }, 1500);
    }
  }, 1000);
});

document.querySelector(".leftButton:nth-child(3)").addEventListener("click", () => {
  setShootingPosition(6.25, 5.3); // Free Throw
});

document.querySelector(".leftButton:nth-child(4)").addEventListener("click", () => {
  setShootingPosition(9.5, 8.5); // Three Point
});

document.querySelector(".leftButton:nth-child(5)").addEventListener("click", () => {
  setShootingPosition(14, 13); // Half-court
});
document.querySelector(".leftButton:nth-child(6)").addEventListener("click", () => {
  resetStats(); // Half-court
});