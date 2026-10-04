const ASSETS = {
  bg: "",
  goal: "assets/gawang.png",
  ball: "assets/bola.png",
  keeper: "",
};
const AUDIO = { music: "", goal: "" }; // musik latar (loop) & efek suara gol
/* ============================================================ */

const $ = (id) => document.getElementById(id);
const W = 360,
  H = 640,
  BX = 180,
  BY = 540;
// area bukaan gawang (untuk deteksi gol) & posisi tanah kiper
const HIT = { x1: 66, x2: 294, y1: 158, y2: 252 },
  KEEPER_Y = 254;
const GOAL_BOX = { x: 40, y: 140, w: 300, h: 128 };
const cv = $("cv"),
  ctx = cv.getContext("2d"),
  stage = $("stage");
const IMG = {};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const FONT = '"Press Start 2P", monospace';

/* ---------- penyimpanan rekor ---------- */
let best = 0;
try {
  best = +localStorage.getItem("flickgol_best") || 0;
} catch (e) {}
function saveBest() {
  try {
    localStorage.setItem("flickgol_best", best);
  } catch (e) {}
}

/* ---------- ukuran layar ---------- */
function fit() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2),
    w = stage.clientWidth,
    h = stage.clientHeight;
  stage.style.setProperty("--u", w / 360 + "px");
  cv.width = w * dpr;
  cv.height = h * dpr;
  ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
  ctx.imageSmoothingEnabled = false; // wajib agar tetap pixel tajam
}
addEventListener("resize", fit);
fit();

/* ---------- sprite pixel dari teks ---------- */
function sprite(rows, pal) {
  const c = document.createElement("canvas");
  c.width = rows[0].length;
  c.height = rows.length;
  const g = c.getContext("2d");
  rows.forEach((r, y) =>
    [...r].forEach((ch, x) => {
      if (pal[ch]) {
        g.fillStyle = pal[ch];
        g.fillRect(x, y, 1, 1);
      }
    }),
  );
  return c;
}
const KP = {
  D: "#1d1d1d",
  S: "#f1c27d",
  Y: "#ffd43b",
  R: "#e63946",
  N: "#14213d",
};
const KEEPER_STAND = sprite(
  [
    "....DDDDDD....",
    "...DDDDDDDD...",
    "...SSSSSSSS...",
    "...SDSSSSDS...",
    "....SSSSSS....",
    "..YYRRRRRRYY..",
    ".YYYRRRRRRYYY.",
    ".YY.RRRRRR.YY.",
    "....RRRRRR....",
    "....RRRRRR....",
    "....RRRRRR....",
    "....NNNNNN....",
    "....NNNNNN....",
    "....NN..NN....",
    "....NN..NN....",
    "....NN..NN....",
    "...DDD..DDD...",
  ],
  KP,
);
const KEEPER_DIVE = sprite(
  [
    "YY..........YY",
    "YY..DDDDDD..YY",
    ".R..DDDDDD..R.",
    ".R..SSSSSS..R.",
    ".RR.SDSSDS.RR.",
    "..RRRRRRRRRR..",
    "....RRRRRR....",
    "....RRRRRR....",
    "....RRRRRR....",
    "....NNNNNN....",
    "....NNNNNN....",
    "...NNN..NNN...",
    "...NN....NN...",
    "...NN....NN...",
    "..DDD....DDD..",
  ],
  KP,
);
const HEART_ROWS = [
  ".XX.XX.",
  "XXXXXXX",
  "XXXXXXX",
  ".XXXXX.",
  "..XXX..",
  "...X...",
];
const HEART_ON = sprite(HEART_ROWS, { X: "#ff4d6d" });
const HEART_OFF = sprite(HEART_ROWS, { X: "rgba(255,255,255,.3)" });

