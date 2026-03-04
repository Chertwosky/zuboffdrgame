const STORAGE_KEY = "chip-game-state-v1";

const defaults = {
  targetScore: 20,
  score: 0,
  turn: 0,
  pawnIndex: 0,
  awaitingTaskDecision: false,
  cells: [
    { id: crypto.randomUUID(), name: "Старт", color: "#ff9f5d", isStart: true },
    { id: crypto.randomUUID(), name: "Роща", color: "#5dd39e", isStart: false },
    { id: crypto.randomUUID(), name: "Река", color: "#64b5f6", isStart: false },
    { id: crypto.randomUUID(), name: "Горы", color: "#c792ea", isStart: false },
    { id: crypto.randomUUID(), name: "Пещера", color: "#f06292", isStart: false },
    { id: crypto.randomUUID(), name: "Портал", color: "#ffd54f", isStart: false }
  ],
  tasks: []
};

defaults.tasks.push(
  {
    id: crypto.randomUUID(),
    color: "#5dd39e",
    title: "Лесной квест",
    description: "Назовите 3 вида деревьев.",
    points: 3,
    penalty: "Штраф: пройти следующий ход без очков.",
    image: "",
    audio: ""
  },
  {
    id: crypto.randomUUID(),
    color: "#64b5f6",
    title: "Речной квест",
    description: "Скажите скороговорку без ошибок.",
    points: 4,
    penalty: "Штраф: сделайте 5 хлопков над головой.",
    image: "",
    audio: ""
  },
  {
    id: crypto.randomUUID(),
    color: "#f06292",
    title: "Пещерный квест",
    description: "Придумайте рифму к слову 'игра'.",
    points: 5,
    penalty: "Штраф: назвать 5 стран за 10 секунд.",
    image: "",
    audio: ""
  }
);

const state = loadState();
const ui = {
  board: document.getElementById("board"),
  scoreValue: document.getElementById("scoreValue"),
  turnValue: document.getElementById("turnValue"),
  targetScoreValue: document.getElementById("targetScoreValue"),
  diceResult: document.getElementById("diceResult"),
  rollDiceBtn: document.getElementById("rollDiceBtn"),
  taskHint: document.getElementById("taskHint"),
  taskTitle: document.getElementById("taskTitle"),
  taskDescription: document.getElementById("taskDescription"),
  taskImage: document.getElementById("taskImage"),
  taskAudio: document.getElementById("taskAudio"),
  taskActions: document.getElementById("taskActions"),
  successBtn: document.getElementById("successBtn"),
  failBtn: document.getElementById("failBtn"),
  adminToggle: document.getElementById("adminToggle"),
  adminPanel: document.getElementById("adminPanel"),
  settingsForm: document.getElementById("settingsForm"),
  targetScoreInput: document.getElementById("targetScoreInput"),
  cellForm: document.getElementById("cellForm"),
  cellNameInput: document.getElementById("cellNameInput"),
  cellColorInput: document.getElementById("cellColorInput"),
  cellStartInput: document.getElementById("cellStartInput"),
  taskForm: document.getElementById("taskForm"),
  taskColorSelect: document.getElementById("taskColorSelect"),
  taskTitleInput: document.getElementById("taskTitleInput"),
  taskDescriptionInput: document.getElementById("taskDescriptionInput"),
  taskPointsInput: document.getElementById("taskPointsInput"),
  taskPenaltyInput: document.getElementById("taskPenaltyInput"),
  taskImageInput: document.getElementById("taskImageInput"),
  taskAudioInput: document.getElementById("taskAudioInput"),
  cellsList: document.getElementById("cellsList"),
  tasksList: document.getElementById("tasksList"),
  gameWinDialog: document.getElementById("gameWinDialog"),
  winText: document.getElementById("winText"),
  newGameBtn: document.getElementById("newGameBtn")
};

let currentTask = null;

renderAll();
wireEvents();

