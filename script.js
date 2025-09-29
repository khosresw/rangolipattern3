const canvas = document.getElementById("ritualCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRID_SIZE = 5;
const CELL_SIZE = 80;
const DOT_RADIUS = 6;

const grid = [];
const dotPositions = {};
for (let y = 0; y < GRID_SIZE; y++) {
  for (let x = 0; x < GRID_SIZE; x++) {
    grid.push([x, y]);
    dotPositions[`${x},${y}`] = [80 + x * CELL_SIZE, 80 + y * CELL_SIZE];
  }
}

let playerLines = [];
let aiLines = [];
let innerDiamondRevealed = false;
let selectedDot = null;
let lastPrompt = "";
let promptTimer = 0;

const cornerTriangles = [
  [[1,1], [0,1], [1,0]],
  [[3,0], [3,1], [4,1]],
  [[0,3], [1,3], [1,4]],
  [[3,3], [4,3], [3,4]],
];

const innerDiamond = [[2,1], [1,2], [2,3], [3,2], [2,1]];

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawGrid();
  drawLines(playerLines, "rgb(60,120,200)");
  drawLines(aiLines, "rgb(255,215,0)");

  if (innerDiamondRevealed) {
    drawCircle(dotPositions["2,2"], 12, "rgb(180,0,180)");
    setFeedback("✨ Inner Diamond Restored! ✨");
  } else if (promptTimer > 0) {
    setFeedback(lastPrompt);
  } else {
    setFeedback("");
  }
}

function drawGrid() {
  for (const [key, pos] of Object.entries(dotPositions)) {
    drawCircle(pos, DOT_RADIUS, "rgb(200,200,200)");
    const [x, y] = key.split(",").map(Number);
    ctx.fillStyle = "#fff";
    ctx.font = "16px sans-serif";
    ctx.fillText(`${x},${y}`, pos[0] + 6, pos[1] - 12);
  }
}

function drawCircle(pos, radius, color) {
  ctx.beginPath();
  ctx.arc(pos[0], pos[1], radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawLines(lines, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  for (const [start, end] of lines) {
    const a = dotPositions[`${start[0]},${start[1]}`];
    const b = dotPositions[`${end[0]},${end[1]}`];
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
}

function setFeedback(text) {
  document.getElementById("feedback").textContent = text;
}

function getNearestDot(pos) {
  for (const [key, screenPos] of Object.entries(dotPositions)) {
    const dx = pos.x - screenPos[0];
    const dy = pos.y - screenPos[1];
    if (Math.hypot(dx, dy) < 20) {
      return key.split(",").map(Number);
    }
  }
  return null;
}

canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  const clicked = getNearestDot(pos);
  if (!clicked) return;

  if (selectedDot === null) {
    selectedDot = clicked;
  } else {
    if (selectedDot[0] !== clicked[0] || selectedDot[1] !== clicked[1]) {
      const line = [selectedDot, clicked];
      const reverse = [clicked, selectedDot];
      if (!playerLines.some(l => isSameLine(l, line) || isSameLine(l, reverse))) {
        playerLines.push(line);
        checkForPrompt(line);
      }
    }
    selectedDot = null;
  }
  draw();
});

function isSameLine(a, b) {
  return a[0][0] === b[0][0] && a[0][1] === b[0][1] && a[1][0] === b[1][0] && a[1][1] === b[1][1];
}

function allLinesPresent(shape) {
  for (let i = 0; i < shape.length; i++) {
    const start = shape[i];
    const end = shape[(i + 1) % shape.length];
    if (!playerLines.some(l => isSameLine(l, [start, end]) || isSameLine(l, [end, start]))) {
      return false;
    }
  }
  return true;
}

function checkForPrompt(newLine) {
  for (const triangle of cornerTriangles) {
    if (allLinesPresent(triangle)) continue;
    if (triangle.some(p => isSameLine([p, newLine[0]], newLine) || isSameLine([p, newLine[1]], newLine))) {
      if (allLinesPresent(triangle)) {
        lastPrompt = "Corner triangle traced!";
        promptTimer = 120;
      }
    }
  }
  if (!innerDiamondRevealed && cornerTriangles.every(allLinesPresent)) {
    revealInnerDiamond();
  }
}

function revealInnerDiamond() {
  aiLines = [];
  for (let i = 0; i < innerDiamond.length - 1; i++) {
    aiLines.push([innerDiamond[i], innerDiamond[i + 1]]);
  }
  innerDiamondRevealed = true;
  lastPrompt = "✨ Inner Diamond Restored!";
  promptTimer = 180;
  draw();
}

document.addEventListener("keydown", e => {
  if (e.key === "r" || e.key === "R") {
    playerLines = [];
    aiLines = [];
    innerDiamondRevealed = false;
    selectedDot = null;
    lastPrompt = "";
    promptTimer = 0;
    draw();
  }
});

function tick() {
  if (promptTimer > 0) {
    promptTimer--;
    draw();
  }
  requestAnimationFrame(tick);
}

draw();
tick();
