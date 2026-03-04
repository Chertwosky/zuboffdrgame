const STORAGE_KEY = "chip-game-state-v2";

const COLOR_PRESETS = [
  { key: "green", label: "Зеленый", color: "#5dd39e", category: 1 },
  { key: "blue", label: "Голубой", color: "#64b5f6", category: 2 },
  { key: "pink", label: "Розовый", color: "#f06292", category: 3 },
  { key: "purple", label: "Сиреневый", color: "#c792ea", category: 4 }
];

const defaults = {
  targetScore: 20,
  score: 0,
  turn: 0,
  pawnIndex: 0,
  awaitingTaskDecision: false,
  isMoving: false,
  pawnStyle: { mode: "shape", shape: "circle", image: "" },
  cells: [
    { id: crypto.randomUUID(), name: "Старт", colorKey: "green", x: 85, y: 50, isStart: true },
    { id: crypto.randomUUID(), name: "Река", colorKey: "blue", x: 66, y: 76, isStart: false },
    { id: crypto.randomUUID(), name: "Цветник", colorKey: "pink", x: 34, y: 74, isStart: false },
    { id: crypto.randomUUID(), name: "Грот", colorKey: "purple", x: 16, y: 48, isStart: false },
    { id: crypto.randomUUID(), name: "Поляна", colorKey: "green", x: 33, y: 22, isStart: false },
    { id: crypto.randomUUID(), name: "Озеро", colorKey: "blue", x: 67, y: 23, isStart: false }
  ],
  tasks: [
    { id: crypto.randomUUID(), colorKey: "green", title: "Эко-челлендж", description: "Назовите 3 растения.", points: 3, penalty: "Штраф: 5 приседаний.", image: "", audio: "" },
    { id: crypto.randomUUID(), colorKey: "blue", title: "Водный раунд", description: "Назовите 3 реки.", points: 4, penalty: "Штраф: 10 хлопков.", image: "", audio: "" },
    { id: crypto.randomUUID(), colorKey: "pink", title: "Скороговорка", description: "Скажите скороговорку.", points: 5, penalty: "Штраф: 3 прыжка.", image: "", audio: "" },
    { id: crypto.randomUUID(), colorKey: "purple", title: "Космос", description: "Назовите 3 созвездия.", points: 6, penalty: "Штраф: рассказать стих.", image: "", audio: "" }
  ]
};

const state = loadState();
const ui = {
  board: document.getElementById("board"),
  categoryLegend: document.getElementById("categoryLegend"),
  scoreValue: document.getElementById("scoreValue"),
  turnValue: document.getElementById("turnValue"),
  targetScoreValue: document.getElementById("targetScoreValue"),
  diceVisual: document.getElementById("diceVisual"),
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
  cellColorSelect: document.getElementById("cellColorSelect"),
  cellStartInput: document.getElementById("cellStartInput"),
  taskForm: document.getElementById("taskForm"),
  taskColorSelect: document.getElementById("taskColorSelect"),
  taskTitleInput: document.getElementById("taskTitleInput"),
  taskDescriptionInput: document.getElementById("taskDescriptionInput"),
  taskPointsInput: document.getElementById("taskPointsInput"),
  taskPenaltyInput: document.getElementById("taskPenaltyInput"),
  taskImageInput: document.getElementById("taskImageInput"),
  taskAudioInput: document.getElementById("taskAudioInput"),
  taskEditId: document.getElementById("taskEditId"),
  taskFormResetBtn: document.getElementById("taskFormResetBtn"),
  pawnForm: document.getElementById("pawnForm"),
  pawnShapeSelect: document.getElementById("pawnShapeSelect"),
  pawnImageInput: document.getElementById("pawnImageInput"),
  cellsList: document.getElementById("cellsList"),
  tasksList: document.getElementById("tasksList"),
  gameWinDialog: document.getElementById("gameWinDialog"),
  winText: document.getElementById("winText"),
  newGameBtn: document.getElementById("newGameBtn"),
  effectsLayer: document.getElementById("effectsLayer")
};

let currentTask = null;
let dragContext = null;

renderAll();
wireEvents();

