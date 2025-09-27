// ProcessAssistantModal.jsx
import React from 'react';

/* ===== Icônes SVG inline (héritent de currentColor) ===== */
const Icon = {
  Search:(p)=>(<svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  Send:(p)=>(<svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  Reset:(p)=>(<svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>),
  Restart:(p)=>(<svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>),
  Copy:(p)=>(<svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>),
  Check:(p)=>(<svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  File:(p)=>(<svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>),
  ChevronRight:(p)=>(<svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>),
  ArrowLeft:(p)=>(<svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>),
  Home:(p)=>(<svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7"/><path d="M9 22V12h6v10"/></svg>),
  Close:(p)=>(<svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),

  /* Nouveaux pour agrandir/réduire */
  Maximize:(p)=>(<svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><line x1="14" y1="10" x2="21" y2="3"/><polyline points="9 21 3 21 3 15"/><line x1="10" y1="14" x2="3" y2="21"/></svg>),
  Minimize:(p)=>(<svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 3 3 3 3 9"/><line x1="10" y1="10" x2="3" y2="3"/><polyline points="15 21 21 21 21 15"/><line x1="14" y1="14" x2="21" y2="21"/></svg>),
};

/* ===== Utils ===== */
async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch { return false; }
  }
}

const normalized = (s='') => s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function Highlight({ text = '', query = '' }) {
  const q = (query || '').trim();
  if (!q || q.length < 3) return <>{text}</>;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${esc(q)})`, 'ig');
  const html = String(text).replace(re, '<mark>$1</mark>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ===== Template block style “ChatGPT code block”, éditable ===== */
function ChatTemplateBubble({ def }) {
  const [copied, setCopied] = React.useState(false);
  const langKeys = Object.keys(def?.langs || {});
  const defaultLang = langKeys.includes('fr') ? 'fr' : (langKeys[0] || 'fr');
  const [lang, setLang] = React.useState(defaultLang);
  const [txt, setTxt]   = React.useState(def?.langs?.[defaultLang] || '');
  const taRef = React.useRef(null);

  React.useEffect(() => { setTxt(def?.langs?.[lang] || ''); }, [lang, def]);

  // Auto-grow (hauteur max)
  const MAX_H = 280;
  const autoGrow = React.useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const next = Math.min(ta.scrollHeight, MAX_H);
    ta.style.height = next + 'px';
    ta.style.overflowY = ta.scrollHeight > MAX_H ? 'auto' : 'hidden';
  }, []);
  React.useEffect(() => { autoGrow(); }, [txt, autoGrow]);
  React.useEffect(() => { autoGrow(); }, []);

  const onCopy = async () => {
    const ok = await copyToClipboard(txt);
    if (ok) { setCopied(true); setTimeout(()=>setCopied(false), 1200); }
  };
  const onReset = () => setTxt(def?.langs?.[lang] || '');

  return (
    <div className="tpl-shell">
      <div className="tpl-top">
        <div className="tpl-meta">
          <div className="tpl-title">{def?.label || 'Message'}</div>
        </div>
        <div className="lang-pills">
          {langKeys.map(k=>(
            <button
              key={k}
              className={`lang-pill ${k===lang?'active':''}`}
              onClick={()=>setLang(k)}
              title={k.toUpperCase()}
            >
              {k.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <textarea
        ref={taRef}
        className="tpl-code"
        value={txt}
        onChange={(e)=>setTxt(e.target.value)}
        spellCheck="true"
        aria-label="Message éditable"
        style={{ height: 'auto', maxHeight: MAX_H, overflowY: 'hidden' }}
      />

      <div className="tpl-bottom">
        <button className="tpl-btn" onClick={onReset} title="Réinitialiser">
          <Icon.Reset style={{marginRight:8}} /> <span>Réinitialiser</span>
        </button>
        <button className={`tpl-btn ${copied ? 'success' : ''}`} onClick={onCopy} title={copied ? 'Copié' : 'Copier'}>
          {copied ? <Icon.Check style={{marginRight:8}}/> : <Icon.Copy style={{marginRight:8}}/>}
          <span>{copied ? 'Copié' : 'Copier'}</span>
        </button>
      </div>
    </div>
  );
}

/* ===== Chat bubble wrapper ===== */
function ChatTurn({ role = 'asst', children, wide = false }) {
  return (
    <div className={`chat-turn ${role === 'user' ? 'user' : 'asst'}`}>
      <div
        className={`chat-msg ${wide ? 'wide' : ''}`}
        style={wide ? { maxWidth: '80%', width: '80%', flexBasis: '80%' } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

export default function ProcessAssistantModal({
  open,
  onClose,
  processes,
  templatesBySlug,
  __flowsUrl,
  __logoUrl="/logo.png",
  __headerless = false
}) {
  const EMBED = !!__headerless;

  const [phase, setPhase] = React.useState('idle');
  const [input, setInput] = React.useState('');
  const [selectedSlug, setSelectedSlug] = React.useState('');
  const [messages, setMessages] = React.useState([]);
  const [highlightIndex, setHighlightIndex] = React.useState(-1);
  const [toast, setToast] = React.useState('');
  const [logoBroken, setLogoBroken] = React.useState(false);
  const [isMax, setIsMax] = React.useState(false); // << NEW
  const scrollRef = React.useRef(null);

  // =========================
  // PERSISTENCE
  // =========================
  const STORAGE_KEY = 'ProcessAssistantModal.v2';

  const packMessages = React.useCallback((msgs = [], currentSlug = '') => {
    return (msgs || []).map(m => {
      if (m.type === 'template') {
        return { type: 'template', templateId: m.templateDef?.id, slug: currentSlug };
      }
      if (m.type === 'decision') {
        return { type: 'decision', options: (m.options || []).map(o => ({ label: o.label, next: o.next })) };
      }
      if (m.type === 'assistant' || m.type === 'user') {
        return { type: m.type, text: m.text };
      }
      return m;
    });
  }, []);

  const saveState = React.useCallback((overrides = {}) => {
    try {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      const payload = {
        phase,
        selectedSlug,
        input,
        isMax, // << persist
        scrollTop,
        messages: packMessages(messages, selectedSlug),
        ts: Date.now(),
        ...overrides,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, [phase, selectedSlug, input, isMax, messages, packMessages]);

  const loadState = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : null;
    } catch { return null; }
  }, []);

  const clearState = React.useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  // =========================
  // Flows externes
  // =========================
  const FLOWS_VERSION = 1;
  const [flows, setFlows] = React.useState(null);
  const [flowsLoading, setFlowsLoading] = React.useState(false);
  const [flowsError, setFlowsError] = React.useState('');

  const loadFlows = async () => {
    try {
      setFlowsLoading(true);
      setFlowsError('');
      const baseUrl = __flowsUrl || `/processes/flows.json`;
      const res = await fetch(`${baseUrl}?v=${FLOWS_VERSION}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFlows(data?.flows || {});
    } catch (e) {
      console.error(e);
      setFlows({});
      setFlowsError('load-error');
    } finally {
      setFlowsLoading(false);
    }
  };

  React.useEffect(() => {
    const active = EMBED ? (open !== false) : open;
    if (active && flows === null && !flowsLoading) loadFlows();
  }, [open, EMBED, flows, flowsLoading]);

  // =========================
  // Suggestions (≥ 3 lettres)
  // =========================
  const suggestions = React.useMemo(() => {
    const q = normalized(input.trim());
    if (q.length < 3) return [];
    const arr = Array.isArray(processes) ? processes : [];
    return arr
      .map(p => ({ ...p, hay: normalized([p.title, p.summary, p.slug, (p.tags||[]).join(' ')].join(' ')) }))
      .filter(p => p.hay.includes(q))
      .slice(0, 6);
  }, [input, processes]);

  const bestMatch = React.useCallback(() => {
    const q = normalized(input.trim());
    if (!q) return null;
    const arr = Array.isArray(processes) ? processes : [];
    let m = arr.find(p => normalized(p.slug) === q)
      || arr.find(p => normalized(p.title) === q);
    if (m) return m;
    m = arr.find(p => normalized(p.title).startsWith(q))
      || arr.find(p => (p.tags||[]).some(t => normalized(t).startsWith(q)));
    if (m) return m;
    m = arr.find(p => normalized([p.title,p.summary,p.slug,(p.tags||[]).join(' ')].join(' ')).includes(q));
    return m || null;
  }, [input, processes]);

  // =========================
  // Templates
  // =========================
  const getTemplateDef = React.useCallback((slug, templateId) => {
    const fromSlug = (templatesBySlug?.[slug] || []).find(t => t.id === templateId);
    if (fromSlug) return fromSlug;
    const fromCommon = (templatesBySlug?.common || []).find(t => t.id === templateId);
    if (fromCommon) return fromCommon;
    for (const s of Object.keys(templatesBySlug || {})) {
      const f = (templatesBySlug[s] || []).find(t => t.id === templateId);
      if (f) return f;
    }
    return null;
  }, [templatesBySlug]);

  const unpackMessages = React.useCallback((packed = []) => {
    return (packed || []).map(m => {
      if (m.type === 'template') {
        const def = getTemplateDef(m.slug, m.templateId);
        return def ? { type: 'template', templateDef: def } : { type: 'assistant', text: 'Template indisponible.' };
      }
      return m;
    });
  }, [getTemplateDef]);

  // =========================
  // Déroulé d'un flow
  // =========================
  const pushNode = (node, slug) => {
    if (!node) return;
    const batch = [];
    if (node.text) batch.push({ type: 'assistant', text: node.text });
    if (node.templateId) batch.push({ type: 'template', templateDef: getTemplateDef(slug, node.templateId) });
    if (node.type !== 'end') {
      if (node.options?.length) {
        batch.push({ type: 'decision', options: node.options });
      } else if (node.next) {
        setMessages(prev => [...prev, ...batch]);
        const nxt = flows?.[slug]?.nodes?.[node.next];
        if (nxt) setTimeout(()=>pushNode(nxt, slug), 0);
        return;
      }
    }
    setMessages(prev => [...prev, ...batch]);
  };

  const startFlow = (slug, { initialUserHeader = true } = {}) => {
    setSelectedSlug(slug);
    setPhase('run');

    const proc = (Array.isArray(processes) ? processes : []).find(p => p.slug === slug);
    const header = proc?.title || slug;
    setMessages(initialUserHeader ? [{ type: 'user', text: header }] : []);

    if (flowsLoading) {
      setMessages(prev => [...prev, { type:'assistant', text:"Chargement des flows…" }]);
      return;
    }
    if (!flows || !flows[slug]) {
      setMessages(prev => [...prev, { type:'assistant', text:"Aucun flow défini pour ce process pour le moment." }]);
      return;
    }

    const first = flows[slug].nodes?.[flows[slug].start];
    if (!first) {
      setMessages(prev => [...prev, { type:'assistant', text:"Flow invalide : nœud de départ introuvable." }]);
      return;
    }
    pushNode(first, slug);
    setTimeout(()=>scrollRef.current?.scrollTo?.({ top: 999999, behavior:'smooth' }), 50);
  };

  const startNewFlow = (pick) => {
    setInput('');
    const slug = typeof pick === 'string' ? pick : pick?.slug;
    if (!slug) return;
    startFlow(slug);
  };

  const pickOption = (opt) => {
    if (!opt?.next || !selectedSlug) return;
    const nxt = flows?.[selectedSlug]?.nodes?.[opt.next];

    setMessages(prev => {
      const arr = [...prev];
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].type === 'decision') { arr.splice(i, 1); break; }
      }
      arr.push({ type: 'user', text: opt.label });
      return arr;
    });

    if (nxt) {
      setTimeout(() => {
        pushNode(nxt, selectedSlug);
        setTimeout(()=>scrollRef.current?.scrollTo?.({ top: 999999, behavior:'smooth' }), 30);
      }, 30);
    }
  };

  // =========================
  // Helpers reset/relance
  // =========================
  const resetToIdle = () => {
    setPhase('idle');
    setSelectedSlug('');
    setMessages([]);
    setHighlightIndex(-1);
    setInput('');
    clearState();
  };

  const restartFlow = () => {
    if (!selectedSlug || flowsLoading) return;
    startFlow(selectedSlug);
  };

  // =========================
  // UX clavier
  // =========================
  React.useEffect(() => {
    const active = EMBED ? (open !== false) : open;
    if (!active) return;
    const onKey = (e) => {
      const hasSugg = suggestions.length > 0;

      if (hasSugg) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1)); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlightIndex(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter') {
          e.preventDefault();
          const pick = highlightIndex >= 0 ? suggestions[highlightIndex] : suggestions[0];
          if (pick) return startNewFlow(pick);
        }
      }
      if (e.key === 'Enter' && !hasSugg && input.trim()) {
        const m = bestMatch();
        if (m) return startNewFlow(m);
        setTimeout(()=>setToast(''), 1400);
      }
      if (e.key === 'Escape') handleClose();
      if (e.altKey && (e.key === 'h' || e.key === 'H')) { // raccourci Accueil
        e.preventDefault();
        resetToIdle();
      }
      if (e.altKey && (e.key === 'm' || e.key === 'M')) { // raccourci Max/Min
        e.preventDefault();
        setIsMax(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, EMBED, suggestions.length, highlightIndex, input, bestMatch]); // handleClose défini plus bas

  // =========================
  // RESTORE
  // =========================
  const unpackMessagesMemo = unpackMessages;
  React.useLayoutEffect(() => {
    const active = EMBED ? (open !== false) : open;
    if (!active) return;
    const restored = loadState();
    if (!restored) return;

    try {
      setInput(restored.input || '');
      setIsMax(!!restored.isMax); // << restore
      if (restored.phase === 'run' && restored.selectedSlug) {
        setSelectedSlug(restored.selectedSlug);
        setPhase('run');
        const rebuilt = unpackMessagesMemo(restored.messages || []);
        setMessages(rebuilt);
        requestAnimationFrame(() => {
          const y = Number(restored.scrollTop || 0);
          if (Number.isFinite(y)) scrollRef.current?.scrollTo?.({ top: y, behavior: 'auto' });
        });
      } else {
        setPhase('idle');
      }
    } catch (e) {
      console.warn('Restore failed', e);
    }
  }, [open, EMBED, loadState, unpackMessagesMemo]);

  // =========================
  // SAVE continu + à la fermeture + scroll
  // =========================
  React.useEffect(() => {
    const active = EMBED ? (open !== false) : open;
    if (!active) return;
    saveState();
  }, [open, EMBED, phase, selectedSlug, messages, input, isMax, saveState]);

  const handleClose = React.useCallback(() => {
    saveState();
    onClose?.();
  }, [onClose, saveState]);

  React.useEffect(() => {
    const active = EMBED ? (open !== false) : open;
    if (!active) return;
    let t = null;
    const onScroll = () => {
      if (t) cancelAnimationFrame(t);
      t = requestAnimationFrame(() => saveState());
    };
    const el = scrollRef.current;
    el?.addEventListener?.('scroll', onScroll, { passive: true });
    return () => el?.removeEventListener?.('scroll', onScroll);
  }, [open, EMBED, saveState]);

  // ===== Rendu =====
  const Hero = (
    <div className="assistant-hero">
      <div className="hero-circle clip">
        {!logoBroken && __logoUrl && (
          <img
            src={__logoUrl}
            alt="Wave"
            className="hero-logo-clip"
            loading="lazy"
            onError={()=>setLogoBroken(true)}
          />
        )}
        {(logoBroken || !__logoUrl) && <div className="hero-fallback">W</div>}
      </div>
      <div className="hero-title">Ask anything about processes</div>
      <div className="hero-sub">Tape un mot-clé pour trouver le bon process</div>

      <div className="chips">
        {['Reset PIN', 'Déplafonnement', 'Dormancy Block'].map((label, i)=>{
          const arr = Array.isArray(processes) ? processes : [];
          const pick =
            arr.find(p => normalized(p.title) === normalized(label)) ||
            arr.find(p => normalized(p.title).includes(normalized(label))) ||
            null;
          return (
            <button
              key={i}
              className="chip"
              onClick={()=> pick ? startNewFlow(pick) : setInput(label)}
              title={label}
            >
              {label}
            </button>
          );
        })}
      </div>

      {flowsError && (
        <div className="note-card warning mt-3">
          Impossible de charger <code>/processes/flows.json</code>.
          <button className="btn btn-sm btn-outline-secondary ms-2" onClick={loadFlows}>Réessayer</button>
        </div>
      )}
    </div>
  );

  const Body = (
    <div className="assistant-body" ref={scrollRef} style={{ flex:1, minHeight:0, overflow:'auto' }}>
      {phase === 'idle'  && Hero}
      {phase === 'run' && (
        <div className="chat-area">
          {messages.map((m, idx) => {
            if (m.type === 'assistant') {
              return (
                <ChatTurn key={idx} role="asst">
                  <div className="msg-text">{m.text}</div>
                </ChatTurn>
              );
            }
            if (m.type === 'template') {
              return (
                <ChatTurn key={idx} role="asst" wide>
                  <ChatTemplateBubble def={m.templateDef} />
                </ChatTurn>
              );
            }
            if (m.type === 'decision') {
              return (
                <ChatTurn key={idx} role="user">
                  <div className="qr-panel">
                    {m.options.map((o, i) => (
                      <button key={i} className="qr-btn" onClick={() => pickOption(o)}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </ChatTurn>
              );
            }
            if (m.type === 'user') {
              return (
                <ChatTurn key={idx} role="user">
                  <div className="msg-text user">{m.text}</div>
                </ChatTurn>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );

  const InputBar = (
    <div className="assistant-input-wrap ai">
      {toast && <div className="ai-toast">{toast}</div>}
      <div className="ai-input">
        <span className="ai-input-icon" aria-hidden="true"><Icon.Search/></span>
        <input
          className="ai-input-field"
          placeholder="Ask me anything"
          value={input}
          onChange={e => { setInput(e.target.value); setHighlightIndex(-1); saveState({ input: e.target.value }); }}
        />
        {phase === 'run' && (
          <button
            className="ai-input-restart"
            onClick={restartFlow}
            aria-label="Recommencer le flow"
            title="Recommencer le flow"
            disabled={!selectedSlug || flowsLoading}
          >
            <Icon.Restart />
          </button>
        )}
        {/* Bouton Accueil (remplace l’ancien bouton Send) */}
        <button
            className="ai-input-home"
            onClick={() => { resetToIdle(); }}
            aria-label="Accueil"
            title="Accueil (Alt+H)"
        >
            <Icon.Home />
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="ai-suggest">
          {suggestions.map((p, i)=>(
            <button
              key={p.slug}
              className={`ai-suggest-item ${i===highlightIndex?'active':''}`}
              onClick={()=>startNewFlow(p)}
              title={p.title}
            >
              <div className="ai-suggest-icon"><Icon.File /></div>
              <div className="ai-suggest-texts">
                <div className="ai-suggest-title">
                  <Highlight text={p.title} query={input} />
                </div>
                {p.summary && (
                  <div className="ai-suggest-sub">
                    <Highlight text={p.summary} query={input} />
                  </div>
                )}
                {Array.isArray(p.tags) && p.tags.length>0 && (
                  <div className="ai-suggest-tags">
                    {p.tags.slice(0,3).map((t, idx)=>(
                      <span key={idx} className="ai-tag">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <span className="ai-suggest-caret"><Icon.ChevronRight /></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (EMBED) {
    return (
      <div className="assistant-root" style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0 }}>
        {Body}
        {InputBar}
      </div>
    );
  }

  if (!open) return null;
  return (
    <div className="modal-overlay modal-overlay-glass" role="dialog" aria-modal="true" onClick={handleClose}>
      <div
        className={`modal-card qto-modal modal-elevated assistant-modal ${isMax ? 'is-max' : ''}`}
        onClick={(e)=>e.stopPropagation()}
        style={isMax
          ? { width:'min(98vw, 1024px)', height:'min(95vh, 800px)', display:'flex', flexDirection:'column' }
          : { width:'min(96vw, 680px)',  height:'min(88vh, 620px)',  display:'flex', flexDirection:'column' }
        }
      >
        <div className="assistant-header">
          <div className="d-flex align-items-center gap-2">
            {phase === 'run' && (
              <button className="btn btn-ghost px-2 assistant-back" onClick={resetToIdle} aria-label="Retour" title="Réinitialiser la session">
                <Icon.ArrowLeft />
              </button>
            )}
            <span className="fw-700">Wave Digital AI Assist</span>
            {flowsLoading && <span className="small text-muted ms-2">· chargement…</span>}
            {flowsError && (
              <button className="btn btn-link btn-sm text-danger ms-2 p-0" onClick={loadFlows}>
                Réessayer
              </button>
            )}
          </div>

          <div className="d-flex align-items-center gap-1">
            {/* Nouveau bouton Accueil près des contrôles */}
            <button
              className="btn btn-ghost px-2 assistant-home"
              onClick={(e)=>{ e.stopPropagation(); resetToIdle(); }}
              aria-label="Accueil"
              title="Accueil (Alt+H)"
            >
              <Icon.Home />
            </button>

            {/* Nouveau bouton Agrandir/Réduire */}
            <button
              className="btn btn-ghost px-2 assistant-maximize"
              onClick={(e)=>{ e.stopPropagation(); setIsMax(v=>!v); saveState({ isMax: !isMax }); }}
              aria-label={isMax ? 'Réduire' : 'Agrandir'}
              title={(isMax ? 'Réduire' : 'Agrandir') + ' (Alt+M)'}
            >
              {isMax ? <Icon.Minimize/> : <Icon.Maximize/>}
            </button>

            {/* Bouton Fermer */}
            <button
              className="btn btn-ghost rounded-circle assistant-close"
              onClick={(e)=>{ e.stopPropagation(); handleClose(); }}
              aria-label="Fermer"
              title="Fermer"
            >
              <Icon.Close />
            </button>
          </div>
        </div>

        {Body}
        {InputBar}
      </div>
    </div>
  );
}

