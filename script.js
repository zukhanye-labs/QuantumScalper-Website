/* =========================================================
   CONFIG — replace with your own WhatsApp number
   Format: country code + number, digits only, no + or spaces
   Example: South Africa 082 123 4567  ->  "27821234567"
========================================================= */
const WHATSAPP_NUMBER = "27631764338";

/* ---------- Build WhatsApp links ---------- */
document.querySelectorAll('.wa-cta').forEach(el => {
  const msg = el.getAttribute('data-msg') || "Hi! I'd like to buy QuantumScalper.";
  const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  if (el.tagName === 'A') {
    el.setAttribute('href', link);
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  } else {
    el.addEventListener('click', () => window.open(link, '_blank', 'noopener,noreferrer'));
  }
});

/* ---------- Mobile nav ---------- */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

/* ---------- Footer year ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- FAQ accordion ---------- */
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-a').style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  });
});

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

/* ---------- Ticker generation ---------- */
const pairs = [
  { s: 'EUR/USD', p: 1.0842 }, { s: 'GBP/USD', p: 1.2716 }, { s: 'USD/JPY', p: 156.32 },
  { s: 'AUD/USD', p: 0.6524 }, { s: 'USD/CAD', p: 1.3712 }, { s: 'EUR/GBP', p: 0.8527 },
  { s: 'USD/CHF', p: 0.8841 }, { s: 'NZD/USD', p: 0.5978 }, { s: 'EUR/JPY', p: 169.47 },
  { s: 'GBP/JPY', p: 198.79 }
];
function buildTicker() {
  const track = document.getElementById('tickerTrack');
  track.innerHTML = '';
  const set = [...pairs, ...pairs]; // duplicate for seamless loop
  set.forEach(pair => {
    const up = Math.random() > 0.5;
    const change = (Math.random() * 0.4).toFixed(2);
    const item = document.createElement('span');
    item.className = 'ticker-item';
    item.dataset.symbol = pair.s;
    item.innerHTML = `${pair.s} <b>${pair.p.toFixed(4).slice(0, pair.p >= 100 ? 6 : 6)}</b> <span class="${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${change}%</span>`;
    track.appendChild(item);
  });
}
buildTicker();

/* ---------- Equity curve drawing (canvas) ---------- */
function drawEquityCurve(canvas, {points = 60, seed = 1, animate = true, color = '#33ee8c'} = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height;

  // generate a semi-random upward equity path
  let val = 40;
  let rnd = seed;
  const rand = () => { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280; };
  const data = [val];
  for (let i = 1; i < points; i++) {
    const drift = 0.55; // upward bias
    const noise = (rand() - 0.42) * 6;
    val = Math.max(20, val + drift + noise);
    data.push(val);
  }
  const min = Math.min(...data), max = Math.max(...data);
  const norm = v => h - 24 - ((v - min) / (max - min)) * (h - 48);
  const stepX = w / (points - 1);

  const path = new Path2D();
  data.forEach((v, i) => {
    const x = i * stepX, y = norm(v);
    if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
  });

  const fillPath = new Path2D(path);
  fillPath.lineTo(w, h);
  fillPath.lineTo(0, h);
  fillPath.closePath();

  let progress = animate ? 0 : 1;
  function frame() {
    ctx.clearRect(0, 0, w, h);

    // grid baseline
    ctx.strokeStyle = 'rgba(241,245,243,0.06)';
    ctx.lineWidth = 1;
    for (let gy = 0; gy < 4; gy++) {
      const y = (h / 4) * gy + 8;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    ctx.save();
    const clipW = w * progress;
    ctx.beginPath(); ctx.rect(0, 0, clipW, h); ctx.clip();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + '33');
    grad.addColorStop(1, color + '00');
    ctx.fillStyle = grad;
    ctx.fill(fillPath);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke(path);
    ctx.restore();

    // moving dot at head
    if (progress < 1) {
      const idx = Math.min(points - 1, Math.floor(progress * points));
      const x = idx * stepX, y = norm(data[idx] || data[data.length - 1]);
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (progress < 1) {
      progress += 0.012;
      requestAnimationFrame(frame);
    }
  }
  frame();
}

function initCharts() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.getElementById('equityHero');
  const big = document.getElementById('equityBig');
  if (hero) drawEquityCurve(hero, { points: 70, seed: 7, animate: !reduceMotion, color: '#33ee8c' });
  if (big) drawEquityCurve(big, { points: 90, seed: 21, animate: !reduceMotion, color: '#33ee8c' });
}
window.addEventListener('load', initCharts);
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initCharts, 250);
});