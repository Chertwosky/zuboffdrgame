const STORAGE_KEY = "chip-game-state-v6";
const CATEGORY_KEYS = ["purple", "red", "blue", "green"];

const CARD_TYPES = {
  purple: { label: "Сиреневые", icon: "🟣" },
  red: { label: "Красные", icon: "🔴" },
  blue: { label: "Синие", icon: "🔵" },
  green: { label: "Зелёные", icon: "🟢" }
};

const DEFAULT_CATEGORIES = {
  purple: { name: "Сиреневый", color: "#c792ea" },
  red: { name: "Красный", color: "#f06292" },
  blue: { name: "Синий", color: "#64b5f6" },
  green: { name: "Зелёный", color: "#5dd39e" }
};

const WIN_TARGET = { purple: 1, red: 2, blue: 3, green: 4 };


const EXCHANGE_RULES = {
  purpleToRed: { from: "purple", to: "red", fromAmount: 1, toAmount: 2, label: "1 сиреневая → 2 красные" },
  redToBlue: { from: "red", to: "blue", fromAmount: 1, toAmount: 2, label: "1 красная → 2 синие" },
  blueToGreen: { from: "blue", to: "green", fromAmount: 1, toAmount: 2, label: "1 синяя → 2 зелёные" }
};


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

const GAMEPLAY_SOUNDS = {
  diceRollLoop: "media/sounds/gameplay/dice-roll-loop.mp3",
  pawnStep: "media/sounds/gameplay/pawn-step.mp3",
  thinkingLoop: "media/sounds/gameplay/thinking-loop.mp3"
};

const SUCCESS_EMOJI_BURST = ["🎉", "🎊", "✨", "🥳", "🎇", "🎆", "🌟", "💫", "🪩", "🎈", "💖", "🍾", "🙌", "💐"];
const FAIL_EMOJI_BURST = ["💩", "☠️", "💀", "🤢", "👎", "😵", "🫠", "😬", "🪦"];