function wireEvents() {
  ui.rollDiceBtn.addEventListener("click", onRollDice);
  ui.successBtn.addEventListener("click", () => completeTask(true));
  ui.failBtn.addEventListener("click", () => completeTask(false));
  ui.adminToggle.addEventListener("click", toggleAdmin);

  ui.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.targetScore = Number(ui.targetScoreInput.value);
    saveAndRender();
  });

  ui.cellForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const colorKey = ui.cellColorSelect.value;
    if (ui.cellStartInput.checked) state.cells.forEach((cell) => { cell.isStart = false; });
    state.cells.push({
      id: crypto.randomUUID(),
      name: ui.cellNameInput.value.trim(),
      colorKey,
      isStart: ui.cellStartInput.checked,
      ...generateNewCellPosition(state.cells.length)
    });
    ui.cellForm.reset();
    saveAndRender();
  });

  ui.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = {
      colorKey: ui.taskColorSelect.value,
      title: ui.taskTitleInput.value.trim(),
      description: ui.taskDescriptionInput.value.trim(),
      points: Number(ui.taskPointsInput.value),
      penalty: ui.taskPenaltyInput.value.trim(),
      image: ui.taskImageInput.value.trim(),
      audio: ui.taskAudioInput.value.trim()
    };
    if (ui.taskEditId.value) {
      const task = state.tasks.find((item) => item.id === ui.taskEditId.value);
      Object.assign(task, payload);
    } else {
      state.tasks.push({ id: crypto.randomUUID(), ...payload });
    }
    resetTaskForm();
    saveAndRender();
  });

  ui.taskFormResetBtn.addEventListener("click", resetTaskForm);

  ui.pawnForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = ui.pawnImageInput.files?.[0];
    if (file) {
      state.pawnStyle = { mode: "image", shape: ui.pawnShapeSelect.value, image: await fileToDataUrl(file) };
    } else {
      state.pawnStyle = { mode: "shape", shape: ui.pawnShapeSelect.value, image: "" };
    }
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

function toggleAdmin() {
  const hidden = ui.adminPanel.hasAttribute("hidden");
  if (hidden) {
    ui.adminPanel.removeAttribute("hidden");
    ui.adminToggle.textContent = "Скрыть админ-панель";
  } else {
    ui.adminPanel.setAttribute("hidden", "");
    ui.adminToggle.textContent = "Показать админ-панель";
  }
}

async function onRollDice() {
  if (state.awaitingTaskDecision || state.isMoving) return;
  if (state.cells.length < 2) {
    ui.diceResult.textContent = "Добавьте минимум 2 ячейки для игры.";
    return;
  }

  state.isMoving = true;
  ui.rollDiceBtn.disabled = true;
  ui.diceVisual.classList.add("rolling");
  await wait(800);

  const dice = 1 + Math.floor(Math.random() * 6);
  ui.diceVisual.classList.remove("rolling");
  ui.diceResult.textContent = `Выпало ${dice}. Фишка двигается...`;

  await animatePawnMove(dice);

  state.turn += 1;
  ui.diceResult.textContent = `Выпало ${dice}. Вы на ячейке «${state.cells[state.pawnIndex].name}».`;

  const colorKey = state.cells[state.pawnIndex].colorKey;
  const colorTasks = state.tasks.filter((task) => task.colorKey === colorKey);
  currentTask = colorTasks[Math.floor(Math.random() * colorTasks.length)] || null;

  if (!currentTask) {
    ui.taskHint.textContent = "";
    ui.taskTitle.textContent = "Для этого цвета пока нет заданий";
    ui.taskDescription.textContent = "Добавьте задания в админ-панели.";
    ui.taskActions.hidden = true;
    state.awaitingTaskDecision = false;
  } else {
    ui.taskHint.textContent = "";
    ui.taskTitle.textContent = currentTask.title;
    ui.taskDescription.textContent = currentTask.description;
    ui.taskActions.hidden = false;
    state.awaitingTaskDecision = true;
  }

  state.isMoving = false;
  ui.rollDiceBtn.disabled = false;
  applyMedia(currentTask);
  renderStats();
  saveState();
}

async function animatePawnMove(steps) {
  for (let i = 0; i < steps; i += 1) {
    state.pawnIndex = (state.pawnIndex + 1) % state.cells.length;
    renderBoard();
    ui.board.classList.add("board-pulse");
    await wait(220);
    ui.board.classList.remove("board-pulse");
  }
}

