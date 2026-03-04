const STORAGE_KEY = "chip-quest-state";

const defaultCells = [
  {
    id: crypto.randomUUID(),
    name: "Старт / Финиш",
    task: "Разомнитесь: сделайте 5 приседаний.",
    points: 2,
    penalty: 1,
    image: "",
    audio: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Лес",
    task: "Назовите 3 дерева.",
    points: 3,
    penalty: 1,
    image: "",
    audio: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Река",
    task: "Скажите скороговорку без ошибок.",
    points: 4,
    penalty: 2,
    image: "",
    audio: "",
  },
];

const state = {
  targetScore: 20,
  cells: defaultCells,
  game: {
    position: 0,
    score: 0,
    pendingCellId: null,
    finished: false,
  },
};

const refs = {
  board: document.getElementById("board"),
  position: document.getElementById("position"),
  score: document.getElementById("score"),
  targetScore: document.getElementById("targetScore"),
  diceResult: document.getElementById("diceResult"),
  gameStatus: document.getElementById("gameStatus"),
  taskCard: document.getElementById("taskCard"),
  taskTitle: document.getElementById("taskTitle"),
  taskText: document.getElementById("taskText"),
  taskImage: document.getElementById("taskImage"),
  taskAudio: document.getElementById("taskAudio"),
  penaltyInfo: document.getElementById("penaltyInfo"),
  rollDiceBtn: document.getElementById("rollDiceBtn"),
  completeTaskBtn: document.getElementById("completeTaskBtn"),
  failTaskBtn: document.getElementById("failTaskBtn"),
  resetGameBtn: document.getElementById("resetGameBtn"),
  targetScoreInput: document.getElementById("targetScoreInput"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  cellNameInput: document.getElementById("cellNameInput"),
  taskInput: document.getElementById("taskInput"),
  pointsInput: document.getElementById("pointsInput"),
  penaltyInput: document.getElementById("penaltyInput"),
  imageInput: document.getElementById("imageInput"),
  audioInput: document.getElementById("audioInput"),
  addCellBtn: document.getElementById("addCellBtn"),
  updateCellBtn: document.getElementById("updateCellBtn"),
  deleteCellBtn: document.getElementById("deleteCellBtn"),
  cellSelect: document.getElementById("cellSelect"),
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed.cells) && parsed.cells.length > 0) {
      state.cells = parsed.cells;
    }
    if (typeof parsed.targetScore === "number" && parsed.targetScore > 0) {
      state.targetScore = parsed.targetScore;
    }
    if (parsed.game) {
      state.game = {
        ...state.game,
        ...parsed.game,
        pendingCellId: null,
      };
    }
  } catch {
    console.warn("Не удалось прочитать сохранение");
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ targetScore: state.targetScore, cells: state.cells, game: state.game }),
  );
}

function renderBoard() {
  refs.board.innerHTML = "";
  state.cells.forEach((cell, index) => {
    const item = document.createElement("div");
    item.className = "cell";
    if (index === state.game.position) item.classList.add("active");
    item.innerHTML = `<div class="index">#${index}</div><strong>${cell.name}</strong><p>${cell.task}</p>`;
    refs.board.appendChild(item);
  });
}

function renderStats() {
  refs.position.textContent = String(state.game.position);
  refs.score.textContent = String(state.game.score);
  refs.targetScore.textContent = String(state.targetScore);
  refs.targetScoreInput.value = String(state.targetScore);
}

function renderCellSelect() {
  refs.cellSelect.innerHTML = "";
  state.cells.forEach((cell, index) => {
    const option = document.createElement("option");
    option.value = cell.id;
    option.textContent = `${index}: ${cell.name}`;
    refs.cellSelect.appendChild(option);
  });
  if (state.cells[0]) {
    refs.cellSelect.value = state.cells[0].id;
    fillAdminForm(state.cells[0]);
  }
}

function fillAdminForm(cell) {
  refs.cellNameInput.value = cell.name;
  refs.taskInput.value = cell.task;
  refs.pointsInput.value = cell.points;
  refs.penaltyInput.value = cell.penalty;
}

function showTask(cell) {
  refs.taskCard.classList.remove("hidden");
  refs.taskTitle.textContent = `${cell.name}`;
  refs.taskText.textContent = cell.task;
  refs.penaltyInfo.textContent = `Штраф при провале: ${cell.penalty} очк.`;

  if (cell.image) {
    refs.taskImage.src = cell.image;
    refs.taskImage.classList.remove("hidden");
  } else {
    refs.taskImage.classList.add("hidden");
  }

  if (cell.audio) {
    refs.taskAudio.src = cell.audio;
    refs.taskAudio.classList.remove("hidden");
  } else {
    refs.taskAudio.classList.add("hidden");
  }
}

