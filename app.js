const STORAGE_KEY = "chip-game-state-v4";

const COLOR_PRESETS = [
  { value: "#c792ea", label: "Сиреневый" },
  { value: "#f06292", label: "Розовый" },
  { value: "#5dd39e", label: "Зелёный" },
  { value: "#64b5f6", label: "Голубой" }
];

const FEEDBACK_MEDIA = {
  success: {
    videos: ["media/video/success/success-1.mp4", "media/video/success/success-2.mp4"],
    images: ["media/images/success/success-1.jpg", "media/images/success/success-2.jpg"],
    sounds: ["media/sounds/success/success-1.mp3", "media/sounds/success/success-2.mp3", "media/sounds/success/success-3.mp3"]
  },
  fail: {
    videos: ["media/video/fail/fail-1.mp4", "media/video/fail/fail-2.mp4"],
    images: ["media/images/fail/fail-1.jpg", "media/images/fail/fail-2.jpg"],
    sounds: ["media/sounds/fail/fail-1.mp3", "media/sounds/fail/fail-2.mp3", "media/sounds/fail/fail-3.mp3"]
  }
};

const SUCCESS_EMOJI_BURST = ["🎉", "🎊", "✨", "🥳", "🎇", "🎆", "🌟", "💫", "🪩", "🎈", "💖", "🍾", "🙌", "💐"];
const FAIL_EMOJI_BURST = ["💩", "☠️", "💀", "🤢", "👎", "😵", "🫠", "😬", "🪦"];

const defaults = {
  targetScore: 20,
  score: 0,
  turn: 0,
  pawnIndex: 0,
  awaitingTaskDecision: false,
  soundEnabled: true,
  theme: "dark",
  stats: { completed: 0, success: 0, fail: 0, streak: 0, bestStreak: 0 },
  history: [],
  pawn: { shape: "circle", image: "" },
  cells: [
    { id: crypto.randomUUID(), name: "Старт", color: "#c792ea", category: 1, isStart: true },
    { id: crypto.randomUUID(), name: "Роща", color: "#5dd39e", category: 2, isStart: false },
    { id: crypto.randomUUID(), name: "Река", color: "#64b5f6", category: 3, isStart: false },
    { id: crypto.randomUUID(), name: "Пещера", color: "#f06292", category: 4, isStart: false }
  ],
  tasks: [
    {
      id: crypto.randomUUID(),
      color: "#5dd39e",
      title: "Лесной квест",
      description: "Назовите 3 вида деревьев.",
      points: 3,
      penalty: "Сделайте 5 хлопков над головой.",
      image: "",
      audio: ""
    },
    {
      id: crypto.randomUUID(),
      color: "#64b5f6",
      title: "Речной квест",
      description: "Скажите скороговорку без ошибок.",
      points: 4,
      penalty: "Назовите 5 стран за 10 секунд.",
      image: "",
      audio: ""
    }
  ]
};