const defaults = {
  players: [{ id: crypto.randomUUID(), name: "Игрок 1", cards: { purple: 0, red: 0, blue: 0, green: 0 } }],
  currentPlayerIndex: 0,
  score: 0,
  turn: 0,
  pawnIndex: 0,
  awaitingTaskDecision: false,
  soundEnabled: true,
  theme: "dark",
  stats: { completed: 0, success: 0, fail: 0, streak: 0, bestStreak: 0 },
  history: [],
  pawn: { shape: "circle", image: "" },
  categories: structuredClone(DEFAULT_CATEGORIES),
  penalties: ["Сделайте 5 хлопков над головой.", "Назовите 5 стран за 10 секунд."],
  feedbackMedia: structuredClone(FEEDBACK_MEDIA),
  gameplaySounds: structuredClone(GAMEPLAY_SOUNDS),
  cells: [
    { id: crypto.randomUUID(), name: "Старт", categoryKey: "purple", isStart: true },
    { id: crypto.randomUUID(), name: "Роща", categoryKey: "green", isStart: false },
    { id: crypto.randomUUID(), name: "Река", categoryKey: "blue", isStart: false },
    { id: crypto.randomUUID(), name: "Пещера", categoryKey: "red", isStart: false }
  ],
  tasks: [
    {
      id: crypto.randomUUID(),
      categoryKey: "green",
      title: "Лесной квест",
      description: "Назовите 3 вида деревьев.",
      points: 1,
      image: "",
      audio: ""
    },
    {
      id: crypto.randomUUID(),
      categoryKey: "blue",
      title: "Речной квест",
      description: "Скажите скороговорку без ошибок.",
      points: 1,
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
  currentPlayerValue: document.getElementById("currentPlayerValue"),
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
  playersPanel: document.getElementById("playersPanel"),
  playerForm: document.getElementById("playerForm"),
  playerNameInput: document.getElementById("playerNameInput"),
  playersAdminList: document.getElementById("playersAdminList"),
  exchangeForm: document.getElementById("exchangeForm"),
  exchangePlayerSelect: document.getElementById("exchangePlayerSelect"),
  exchangeRuleSelect: document.getElementById("exchangeRuleSelect"),
  pawnForm: document.getElementById("pawnForm"),
  pawnShapeSelect: document.getElementById("pawnShapeSelect"),
  pawnImageUpload: document.getElementById("pawnImageUpload"),
  cellForm: document.getElementById("cellForm"),
  cellNameInput: document.getElementById("cellNameInput"),
  cellCategoryInput: document.getElementById("cellCategoryInput"),
  cellStartInput: document.getElementById("cellStartInput"),
  taskForm: document.getElementById("taskForm"),
  taskCategorySelect: document.getElementById("taskCategorySelect"),
  taskTitleInput: document.getElementById("taskTitleInput"),
  taskDescriptionInput: document.getElementById("taskDescriptionInput"),
  penaltyForm: document.getElementById("penaltyForm"),
  penaltyInput: document.getElementById("penaltyInput"),
  penaltiesList: document.getElementById("penaltiesList"),
  categoriesForm: document.getElementById("categoriesForm"),
  categoriesEditor: document.getElementById("categoriesEditor"),
  mediaSettingsForm: document.getElementById("mediaSettingsForm"),
  successVideosInput: document.getElementById("successVideosInput"),
  successImagesInput: document.getElementById("successImagesInput"),
  successSoundsInput: document.getElementById("successSoundsInput"),
  failVideosInput: document.getElementById("failVideosInput"),
  failImagesInput: document.getElementById("failImagesInput"),
  failSoundsInput: document.getElementById("failSoundsInput"),
  successVideosUpload: document.getElementById("successVideosUpload"),
  successImagesUpload: document.getElementById("successImagesUpload"),
  successSoundsUpload: document.getElementById("successSoundsUpload"),
  failVideosUpload: document.getElementById("failVideosUpload"),
  failImagesUpload: document.getElementById("failImagesUpload"),
  failSoundsUpload: document.getElementById("failSoundsUpload"),
  addSuccessVideosBtn: document.getElementById("addSuccessVideosBtn"),
  addSuccessImagesBtn: document.getElementById("addSuccessImagesBtn"),
  addSuccessSoundsBtn: document.getElementById("addSuccessSoundsBtn"),
  addFailVideosBtn: document.getElementById("addFailVideosBtn"),
  addFailImagesBtn: document.getElementById("addFailImagesBtn"),
  addFailSoundsBtn: document.getElementById("addFailSoundsBtn"),
  diceRollLoopInput: document.getElementById("diceRollLoopInput"),
  pawnStepInput: document.getElementById("pawnStepInput"),
  thinkingLoopInput: document.getElementById("thinkingLoopInput"),
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
  newGameBtn: document.getElementById("newGameBtn"),
  rerollPenaltyBtn: document.getElementById("rerollPenaltyBtn"),
  taskPenaltyPreview: document.getElementById("taskPenaltyPreview")
};

let currentTask = null;
let currentPenalty = "";
let draggingCellId = null;
let feedbackSound = null;
let feedbackVideoSound = null;
let feedbackCloseTimer = null;
let diceRollLoopSound = null;
let thinkingLoopSound = null;

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

  ui.playerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = ui.playerNameInput.value.trim();
    if (!name) return;
    state.players.push({ id: crypto.randomUUID(), name, cards: makeEmptyCards() });
    ui.playerForm.reset();
    saveAndRender();
  });

  ui.exchangeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const playerId = ui.exchangePlayerSelect.value;
    const ruleKey = ui.exchangeRuleSelect.value;
    const player = state.players.find((item) => item.id === playerId);
    const rule = EXCHANGE_RULES[ruleKey];
    if (!player || !rule) return;

    if ((player.cards[rule.from] || 0) < rule.fromAmount) {
      ui.diceResult.textContent = `Недостаточно карточек для обмена: ${rule.label}.`;
      return;
    }

    player.cards[rule.from] -= rule.fromAmount;
    player.cards[rule.to] = (player.cards[rule.to] || 0) + rule.toAmount;
    pushHistory(`🔁 ${player.name}: обмен ${rule.label}.`);
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
      categoryKey: ui.cellCategoryInput.value,
      isStart: ui.cellStartInput.checked
    });

    if (ui.cellStartInput.checked) state.pawnIndex = state.cells.length - 1;
    ui.cellForm.reset();
    ui.cellCategoryInput.value = "purple";
    saveAndRender();
  });

  ui.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.tasks.push({
      id: crypto.randomUUID(),
      categoryKey: ui.taskCategorySelect.value,
      title: ui.taskTitleInput.value.trim(),
      description: ui.taskDescriptionInput.value.trim(),
      points: 1,
      image: ui.taskImageInput.value.trim(),
      audio: ui.taskAudioInput.value.trim()
    });

    ui.taskForm.reset();
    ui.taskCategorySelect.value = "purple";
    saveAndRender();
  });

  ui.penaltyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const penalty = ui.penaltyInput.value.trim();
    if (!penalty) return;
    state.penalties.push(penalty);
    ui.penaltyForm.reset();
    saveAndRender();
  });

  ui.rerollPenaltyBtn.addEventListener("click", () => {
    if (!state.awaitingTaskDecision) return;
    currentPenalty = getRandomPenalty();
    renderCurrentPenalty();
  });

  ui.categoriesForm.addEventListener("submit", (event) => {
    event.preventDefault();
    CATEGORY_KEYS.forEach((key) => {
      const nameInput = document.getElementById(`cat-name-${key}`);
      const colorInput = document.getElementById(`cat-color-${key}`);
      state.categories[key] = {
        name: nameInput?.value?.trim() || DEFAULT_CATEGORIES[key].name,
        color: normalizeColor(colorInput?.value || DEFAULT_CATEGORIES[key].color)
      };
    });
    saveAndRender();
  });

  ui.mediaSettingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.feedbackMedia = {
      success: {
        videos: parseLines(ui.successVideosInput.value),
        images: parseLines(ui.successImagesInput.value),
        sounds: parseLines(ui.successSoundsInput.value)
      },
      fail: {
        videos: parseLines(ui.failVideosInput.value),
        images: parseLines(ui.failImagesInput.value),
        sounds: parseLines(ui.failSoundsInput.value)
      }
    };
    state.gameplaySounds = {
      diceRollLoop: ui.diceRollLoopInput.value.trim(),
      pawnStep: ui.pawnStepInput.value.trim(),
      thinkingLoop: ui.thinkingLoopInput.value.trim()
    };
    saveAndRender();
  });

  ui.addSuccessVideosBtn.addEventListener("click", () => appendUploadedFiles(ui.successVideosUpload, ui.successVideosInput));
  ui.addSuccessImagesBtn.addEventListener("click", () => appendUploadedFiles(ui.successImagesUpload, ui.successImagesInput));
  ui.addSuccessSoundsBtn.addEventListener("click", () => appendUploadedFiles(ui.successSoundsUpload, ui.successSoundsInput));
  ui.addFailVideosBtn.addEventListener("click", () => appendUploadedFiles(ui.failVideosUpload, ui.failVideosInput));
  ui.addFailImagesBtn.addEventListener("click", () => appendUploadedFiles(ui.failImagesUpload, ui.failImagesInput));
  ui.addFailSoundsBtn.addEventListener("click", () => appendUploadedFiles(ui.failSoundsUpload, ui.failSoundsInput));

  ui.newGameBtn.addEventListener("click", () => {
    state.turn = 0;
    state.currentPlayerIndex = 0;
    state.players = state.players.map((player) => ({ ...player, cards: makeEmptyCards() }));
    state.stats = structuredClone(defaults.stats);
    state.history = [];
    state.awaitingTaskDecision = false;
    stopThinkingLoopSound();
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
    stopThinkingLoopSound();
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
  const player = getCurrentPlayer();
  ui.diceResult.textContent = `Выпало ${dice}. ${player?.name || "Игрок"} на ячейке «${cell.name}».`;
  pushHistory(`🎲 Ход ${state.turn} (${player?.name || "Игрок"}): выпало ${dice}, переход на «${cell.name}».`);

  currentTask = pickRandomTaskByCategory(cell.categoryKey);
  currentPenalty = getRandomPenalty();

  if (!currentTask) {
    stopThinkingLoopSound();
    ui.taskHint.textContent = "Для этой категории пока нет заданий. Добавьте их в админ-панели.";
    ui.taskTitle.textContent = "";
    ui.taskDescription.textContent = "";
    ui.taskActions.hidden = true;
    state.awaitingTaskDecision = false;
    advancePlayerTurn();
  } else {
    ui.taskHint.textContent = "Оцените результат выполнения задания:";
    ui.taskTitle.textContent = currentTask.title;
    ui.taskDescription.textContent = currentTask.description;
    ui.taskActions.hidden = false;
    renderCurrentPenalty();
    state.awaitingTaskDecision = true;
    startThinkingLoopSound();
  }

  applyTaskMedia(currentTask);
  renderBoard();
  renderStats();
  saveState();
}

function completeTask(success) {
  if (!currentTask || !state.awaitingTaskDecision) return;
  stopThinkingLoopSound();

  state.stats.completed += 1;

  if (success) {
    const player = getCurrentPlayer();
    const cardType = getCardTypeByTask(currentTask);
    if (player && cardType) {
      player.cards[cardType] = (player.cards[cardType] || 0) + 1;
      ui.taskHint.textContent = `Отлично! ${CARD_TYPES[cardType].icon} +1 карточка (${CARD_TYPES[cardType].label.toLowerCase()}).`;
      pushHistory(`✅ ${player.name}: «${currentTask.title}» выполнено. +1 ${CARD_TYPES[cardType].label.toLowerCase()} карточка.`);
    } else {
      ui.taskHint.textContent = "Отлично! Карточка получена.";
      pushHistory(`✅ «${currentTask.title}» выполнено.`);
    }
    state.stats.success += 1;
    state.stats.streak += 1;
    state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    showConfetti();
  } else {
    state.stats.fail += 1;
    state.stats.streak = 0;
    ui.taskHint.textContent = `Не выполнено. Штраф: ${currentPenalty}`;
    pushHistory(`❌ «${currentTask.title}» не выполнено. Штраф: ${currentPenalty}`);
    showPoopFx();
  }

  state.awaitingTaskDecision = false;
  ui.taskActions.hidden = true;
  advancePlayerTurn();
  renderStats();
  saveState();
  showFeedbackOverlay(success);
  checkWin();
}

function showFeedbackOverlay(success) {
  const mode = success ? "success" : "fail";
  const mediaSet = state.feedbackMedia?.[mode] || FEEDBACK_MEDIA[mode];
  const text = success
    ? "Классно! Так держать!"
    : `Не страшно. Следующее задание точно получится. ${currentPenalty || ""}`;

  ui.feedbackOverlay.hidden = false;
  ui.feedbackClose.onclick = closeFeedbackOverlay;
  ui.feedbackOverlay.classList.toggle("success", success);
  ui.feedbackOverlay.classList.toggle("fail", !success);
  ui.feedbackTitle.textContent = success ? "Успех!" : "Промах";
  ui.feedbackText.textContent = text;

  const visualMode = presentFeedbackVisual(mediaSet);
  if (visualMode === "video") {
    if (feedbackSound) {
      feedbackSound.pause();
      feedbackSound = null;
    }
  } else {
    playFeedbackSound(mediaSet.sounds, success);
  }

  if (feedbackCloseTimer) clearTimeout(feedbackCloseTimer);
  feedbackCloseTimer = setTimeout(closeFeedbackOverlay, 12000);
}

function presentFeedbackVisual(mediaSet) {
  const wantsImage = Math.random() > 0.45;
  const videoSrc = pickRandom(mediaSet.videos);
  const imageSrc = pickRandom(mediaSet.images);

  stopFeedbackVideoSound();
  ui.feedbackVideo.pause();
  ui.feedbackVideo.hidden = true;
  ui.feedbackImage.hidden = true;
  ui.feedbackVideo.removeAttribute("src");

  if (!wantsImage && videoSrc) {
    ui.feedbackVideo.src = videoSrc;
    ui.feedbackVideo.loop = true;
    ui.feedbackVideo.volume = 0;
    ui.feedbackVideo.muted = true;
    ui.feedbackVideo.currentTime = 0;
    ui.feedbackVideo.hidden = false;
    ui.feedbackVideo.play().then(() => {
      startFeedbackVideoOneShotSound(videoSrc);
    }).catch(() => {
      ui.feedbackVideo.hidden = true;
      showFeedbackImage(imageSrc);
    });
    return "video";
  }

  showFeedbackImage(imageSrc);
  return "image";
}

function showFeedbackImage(src) {
  if (!src) return;
  ui.feedbackImage.src = src;
  ui.feedbackImage.hidden = false;
}

async function startFeedbackVideoOneShotSound(videoSrc) {
  if (!state.soundEnabled || !videoSrc) return;
  stopFeedbackVideoSound();
  feedbackVideoSound = new Audio(videoSrc);
  feedbackVideoSound.volume = 0.55;
  try {
    await feedbackVideoSound.play();
  } catch {
    feedbackVideoSound = null;
  }
}

function stopFeedbackVideoSound() {
  if (!feedbackVideoSound) return;
  feedbackVideoSound.pause();
  feedbackVideoSound.currentTime = 0;
  feedbackVideoSound = null;
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
  stopFeedbackVideoSound();
}

function checkWin() {
  const winner = state.players.find((player) => hasWinCards(player.cards));
  if (!winner) return;
  if (state.pawnIndex !== getStartIndex()) return;
  ui.winText.textContent = `Победа ${winner.name}! Собран набор: 🟣1 🔴2 🔵3 🟢4. Ходов: ${state.turn}.`;
  ui.gameWinDialog.showModal();
}

function renderAll() {
  ensureStartCell();
  applyTheme();
  renderStats();
  renderBoard();
  renderLegend();
  renderAdminLists();
  renderHistory();
  renderCategorySelects();
  renderCategoriesEditor();
  renderPenaltiesList();
  renderMediaSettings();
  renderPlayers();
  renderPlayersAdmin();
  renderExchangePlayers();
  renderCurrentPenalty();
  applyTaskMedia(currentTask);
  ui.pawnShapeSelect.value = state.pawn?.shape || "circle";
  ui.soundToggleBtn.textContent = state.soundEnabled ? "🔊 Звук включён" : "🔇 Звук выключен";
  ui.themeToggleBtn.textContent = state.theme === "light" ? "🌙 Тёмная тема" : "☀️ Светлая тема";
}

function renderStats() {
  const currentPlayer = getCurrentPlayer();
  ui.scoreValue.textContent = currentPlayer ? countCards(currentPlayer.cards) : 0;
  ui.currentPlayerValue.textContent = currentPlayer?.name || "—";
  ui.turnValue.textContent = state.turn;

  const percent = currentPlayer ? getPlayerProgressPercent(currentPlayer.cards) : 0;
  ui.goalProgress.style.width = `${percent}%`;
  ui.goalProgressLabel.textContent = `${percent}% до победного набора`;

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
    const cat = state.categories?.[cell.categoryKey] || DEFAULT_CATEGORIES.purple;
    node.style.background = cat.color;
    node.title = `${cell.name}: ${cat.name}`;

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
  CATEGORY_KEYS.forEach((key, index) => {
    const category = state.categories?.[key] || DEFAULT_CATEGORIES[key];
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<i style="background:${category.color}"></i>${index + 1}. ${category.name}`;
    ui.categoryLegend.appendChild(item);
  });
}

function renderCategorySelects() {
  ui.cellCategoryInput.innerHTML = "";
  ui.taskCategorySelect.innerHTML = "";
  CATEGORY_KEYS.forEach((key, index) => {
    const category = state.categories?.[key] || DEFAULT_CATEGORIES[key];
    const text = `${index + 1}. ${category.name}`;
    const opt1 = document.createElement("option");
    opt1.value = key;
    opt1.textContent = text;
    const opt2 = opt1.cloneNode(true);
    ui.cellCategoryInput.appendChild(opt1);
    ui.taskCategorySelect.appendChild(opt2);
  });
  if (!ui.cellCategoryInput.value) ui.cellCategoryInput.value = "purple";
  if (!ui.taskCategorySelect.value) ui.taskCategorySelect.value = "purple";
}

function renderAdminLists() {
  ui.cellsList.innerHTML = "";
  state.cells.forEach((cell) => {
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.cellId = cell.id;
    const category = state.categories?.[cell.categoryKey] || DEFAULT_CATEGORIES.purple;
    li.textContent = `${cell.name} (${category.name})${cell.isStart ? " — СТАРТ" : ""}`;
    li.addEventListener("dragstart", () => (draggingCellId = cell.id));
    li.addEventListener("dragover", (event) => event.preventDefault());
    li.addEventListener("drop", () => reorderCells(draggingCellId, cell.id));
    ui.cellsList.appendChild(li);
  });

  ui.tasksList.innerHTML = "";
  state.tasks.forEach((task, idx) => {
    const li = document.createElement("li");
    const category = state.categories?.[task.categoryKey] || DEFAULT_CATEGORIES.purple;
    li.textContent = `[${category.name}] ${task.title} • +${task.points} карточка`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "button ghost";
    btn.textContent = "Удалить";
    btn.addEventListener("click", () => {
      state.tasks.splice(idx, 1);
      saveAndRender();
    });
    li.appendChild(document.createTextNode(" "));
    li.appendChild(btn);
    ui.tasksList.appendChild(li);
  });
}

function renderPlayers() {
  ui.playersPanel.innerHTML = "";
  state.players.forEach((player, index) => {
    const card = document.createElement("article");
    card.className = "player-card";
    if (index === state.currentPlayerIndex) card.classList.add("active");

    const cards = player.cards || makeEmptyCards();
    card.innerHTML = `
      <h3>${player.name}</h3>
      <p>${renderCardStatus(cards)}</p>
    `;
    ui.playersPanel.appendChild(card);
  });
}

function renderPlayersAdmin() {
  ui.playersAdminList.innerHTML = "";
  state.players.forEach((player, index) => {
    const li = document.createElement("li");
    const activeMark = index === state.currentPlayerIndex ? " • текущий" : "";
    li.textContent = `${player.name}${activeMark} — ${renderCardStatus(player.cards || makeEmptyCards())}`;
    ui.playersAdminList.appendChild(li);
  });
}

function renderExchangePlayers() {
  ui.exchangePlayerSelect.innerHTML = "";
  state.players.forEach((player) => {
    const option = document.createElement("option");
    option.value = player.id;
    option.textContent = player.name;
    ui.exchangePlayerSelect.appendChild(option);
  });
}

function renderCardStatus(cards) {
  return `${CARD_TYPES.purple.icon}${cards.purple || 0}/${WIN_TARGET.purple} · ${CARD_TYPES.red.icon}${cards.red || 0}/${WIN_TARGET.red} · ${CARD_TYPES.blue.icon}${cards.blue || 0}/${WIN_TARGET.blue} · ${CARD_TYPES.green.icon}${cards.green || 0}/${WIN_TARGET.green}`;
}

function getCurrentPlayer() {
  if (!state.players.length) return null;
  state.currentPlayerIndex = clamp(state.currentPlayerIndex || 0, 0, state.players.length - 1);
  return state.players[state.currentPlayerIndex] || null;
}

function advancePlayerTurn() {
  if (!state.players.length) return;
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
}

function getCardTypeByTask(task) {
  return task?.categoryKey || "purple";
}

function makeEmptyCards() {
  return { purple: 0, red: 0, blue: 0, green: 0 };
}

function hasWinCards(cards) {
  return ["purple", "red", "blue", "green"].every((key) => (cards?.[key] || 0) >= WIN_TARGET[key]);
}

function countCards(cards) {
  return (cards?.purple || 0) + (cards?.red || 0) + (cards?.blue || 0) + (cards?.green || 0);
}

function getPlayerProgressPercent(cards) {
  const totalNeed = WIN_TARGET.purple + WIN_TARGET.red + WIN_TARGET.blue + WIN_TARGET.green;
  const sum = Math.min(cards.purple || 0, WIN_TARGET.purple)
    + Math.min(cards.red || 0, WIN_TARGET.red)
    + Math.min(cards.blue || 0, WIN_TARGET.blue)
    + Math.min(cards.green || 0, WIN_TARGET.green);
  return clamp(Math.round((sum / totalNeed) * 100), 0, 100);
}

async function animateDiceRoll(finalValue) {
  startDiceRollLoopSound();
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
  stopDiceRollLoopSound();
}

async function animatePawnRoute(route) {
  for (const nextIndex of route) {
    playSoundEffect(state.gameplaySounds?.pawnStep, 0.35);
    state.pawnIndex = nextIndex;
    renderBoard();
    await wait(240);
  }
}

function startDiceRollLoopSound() {
  if (!state.soundEnabled || !state.gameplaySounds?.diceRollLoop) return;
  if (!diceRollLoopSound) {
    diceRollLoopSound = new Audio(state.gameplaySounds?.diceRollLoop);
    diceRollLoopSound.loop = true;
    diceRollLoopSound.volume = 0.35;
  }

  diceRollLoopSound.currentTime = 0;
  diceRollLoopSound.play().catch(() => {
    diceRollLoopSound = null;
  });
}

function stopDiceRollLoopSound() {
  if (!diceRollLoopSound) return;
  diceRollLoopSound.pause();
  diceRollLoopSound.currentTime = 0;
}

function playSoundEffect(src, volume = 0.4) {
  if (!state.soundEnabled || !src) return;
  const sound = new Audio(src);
  sound.volume = volume;
  sound.play().catch(() => {
    sound.remove();
  });
}

function startThinkingLoopSound() {
  if (!state.soundEnabled || !state.gameplaySounds?.thinkingLoop) return;
  if (!thinkingLoopSound) {
    thinkingLoopSound = new Audio(state.gameplaySounds?.thinkingLoop);
    thinkingLoopSound.loop = true;
    thinkingLoopSound.volume = 0.28;
  }

  thinkingLoopSound.currentTime = 0;
  thinkingLoopSound.play().catch(() => {
    thinkingLoopSound = null;
  });
}

function stopThinkingLoopSound() {
  if (!thinkingLoopSound) return;
  thinkingLoopSound.pause();
  thinkingLoopSound.currentTime = 0;
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
  if (!state.soundEnabled) {
    stopDiceRollLoopSound();
    stopThinkingLoopSound();
    stopFeedbackVideoSound();
  } else if (state.awaitingTaskDecision) {
    startThinkingLoopSound();
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
    stopThinkingLoopSound();
    if (state.awaitingTaskDecision) startThinkingLoopSound();
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




function pickRandomTaskByCategory(categoryKey) {
  const categoryTasks = state.tasks.filter((task) => task.categoryKey === categoryKey);
  return pickRandom(categoryTasks) || null;
}

function getRandomPenalty() {
  return pickRandom(state.penalties) || "Без штрафа";
}

function renderCurrentPenalty() {
  const shouldShow = Boolean(state.awaitingTaskDecision && currentTask);
  ui.taskPenaltyPreview.hidden = !shouldShow;
  if (shouldShow) {
    ui.taskPenaltyPreview.textContent = `Случайный штраф: ${currentPenalty || "—"}`;
  }
}

function renderPenaltiesList() {
  ui.penaltiesList.innerHTML = "";
  state.penalties.forEach((penalty, idx) => {
    const li = document.createElement("li");
    li.textContent = penalty;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "button ghost";
    btn.textContent = "Удалить";
    btn.addEventListener("click", () => {
      state.penalties.splice(idx, 1);
      saveAndRender();
    });
    li.appendChild(document.createTextNode(" "));
    li.appendChild(btn);
    ui.penaltiesList.appendChild(li);
  });
}

function renderCategoriesEditor() {
  ui.categoriesEditor.innerHTML = "";
  CATEGORY_KEYS.forEach((key, index) => {
    const category = state.categories?.[key] || DEFAULT_CATEGORIES[key];
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <label>${index + 1}. Название
        <input type="text" id="cat-name-${key}" value="${category.name}" required />
      </label>
      <label>Цвет
        <input type="color" id="cat-color-${key}" value="${category.color}" required />
      </label>
    `;
    ui.categoriesEditor.appendChild(wrap);
  });
}

function renderMediaSettings() {
  const fm = state.feedbackMedia || FEEDBACK_MEDIA;
  ui.successVideosInput.value = (fm.success?.videos || []).join("\n");
  ui.successImagesInput.value = (fm.success?.images || []).join("\n");
  ui.successSoundsInput.value = (fm.success?.sounds || []).join("\n");
  ui.failVideosInput.value = (fm.fail?.videos || []).join("\n");
  ui.failImagesInput.value = (fm.fail?.images || []).join("\n");
  ui.failSoundsInput.value = (fm.fail?.sounds || []).join("\n");

  ui.diceRollLoopInput.value = state.gameplaySounds?.diceRollLoop || "";
  ui.pawnStepInput.value = state.gameplaySounds?.pawnStep || "";
  ui.thinkingLoopInput.value = state.gameplaySounds?.thinkingLoop || "";
}

function parseLines(text) {
  return String(text || "").split("\n").map((line) => line.trim()).filter(Boolean);
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

async function appendUploadedFiles(fileInput, targetTextarea) {
  const files = Array.from(fileInput?.files || []);
  if (!files.length || !targetTextarea) return;

  const encoded = await Promise.all(files.map((file) => toDataUri(file)));
  const existing = parseLines(targetTextarea.value);
  targetTextarea.value = [...existing, ...encoded].join("\n");
  fileInput.value = "";
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
  const sanitizedPlayers = Array.isArray(parsed?.players) && parsed.players.length
    ? parsed.players.map((player, index) => ({
        id: player?.id || crypto.randomUUID(),
        name: player?.name || `Игрок ${index + 1}`,
        cards: { ...makeEmptyCards(), ...player?.cards }
      }))
    : structuredClone(defaults.players);

  const categories = { ...structuredClone(DEFAULT_CATEGORIES), ...(parsed?.categories || {}) };
  const cells = (parsed?.cells?.length ? parsed.cells : structuredClone(defaults.cells)).map((cell, idx) => {
    const fromLegacyColor = Object.entries(categories).find(([, c]) => normalizeColor(c.color) === normalizeColor(cell?.color || ""))?.[0];
    return {
      id: cell?.id || crypto.randomUUID(),
      name: cell?.name || `Ячейка ${idx + 1}`,
      categoryKey: cell?.categoryKey || fromLegacyColor || CATEGORY_KEYS[(Math.max(1, Number(cell?.category || 1)) - 1) % 4],
      isStart: Boolean(cell?.isStart)
    };
  });

  const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks.map((task) => {
    const fromLegacyColor = Object.entries(categories).find(([, c]) => normalizeColor(c.color) === normalizeColor(task?.color || ""))?.[0];
    return {
      id: task?.id || crypto.randomUUID(),
      categoryKey: task?.categoryKey || fromLegacyColor || "purple",
      title: task?.title || "Без названия",
      description: task?.description || "",
      points: 1,
      image: task?.image || "",
      audio: task?.audio || ""
    };
  }) : structuredClone(defaults.tasks);

  const penalties = Array.isArray(parsed?.penalties)
    ? parsed.penalties.filter(Boolean)
    : (Array.isArray(parsed?.tasks) ? parsed.tasks.map((t) => t?.penalty).filter(Boolean) : structuredClone(defaults.penalties));

  return {
    ...structuredClone(defaults),
    ...parsed,
    categories,
    penalties,
    feedbackMedia: { ...structuredClone(FEEDBACK_MEDIA), ...(parsed?.feedbackMedia || {}) },
    gameplaySounds: { ...structuredClone(GAMEPLAY_SOUNDS), ...(parsed?.gameplaySounds || {}) },
    players: sanitizedPlayers,
    currentPlayerIndex: clamp(parsed?.currentPlayerIndex ?? 0, 0, Math.max(0, sanitizedPlayers.length - 1)),
    pawn: { ...structuredClone(defaults.pawn), ...parsed?.pawn },
    stats: { ...structuredClone(defaults.stats), ...parsed?.stats },
    cells,
    tasks,
    history: Array.isArray(parsed?.history) ? parsed.history.slice(0, 14) : []
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