function completeTask(success) {
  if (!currentTask || !state.awaitingTaskDecision) return;
  if (success) {
    state.score += currentTask.points;
    ui.taskHint.textContent = `Отлично! +${currentTask.points} очков.`;
    triggerConfetti();
    playResultTone(true);
  } else {
    ui.taskHint.textContent = `Не выполнено. ${currentTask.penalty}`;
    triggerPoopStorm();
    playResultTone(false);
  }
  state.awaitingTaskDecision = false;
  ui.taskActions.hidden = true;
  checkWin();
  renderStats();
  saveState();
}

function triggerConfetti() {
  for (let i = 0; i < 45; i += 1) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty("--delay", `${Math.random() * 0.25}s`);
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 180}px`);
    piece.style.background = ["#64b5f6", "#f06292", "#5dd39e", "#c792ea", "#ffd54f"][Math.floor(Math.random() * 5)];
    ui.effectsLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 1800);
  }
}

function triggerPoopStorm() {
  for (let i = 0; i < 16; i += 1) {
    const piece = document.createElement("div");
    piece.className = "poop-piece";
    piece.textContent = "💩";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty("--delay", `${Math.random() * 0.3}s`);
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 140}px`);
    ui.effectsLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 2000);
  }
}

function playResultTone(isSuccess) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;

  const ctx = new Ctx();
  const now = ctx.currentTime;
  const bank = isSuccess
    ? [[659, 0.08], [784, 0.08], [988, 0.12]]
    : [[220, 0.12], [185, 0.12], [147, 0.16]];

  bank.forEach(([freq, dur], i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isSuccess ? "triangle" : "sawtooth";
    osc.frequency.value = freq + Math.random() * (isSuccess ? 16 : 8);
    gain.gain.setValueAtTime(0.0001, now + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(isSuccess ? 0.14 : 0.11, now + i * 0.08 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + dur + 0.02);
  });

  setTimeout(() => ctx.close(), 800);
}

function checkWin() {
  if (state.score < state.targetScore) return;
  if (state.pawnIndex !== getStartIndex()) return;
  ui.winText.textContent = `Вы набрали ${state.score} очков и вернулись на старт за ${state.turn} ходов.`;
  ui.gameWinDialog.showModal();
}

function renderAll() {
  ensureStartCell();
  renderStats();
  renderColorSelectors();
  renderLegend();
  renderBoard();
  renderAdminLists();
  applyMedia(currentTask);
  ui.targetScoreInput.value = state.targetScore;
  ui.pawnShapeSelect.value = state.pawnStyle.shape || "circle";
}

function renderLegend() {
  ui.categoryLegend.innerHTML = COLOR_PRESETS
    .map((preset) => `<span class="legend-item"><i style="background:${preset.color}"></i>${preset.label} — Категория ${preset.category}</span>`)
    .join("");
}

function renderStats() {
  ui.scoreValue.textContent = state.score;
  ui.turnValue.textContent = state.turn;
  ui.targetScoreValue.textContent = state.targetScore;
}

function renderColorSelectors() {
  const options = COLOR_PRESETS.map((preset) => `<option value="${preset.key}">${preset.label} — Категория ${preset.category}</option>`).join("");
  ui.cellColorSelect.innerHTML = options;
  ui.taskColorSelect.innerHTML = options;
}

function renderBoard() {
  ui.board.innerHTML = "";

  state.cells.forEach((cell, index) => {
    const node = document.createElement("div");
    node.className = "cell";
    node.style.left = `${cell.x}%`;
    node.style.top = `${cell.y}%`;
    node.dataset.id = cell.id;
    const color = getColor(cell.colorKey);
    node.style.background = color;
    if (cell.isStart) node.classList.add("start");

    if (index === state.pawnIndex) node.appendChild(buildPawnNode());

    enableDrag(node, cell.id);
    ui.board.appendChild(node);
  });
}

function buildPawnNode() {
  const pawn = document.createElement("div");
  pawn.className = "pawn";
  if (state.pawnStyle.mode === "image" && state.pawnStyle.image) {
    pawn.classList.add("image");
    pawn.style.backgroundImage = `url('${state.pawnStyle.image}')`;
  } else {
    pawn.classList.add(state.pawnStyle.shape || "circle");
  }
  return pawn;
}

