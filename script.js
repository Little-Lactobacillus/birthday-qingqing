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
const clueLog = document.querySelector("#clueLog");
const decoderPanel = document.querySelector("#decoderPanel");
const codeInputs = [...document.querySelectorAll("#codeInputs input")];
const resetPuzzle = document.querySelector("#resetPuzzle");
const undoDigit = document.querySelector("#undoDigit");
const unlockButton = document.querySelector("#unlockButton");
const puzzleMessage = document.querySelector("#puzzleMessage");
const backToPuzzle = document.querySelector("#backToPuzzle");
const backToCover = document.querySelector("#backToCover");
const toast = document.querySelector("#toast");
const handwrittenImage = document.querySelector("#handwrittenImage");
const letterLightbox = document.querySelector("#letterLightbox");
const lightboxClose = document.querySelector("#lightboxClose");

const password = "0526";
const foundClues = new Set();
const clueTexts = [
  "邮戳压着一张小纸条：圆月、午风、耳语、柳枝。顺序就按纸条从左到右。",
  "星光偏要捉迷藏：第一个信物别听声音，只看形状~。",
  "丝带轻轻晃：后面三个信物别看形，读一读声音，午、耳、柳会露出数字。",
  "纸角把答案折起来：把四个信物换成阿拉伯数字，连起来就是开信口令。"
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
    ? "线索齐了。读纸条上的四个信物，写成四位口令。"
    : `已经找到 ${count} / 4 个线索。点过的线索会留在这里。`;

  if (clueLog) {
    const entries = [...foundClues].sort((a, b) => a - b);
    if (entries.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.textContent = "请寻找：邮戳，星光，丝带，纸角。";
      clueLog.replaceChildren(emptyItem);
    } else {
      const clueItems = entries.map((index) => {
        const item = document.createElement("li");
        item.textContent = clueTexts[index];
        return item;
      });
      clueLog.replaceChildren(...clueItems);
    }
  }

  decoderPanel.classList.toggle("is-locked", !ready);
  codeInputs.forEach((input) => {
    input.disabled = !ready;
  });
  unlockButton.disabled = !ready;
  updateInputActions();

  if (ready && getAttempt().length === 0) {
    puzzleMessage.textContent = "四个信物都在纸条上了。第一个看形，后面三个听音。";
  }
}

function getAttempt() {
  return codeInputs.map((input) => input.value).join("");
}

function updateInputActions() {
  const hasInput = codeInputs.some((input) => input.value);
  const locked = foundClues.size < clueTexts.length;
  undoDigit.disabled = locked || !hasInput;
  resetPuzzle.disabled = locked || !hasInput;
}

function collectClue(button) {
  const index = Number(button.dataset.clue);
  const isNewClue = !foundClues.has(index);
  if (button.classList.contains("gift-clue")) {
    button.classList.remove("is-bursting");
    void button.offsetWidth;
    button.classList.add("is-bursting");
  }

  if (isNewClue) {
    foundClues.add(index);
    button.classList.add("is-found");
    updateClues();
  }

  showToast(clueTexts[index]);
}

function handleCodeInput(input, index) {
  if (foundClues.size < clueTexts.length) {
    input.value = "";
    showToast("先把四个线索找齐，口令格才会醒。");
    return;
  }

  input.value = input.value.replace(/\D/g, "").slice(-1);
  updateInputActions();

  puzzleMessage.textContent =
    getAttempt().length === 4
      ? "四位口令写好了。想想：圆的形、午耳柳的声音。"
      : "继续写下一位口令。";

  if (input.value && codeInputs[index + 1]) {
    codeInputs[index + 1].focus();
  }
}

function clearInputs() {
  codeInputs.forEach((input) => {
    input.value = "";
  });
  puzzleMessage.textContent = "重新写一次。第一个看形，后面三个听音。";
  updateInputActions();
  codeInputs[0]?.focus();
}

function removeLastInput() {
  let lastFilled = -1;
  for (let index = codeInputs.length - 1; index >= 0; index -= 1) {
    if (codeInputs[index].value) {
      lastFilled = index;
      break;
    }
  }

  if (lastFilled < 0) {
    return;
  }

  codeInputs[lastFilled].value = "";
  codeInputs[lastFilled].focus();
  puzzleMessage.textContent = "退回一格。再读读纸条上的信物。";
  updateInputActions();
}

function unlockFinalLetter() {
  if (foundClues.size < clueTexts.length) {
    puzzleMessage.textContent = "线索还没齐，邮戳暂时打不开。";
    showToast("先把四个小线索都找出来。");
    return;
  }

  const attempt = getAttempt();
  if (attempt.length < 4) {
    puzzleMessage.textContent = "口令还缺数字。";
    return;
  }

  if (attempt !== password) {
    puzzleMessage.textContent = "还没对。圆月看形，午风、耳语、柳枝听声音。";
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

function openLetterLightbox() {
  if (!letterLightbox) {
    return;
  }

  letterLightbox.hidden = false;
  document.body.classList.add("has-lightbox");
  lightboxClose?.focus();
}

function closeLetterLightbox() {
  if (!letterLightbox) {
    return;
  }

  letterLightbox.hidden = true;
  document.body.classList.remove("has-lightbox");
  handwrittenImage?.focus();
}

openEnvelope.addEventListener("click", openLetter);
backButton.addEventListener("click", handleBack);
musicPlayer.addEventListener("click", toggleMusic);
backToPuzzle.addEventListener("click", () => setScreen("story"));
backToCover.addEventListener("click", () => setScreen("cover"));

clueButtons.forEach((button) => {
  button.addEventListener("click", () => collectClue(button));
});

codeInputs.forEach((input, index) => {
  input.addEventListener("input", () => handleCodeInput(input, index));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && !input.value && codeInputs[index - 1]) {
      codeInputs[index - 1].focus();
    }
    if (event.key === "Enter") {
      unlockFinalLetter();
    }
  });
  input.addEventListener("paste", (event) => {
    event.preventDefault();
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    digits.split("").forEach((digit, offset) => {
      if (codeInputs[index + offset]) {
        codeInputs[index + offset].value = digit;
      }
    });
    updateInputActions();
    puzzleMessage.textContent =
      getAttempt().length === 4 ? "四位口令写好了。按下打开生日信试试。" : "继续写下一位口令。";
  });
});

resetPuzzle.addEventListener("click", clearInputs);
undoDigit.addEventListener("click", removeLastInput);
unlockButton.addEventListener("click", unlockFinalLetter);

if (handwrittenImage) {
  handwrittenImage.addEventListener("click", openLetterLightbox);
  handwrittenImage.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLetterLightbox();
    }
  });
  handwrittenImage.addEventListener("error", () => {
    handwrittenImage.hidden = true;
  });
}

lightboxClose?.addEventListener("click", closeLetterLightbox);
letterLightbox?.addEventListener("click", (event) => {
  if (event.target === letterLightbox) {
    closeLetterLightbox();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && letterLightbox && !letterLightbox.hidden) {
    closeLetterLightbox();
  }
});

updateMusicUi();
updateClues();
updateInputActions();
