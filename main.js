const canvas = document.getElementById('emberField');
const ctx = canvas.getContext('2d');
let particles = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function makeParticle() {
  return {
    x: Math.random() * canvas.width,
    y: canvas.height + 10,
    vx: (Math.random() - 0.5) * 0.45,
    vy: -(Math.random() * 0.9 + 0.25),
    life: 1,
    decay: Math.random() * 0.0035 + 0.0012,
    size: Math.random() * 1.3 + 0.3,
  };
}

for (let i = 0; i < 65; i++) {
  const p = makeParticle();
  p.y = Math.random() * canvas.height;
  p.life = Math.random();
  particles.push(p);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const t = Date.now() * 0.001;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx + Math.sin(t + p.y * 0.011) * 0.18;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0 || p.y < -10) { particles[i] = makeParticle(); continue; }
    ctx.save();
    ctx.globalAlpha = p.life * 0.18;
    ctx.fillStyle = '#c8c4bc';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  requestAnimationFrame(draw);
}
draw();

const currentLines = [
  "Full stack developer",
  "One of one, the only one",
  "The silence in my code speaks louder than yours."
];

let bioIndex = 0, charIndex = 0, deleting = false, paused = false;
const bioEl = document.getElementById('bioText');

function typeBio() {
  if (!bioEl) return;
  if (bioIndex >= currentLines.length) bioIndex = 0;
  if (paused) { setTimeout(typeBio, 3200); paused = false; return; }
  const currentText = currentLines[bioIndex];
  if (!deleting) {
    bioEl.textContent = currentText.slice(0, ++charIndex);
    if (charIndex === currentText.length) { deleting = true; paused = true; }
    setTimeout(typeBio, 55);
  } else {
    bioEl.textContent = currentText.slice(0, --charIndex);
    if (charIndex === 0) { deleting = false; bioIndex = (bioIndex + 1) % currentLines.length; }
    setTimeout(typeBio, 28);
  }
}

document.addEventListener("DOMContentLoaded", typeBio);
if (document.readyState === "interactive" || document.readyState === "complete") typeBio();

const audio = document.getElementById("siteTrack");
const toggleMusicButton = document.getElementById("audioToggle");
const toggleMusicIcon = document.getElementById("audioSymbol");
const volumeRangeControl = document.getElementById("soundBar");
const volumeIconMark = document.getElementById("soundSymbol");
const progressRangeControl = document.getElementById("audioBar");
const currentTimeText = document.getElementById("audioNow");
const totalTimeText = document.getElementById("audioLength");
const discMark = document.getElementById("recordSymbol");
let autoplayedOnce = false;

function convertSecondsToLabel(s) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function updateModernSlider(el) {
  const min = Number(el.min) || 0;
  const max = Number(el.max) || 100;
  const val = Number(el.value) || 0;
  const pct = (val - min) / (max - min) * 100;
  el.style.background = `linear-gradient(90deg, #c8c4bc ${pct}%, rgba(200,196,188,0.1) ${pct}%)`;
}

document.addEventListener("click", () => {
  if (!autoplayedOnce && audio) {
    autoplayedOnce = true;
    audio.play().then(() => {
      toggleMusicIcon.className = "fa-solid fa-pause";
      discMark.classList.add("spinning");
    }).catch(() => {});
  }
}, { once: true });

if (audio) {
  audio.volume = 0.7;
  audio.addEventListener("loadedmetadata", () => {
    progressRangeControl.max = audio.duration;
    totalTimeText.textContent = convertSecondsToLabel(audio.duration);
    updateModernSlider(progressRangeControl);
  });
  audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
      progressRangeControl.value = audio.currentTime;
      currentTimeText.textContent = convertSecondsToLabel(audio.currentTime);
      updateModernSlider(progressRangeControl);
    }
  });
  progressRangeControl.addEventListener("input", () => {
    audio.currentTime = Number(progressRangeControl.value);
    updateModernSlider(progressRangeControl);
  });
  volumeRangeControl.addEventListener("input", () => {
    audio.volume = Number(volumeRangeControl.value);
    volumeIconMark.className = audio.volume === 0
      ? "fa-solid fa-volume-xmark"
      : audio.volume < 0.5 ? "fa-solid fa-volume-low" : "fa-solid fa-volume-high";
    updateModernSlider(volumeRangeControl);
  });
  toggleMusicButton.addEventListener("click", (e) => {
    e.stopPropagation();
    if (audio.paused) {
      audio.play().catch(() => {});
      toggleMusicIcon.className = "fa-solid fa-pause";
      discMark.classList.add("spinning");
    } else {
      audio.pause();
      toggleMusicIcon.className = "fa-solid fa-play";
      discMark.classList.remove("spinning");
    }
  });
  audio.addEventListener("ended", () => {
    toggleMusicIcon.className = "fa-solid fa-play";
    discMark.classList.remove("spinning");
    progressRangeControl.value = 0;
    currentTimeText.textContent = "0:00";
    updateModernSlider(progressRangeControl);
  });
}

[progressRangeControl, volumeRangeControl].forEach(el => updateModernSlider(el));

const glowCursor = document.querySelector(".cursor-glow");
document.addEventListener("mousemove", (e) => {
  glowCursor.style.left = `${e.clientX}px`;
  glowCursor.style.top = `${e.clientY}px`;
  glowCursor.style.opacity = "1";
  const dot = document.createElement("div");
  dot.className = "trail-dot";
  dot.style.left = `${e.clientX}px`;
  dot.style.top = `${e.clientY}px`;
  document.body.appendChild(dot);
  setTimeout(() => dot.remove(), 650);
});
document.addEventListener("mouseleave", () => { glowCursor.style.opacity = "0"; });
