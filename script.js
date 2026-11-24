const bgmAudio = document.getElementById('bgmAudio');
const bdayAudio = document.getElementById('bdayAudio');
let isMuted = false;

// 音樂音量平滑漸變
function fadeAudio(audio, targetVolume, duration = 1200) {
  const stepTime = 50;
  const steps = duration / stepTime;
  const volumeStep = (targetVolume - audio.volume) / steps;

  if (targetVolume > 0 && audio.paused) {
    audio.volume = 0;
    audio.play().catch(() => {});
  }

  const timer = setInterval(() => {
    let nextVol = audio.volume + volumeStep;
    if ((volumeStep > 0 && nextVol >= targetVolume) || (volumeStep < 0 && nextVol <= targetVolume)) {
      audio.volume = Math.max(0, Math.min(1, targetVolume));
      if (targetVolume === 0) audio.pause();
      clearInterval(timer);
    } else {
      audio.volume = Math.max(0, Math.min(1, nextVol));
    }
  }, stepTime);
}

function toggleMute() {
  isMuted = !isMuted;
  bgmAudio.muted = isMuted;
  bdayAudio.muted = isMuted;
  const btn = document.getElementById('musicToggle');
  btn.textContent = isMuted ? '🔇' : '🎵';
  btn.classList.toggle('muted', isMuted);
}

// 切換場景共用函式
function switchSection(hideId, showId) {
  document.getElementById(hideId).classList.remove('active');
  document.getElementById(showId).classList.add('active');
  window.scrollTo(0, 0);
}

// 1. 第一幕 -> 第二幕
function enterGallery() {
  switchSection('introSection', 'gallerySection');
  fadeAudio(bgmAudio, 0.65, 1500);
}

// 2. 照片放大檢視
function openPhotoModal(element) {
  document.getElementById('modalImg').src = element.querySelector('img').src;
  document.getElementById('modalTitle').textContent = element.querySelector('.caption').textContent;
  document.getElementById('modalYear').textContent = element.getAttribute('data-year');
  document.getElementById('modalStory').textContent = element.getAttribute('data-story');
  document.getElementById('photoModal').classList.add('show');
}

function closePhotoModal() {
  document.getElementById('photoModal').classList.remove('show');
}

const ropeContainer = document.getElementById('ropeContainer');
ropeContainer.addEventListener('wheel', (e) => {
  if (e.deltaY !== 0) {
    e.preventDefault();
    ropeContainer.scrollLeft += e.deltaY;
  }
});

// 3. 第二幕 -> 第三幕（蛋糕暗房 + 音樂切換）
function goToCake() {
  switchSection('gallerySection', 'cakeSection');
  document.body.classList.add('lights-off');
}

let candleBlown = false;
function blowCandle() {
  if (candleBlown) return;
  candleBlown = true;

  document.getElementById('flame').classList.add('blown');
  document.getElementById('candleGlow').classList.add('off');
  document.getElementById('smoke').classList.add('rising');

  document.getElementById('cakeTitle').textContent = '願望一定會實現的！🌟';
  document.getElementById('cakeHint').textContent = '接下來，去打開你的生日禮物吧 👇';
  document.getElementById('toGiftBtn').style.display = 'inline-block';
}

// 4. 第三幕 -> 第四幕（斜上方立體禮物盒 + 切回輕音樂）
function goToGift() {
  switchSection('cakeSection', 'giftSection');
  document.body.classList.remove('lights-off');
}

function backToGallery() {
  switchSection('giftSection', 'gallerySection');
  document.body.classList.remove('lights-off');
}

// 5. 開啟禮物盒 -> 100顆氣球湧出 + 拉炮彩色紙片掉落
let giftOpened = false;
function openGift() {
  if (giftOpened) return;
  giftOpened = true;

  const giftBox = document.getElementById('giftBox');
  giftBox.classList.add('opened');

  document.getElementById('giftTitle').textContent = '生日快樂！！🎉';
  document.getElementById('giftHint').textContent = '點擊禮物盒裡浮出來的信封卡片 💌';

  const rect = giftBox.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  launchCelebration(originX, originY);
}

function openLetter(event) {
  if (event) event.stopPropagation();
  if (!giftOpened) return;
  document.getElementById('letterModal').classList.add('show');
}

function closeLetter() {
  document.getElementById('letterModal').classList.remove('show');
}

// 6. 第四幕 -> 第五幕（結束頁面）
function goToEnding() {
  closeLetter();
  switchSection('giftSection', 'endingSection');
  // 結束頁再灑一波拉炮彩帶慶祝
  launchConfettiOnly();
}

// 從頭重玩一次
function restartAll() {
  // 重置蠟燭狀態
  candleBlown = false;
  document.getElementById('flame').classList.remove('blown');
  document.getElementById('candleGlow').classList.remove('off');
  document.getElementById('smoke').classList.remove('rising');
  document.getElementById('cakeTitle').textContent = '閉上眼睛，許個生日願望吧 ✨';
  document.getElementById('cakeHint').textContent = '許完願後，點擊蠟燭吹熄它 🕯️';
  document.getElementById('toGiftBtn').style.display = 'none';

  // 重置禮物盒狀態
  giftOpened = false;
  document.getElementById('giftBox').classList.remove('opened');
  document.getElementById('giftTitle').textContent = '最後，有一個禮物要送給你...';
  document.getElementById('giftHint').textContent = '點擊禮物盒，看看裡面裝了什麼驚喜！🎀';

  switchSection('endingSection', 'introSection');
}