function maybeFinishGame() {
  if (state.game.score >= state.targetScore && state.game.position === 0) {
    state.game.finished = true;
    refs.gameStatus.textContent = "Победа! Вы набрали нужные очки и финишировали на старте.";
    refs.rollDiceBtn.disabled = true;
    return true;
  }
  return false;
}

function onRollDice() {
  if (state.game.pendingCellId || state.game.finished || state.cells.length === 0) return;

  const dice = Math.floor(Math.random() * 6) + 1;
  state.game.position = (state.game.position + dice) % state.cells.length;
  const landed = state.cells[state.game.position];
  state.game.pendingCellId = landed.id;

  refs.diceResult.textContent = `Выпало ${dice}. Вы на клетке: ${landed.name}`;
  refs.gameStatus.textContent = "Выполните или провалите задание, чтобы продолжить.";

  showTask(landed);
  renderBoard();
  renderStats();
  saveState();
}

function resolveTask(isSuccess) {
  if (!state.game.pendingCellId) return;

  const cell = state.cells.find((item) => item.id === state.game.pendingCellId);
  if (!cell) return;

  if (isSuccess) {
    state.game.score += Number(cell.points) || 0;
    refs.gameStatus.textContent = `Задание выполнено! +${cell.points} очков.`;
  } else {
    state.game.score = Math.max(0, state.game.score - (Number(cell.penalty) || 0));
    refs.gameStatus.textContent = `Задание провалено. Штраф: -${cell.penalty} очков.`;
  }

  state.game.pendingCellId = null;
  refs.taskCard.classList.add("hidden");

  if (!maybeFinishGame()) {
    refs.rollDiceBtn.disabled = false;
  }

  renderStats();
  saveState();
}

function resetGame() {
  state.game = {
    position: 0,
    score: 0,
    pendingCellId: null,
    finished: false,
  };
  refs.rollDiceBtn.disabled = false;
  refs.taskCard.classList.add("hidden");
  refs.diceResult.textContent = "Игра сброшена. Бросайте кубик.";
  refs.gameStatus.textContent = "";
  renderBoard();
  renderStats();
  saveState();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Ошибка чтения файла"));
    reader.readAsDataURL(file);
  });
}

async function createCellFromForm(existingId = null) {
  const name = refs.cellNameInput.value.trim() || "Без названия";
  const task = refs.taskInput.value.trim() || "Задание не указано";
  const points = Math.max(0, Number(refs.pointsInput.value) || 0);
  const penalty = Math.max(0, Number(refs.penaltyInput.value) || 0);

  const imageFile = refs.imageInput.files[0];
  const audioFile = refs.audioInput.files[0];

  const existing = state.cells.find((cell) => cell.id === existingId);
  const image = imageFile ? await readFileAsDataUrl(imageFile) : existing?.image || "";
  const audio = audioFile ? await readFileAsDataUrl(audioFile) : existing?.audio || "";

  return {
    id: existingId || crypto.randomUUID(),
    name,
    task,
    points,
    penalty,
    image,
    audio,
  };
}

refs.rollDiceBtn.addEventListener("click", onRollDice);
refs.completeTaskBtn.addEventListener("click", () => resolveTask(true));
refs.failTaskBtn.addEventListener("click", () => resolveTask(false));
refs.resetGameBtn.addEventListener("click", resetGame);

refs.saveSettingsBtn.addEventListener("click", () => {
  state.targetScore = Math.max(1, Number(refs.targetScoreInput.value) || 1);
  renderStats();
  saveState();
});

refs.cellSelect.addEventListener("change", () => {
  const selected = state.cells.find((cell) => cell.id === refs.cellSelect.value);
  if (selected) fillAdminForm(selected);
});

refs.addCellBtn.addEventListener("click", async () => {
  const cell = await createCellFromForm();
  state.cells.push(cell);
  renderBoard();
  renderCellSelect();
  saveState();
});

refs.updateCellBtn.addEventListener("click", async () => {
  const id = refs.cellSelect.value;
  if (!id) return;
  const idx = state.cells.findIndex((cell) => cell.id === id);
  if (idx < 0) return;

  state.cells[idx] = await createCellFromForm(id);
  renderBoard();
  renderCellSelect();
  refs.cellSelect.value = id;
  saveState();
});

refs.deleteCellBtn.addEventListener("click", () => {
  if (state.cells.length <= 1) {
    alert("Нельзя удалить последнюю клетку.");
    return;
  }

  const id = refs.cellSelect.value;
  const idx = state.cells.findIndex((cell) => cell.id === id);
  if (idx < 0) return;

  state.cells.splice(idx, 1);
  state.game.position = state.game.position % state.cells.length;
  state.game.pendingCellId = null;
  refs.taskCard.classList.add("hidden");
  renderBoard();
  renderCellSelect();
  renderStats();
  saveState();
});

loadState();
renderBoard();
renderStats();
renderCellSelect();
refs.rollDiceBtn.disabled = false;