const state = loadState();
const ui = {
  board: document.getElementById("board"),
  categoryLegend: document.getElementById("categoryLegend"),
  fxLayer: document.getElementById("fxLayer"),
  scoreValue: document.getElementById("scoreValue"),
  turnValue: document.getElementById("turnValue"),
  targetScoreValue: document.getElementById("targetScoreValue"),
  goalProgress: document.getElementById("goalProgress"),
  goalProgressLabel: document.getElementById("goalProgressLabel"),
  completedTasksValue: document.getElementById("completedTasksValue"),
  successRateValue: document.getElementById("successRateValue"),
  streakValue: document.getElementById("streakValue"),
  historyList: document.getElementById("historyList"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
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
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  soundToggleBtn: document.getElementById("soundToggleBtn"),
  adminPanel: document.getElementById("adminPanel"),
  settingsForm: document.getElementById("settingsForm"),
  targetScoreInput: document.getElementById("targetScoreInput"),
  pawnForm: document.getElementById("pawnForm"),
  pawnShapeSelect: document.getElementById("pawnShapeSelect"),
  pawnImageUpload: document.getElementById("pawnImageUpload"),
  cellForm: document.getElementById("cellForm"),
  cellNameInput: document.getElementById("cellNameInput"),
  cellColorInput: document.getElementById("cellColorInput"),
  cellCategoryInput: document.getElementById("cellCategoryInput"),
  cellStartInput: document.getElementById("cellStartInput"),
  taskForm: document.getElementById("taskForm"),
  taskColorSelect: document.getElementById("taskColorSelect"),
  taskTitleInput: document.getElementById("taskTitleInput"),
  taskDescriptionInput: document.getElementById("taskDescriptionInput"),
  taskPointsInput: document.getElementById("taskPointsInput"),
  taskPenaltyInput: document.getElementById("taskPenaltyInput"),
  taskImageInput: document.getElementById("taskImageInput"),
  taskAudioInput: document.getElementById("taskAudioInput"),
  exportStateBtn: document.getElementById("exportStateBtn"),
  importStateInput: document.getElementById("importStateInput"),
  resetStateBtn: document.getElementById("resetStateBtn"),
  cellsList: document.getElementById("cellsList"),
  tasksList: document.getElementById("tasksList"),
  feedbackOverlay: document.getElementById("feedbackOverlay"),
  feedbackVideo: document.getElementById("feedbackVideo"),
  feedbackImage: document.getElementById("feedbackImage"),
  feedbackTitle: document.getElementById("feedbackTitle"),
  feedbackText: document.getElementById("feedbackText"),
  feedbackClose: document.getElementById("feedbackClose"),
  gameWinDialog: document.getElementById("gameWinDialog"),
  winText: document.getElementById("winText"),
  newGameBtn: document.getElementById("newGameBtn")
};

let currentTask = null;
let draggingCellId = null;
let feedbackSound = null;
let feedbackCloseTimer = null;

renderAll();
wireEvents();

function wireEvents() {
  ui.rollDiceBtn.addEventListener("click", onRollDice);
  ui.successBtn.addEventListener("click", () => completeTask(true));
  ui.failBtn.addEventListener("click", () => completeTask(false));
  ui.themeToggleBtn.addEventListener("click", toggleTheme);
  ui.soundToggleBtn.addEventListener("click", toggleSound);
  ui.clearHistoryBtn.addEventListener("click", () => {
    state.history = [];
    saveAndRender();
  });

  document.addEventListener("keydown", onHotkeys);

  ui.feedbackClose.addEventListener("click", closeFeedbackOverlay);
  ui.feedbackClose.addEventListener("pointerup", closeFeedbackOverlay);
  ui.feedbackOverlay.addEventListener("click", (event) => {
    if (event.target === ui.feedbackOverlay) closeFeedbackOverlay();
  });

  ui.adminToggle.addEventListener("click", () => {
    const hidden = ui.adminPanel.hasAttribute("hidden");
    ui.adminPanel.toggleAttribute("hidden");
    ui.adminToggle.textContent = hidden ? "Скрыть админ-панель" : "Показать админ-панель";
  });

  ui.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.targetScore = Number(ui.targetScoreInput.value);
    saveAndRender();
  });

  ui.pawnForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.pawn.shape = ui.pawnShapeSelect.value;
    const file = ui.pawnImageUpload.files?.[0];
    if (file) state.pawn.image = await toDataUri(file);
    saveAndRender();
  });

  ui.cellForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (ui.cellStartInput.checked) state.cells.forEach((cell) => (cell.isStart = false));

    state.cells.push({
      id: crypto.randomUUID(),
      name: ui.cellNameInput.value.trim(),
      color: normalizeColor(ui.cellColorInput.value),
      category: Number(ui.cellCategoryInput.value),
      isStart: ui.cellStartInput.checked
    });

    if (ui.cellStartInput.checked) state.pawnIndex = state.cells.length - 1;
    ui.cellForm.reset();
    ui.cellCategoryInput.value = "1";
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
    state.stats = structuredClone(defaults.stats);
    state.history = [];
    state.awaitingTaskDecision = false;
    currentTask = null;
    state.pawnIndex = getStartIndex();
    ui.gameWinDialog.close();
    saveAndRender();
  });

  ui.exportStateBtn.addEventListener("click", exportState);
  ui.importStateInput.addEventListener("change", importStateFile);
  ui.resetStateBtn.addEventListener("click", () => {
    const shouldReset = window.confirm("Сбросить игру и конструктор до стандартных значений?");
    if (!shouldReset) return;
    Object.assign(state, structuredClone(defaults));
    state.pawnIndex = getStartIndex();
    currentTask = null;
    saveAndRender();
  });
}