/* ---------- background pixel ---------- */
function makePixelBg() {
  const c = document.createElement("canvas");
  c.width = 90;
  c.height = 160;
  const g = c.getContext("2d");
  const R = (x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  ["#3aa6e8", "#4cb8f0", "#6cc8f5", "#8fd6f8", "#b5e5fb"].forEach((col, i) =>
    R(0, i * 7, 90, 7, col),
  );
  [
    [8, 6],
    [58, 3],
    [38, 14],
    [72, 17],
  ].forEach(([x, y]) => {
    R(x + 2, y, 6, 1, "#fff");
    R(x, y + 1, 11, 2, "#fff");
    R(x + 1, y + 3, 9, 1, "#dff3ff");
  });
  R(0, 34, 90, 5, "#1d2a4a");
  const cols = ["#e63946", "#ffd43b", "#fff", "#4cb8f0", "#ff9f1a"];
  for (let y = 34; y < 39; y++)
    for (let x = 0; x < 90; x++)
      if (rnd() < 0.55) R(x, y, 1, 1, cols[(rnd() * 5) | 0]);
  R(0, 39, 90, 5, "#14213d");
  R(0, 39, 90, 1, "#fff");
  for (let x = 0; x < 90; x += 12) {
    R(x + 1, 41, 8, 1, "#ff9f1a");
    R(x + 1, 42, 8, 1, "#ffd43b");
  }
  for (let y = 44; y < 160; y++)
    R(0, y, 90, 1, Math.floor((y - 44) / 10) % 2 ? "#379f42" : "#3fae49");
  for (let i = 0; i < 70; i++)
    R(
      (rnd() * 90) | 0,
      44 + ((rnd() * 116) | 0),
      2,
      1,
      rnd() < 0.5 ? "#2f8e3a" : "#4cbc57",
    );
  const L = "#f2f2f2";
  R(0, 67, 90, 1, L);
  R(10, 67, 1, 34, L);
  R(10, 100, 71, 1, L);
  R(80, 67, 1, 34, L);
  R(44, 88, 2, 2, L);
  for (let a = 0; a < Math.PI; a += 0.02)
    R(
      45 + Math.round(Math.cos(a) * 14),
      100 + Math.round(Math.sin(a) * 14),
      1,
      1,
      L,
    );
  return c;
}
const PIXEL_BG = makePixelBg();

/* ---------- audio ---------- */
let ac = null,
  muted = false,
  musicTimer = null,
  step = 0;
const bgm = $("bgm"),
  sfxGoal = $("sfxGoal");
if (AUDIO.music) bgm.src = AUDIO.music;
if (AUDIO.goal) sfxGoal.src = AUDIO.goal;
function actx() {
  if (!ac) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (C) ac = new C();
  }
  if (ac && ac.state === "suspended") ac.resume();
  return ac;
}
function tone(f, d, type, v, when, slide) {
  const a = actx();
  if (!a || muted) return;
  const t = a.currentTime + (when || 0);
  const o = a.createOscillator(),
    g = a.createGain();
  o.type = type || "square";
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
  g.gain.setValueAtTime(v || 0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g);
  g.connect(a.destination);
  o.start(t);
  o.stop(t + d);
}
const sfx = {
  // Suara tendangan dikosongkan agar tidak ada bunyi saat geser bola
  kick() {},
  goal() {
    if (AUDIO.goal && !muted) {
      sfxGoal.currentTime = 0;
      sfxGoal.play().catch(() => {});
      return;
    }
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(f, 0.25, "square", 0.12, i * 0.09),
    );
  },
  miss() {
    tone(240, 0.35, "sawtooth", 0.12, 0, 90);
  },
  // Efek suara khas Game Over / Kalah (nada turun drastis)
  gameover() {
    [400, 350, 300, 220].forEach((f, i) =>
      tone(f, 0.2, "sawtooth", 0.15, i * 0.15, f - 80),
    );
  },
};
const NOTES = [262, 330, 392, 523, 392, 330, 294, 370, 440, 587, 440, 370];
function startMusic() {
  stopMusic();
  if (AUDIO.music) {
    bgm.volume = 0.5;
    if (!muted) bgm.play().catch(() => {});
    return;
  }
  musicTimer = setInterval(() => {
    tone(NOTES[step % NOTES.length], 0.18, "square", 0.035);
    if (step % 4 === 0)
      tone(NOTES[step % NOTES.length] / 4, 0.4, "triangle", 0.08);
    step++;
  }, 220);
}
function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
  bgm.pause();
}
$("btnMute").onclick = () => {
  muted = !muted;
  $("btnMute").textContent = "SUARA: " + (muted ? "OFF" : "ON");
  if (muted) bgm.pause();
  else if (AUDIO.music && state === "play") bgm.play().catch(() => {});
};

/* ---------- loading ---------- */
let state = "load";
(function load() {
  const keys = Object.keys(ASSETS).filter((k) => ASSETS[k]),
    total = keys.length + 1;
  let done = 0,
    shown = 0;
  const t0 = performance.now();
  keys.forEach((k) => {
    const im = new Image();
    im.onload = () => {
      IMG[k] = im;
      done++;
    };
    im.onerror = () => {
      done++;
    };
    im.src = ASSETS[k];
  });
  const fin = () => {
    done++;
  };
  if (document.fonts && document.fonts.load)
    document.fonts.load('16px "Press Start 2P"').then(fin, fin);
  else fin();
  setTimeout(() => {
    done = Math.max(done, total);
  }, 4000);
  (function tick() {
    const target = Math.min(done / total, (performance.now() - t0) / 1200);
    shown += (target - shown) * 0.15;
    $("pct").textContent = Math.round(shown * 100);
    $("fill").style.width = shown * 100 + "%";
    if (shown > 0.99 && target >= 1) {
      $("pct").textContent = 100;
      setTimeout(showMenu, 250);
    } else requestAnimationFrame(tick);
  })();
})();

