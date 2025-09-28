// widget.js (ES module) — Wave Front Assist (2 FABs: Templates + Assistant, exclusifs)

/* =========================================================
   1) Localisation de la Shadow Root
   ========================================================= */
const shadow =
  window.__WAVE_ASSIST_SHADOW__ ||
  document.getElementById('wave-assist-host')?.shadowRoot;

if (!shadow) {
  console.warn('[Assist] Shadow root introuvable. Vérifie content.js / le host.');
}


/* =========================================================
   3) Styles de base du widget (conteneur + panneaux)
   ========================================================= */
if (shadow) {
  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; font:14px/1.45 Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#0f172a; }

    /* --- FAB rond bleu (commun) --- */
    .assist-fab{
      position: fixed; left: 16px;
      display: inline-grid; place-items: center;
      width: 56px; height: 56px;
      border: none; border-radius: 9999px;
      background: #1a73e8; color: #fff; cursor: pointer;
      box-shadow: 0 10px 30px rgba(2,8,23,.25);
      z-index: 2147483002;
      transition: filter .15s ease, transform .05s ease;
    }
    .assist-fab:hover{ filter: brightness(1.06); }
    .assist-fab:active{ transform: translateY(1px); }
    .assist-fab:focus-visible{ outline: 3px solid rgba(26,115,232,.35); outline-offset: 2px; }
    .assist-fab svg{ width: 22px; height: 22px; display:block; }

    /* Position verticale des 2 FABs */
    .fab-templates{ bottom: 88px; } /* au-dessus du FAB assistant */
    .fab-assistant{ bottom: 16px; }

    .assist-wrap{ position: fixed; z-index: 2147483001; background: transparent; }
    .assist-card{
      width: 720px; height: 460px;
      background:#fff; border:1px solid #e9edf4; border-radius:16px;
      box-shadow:0 24px 70px rgba(2,8,23,.35);
      display:flex; flex-direction:column; overflow:hidden;
    }
    .assist-hd{
      display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 10px;
      background:linear-gradient(180deg,#ffffff 0%,#fafbff 100%); border-bottom:1px solid #eef1f6;
      cursor:move; user-select:none;
    }
    .assist-title{ font-weight:700; }
    .assist-actions{ display:flex; gap:6px; }
    .assist-btn{
      width:28px; height:28px; border-radius:8px; border:1px solid #e7ebf3; background:#fff; cursor:pointer;
      display:grid; place-items:center; font-size:13px;
    }
    .assist-btn:hover{ background:#f6f8fc; }
    .assist-bd{ flex:1; min-height:0; background:#fff; display:flex; flex-direction:column; }
  `;
  shadow.appendChild(style);
}

/* =========================================================
   4) Construction du widget (2 FABs + 2 panneaux draggable)
   ========================================================= */
if (shadow) {
  // --- constants
  const PAD = 8;
  const FAB_SIZE = 56;
  const FAB_GAP  = 24;

  // Ancrages pour éviter chevauchement & aligner sur la gauche des FABs
  const FAB_LEFT = 16;
  const PANEL_LEFT_MARGIN = 12;
  const PANEL_LEFT_ANCHOR = FAB_LEFT + FAB_SIZE + PANEL_LEFT_MARGIN;

  // Petite marge visuelle par rapport au bas (alignement FAB assistant)
  const BOTTOM_MARGIN = 24;

  // États panneau Assistant
  let OPEN_ASSIST = false, MAXI_ASSIST = false, AX, AY;

  // États panneau Templates
  let OPEN_TPL = false, MAXI_TPL = false, TX, TY;

  const root = document.createElement('div');
  shadow.appendChild(root);

  /* ======================
     4.1 FAB — TEMPLATES
     ====================== */
  const fabTpl = document.createElement('button');
  fabTpl.className = 'assist-fab fab-templates';
  fabTpl.setAttribute('aria-label', 'Open Templates');
  fabTpl.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="14" rx="2" ry="2"></rect>
      <path d="M7 8h10M7 12h6"></path>
    </svg>
  `;
  fabTpl.addEventListener('click', () => {
    openTemplates(!OPEN_TPL);
    if (OPEN_TPL) openAssistant(false); // exclusif
  });
  root.appendChild(fabTpl);

  /* ======================
     4.2 FAB — ASSISTANT
     ====================== */
  const fabAssist = document.createElement('button');
  fabAssist.className = 'assist-fab fab-assistant';
  fabAssist.setAttribute('aria-label', 'Open AI Assist');
  fabAssist.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="10" rx="2" ry="2"></rect>
      <path d="M12 2v4"></path>
      <circle cx="8" cy="13" r="1"></circle>
      <circle cx="16" cy="13" r="1"></circle>
      <path d="M7 18v2"></path>
      <path d="M17 18v2"></path>
      <path d="M3 13H1"></path>
      <path d="M23 13h-2"></path>
    </svg>
  `;
  fabAssist.addEventListener('click', () => {
    openAssistant(!OPEN_ASSIST);
    if (OPEN_ASSIST) openTemplates(false);
  });
  root.appendChild(fabAssist);

  /* ======================
     4.3 Panneau ASSISTANT
     ====================== */
  const wrapA = document.createElement('div');
  wrapA.className = 'assist-wrap';
  wrapA.style.display = 'none';
  const cardA = document.createElement('div');
  cardA.className = 'assist-card';
  wrapA.appendChild(cardA);
  root.appendChild(wrapA);

  const hdA = document.createElement('div');
  hdA.className = 'assist-hd';
  hdA.innerHTML = `
    <div class="assist-title">Wave Digital AI Assist</div>
    <div class="assist-actions">
      <button class="assist-btn" data-a="maxi">▢</button>
      <button class="assist-btn" data-a="close">✕</button>
    </div>
  `;
  cardA.appendChild(hdA);

  const bodyA = document.createElement('div');
  bodyA.className = 'assist-bd';
  bodyA.innerHTML = `<div id="assistant-root" style="display:flex;flex-direction:column;height:100%"></div>`;
  cardA.appendChild(bodyA);

  /* Drag Assistant */
  let dragA = null;
  const onDownA = (clientX, clientY) => { if (!MAXI_ASSIST) dragA = { sx: clientX, sy: clientY, bx: AX, by: AY }; };
  hdA.addEventListener('mousedown', (e) => { onDownA(e.clientX, e.clientY); e.preventDefault(); });
  hdA.addEventListener('touchstart', (e) => { const t=e.touches?.[0]; if(t){ onDownA(t.clientX,t.clientY); e.preventDefault(); } }, { passive:false });
  const onMoveA = (clientX, clientY) => { if (!dragA) return; AX = dragA.bx + (clientX - dragA.sx); AY = dragA.by + (clientY - dragA.sy); positionAssistant(); };
  window.addEventListener('mousemove', (e) => onMoveA(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => { const t=e.touches?.[0]; if(t) onMoveA(t.clientX, t.clientY); }, { passive:false });
  const endDragA = () => { dragA = null; };
  window.addEventListener('mouseup', endDragA);
  window.addEventListener('touchend', endDragA);

  hdA.addEventListener('click', (e) => {
    const a = e.target.closest('.assist-btn')?.dataset?.a;
    if (a === 'close') openAssistant(false);
    if (a === 'maxi') { MAXI_ASSIST = !MAXI_ASSIST; positionAssistant(); persistAssistant(); }
  });

  /* ======================
     4.4 Panneau TEMPLATES
     ====================== */
  const wrapT = document.createElement('div');
  wrapT.className = 'assist-wrap';
  wrapT.style.display = 'none';
  const cardT = document.createElement('div');
  cardT.className = 'assist-card';
  wrapT.appendChild(cardT);
  root.appendChild(wrapT);

  const hdT = document.createElement('div');
  hdT.className = 'assist-hd';
  hdT.innerHTML = `
    <div class="assist-title">Templates</div>
    <div class="assist-actions">
      <button class="assist-btn" data-a="maxi">▢</button>
      <button class="assist-btn" data-a="close">✕</button>
    </div>
  `;
  cardT.appendChild(hdT);

  const bodyT = document.createElement('div');
  bodyT.className = 'assist-bd';
  bodyT.innerHTML = `<div id="templates-root" style="display:flex;flex-direction:column;height:100%"></div>`;
  cardT.appendChild(bodyT);

  /* Drag Templates */
  let dragT = null;
  const onDownT = (clientX, clientY) => { if (!MAXI_TPL) dragT = { sx: clientX, sy: clientY, bx: TX, by: TY }; };
  hdT.addEventListener('mousedown', (e) => { onDownT(e.clientX, e.clientY); e.preventDefault(); });
  hdT.addEventListener('touchstart', (e) => { const t=e.touches?.[0]; if(t){ onDownT(t.clientX,t.clientY); e.preventDefault(); } }, { passive:false });
  const onMoveT = (clientX, clientY) => { if (!dragT) return; TX = dragT.bx + (clientX - dragT.sx); TY = dragT.by + (clientY - dragT.sy); positionTemplates(); };
  window.addEventListener('mousemove', (e) => onMoveT(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => { const t=e.touches?.[0]; if(t) onMoveT(t.clientX, t.clientY); }, { passive:false });
  const endDragT = () => { dragT = null; };
  window.addEventListener('mouseup', endDragT);
  window.addEventListener('touchend', endDragT);

  hdT.addEventListener('click', (e) => {
    const a = e.target.closest('.assist-btn')?.dataset?.a;
    if (a === 'close') openTemplates(false);
    if (a === 'maxi') { MAXI_TPL = !MAXI_TPL; positionTemplates(); persistTemplates(); }
  });

  /* =========================================================
     5) Position / Persist — Assistant
     ========================================================= */
  const LS_A = 'waveAssist.layout.assistant.v1';
  const loadA = () => { try { return JSON.parse(localStorage.getItem(LS_A)) || null; } catch { return null; } };
  const saveA = (obj) => { try { localStorage.setItem(LS_A, JSON.stringify(obj)); } catch {} };

  function positionAssistant() {
    const vw = innerWidth, vh = innerHeight;

    if (MAXI_ASSIST) {
      wrapA.style.left = PAD + 'px';
      wrapA.style.top  = PAD + 'px';
      cardA.style.width  = `calc(100vw - ${PAD*2}px)`;
      cardA.style.height = `calc(100vh - ${PAD*2}px)`;
      return;
    }

    const W = 720, H = 460;
    cardA.style.width  = W + 'px';
    cardA.style.height = H + 'px';

    if (AX == null || AY == null) {
      AX = PANEL_LEFT_ANCHOR;
      AY = vh - (H + BOTTOM_MARGIN); // aligné en bas avec petite marge
    }

    const maxX = Math.max(PAD, vw - (W + PAD));
    const maxY = Math.max(PAD, vh - (H + BOTTOM_MARGIN));

    const clampedLeft = Math.min(Math.max(PANEL_LEFT_ANCHOR, AX), maxX);
    const top = Math.min(Math.max(PAD, AY), maxY);

    wrapA.style.left = clampedLeft + 'px';
    wrapA.style.top  = top + 'px';
  }

  function persistAssistant(){ saveA({ x:AX, y:AY, maxi:MAXI_ASSIST }); }
  function restoreAssistant(){ const s = loadA(); if (s){ AX=s.x; AY=s.y; MAXI_ASSIST=!!s.maxi; } positionAssistant(); }

  /* =========================================================
     6) Position / Persist — Templates
     ========================================================= */
  // ⚠️ v2 pour « réinitialiser » l’ancienne position sauvegardée trop haute
  const LS_T = 'waveAssist.layout.templates.v2';
  const loadT = () => { try { return JSON.parse(localStorage.getItem(LS_T)) || null; } catch { return null; } };
  const saveT = (obj) => { try { localStorage.setItem(LS_T, JSON.stringify(obj)); } catch {} };

  function positionTemplates() {
    const vw = innerWidth, vh = innerHeight;

    if (MAXI_TPL) {
      wrapT.style.left = PAD + 'px';
      wrapT.style.top  = PAD + 'px';
      cardT.style.width  = `calc(100vw - ${PAD*2}px)`;
      cardT.style.height = `calc(100vh - ${PAD*2}px)`;
      return;
    }

    const W = 720, H = 460;
    cardT.style.width  = W + 'px';
    cardT.style.height = H + 'px';

    // première ouverture (ou après reset v2) → aligne en bas comme l’assistant
    if (TX == null || TY == null) {
      TX = PANEL_LEFT_ANCHOR;
      TY = vh - (H + BOTTOM_MARGIN);
    }

    const maxX = Math.max(PAD, vw - (W + PAD));
    const maxY = Math.max(PAD, vh - (H + BOTTOM_MARGIN));

    const clampedLeft = Math.min(Math.max(PANEL_LEFT_ANCHOR, TX), maxX);
    const top = Math.min(Math.max(PAD, TY), maxY);

    wrapT.style.left = clampedLeft + 'px';
    wrapT.style.top  = top + 'px';
  }

  function persistTemplates(){ saveT({ x:TX, y:TY, maxi:MAXI_TPL }); }
  function restoreTemplates(){ const s = loadT(); if (s){ TX=s.x; TY=s.y; MAXI_TPL=!!s.maxi; } positionTemplates(); }

  window.addEventListener('resize', () => { positionAssistant(); positionTemplates(); });

  /* =========================================================
     7) Montage React — Assistant + Templates
     ========================================================= */
  async function mountAssistant() {
    const getURL = (p) =>
      (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
        ? chrome.runtime.getURL(p)
        : new URL(p, import.meta.url).href;

    const flowsUrl     = getURL('flows/flows.json');
    const processesUrl = getURL('processes/index.json');
    const templatesUrl = getURL('templates/templates.json');
    const modUrl       = getURL('dist/assistant-adapter.js');

    const logoUrl = 'https://res.cloudinary.com/dc9jld4yo/image/upload/v1758959598/logo_nd0ypl.png';

    if (!('process' in window)) window.process = { env: { NODE_ENV: 'production' } };
    if (!('global'  in window)) window.global  = window;

    let loaded = false;
    try {
      await import(modUrl);
      loaded = !!(window.WaveAssist && window.WaveAssist.mount);
    } catch (e) {
      console.warn('[Assist] import() failed', e);
    }

    if (!loaded) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.type = 'module';
        s.src  = modUrl;
        s.onload  = () => resolve();
        s.onerror = () => reject(new Error('Module tag load failed'));
        (window.__WAVE_ASSIST_SHADOW__ || document.head).appendChild(s);
      });
      loaded = !!(window.WaveAssist && window.WaveAssist.mount);
    }

    if (!loaded) {
      bodyA.innerHTML = `<div style="padding:12px">Adapter non chargé.</div>`;
      return;
    }

    const mountNode = bodyA.querySelector('#assistant-root');
    window.WaveAssist.mount(mountNode, {
      open: true,
      flowsUrl,
      templatesUrl,
      processesUrl,
      __logoUrl: logoUrl,
    });
  }

  async function mountTemplates() {
    const getURL = (p) =>
      (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
        ? chrome.runtime.getURL(p)
        : new URL(p, import.meta.url).href;

    const processesUrl = getURL('processes/index.json');
    const templatesUrl = getURL('templates/templates.json');
    const modUrl       = getURL('dist/templates-adapter.js');

    if (!('process' in window)) window.process = { env: { NODE_ENV: 'production' } };
    if (!('global'  in window)) window.global  = window;

    let loaded = false;
    try {
      await import(modUrl);
      loaded = !!(window.WaveTemplates && window.WaveTemplates.mount);
    } catch (e) {
      console.warn('[Templates] import() failed', e);
    }

    if (!loaded) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.type = 'module';
        s.src  = modUrl;
        s.onload  = () => resolve();
        s.onerror = () => reject(new Error('Module tag load failed'));
        (window.__WAVE_ASSIST_SHADOW__ || document.head).appendChild(s);
      });
      loaded = !!(window.WaveTemplates && window.WaveTemplates.mount);
    }

    if (!loaded) {
      bodyT.innerHTML = `<div style="padding:12px">Adapter Templates non chargé.</div>`;
      return;
    }

    const mountNode = bodyT.querySelector('#templates-root');
    window.WaveTemplates.mount(mountNode, {
      open: true,
      templatesUrl,
      processesUrl,
    });
  }

  /* =========================================================
     8) Ouverture / Fermeture (exclusivité)
     ========================================================= */
  function openAssistant(v){
    OPEN_ASSIST = !!v;
    wrapA.style.display = OPEN_ASSIST ? 'block' : 'none';
    if (OPEN_ASSIST) { restoreAssistant(); mountAssistant(); }
  }
  function openTemplates(v){
    OPEN_TPL = !!v;
    wrapT.style.display = OPEN_TPL ? 'block' : 'none';
    if (OPEN_TPL) { restoreTemplates(); mountTemplates(); }
  }
}
