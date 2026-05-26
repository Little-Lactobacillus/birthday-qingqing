const screens = {
  cover: document.querySelector("#coverScreen"),
  story: document.querySelector("#storyScreen"),
  final: document.querySelector("#finalScreen")
};

const openEnvelope = document.querySelector("#openEnvelope");
const backButton = document.querySelector("#backButton");
const musicPlayer = document.querySelector("#musicPlayer");
const playerCopy = document.querySelector("#playerCopy");
const birthdayAudio = document.querySelector("#birthdayAudio");
const clueButtons = [...document.querySelectorAll(".clue")];
const clueMeter = [...document.querySelectorAll("#clueMeter span")];
const progressCopy = document.querySelector("#progressCopy");
const decoderPanel = document.querySelector("#decoderPanel");
const digitButtons = [...document.querySelectorAll("#digitTray button")];
const answerSlots = [...document.querySelectorAll("#answerSlots span")];
const resetPuzzle = document.querySelector("#resetPuzzle");
const undoDigit = document.querySelector("#undoDigit");
const unlockButton = document.querySelector("#unlockButton");
const puzzleMessage = document.querySelector("#puzzleMessage");
const backToPuzzle = document.querySelector("#backToPuzzle");
const backToCover = document.querySelector("#backToCover");
const toast = document.querySelector("#toast");
const handwrittenImage = document.querySelector("#handwrittenImage");

const password = "0526";
const foundClues = new Set();
const selectedDigits = [];
const clueTexts = [
  "邮戳轻轻提醒：只收月和日，不收年份。",
  "星光眨了一下：第五个月写在纸上，要补成两位。",
  "丝带打了个结：日子是二十六，不是二和六的加法。",
  "纸角露出一点点：月在前，日在后，像信封上的日期。"
];

let currentScreen = "cover";
let toastTimer;
let openingTimer;
let wantsMusic = true;

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}

function setScreen(name) {
  currentScreen = name;
  Object.entries(screens).forEach(([screenName, screen]) => {
    screen.classList.toggle("is-active", screenName === name);
  });

  backButton.hidden = name === "cover";
  backButton.textContent = name === "final" ? "返回解谜" : "返回信封";
  if (name === "final") {
    window.clearTimeout(toastTimer);
    toast.classList.remove("is-visible");
  }
  window.scrollTo(0, 0);
}

function updateMusicUi() {
  const playing = wantsMusic;
  musicPlayer.classList.toggle("is-playing", playing);
  musicPlayer.classList.toggle("is-muted", !playing);
  musicPlayer.setAttribute("aria-pressed", String(!playing));
  musicPlayer.setAttribute(
    "aria-label",
    playing ? "播放中，点击静音" : "已静音，点击播放"
  );
  musicPlayer.title = playing ? "播放中，点击静音" : "已静音，点击播放";
  playerCopy.textContent = playing ? "播放中，点击静音" : "已静音，点击播放";
}

function playMusic() {
  if (!birthdayAudio || !wantsMusic) {
    return;
  }

  birthdayAudio.volume = 0.56;
  birthdayAudio.muted = false;
  birthdayAudio.play().catch(() => {
    // Browsers may block autoplay until the first deliberate interaction.
  });
}

function pauseMusic() {
  if (birthdayAudio) {
    birthdayAudio.pause();
  }
}

function toggleMusic() {
  wantsMusic = !wantsMusic;
  if (wantsMusic) {
    playMusic();
  } else {
    pauseMusic();
  }
  updateMusicUi();
}

function updateClues() {
  clueMeter.forEach((item, index) => {
    item.classList.toggle("is-found", foundClues.has(index));
  });

  const count = foundClues.size;
  const ready = count === clueTexts.length;
  progressCopy.textContent = ready
    ? "线索齐了。现在把数字片排成邮戳日期。"
    : `已经找到 ${count} / 4 个线索。线索要合起来看。`;

  decoderPanel.classList.toggle("is-locked", !ready);
  digitButtons.forEach((button) => {
    button.disabled = !ready;
  });
  unlockButton.disabled = !ready;
  undoDigit.disabled = !ready || selectedDigits.length === 0;
  resetPuzzle.disabled = !ready || selectedDigits.length === 0;

  if (ready && selectedDigits.length === 0) {
    puzzleMessage.textContent = "四块数字片都能用了。顺序像日期，不像算式。";
  }
}