async function onRollDice() {
  if (state.awaitingTaskDecision) return;
  if (state.cells.length < 2) {
    ui.diceResult.textContent = "Добавьте минимум 2 ячейки для игры.";
    return;
  }

  const dice = 1 + Math.floor(Math.random() * 6);
  state.turn += 1;
  await animateDiceRoll(dice);

  const route = [];
  for (let i = 1; i <= dice; i += 1) {
    route.push((state.pawnIndex + i) % state.cells.length);
  }

  await animatePawnRoute(route);
  state.pawnIndex = route[route.length - 1];

  const cell = state.cells[state.pawnIndex];
  ui.diceResult.textContent = `Выпало ${dice}. Вы на ячейке «${cell.name}».`;
  pushHistory(`🎲 Ход ${state.turn}: выпало ${dice}, переход на «${cell.name}».`);

  const colorTasks = state.tasks.filter((task) => normalizeColor(task.color) === normalizeColor(cell.color));
  currentTask = pickRandom(colorTasks) || null;

  if (!currentTask) {
    ui.taskHint.textContent = "Для этого цвета пока нет заданий. Добавьте их в админ-панели.";
    ui.taskTitle.textContent = "";
    ui.taskDescription.textContent = "";
    ui.taskActions.hidden = true;
    state.awaitingTaskDecision = false;
  } else {
    ui.taskHint.textContent = "Оцените результат выполнения задания:";
    ui.taskTitle.textContent = currentTask.title;
    ui.taskDescription.textContent = currentTask.description;
    ui.taskActions.hidden = false;
    state.awaitingTaskDecision = true;
  }

  applyTaskMedia(currentTask);
  renderBoard();
  renderStats();
  saveState();
}

function completeTask(success) {
  if (!currentTask || !state.awaitingTaskDecision) return;

  state.stats.completed += 1;

  if (success) {
    state.score += currentTask.points;
    state.stats.success += 1;
    state.stats.streak += 1;
    state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    ui.taskHint.textContent = `Отлично! +${currentTask.points} очков.`;
    pushHistory(`✅ «${currentTask.title}» выполнено. +${currentTask.points} очков.`);
    showConfetti();
  } else {
    state.stats.fail += 1;
    state.stats.streak = 0;
    ui.taskHint.textContent = `Не выполнено. Штраф: ${currentTask.penalty}`;
    pushHistory(`❌ «${currentTask.title}» не выполнено. Штраф: ${currentTask.penalty}`);
    showPoopFx();
  }

  state.awaitingTaskDecision = false;
  ui.taskActions.hidden = true;
  renderStats();
  saveState();
  showFeedbackOverlay(success);
  checkWin();
}

function showFeedbackOverlay(success) {
  const mode = success ? "success" : "fail";
  const mediaSet = FEEDBACK_MEDIA[mode];
  const text = success
    ? "Классно! Так держать!"
    : `Не страшно. Следующее задание точно получится. ${currentTask?.penalty || ""}`;

  ui.feedbackOverlay.hidden = false;
  ui.feedbackClose.onclick = closeFeedbackOverlay;
  ui.feedbackOverlay.classList.toggle("success", success);
  ui.feedbackOverlay.classList.toggle("fail", !success);
  ui.feedbackTitle.textContent = success ? "Успех!" : "Промах";
  ui.feedbackText.textContent = text;

  presentFeedbackVisual(mediaSet);
  playFeedbackSound(mediaSet.sounds, success);

  if (feedbackCloseTimer) clearTimeout(feedbackCloseTimer);
  feedbackCloseTimer = setTimeout(closeFeedbackOverlay, 12000);
}

