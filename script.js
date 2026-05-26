const coverScreen = document.querySelector("#coverScreen");
const storyScreen = document.querySelector("#storyScreen");
const finalScreen = document.querySelector("#finalScreen");
const openEnvelope = document.querySelector("#openEnvelope");
const soundToggle = document.querySelector("#soundToggle");
const clueButtons = [...document.querySelectorAll(".clue")];
const clueMeter = [...document.querySelectorAll("#clueMeter span")];
const progressCopy = document.querySelector("#progressCopy");
const passwordInput = document.querySelector("#passwordInput");
const unlockButton = document.querySelector("#unlockButton");
const puzzleMessage = document.querySelector("#puzzleMessage");
const toast = document.querySelector("#toast");
const handwrittenImage = document.querySelector("#handwrittenImage");

const password = "0526";
const foundClues = new Set();
const clueTexts = [
  "邮戳写着：五月的小信，今天送达。",
  "星星说：答案有四位，前两位是 05。",
  "丝带悄悄打了个结：后两位是 26。",
  "纸角露出一句话：把今天写成 0526。"
];

let audioContext;
let masterGain;
let melodyTimer;
let muted = false;
let toastTimer;

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2900);
}

function setScreen(nextScreen) {
  [coverScreen, storyScreen, finalScreen].forEach((screen) => {
    screen.classList.toggle("is-active", screen === nextScreen);
  });
}

function ensureAudio() {
  if (audioContext) {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    soundToggle.hidden = true;
    return;
  }

  audioContext = new AudioContextClass();
  masterGain = audioContext.createGain();
  masterGain.gain.value = muted ? 0 : 0.08;
  masterGain.connect(audioContext.destination);
  startMelody();
}

function playNote(frequency, startTime, duration) {
  if (!audioContext || !masterGain) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const noteGain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  noteGain.gain.setValueAtTime(0, startTime);
  noteGain.gain.linearRampToValueAtTime(0.22, startTime + 0.03);
  noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.connect(noteGain);
  noteGain.connect(masterGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function startMelody() {
  const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 783.99];
  let step = 0;

  const tick = () => {
    if (!audioContext) {
      return;
    }

    const now = audioContext.currentTime;
    const root = notes[step % notes.length];
    playNote(root, now, 0.72);
    if (step % 2 === 0) {
      playNote(root / 2, now + 0.02, 0.9);
    }
    step += 1;
  };

  tick();
  melodyTimer = window.setInterval(tick, 1200);
}

function updateSoundButton() {
  soundToggle.textContent = muted ? "播放" : "静音";
  soundToggle.setAttribute("aria-pressed", String(muted));
  if (masterGain) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.08, audioContext.currentTime, 0.03);
  }
}

function updateClues() {
  clueMeter.forEach((item, index) => {
    item.classList.toggle("is-found", foundClues.has(index));
  });

  const count = foundClues.size;
  progressCopy.textContent =
    count === 4
      ? "线索已经齐了。密码就在今天。"
      : `已经找到 ${count} / 4 个线索。`;
}

function collectClue(button) {
  const index = Number(button.dataset.clue);
  if (foundClues.has(index)) {
    showToast("这个线索已经收好啦。");
    return;
  }

  foundClues.add(index);
  button.classList.add("is-found");
  showToast(clueTexts[index]);
  updateClues();
}

function unlockFinalLetter() {
  const value = passwordInput.value.trim();
  if (foundClues.size < 4) {
    puzzleMessage.textContent = "还差一点点，先把四个线索都找齐吧。";
    showToast("周围还有小线索没有被发现。");
    return;
  }

  if (value !== password) {
    puzzleMessage.textContent = "密码好像还没对。提示：今天的月和日。";
    passwordInput.select();
    return;
  }

  puzzleMessage.textContent = "信已经打开。";
  showToast("生日信打开了。");
  setScreen(finalScreen);
  finalScreen.scrollIntoView({ behavior: "smooth", block: "start" });
}

openEnvelope.addEventListener("click", () => {
  ensureAudio();
  setScreen(storyScreen);
});

soundToggle.addEventListener("click", () => {
  ensureAudio();
  muted = !muted;
  updateSoundButton();
});

clueButtons.forEach((button) => {
  button.addEventListener("click", () => collectClue(button));
});

unlockButton.addEventListener("click", unlockFinalLetter);

passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    unlockFinalLetter();
  }
});

passwordInput.addEventListener("input", () => {
  passwordInput.value = passwordInput.value.replace(/\D/g, "").slice(0, 4);
});

window.addEventListener("beforeunload", () => {
  window.clearInterval(melodyTimer);
});

updateClues();
updateSoundButton();

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
