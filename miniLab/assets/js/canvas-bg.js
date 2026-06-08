/* ══════════════════════════════════════════════════════════
   ANIMATED BACKGROUND
   Estratto da johnwhale-site-theme.html
   Adattato per usare id="bg-canvas"
══════════════════════════════════════════════════════════ */
let dark = true; // La variabile `dark` è gestita dal `data-theme` sull'html, ma per il canvas la inizializziamo qui.

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W, H, cols, pts, rings, frame = 0, nextSonar;
const COL_W = 15;
const CHARS = '0123456789ABCDEF♩♪+×∑∂░▒01ME51N▓SAP⟨⟩{}[]//'.split('');

function theme() {
    // Legge il tema corrente dal tag html
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0d1518' : '#f0f4f1',
        fg: isDark ? 'rgba(46,204,113,' : 'rgba(13,21,24,',
        accent: isDark ? '#2ecc71' : '#1fa85a',
    };
}

function initBg() {
    W = canvas.width = canvas.offsetWidth || window.innerWidth;
    H = canvas.height = canvas.offsetHeight || window.innerHeight;
    const N_COLS = Math.ceil(W / COL_W);
    const N_ROWS = Math.ceil(H / COL_W) + 2;
    cols = Array.from({ length: N_COLS }, () => ({
        y: Math.random() * H,
        speed: 0.12 + Math.random() * 0.22,
        chars: Array.from({ length: N_ROWS }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
        opacity: 0.025 + Math.random() * 0.045,
        changeCounters: Array.from({ length: N_ROWS }, () => Math.random() * 120),
        changeIntervals: Array.from({ length: N_ROWS }, () => 80 + Math.random() * 300),
    }));
    pts = Array.from({ length: 28 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
        r: 1.5 + Math.random() * 2,
        pulse: Math.random() * Math.PI * 2,
    }));
    rings = []; nextSonar = 80 + Math.random() * 120;
}

function drawBg() {
    const t = theme();
    ctx.fillStyle = t.bg; ctx.fillRect(0, 0, W, H);

    // LAYER 1: character columns
    ctx.font = `${COL_W * 0.78}px 'Ubuntu Mono',monospace`;
    ctx.textBaseline = 'top';
    cols.forEach((col, ci) => {
        col.y += col.speed;
        const nRows = col.chars.length;
        col.chars.forEach((ch, ri) => {
            col.changeCounters[ri]++;
            if (col.changeCounters[ri] > col.changeIntervals[ri]) {
                col.chars[ri] = CHARS[Math.floor(Math.random() * CHARS.length)];
                col.changeCounters[ri] = 0; col.changeIntervals[ri] = 80 + Math.random() * 300;
            }
            const py = (ri * COL_W - col.y % (nRows * COL_W) + nRows * COL_W) % (nRows * COL_W);
            const ef = Math.max(0, Math.min(py / 80, 1) * Math.min((H - py) / 80, 1));
            ctx.fillStyle = t.fg + (col.opacity * ef).toFixed(3) + ')';
            ctx.fillText(ch, ci * COL_W, py);
        });
    });

    // LAYER 2: particle network
    frame++;
    pts.forEach(p => {
        p.x += p.vx + Math.sin(frame * 0.008 + p.pulse) * 0.06;
        p.y += p.vy + Math.cos(frame * 0.008 + p.pulse) * 0.06;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = t.fg + '0.18)'; ctx.fill();
    });
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 135) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = t.fg + ((1 - d / 135) * 0.09).toFixed(3) + ')'; ctx.lineWidth = 0.6; ctx.stroke();
        }
    }

    // LAYER 3: sonar rings
    nextSonar--;
    if (nextSonar <= 0) { const p = pts[Math.floor(Math.random() * pts.length)]; rings.push({ x: p.x, y: p.y, r: 0, alpha: 0.22, maxR: 150 }); nextSonar = 100 + Math.random() * 160; }
    for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i]; ring.r += 1.1; ring.alpha *= 0.968;
        if (ring.alpha < 0.003 || ring.r > ring.maxR) { rings.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = t.fg + ring.alpha.toFixed(3) + ')'; ctx.lineWidth = 0.8; ctx.stroke();
        if (ring.r > 20) {
            ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r * 0.62, 0, Math.PI * 2);
            ctx.strokeStyle = t.fg + (ring.alpha * 0.4).toFixed(3) + ')'; ctx.stroke();
        }
    }

    // vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.82);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, t.bg === '#0d1518' ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.08)'); // Usa il tema corrente per la vignetta
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(drawBg);
}

window.addEventListener('resize', initBg);
initBg();
drawBg();

// Funzione per gestire il cambio tema (se implementato altrove)
function handleThemeChange(mutationsList, observer) {
    for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            // Re-inizializza e ridisegna per applicare il nuovo tema al canvas
            initBg();
            // Non c'è bisogno di chiamare drawBg esplicitamente qui,
            // perché requestAnimationFrame lo farà al prossimo frame.
        }
    }
}

// Crea un observer per monitorare i cambiamenti all'attributo data-theme
const observer = new MutationObserver(handleThemeChange);
observer.observe(document.documentElement, { attributes: true });