function presentFeedbackVisual(mediaSet) {
  const prefersVideo = Math.random() > 0.35;
  const videoSrc = pickRandom(mediaSet.videos);
  const imageSrc = pickRandom(mediaSet.images);

  ui.feedbackVideo.pause();
  ui.feedbackVideo.hidden = true;
  ui.feedbackImage.hidden = true;
  ui.feedbackVideo.removeAttribute("src");

  if (prefersVideo && videoSrc) {
    ui.feedbackVideo.src = videoSrc;
    ui.feedbackVideo.loop = false;
    ui.feedbackVideo.volume = 0.8;
    ui.feedbackVideo.currentTime = 0;
    ui.feedbackVideo.hidden = false;
    ui.feedbackVideo.muted = false;
    ui.feedbackVideo.play().catch(() => {
      ui.feedbackVideo.hidden = true;
      showFeedbackImage(imageSrc);
    });
    return;
  }

  showFeedbackImage(imageSrc);
}

function showFeedbackImage(src) {
  if (!src) return;
  ui.feedbackImage.src = src;
  ui.feedbackImage.hidden = false;
}

function playFeedbackSound(soundList, isGood) {
  if (!state.soundEnabled) return;
  if (feedbackSound) {
    feedbackSound.pause();
    feedbackSound = null;
  }

  const selected = pickRandom(soundList);
  if (!selected) {
    toneFallback(isGood);
    return;
  }

  feedbackSound = new Audio(selected);
  feedbackSound.volume = 0.55;
  feedbackSound.play().catch(() => toneFallback(isGood));
}

function closeFeedbackOverlay() {
  if (feedbackCloseTimer) {
    clearTimeout(feedbackCloseTimer);
    feedbackCloseTimer = null;
  }

  ui.feedbackOverlay.hidden = true;
  ui.feedbackVideo.pause();
  ui.feedbackVideo.hidden = true;
  ui.feedbackImage.hidden = true;
  ui.feedbackVideo.removeAttribute("src");
  if (feedbackSound) {
    feedbackSound.pause();
    feedbackSound = null;
  }
}

function checkWin() {
  if (state.score < state.targetScore) return;
  if (state.pawnIndex !== getStartIndex()) return;
  ui.winText.textContent = `Вы набрали ${state.score} очков и финишировали на старте за ${state.turn} ходов.`;
  ui.gameWinDialog.showModal();
}

function renderAll() {
  ensureStartCell();
  applyTheme();
  renderColorOptions();
  renderStats();
  renderBoard();
  renderLegend();
  renderAdminLists();
  renderHistory();
  renderTaskColorSelect();
  applyTaskMedia(currentTask);
  ui.targetScoreInput.value = state.targetScore;
  ui.pawnShapeSelect.value = state.pawn?.shape || "circle";
  ui.soundToggleBtn.textContent = state.soundEnabled ? "🔊 Звук включён" : "🔇 Звук выключен";
  ui.themeToggleBtn.textContent = state.theme === "light" ? "🌙 Тёмная тема" : "☀️ Светлая тема";
}

function renderColorOptions() {
  ui.cellColorInput.innerHTML = "";
  COLOR_PRESETS.forEach((color) => {
    const option = document.createElement("option");
    option.value = color.value;
    option.textContent = `${color.label} (${color.value})`;
    ui.cellColorInput.appendChild(option);
  });
}

function renderStats() {
  ui.scoreValue.textContent = state.score;
  ui.turnValue.textContent = state.turn;
  ui.targetScoreValue.textContent = state.targetScore;
  const percent = clamp(Math.round((state.score / Math.max(1, state.targetScore)) * 100), 0, 100);
  ui.goalProgress.style.width = `${percent}%`;
  ui.goalProgressLabel.textContent = `${percent}% до цели`;

  const successRate = state.stats.completed
    ? Math.round((state.stats.success / state.stats.completed) * 100)
    : 0;
  ui.completedTasksValue.textContent = state.stats.completed;
  ui.successRateValue.textContent = `${successRate}%`;
  ui.streakValue.textContent = `${state.stats.streak} (лучшее: ${state.stats.bestStreak})`;
}