/* ---------- alur layar ---------- */
let score = 0,
  lives = 3,
  newRec = false;
function show(id) {
  ["sLoad", "sMenu", "sOver"].forEach((s) =>
    $(s).classList.toggle("hidden", s !== id),
  );
}
function showMenu() {
  state = "menu";
  stopMusic();
  show("sMenu");
  $("menuBest").textContent = best;
  $("menuNew").classList.toggle("hidden", !newRec);
  $("btnExit").classList.add("hidden");
  $("btnMute").classList.add("hidden");
}
function startGame() {
  actx();
  score = 0;
  lives = 3;
  newRec = false;
  state = "play";
  show(null);
  $("btnExit").classList.remove("hidden");
  $("btnMute").classList.remove("hidden");
  resetBall();
  msg = null;
  startMusic();
}
function gameOver() {
  state = "over";
  show("sOver");
  stopMusic();
  sfx.gameover(); // Memutar suara game over saat kalah
  $("overScore").textContent = score;
  $("overBest").textContent = best;
  $("overNew").classList.toggle("hidden", !newRec);
}
$("btnPlay").onclick = startGame;
$("btnAgain").onclick = startGame;
$("btnMenu").onclick = showMenu;
$("btnExit").onclick = showMenu;

/* ---------- objek game ---------- */
const ball = {
  x: BX,
  y: BY,
  s: 1,
  mode: "idle",
  t: 0,
  sx: 0,
  sy: 0,
  tx: 0,
  ty: 0,
  dur: 650,
  wait: 0,
};
const keeper = { x: 179, phase: 0, diving: false, from: 179, to: 179, ang: 0 };
let msg = null,
  drag = false,
  samples = [];
function resetBall() {
  Object.assign(ball, { x: BX, y: BY, s: 1, mode: "idle", t: 0 });
  keeper.diving = false;
  keeper.ang = 0;
}
function say(text, color) {
  msg = { text, color, t: 0 };
}

/* ---------- kontrol sentuh / geser ---------- */
function pos(e) {
  const r = cv.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * W,
    y: ((e.clientY - r.top) / r.height) * H,
  };
}
cv.addEventListener("pointerdown", (e) => {
  if (state !== "play" || ball.mode !== "idle") return;
  const p = pos(e);
  if (Math.hypot(p.x - ball.x, p.y - ball.y) > 75) return;
  drag = true;
  samples = [{ x: p.x, y: p.y, t: performance.now() }];
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const p = pos(e);
  samples.push({ x: p.x, y: p.y, t: performance.now() });
  if (samples.length > 12) samples.shift();
  ball.x = clamp(p.x, 40, 320);
  ball.y = clamp(p.y, 430, 610);
});
function release() {
  if (!drag) return;
  drag = false;
  const now = performance.now(),
    last = samples[samples.length - 1];
  const first = samples.find((s) => s.t >= now - 110) || samples[0];
  const dt = Math.max(16, last.t - first.t),
    vx = (last.x - first.x) / dt,
    vy = (last.y - first.y) / dt;
  if (vy > -0.5 || samples.length < 2) {
    resetBall();
    return;
  }
  shoot(vx, vy);
}
cv.addEventListener("pointerup", release);
cv.addEventListener("pointercancel", release);

function shoot(vx, vy) {
  const power = clamp((-vy - 0.5) / 2, 0, 1);
  Object.assign(ball, {
    mode: "fly",
    t: 0,
    sx: ball.x,
    sy: ball.y,
    tx: clamp(ball.x + vx * 320, 10, 350),
    ty: 270 - power * 170,
    dur: 700 - power * 250,
  });
  const chance = Math.min(0.2 + score * 0.05, 0.85);
  keeper.diving = true;
  keeper.from = keeper.x;
  keeper.to = clamp(
    Math.random() < chance
      ? ball.tx + (Math.random() - 0.5) * 30
      : ball.tx < 180
        ? 250
        : 110,
    90,
    270,
  );
  sfx.kick(); // Dipanggil tapi kosong, jadi suara geser/tendang bola senyap
}
function resolve() {
  const inGoal =
    ball.tx > HIT.x1 &&
    ball.tx < HIT.x2 &&
    ball.ty > HIT.y1 &&
    ball.ty < HIT.y2;
  const saved = inGoal && Math.abs(ball.tx - keeper.x) < 36 && ball.ty > 182;
  ball.mode = "wait";
  ball.wait = 0;
  if (inGoal && !saved) {
    score++;
    say("GOAL!", "#ffd43b");
    sfx.goal();
    if (score > best) {
      best = score;
      newRec = true;
      saveBest();
    }
  } else {
    lives--;
    sfx.miss();
    say(saved ? "DITEPIS!" : "MELESET!", "#ff5d5d");
  }
}