function wireEvents() {
  ui.rollDiceBtn.addEventListener("click", onRollDice);
  ui.successBtn.addEventListener("click", () => completeTask(true));
  ui.failBtn.addEventListener("click", () => completeTask(false));

  ui.adminToggle.addEventListener("click", () => {
    const hidden = ui.adminPanel.hasAttribute("hidden");
    if (hidden) {
      ui.adminPanel.removeAttribute("hidden");
      ui.adminToggle.textContent = "Скрыть админ-панель";
    } else {
      ui.adminPanel.setAttribute("hidden", "");
      ui.adminToggle.textContent = "Показать админ-панель";
    }
  });

  ui.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.targetScore = Number(ui.targetScoreInput.value);
    saveAndRender();
  });

  ui.cellForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const color = normalizeColor(ui.cellColorInput.value);
    if (ui.cellStartInput.checked) {
      state.cells.forEach((cell) => {
        cell.isStart = false;
      });
      state.pawnIndex = state.cells.length;
    }
    state.cells.push({
      id: crypto.randomUUID(),
      name: ui.cellNameInput.value.trim(),
      color,
      isStart: ui.cellStartInput.checked
    });
    ui.cellForm.reset();
    ui.cellColorInput.value = "#5dd39e";
    saveAndRender();
  });

  ui.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.tasks.push({
      id: crypto.randomUUID(),
      color: normalizeColor(ui.taskColorSelect.value),
      title: ui.taskTitleInput.value.trim(),
      description: ui.taskDescriptionInput.value.trim(),
      points: Number(ui.taskPointsInput.value),
      penalty: ui.taskPenaltyInput.value.trim(),
      image: ui.taskImageInput.value.trim(),
      audio: ui.taskAudioInput.value.trim()
    });
    ui.taskForm.reset();
    saveAndRender();
  });

  ui.newGameBtn.addEventListener("click", () => {
    state.score = 0;
    state.turn = 0;
    state.awaitingTaskDecision = false;
    currentTask = null;
    state.pawnIndex = getStartIndex();
    ui.gameWinDialog.close();
    saveAndRender();
  });
}

function onRollDice() {
  if (state.awaitingTaskDecision) return;
  if (state.cells.length < 2) {
    ui.diceResult.textContent = "Добавьте минимум 2 ячейки для игры.";
    return;
  }
  const dice = 1 + Math.floor(Math.random() * 6);
  state.turn += 1;
  state.pawnIndex = (state.pawnIndex + dice) % state.cells.length;
  ui.diceResult.textContent = `Выпало ${dice}. Вы на ячейке «${state.cells[state.pawnIndex].name}».`;

  const color = normalizeColor(state.cells[state.pawnIndex].color);
  const colorTasks = state.tasks.filter((task) => normalizeColor(task.color) === color);
  currentTask = colorTasks[Math.floor(Math.random() * colorTasks.length)] || null;

  if (!currentTask) {
    ui.taskHint.textContent = "Для этого цвета пока нет заданий. Добавьте в админ-панели.";
    ui.taskTitle.textContent = "";
    ui.taskDescription.textContent = "";
    ui.taskActions.hidden = true;
    state.awaitingTaskDecision = false;
  } else {
    ui.taskHint.textContent = "Задание открыто только после попадания на ячейку:";
    ui.taskTitle.textContent = currentTask.title;
    ui.taskDescription.textContent = currentTask.description;
    ui.taskActions.hidden = false;
    state.awaitingTaskDecision = true;
  }

  applyMedia(currentTask);
  renderBoard();
  renderStats();
  saveState();
}

function completeTask(success) {
  if (!currentTask || !state.awaitingTaskDecision) return;

  if (success) {
    state.score += currentTask.points;
    ui.taskHint.textContent = `Отлично! Вы получили ${currentTask.points} очк.`;
  } else {
    ui.taskHint.textContent = `Не выполнено. ${currentTask.penalty}`;
  }

  state.awaitingTaskDecision = false;
  ui.taskActions.hidden = true;
  checkWin();
  renderStats();
  saveState();
}