function renderHistory() {
  ui.historyList.innerHTML = "";
  const log = state.history.length ? state.history : ["Игра готова. Сделайте первый ход."];
  log.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    ui.historyList.appendChild(item);
  });
}

function renderBoard() {
  ui.board.innerHTML = "";
  const points = generateLoopPositions(state.cells.length);

  state.cells.forEach((cell, index) => {
    const node = document.createElement("button");
    node.className = "cell";
    node.type = "button";
    node.draggable = true;
    node.dataset.cellId = cell.id;
    node.style.left = `${points[index].x}%`;
    node.style.top = `${points[index].y}%`;
    node.style.background = cell.color;
    node.title = `${cell.name}: цвет ${cell.color}, категория ${cell.category}`;
    node.innerHTML = `<span>${cell.name}</span>`;

    if (cell.isStart) node.classList.add("start");

    node.addEventListener("dragstart", () => (draggingCellId = cell.id));
    node.addEventListener("dragover", (event) => event.preventDefault());
    node.addEventListener("drop", () => reorderCells(draggingCellId, cell.id));

    if (index === state.pawnIndex) {
      const pawn = document.createElement("div");
      pawn.className = `pawn ${state.pawn?.shape || "circle"}`;
      if (state.pawn?.image) pawn.style.backgroundImage = `url(${state.pawn.image})`;
      node.appendChild(pawn);
    }

    ui.board.appendChild(node);
  });
}

function renderLegend() {
  ui.categoryLegend.innerHTML = "";
  state.cells.forEach((cell, index) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<i style="background:${cell.color}"></i>${index + 1}. ${cell.name} — ${cell.color}, категория ${cell.category}`;
    ui.categoryLegend.appendChild(item);
  });
}

function renderTaskColorSelect() {
  ui.taskColorSelect.innerHTML = "";
  const uniqueColors = [...new Set(state.cells.map((cell) => normalizeColor(cell.color)))];

  uniqueColors.forEach((color) => {
    const option = document.createElement("option");
    option.value = color;
    const preset = COLOR_PRESETS.find((entry) => entry.value === color);
    option.textContent = preset ? `${preset.label} (${color})` : color;
    ui.taskColorSelect.appendChild(option);
  });
}

function renderAdminLists() {
  ui.cellsList.innerHTML = "";
  state.cells.forEach((cell) => {
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.cellId = cell.id;
    li.textContent = `${cell.name} (${cell.color}) → категория ${cell.category}${cell.isStart ? " — СТАРТ" : ""}`;
    li.addEventListener("dragstart", () => (draggingCellId = cell.id));
    li.addEventListener("dragover", (event) => event.preventDefault());
    li.addEventListener("drop", () => reorderCells(draggingCellId, cell.id));
    ui.cellsList.appendChild(li);
  });

  ui.tasksList.innerHTML = "";
  state.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.textContent = `[${task.color}] ${task.title} • +${task.points} очков`;
    ui.tasksList.appendChild(li);
  });
}

async function animateDiceRoll(finalValue) {
  ui.rollDiceBtn.disabled = true;
  ui.rollDiceBtn.classList.add("rolling");
  for (let i = 0; i < 8; i += 1) {
    const fake = 1 + Math.floor(Math.random() * 6);
    ui.diceResult.textContent = `Кубик крутится... ${fake}`;
    await wait(90);
  }
  ui.diceResult.textContent = `Кубик остановился: ${finalValue}`;
  ui.rollDiceBtn.classList.remove("rolling");
  ui.rollDiceBtn.disabled = false;
}

async function animatePawnRoute(route) {
  for (const nextIndex of route) {
    state.pawnIndex = nextIndex;
    renderBoard();
    await wait(240);
  }
}

function showConfetti() {
  burstFx(SUCCESS_EMOJI_BURST, 90);
}

function showPoopFx() {
  burstFx(FAIL_EMOJI_BURST, 42);
}

function burstFx(symbols, count = 24) {
  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement("span");
    particle.className = "fx-particle";
    particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 0.3}s`;
    particle.style.setProperty("--drift", `${-30 + Math.random() * 60}px`);
    ui.fxLayer.appendChild(particle);
    setTimeout(() => particle.remove(), 1800);
  }
}