/* ---------- update ---------- */
function update(dt) {
  if (!keeper.diving) {
    keeper.phase += dt * Math.min(0.0014 + score * 0.00016, 0.004);
    keeper.x = 179 + Math.sin(keeper.phase) * (60 + Math.min(score * 2, 25));
  }
  if (state !== "play") return;
  if (ball.mode === "fly") {
    ball.t += dt / ball.dur;
    const p = Math.min(1, ball.t),
      e = 1 - (1 - p) * (1 - p);
    ball.x = ball.sx + (ball.tx - ball.sx) * e;
    ball.y = ball.sy + (ball.ty - ball.sy) * e - Math.sin(Math.PI * p) * 40;
    ball.s = 1 - 0.62 * p;
    const k = Math.min(1, ball.t / 0.7),
      ke = 1 - (1 - k) * (1 - k);
    keeper.x = keeper.from + (keeper.to - keeper.from) * ke;
    keeper.ang = clamp((keeper.to - keeper.from) / 130, -1, 1) * ke;
    if (p >= 1) resolve();
  } else if (ball.mode === "wait") {
    ball.wait += dt;
    if (ball.wait > 1000) {
      if (lives <= 0) gameOver();
      else resetBall();
    }
  }
  if (msg) {
    msg.t += dt;
    if (msg.t > 1200) msg = null;
  }
}

/* ---------- gambar ---------- */
function drawBg() {
  ctx.drawImage(IMG.bg || PIXEL_BG, 0, 0, W, H);
}
function drawGoal() {
  if (IMG.goal)
    ctx.drawImage(IMG.goal, GOAL_BOX.x, GOAL_BOX.y, GOAL_BOX.w, GOAL_BOX.h);
  else {
    ctx.fillStyle = "#fff";
    ctx.fillRect(60, 148, 240, 8);
    ctx.fillRect(56, 148, 8, 120);
    ctx.fillRect(296, 148, 8, 120);
  }
}
function drawKeeper() {
  ctx.save();
  ctx.translate(Math.round(keeper.x), KEEPER_Y);
  ctx.rotate(keeper.ang * 0.7);
  if (IMG.keeper) ctx.drawImage(IMG.keeper, -30, -70, 60, 70);
  else {
    const sp = keeper.diving ? KEEPER_DIVE : KEEPER_STAND,
      sc = 4;
    ctx.drawImage(
      sp,
      (-sp.width * sc) / 2,
      -sp.height * sc,
      sp.width * sc,
      sp.height * sc,
    );
  }
  ctx.restore();
}
function drawBall() {
  const size = Math.round((68 * ball.s) / 2) * 2,
    r = size / 2;
  const gy =
    ball.mode === "fly"
      ? ball.sy + (ball.y - ball.sy) * 0.3 + r
      : ball.y + r * 0.9;
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.fillRect(
    Math.round(ball.x - r * 0.8),
    Math.round(gy),
    Math.round(r * 1.6),
    Math.max(2, Math.round(r * 0.16)),
  );
  const x = Math.round(ball.x - r),
    y = Math.round(ball.y - r);
  if (IMG.ball) ctx.drawImage(IMG.ball, x, y, size, size);
  else {
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "#14213d";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, size, size);
  }
}
function text(t, x, y, size, fill, align) {
  ctx.font = size + "px " + FONT;
  ctx.textAlign = align || "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#14213d";
  ctx.fillText(t, x + 3, y + 3);
  ctx.fillStyle = fill || "#fff";
  ctx.fillText(t, x, y);
}
function drawHud() {
  if (state !== "play") return;
  text("SKOR " + score, 14, 30, 14);
  text("REKOR " + best, W - 14, 30, 10, "#ffd43b", "right");
  for (let i = 0; i < 3; i++)
    ctx.drawImage(i < lives ? HEART_ON : HEART_OFF, 14 + i * 30, 42, 21, 18);

  if (msg) {
    const p = msg.t / 1200,
      sc =
        p < 0.15
          ? 0.4 + (p / 0.15) * 0.8
          : 1.2 - Math.min(0.2, (p - 0.15) * 0.5);
    ctx.save();
    ctx.globalAlpha = p > 0.75 ? 1 - (p - 0.75) * 4 : 1;
    ctx.translate(W / 2, 350);
    ctx.rotate(-0.08);
    ctx.scale(sc, sc);
    text(msg.text, 0, 0, msg.text === "GOAL!" ? 44 : 26, msg.color, "center");
    ctx.restore();
  }
}
function draw() {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  drawBg();
  drawGoal();
  drawKeeper();
  drawBall();
  drawHud();
}

let last = performance.now();
(function loop(t) {
  update(Math.min(50, t - last));
  last = t;
  draw();
  requestAnimationFrame(loop);
})(last);