function checkWin() {
  if (state.score < state.targetScore) return;
  if (state.pawnIndex !== getStartIndex()) return;
  ui.winText.textContent = `Вы набрали ${state.score} очков и финишировали на старте за ${state.turn} ходов.`;
  ui.gameWinDialog.showModal();
}

function renderAll() {
  ensureStartCell();
  renderStats();
  renderBoard();
  renderAdminLists();
  renderTaskColorSelect();
  applyMedia(currentTask);
  ui.targetScoreInput.value = state.targetScore;
}

function renderStats() {
  ui.scoreValue.textContent = state.score;
  ui.turnValue.textContent = state.turn;
  ui.targetScoreValue.textContent = state.targetScore;
}

function renderBoard() {
  ui.board.innerHTML = "";
  const points = generateLoopPositions(state.cells.length);

  state.cells.forEach((cell, index) => {
    const node = document.createElement("div");
    node.className = "cell";
    node.style.left = `${points[index].x}%`;
    node.style.top = `${points[index].y}%`;
    node.style.background = cell.color;
    node.title = cell.name;
    if (cell.isStart) node.classList.add("start");

    if (index === state.pawnIndex) {
      const pawn = document.createElement("div");
      pawn.className = "pawn";
      pawn.title = "Фишка игрока";
      node.appendChild(pawn);
    }

    ui.board.appendChild(node);
  });
}

function renderTaskColorSelect() {
  ui.taskColorSelect.innerHTML = "";
  const uniqueColors = [...new Set(state.cells.map((cell) => normalizeColor(cell.color)))];
  uniqueColors.forEach((color) => {
    const option = document.createElement("option");
    option.value = color;
    option.textContent = color;
    ui.taskColorSelect.appendChild(option);
  });
}

function renderAdminLists() {
  ui.cellsList.innerHTML = "";
  state.cells.forEach((cell) => {
    const li = document.createElement("li");
    li.textContent = `${cell.name} (${cell.color})${cell.isStart ? " — СТАРТ" : ""}`;
    ui.cellsList.appendChild(li);
  });

  ui.tasksList.innerHTML = "";
  state.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.textContent = `[${task.color}] ${task.title} • +${task.points} очков`;
    ui.tasksList.appendChild(li);
  });
}

function generateLoopPositions(count) {
  const arr = [];
  const cx = 50;
  const cy = 50;
  const base = 37;
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    const jitter = (i % 2 === 0 ? 1 : -1) * (6 + (i % 3) * 2);
    const radius = base + jitter;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * (radius * 0.62);
    arr.push({ x: clamp(x, 5, 89), y: clamp(y, 8, 84) });
  }
  return arr;
}

function applyMedia(task) {
  ui.taskImage.hidden = !(task && task.image);
  if (task?.image) ui.taskImage.src = task.image;

  ui.taskAudio.hidden = !(task && task.audio);
  if (task?.audio) ui.taskAudio.src = task.audio;
}

function saveAndRender() {
  ensureStartCell();
  saveState();
  renderAll();
}

function ensureStartCell() {
  if (!state.cells.some((cell) => cell.isStart) && state.cells[0]) {
    state.cells[0].isStart = true;
  }
  state.pawnIndex = clamp(state.pawnIndex, 0, Math.max(0, state.cells.length - 1));
}

function getStartIndex() {
  const idx = state.cells.findIndex((cell) => cell.isStart);
  return idx >= 0 ? idx : 0;
}

function normalizeColor(color) {
  return color.trim().toLowerCase();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaults);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaults),
      ...parsed,
      cells: parsed.cells?.length ? parsed.cells : structuredClone(defaults.cells),
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : structuredClone(defaults.tasks)
    };
  } catch {
    return structuredClone(defaults);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