function toneFallback(isGood) {
  const context = new AudioContext();
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = isGood ? "triangle" : "sawtooth";
  osc.frequency.value = isGood ? 660 : 180;
  osc.connect(gain);
  gain.connect(context.destination);
  gain.gain.value = 0.02;
  osc.start();
  osc.stop(context.currentTime + 0.25);
}

function reorderCells(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const fromIndex = state.cells.findIndex((cell) => cell.id === fromId);
  const toIndex = state.cells.findIndex((cell) => cell.id === toId);
  if (fromIndex < 0 || toIndex < 0) return;

  const pawnCellId = state.cells[state.pawnIndex]?.id;
  const [moved] = state.cells.splice(fromIndex, 1);
  state.cells.splice(toIndex, 0, moved);
  state.pawnIndex = Math.max(0, state.cells.findIndex((cell) => cell.id === pawnCellId));
  saveAndRender();
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

function applyTaskMedia(task) {
  ui.taskImage.hidden = !(task && task.image);
  if (task?.image) ui.taskImage.src = task.image;

  ui.taskAudio.hidden = !(task && task.audio);
  if (task?.audio) ui.taskAudio.src = task.audio;
}

function pushHistory(message) {
  state.history.unshift(message);
  state.history = state.history.slice(0, 14);
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  saveAndRender();
}

function applyTheme() {
  document.body.dataset.theme = state.theme || "dark";
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  if (!state.soundEnabled && feedbackSound) {
    feedbackSound.pause();
    feedbackSound = null;
  }
  saveAndRender();
}

function onHotkeys(event) {
  if (event.target.matches("input, textarea, select")) return;
  if (ui.feedbackOverlay.hidden === false && event.key === "Escape") {
    closeFeedbackOverlay();
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    onRollDice();
  }

  if (state.awaitingTaskDecision && event.key.toLowerCase() === "s") completeTask(true);
  if (state.awaitingTaskDecision && event.key.toLowerCase() === "f") completeTask(false);
}

function exportState() {
  const file = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = "chip-game-state.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importStateFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    const next = sanitizeState(parsed);
    Object.assign(state, next);
    currentTask = null;
    saveAndRender();
  } catch {
    ui.diceResult.textContent = "Не удалось импортировать JSON. Проверьте формат файла.";
  }

  event.target.value = "";
}

function saveAndRender() {
  ensureStartCell();
  saveState();
  renderAll();
}

function ensureStartCell() {
  if (!state.cells.some((cell) => cell.isStart) && state.cells[0]) state.cells[0].isStart = true;
  state.pawnIndex = clamp(state.pawnIndex, 0, Math.max(0, state.cells.length - 1));
}

function getStartIndex() {
  const idx = state.cells.findIndex((cell) => cell.isStart);
  return idx >= 0 ? idx : 0;
}

function pickRandom(list) {
  if (!Array.isArray(list) || !list.length) return "";
  return list[Math.floor(Math.random() * list.length)];
}

function normalizeColor(color) {
  return color.trim().toLowerCase();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaults);

    const parsed = JSON.parse(raw);
    return sanitizeState(parsed);
  } catch {
    return structuredClone(defaults);
  }
}

function sanitizeState(parsed) {
  return {
    ...structuredClone(defaults),
    ...parsed,
    pawn: { ...structuredClone(defaults.pawn), ...parsed?.pawn },
    stats: { ...structuredClone(defaults.stats), ...parsed?.stats },
    cells: parsed?.cells?.length ? parsed.cells : structuredClone(defaults.cells),
    tasks: Array.isArray(parsed?.tasks) ? parsed.tasks : structuredClone(defaults.tasks),
    history: Array.isArray(parsed?.history) ? parsed.history.slice(0, 14) : []
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