function updateSlots() {
  answerSlots.forEach((slot, index) => {
    slot.textContent = selectedDigits[index] || "";
    slot.classList.toggle("is-filled", Boolean(selectedDigits[index]));
  });

  digitButtons.forEach((button) => {
    const digit = button.dataset.digit;
    const usedCount = selectedDigits.filter((value) => value === digit).length;
    const availableCount = digitButtons.filter((item) => item.dataset.digit === digit).length;
    button.disabled = foundClues.size < clueTexts.length || usedCount >= availableCount;
  });

  undoDigit.disabled = foundClues.size < clueTexts.length || selectedDigits.length === 0;
  resetPuzzle.disabled = foundClues.size < clueTexts.length || selectedDigits.length === 0;
}

function collectClue(button) {
  const index = Number(button.dataset.clue);
  if (foundClues.has(index)) {
    showToast("这个线索已经收好了。");
    return;
  }

  foundClues.add(index);
  button.classList.add("is-found");
  showToast(clueTexts[index]);
  updateClues();
  updateSlots();
}

function addDigit(button) {
  if (foundClues.size < clueTexts.length) {
    showToast("先把四个线索找齐，数字片才会醒。");
    return;
  }

  if (selectedDigits.length >= 4) {
    puzzleMessage.textContent = "四格已经满了。可以退一格或重排。";
    return;
  }

  selectedDigits.push(button.dataset.digit);
  puzzleMessage.textContent =
    selectedDigits.length === 4
      ? "邮戳已经拼好了。看看它像不像一个日期。"
      : "继续放下一块数字片。";
  updateSlots();
}

function clearDigits() {
  selectedDigits.splice(0, selectedDigits.length);
  puzzleMessage.textContent = "重新排一次。线索说：月在前，日在后。";
  updateSlots();
  updateClues();
}

function removeLastDigit() {
  selectedDigits.pop();
  puzzleMessage.textContent = "退回一格。再想想日期的写法。";
  updateSlots();
  updateClues();
}

function unlockFinalLetter() {
  if (foundClues.size < clueTexts.length) {
    puzzleMessage.textContent = "线索还没齐，邮戳暂时打不开。";
    showToast("先把四个小线索都找出来。");
    return;
  }

  if (selectedDigits.length < 4) {
    puzzleMessage.textContent = "邮戳还缺数字片。";
    return;
  }

  const attempt = selectedDigits.join("");
  if (attempt !== password) {
    puzzleMessage.textContent = "还没对。顺序像日期，不像算式。";
    return;
  }

  puzzleMessage.textContent = "邮戳亮起来了，生日信打开。";
  setScreen("final");
}

function openLetter() {
  if (openEnvelope.classList.contains("is-opening")) {
    return;
  }

  playMusic();
  openEnvelope.classList.add("is-opening");
  window.clearTimeout(openingTimer);
  openingTimer = window.setTimeout(() => {
    openEnvelope.classList.remove("is-opening");
    setScreen("story");
  }, 1050);
}

function handleBack() {
  if (currentScreen === "final") {
    setScreen("story");
    return;
  }
  if (currentScreen === "story") {
    setScreen("cover");
  }
}

openEnvelope.addEventListener("click", openLetter);
backButton.addEventListener("click", handleBack);
musicPlayer.addEventListener("click", toggleMusic);
backToPuzzle.addEventListener("click", () => setScreen("story"));
backToCover.addEventListener("click", () => setScreen("cover"));

clueButtons.forEach((button) => {
  button.addEventListener("click", () => collectClue(button));
});

digitButtons.forEach((button) => {
  button.addEventListener("click", () => addDigit(button));
});

resetPuzzle.addEventListener("click", clearDigits);
undoDigit.addEventListener("click", removeLastDigit);
unlockButton.addEventListener("click", unlockFinalLetter);

if (handwrittenImage) {
  handwrittenImage.addEventListener("load", () => {
    const isPlaceholder =
      handwrittenImage.naturalWidth <= 4 || handwrittenImage.naturalHeight <= 4;
    handwrittenImage.hidden = isPlaceholder;
  });
  handwrittenImage.addEventListener("error", () => {
    handwrittenImage.hidden = true;
  });
  handwrittenImage.src = "assets/handwritten-letter.jpg";
}

updateMusicUi();
updateClues();
updateSlots();
