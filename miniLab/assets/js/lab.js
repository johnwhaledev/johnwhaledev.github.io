// miniLab — logica client: widget meteo inline (Open-Meteo, no key), modale CV, formattatori.
// I dati di news/offerte/CV sono statici, iniettati in window.LAB_DATA dal build.

const _WMO_EMOJI = (c) => {
  if (c === 0) return '☀️';
  if (c <= 3)  return '⛅';
  if (c <= 48) return '🌫️';
  if (c <= 55) return '🌦️';
  if (c <= 67) return '🌧️';
  if (c <= 77) return '❄️';
  if (c <= 82) return '🌦️';
  return '⛈️';
};

const _FASCE = [
  { key: 'notte', label: '🌙 Notte',      da: 0,  a: 6  },
  { key: 'matt',  label: '🌄 Mattina',    da: 6,  a: 12 },
  { key: 'pom',   label: '☀️ Pomeriggio', da: 12, a: 18 },
  { key: 'sera',  label: '🌆 Sera',       da: 18, a: 24 },
];

async function fetchRegionForecast(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weathercode` +
    `&timezone=Europe%2FRome&forecast_days=4`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('open-meteo error');
  const d = await r.json();
  const times = d.hourly.time;
  const temps = d.hourly.temperature_2m;
  const hums  = d.hourly.relative_humidity_2m;
  const precs = d.hourly.precipitation_probability;
  const codes = d.hourly.weathercode;

  const days = {};
  times.forEach((t, i) => {
    const [date, hhmm] = t.split('T');
    const h = parseInt(hhmm);
    if (!days[date]) days[date] = { notte: [], matt: [], pom: [], sera: [] };
    const f = _FASCE.find(x => h >= x.da && h < x.a);
    if (f) days[date][f.key].push({ t: temps[i], u: hums[i], p: precs[i], c: codes[i] });
  });

  const avg = (arr, key) => arr.length ? Math.round(arr.reduce((s, x) => s + x[key], 0) / arr.length) : null;
  const dom = (arr) => {
    if (!arr.length) return 0;
    const cnt = {}; arr.forEach(x => cnt[x.c] = (cnt[x.c] || 0) + 1);
    return +Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0];
  };
  const fascia = (arr) => ({
    emoji: _WMO_EMOJI(dom(arr)), temp: avg(arr, 't'), umid: avg(arr, 'u'), rain: avg(arr, 'p'),
  });

  const dayKeys = Object.keys(days).sort().slice(0, 3); // oggi, domani, +2
  return dayKeys.map(dk => ({
    date: dk,
    label: new Date(dk + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' }),
    fasce: _FASCE.map(f => ({ key: f.key, label: f.label, ...fascia(days[dk][f.key]) })),
  }));
}

function labApp() {
  return {
    d: window.LAB_DATA || {},
    showCv: false,
    // Meteo (widget inline)
    meteoSelected: null,
    meteoForecast: null,
    meteoLoading: false,
    meteoCache: {},
    // UI
    offerteEspanse: false,
    newsEspanse: false,

    get regioni() { return this.d.regioni || []; },
    get news()    { return this.d.news || []; },
    get offerte() { return (this.d.offerte && this.d.offerte.items) || []; },
    get stats()   { return (this.d.offerte && this.d.offerte.stats) || {}; },
    get cv()      { return this.d.cv || {}; },

    async init() {
      // Carica nel widget la regione di default (Lombardia/Bergamo)
      const lom = this.regioni.find(r => r.id === 'lom') || this.regioni[0];
      if (lom) await this.selectRegion(lom);
    },

    selectById(id) {
      const r = this.regioni.find(x => x.id === id);
      if (r) this.selectRegion(r);
    },

    async selectRegion(region) {
      this.meteoSelected = region;
      document.querySelectorAll('.italy-map path').forEach(p =>
        p.classList.toggle('selected', p.dataset.id === region.id));
      if (this.meteoCache[region.id]) { this.meteoForecast = this.meteoCache[region.id]; return; }
      this.meteoLoading = true;
      this.meteoForecast = null;
      try {
        const f = await fetchRegionForecast(region.lat, region.lon);
        this.meteoCache[region.id] = f;
        this.meteoForecast = f;
      } catch (e) {
        this.meteoForecast = null;
      } finally {
        this.meteoLoading = false;
      }
    },

    fmtRal(v) { return v ? '€' + Math.round(v).toLocaleString('it-IT') : ''; },
    ralRange(o) {
      if (o.ral_min && o.ral_max && o.ral_min !== o.ral_max) return this.fmtRal(o.ral_min) + '–' + this.fmtRal(o.ral_max);
      if (o.ral) return '~' + this.fmtRal(o.ral);
      return '';
    },
    scoreColor(s) {
      if (s == null) return 'var(--jw-muted)';
      return s >= 60 ? 'var(--jw-accent)' : (s >= 40 ? '#f59e0b' : '#ef4444');
    },
  };
}