// ================= 氣球（100顆）＋ 拉炮彩帶物理動畫 =================
const canvas = document.getElementById('celebrationCanvas');
const ctx = canvas.getContext('2d');
let balloons = [];
let confettis = [];
let animationRunning = false;

const palette = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff758f', '#ffb703', '#ff99c8', '#4cc9f0'];

function createConfettiBurst(count = 220) {
  for (let i = 0; i < count; i++) {
    // 模擬左右兩側與上方拉炮噴射後往下飄落
    const fromLeft = i % 2 === 0;
    confettis.push({
      x: fromLeft ? Math.random() * (canvas.width * 0.45) : canvas.width - Math.random() * (canvas.width * 0.45),
      y: -20 - Math.random() * 250,
      vx: (Math.random() - 0.5) * 6,
      vy: 2.2 + Math.random() * 4.2,
      w: 7 + Math.random() * 7,
      h: 4 + Math.random() * 5,
      color: palette[Math.floor(Math.random() * palette.length)],
      tilt: Math.random() * 10,
      tiltSpeed: 0.06 + Math.random() * 0.08,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.04 + Math.random() * 0.04
    });
  }
}

function launchCelebration(originX, originY) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 產生 100 顆氣球從禮物盒中心分批湧出
  for (let i = 0; i < 100; i++) {
    const angle = (Math.random() * Math.PI) - Math.PI;
    const spreadSpeed = 1.2 + Math.random() * 7.5;

    balloons.push({
      x: originX + (Math.random() - 0.5) * 55,
      y: originY + (Math.random() - 0.5) * 45,
      vx: Math.cos(angle) * spreadSpeed + (Math.random() - 0.5) * 5,
      vy: -(2.2 + Math.random() * 5.2),
      radiusX: 13 + Math.random() * 12,
      radiusY: 18 + Math.random() * 14,
      scale: 0.15,
      delay: Math.floor(i / 4), // 分批冒出更有湧泉感
      swaySpeed: 0.02 + Math.random() * 0.03,
      swayOffset: Math.random() * Math.PI * 2,
      color: palette[Math.floor(Math.random() * palette.length)]
    });
  }

  // 同時產生 220 片拉炮彩帶掉落
  createConfettiBurst(220);

  if (!animationRunning) {
    animationRunning = true;
    animateCelebration();
  }
}

function launchConfettiOnly() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  createConfettiBurst(150);
  if (!animationRunning) {
    animationRunning = true;
    animateCelebration();
  }
}

function animateCelebration() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. 繪製與更新氣球
  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i];
    if (b.delay > 0) {
      b.delay--;
      continue;
    }

    b.vx *= 0.965;
    b.x += b.vx + Math.sin(b.swayOffset) * 0.9;
    b.y += b.vy;
    b.swayOffset += b.swaySpeed;

    if (b.scale < 1) b.scale = Math.min(1, b.scale + 0.045);

    if (b.y + b.radiusY < -120) {
      balloons.splice(i, 1);
      continue;
    }

    const rx = b.radiusX * b.scale;
    const ry = b.radiusY * b.scale;

    ctx.beginPath();
    ctx.ellipse(b.x, b.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(b.x - rx * 0.3, b.y - ry * 0.3, rx * 0.18, ry * 0.25, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(b.x, b.y + ry);
    ctx.lineTo(b.x - 4 * b.scale, b.y + ry + 5 * b.scale);
    ctx.lineTo(b.x + 4 * b.scale, b.y + ry + 5 * b.scale);
    ctx.closePath();
    ctx.fillStyle = b.color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(b.x, b.y + ry + 5 * b.scale);
    ctx.quadraticCurveTo(b.x + Math.sin(b.swayOffset) * 8, b.y + ry + 30 * b.scale, b.x, b.y + ry + 55 * b.scale);
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }

  // 2. 繪製與更新拉炮彩色紙片彩帶
  for (let i = confettis.length - 1; i >= 0; i--) {
    const c = confettis[i];
    c.wobble += c.wobbleSpeed;
    c.tilt += c.tiltSpeed;
    c.vx *= 0.98;
    c.x += c.vx + Math.sin(c.wobble) * 1.4;
    c.y += c.vy;

    if (c.y > canvas.height + 30) {
      confettis.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(c.x, c.y);
    // 模擬紙片在空中翻轉的立體感
    ctx.rotate(c.tilt);
    ctx.scale(1, Math.cos(c.tilt));
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    ctx.restore();
  }

  if (balloons.length > 0 || confettis.length > 0) {
    requestAnimationFrame(animateCelebration);
  } else {
    animationRunning = false;
  }
}