function enableDrag(node, cellId) {
  node.addEventListener("pointerdown", (event) => {
    const rect = ui.board.getBoundingClientRect();
    dragContext = { cellId, rect };
    node.classList.add("dragging");
    node.setPointerCapture(event.pointerId);
  });

  node.addEventListener("pointermove", (event) => {
    if (!dragContext || dragContext.cellId !== cellId) return;
    const x = ((event.clientX - dragContext.rect.left) / dragContext.rect.width) * 100;
    const y = ((event.clientY - dragContext.rect.top) / dragContext.rect.height) * 100;
    updateCellPosition(cellId, clamp(x, 3, 90), clamp(y, 4, 86));
    renderBoard();
  });

  node.addEventListener("pointerup", () => {
    if (!dragContext || dragContext.cellId !== cellId) return;
    dragContext = null;
    saveState();
  });
}

function updateCellPosition(cellId, x, y) {
  const cell = state.cells.find((item) => item.id === cellId);
  if (!cell) return;
  cell.x = x;
  cell.y = y;
}

function renderAdminLists() {
  ui.cellsList.innerHTML = "";
  state.cells.forEach((cell) => {
    const li = document.createElement("li");
    li.textContent = `${cell.name} — ${getColorLabel(cell.colorKey)} (Категория ${getCategory(cell.colorKey)})${cell.isStart ? " [СТАРТ]" : ""}`;
    ui.cellsList.appendChild(li);
  });

  ui.tasksList.innerHTML = "";
  state.tasks.forEach((task) => {
    const li = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = `${getColorLabel(task.colorKey)} / Категория ${getCategory(task.colorKey)}: ${task.title} (+${task.points})`;

    const actions = document.createElement("div");
    actions.className = "inline-actions";
    const editBtn = document.createElement("button");
    editBtn.textContent = "Изменить";
    editBtn.className = "button secondary";
    editBtn.type = "button";
    editBtn.addEventListener("click", () => fillTaskForm(task));

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Удалить";
    removeBtn.className = "button danger";
    removeBtn.type = "button";
    removeBtn.addEventListener("click", () => {
      state.tasks = state.tasks.filter((item) => item.id !== task.id);
      saveAndRender();
    });

    actions.append(editBtn, removeBtn);
    li.append(text, actions);
    ui.tasksList.appendChild(li);
  });
}

function fillTaskForm(task) {
  ui.taskEditId.value = task.id;
  ui.taskColorSelect.value = task.colorKey;
  ui.taskTitleInput.value = task.title;
  ui.taskDescriptionInput.value = task.description;
  ui.taskPointsInput.value = task.points;
  ui.taskPenaltyInput.value = task.penalty;
  ui.taskImageInput.value = task.image;
  ui.taskAudioInput.value = task.audio;
}

function resetTaskForm() {
  ui.taskForm.reset();
  ui.taskEditId.value = "";
}

function applyMedia(task) {
  ui.taskImage.hidden = !(task && task.image);
  if (task?.image) ui.taskImage.src = task.image;
  ui.taskAudio.hidden = !(task && task.audio);
  if (task?.audio) ui.taskAudio.src = task.audio;
}

function ensureStartCell() {
  if (!state.cells.some((cell) => cell.isStart) && state.cells[0]) state.cells[0].isStart = true;
  state.pawnIndex = clamp(state.pawnIndex, 0, Math.max(0, state.cells.length - 1));
}

function getStartIndex() {
  const idx = state.cells.findIndex((cell) => cell.isStart);
  return idx >= 0 ? idx : 0;
}

function generateNewCellPosition(index) {
  const angle = (Math.PI * 2 * (index + 1)) / Math.max(6, state.cells.length + 1);
  return { x: clamp(50 + Math.cos(angle) * 35, 4, 90), y: clamp(50 + Math.sin(angle) * 26, 5, 85) };
}

function getPreset(colorKey) {
  return COLOR_PRESETS.find((preset) => preset.key === colorKey) || COLOR_PRESETS[0];
}
function getColor(colorKey) { return getPreset(colorKey).color; }
function getColorLabel(colorKey) { return getPreset(colorKey).label; }
function getCategory(colorKey) { return getPreset(colorKey).category; }

function saveAndRender() {
  ensureStartCell();
  saveState();
  renderAll();
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
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : structuredClone(defaults.tasks),
      pawnStyle: parsed.pawnStyle || structuredClone(defaults.pawnStyle)
    };
  } catch {
    return structuredClone(defaults);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
