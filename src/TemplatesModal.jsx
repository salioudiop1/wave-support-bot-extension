import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===== Utils ===== */
const strip = (s='') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/* Icônes SVG simples (pas de dépendance FA) */
const Icon = {
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  copy: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="9" width="10" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
      <rect x="5" y="5" width="10" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
    </svg>
  ),
  reset: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M3 5v4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

/* Clipboard */
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

/* ===== Carte template ===== */
function TemplateCard({ item, copiedId, setCopiedId }) {
  const langs = Object.keys(item?.langs || {});
  const defaultLang = langs.includes('fr') ? 'fr' : (langs[0] || 'fr');
  const [lang, setLang]   = useState(defaultLang);
  const [value, setValue] = useState(item?.langs?.[defaultLang] || '');
  const id = item?.id || `${(item?.label || 'tpl')}:${defaultLang}`;

  useEffect(() => {
    const dft = langs.includes('fr') ? 'fr' : (langs[0] || 'fr');
    setLang(dft);
    setValue(item?.langs?.[dft] || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  useEffect(() => {
    setValue(item?.langs?.[lang] || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const onCopy = async () => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 1200);
    }
  };

  const onReset = () => setValue(item?.langs?.[lang] || '');

  return (
    <div className="tpl-card">
      <div className="tpl-card-head">
        <h4 className="tpl-card-title">{item?.label || item?.id || 'Template'}</h4>

        {/* Pills langues */}
        <div className="tpl-lang-pills" aria-label="Langues">
          {langs.map(k => (
            <button
              key={k}
              className={`tpl-lang-pill ${k === lang ? 'active' : ''}`}
              onClick={() => setLang(k)}
              title={k.toUpperCase()}
              type="button"
            >
              {k.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="tpl-card-body">
        <div className="tpl-editor">
          <textarea
            className="tpl-editor-textarea"
            value={value}
            onChange={(e)=>setValue(e.target.value)}
            spellCheck="true"
          />
        </div>
        {/* (hint retiré à ta demande) */}
      </div>

      <div className="tpl-card-foot">
        <button
          className="tpl-reset-btn"
          onClick={onReset}
          title="Réinitialiser"
          aria-label="Réinitialiser"
          type="button"
        >
          {Icon.reset}
        </button>

        <button
          className="btn-copy btn-copy-right"
          onClick={onCopy}
          title="Copier"
          aria-label="Copier"
          type="button"
        >
          {Icon.copy}
        </button>

        {copiedId === id && <span className="copied-toast">Copié ✅</span>}
      </div>
    </div>
  );
}

/* =========================
   Templates — Modal / Panel
   ========================= */
export default function TemplatesByProcessModal({
  open,
  onClose,
  templatesBySlug,
  processes,
  embedded = true, // on reste en panel embarqué dans ton widget
}) {
  const [activeSlug, setActiveSlug] = useState('');
  const [qCat, setQCat] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const gridRef = useRef(null);

  const humanize = (slug='') =>
    slug.replace(/[-_]+/g,' ').replace(/\b\w/g, s => s.toUpperCase());

  const { stdList, procList, allList } = useMemo(() => {
    const procs = Array.isArray(processes) ? processes : [];
    const procBasics = procs.map(p => ({ slug: p.slug, title: p.title }));

    const templateSlugs = Object.keys(templatesBySlug || {});
    const knownProcSlugs = new Set(procBasics.map(p => p.slug));

    const standards = templateSlugs
      .filter(slug => !knownProcSlugs.has(slug))
      .map(slug => ({ slug, title: humanize(slug) }));

    const addCount = (arr) =>
      arr
        .map(x => ({
          ...x,
          count: Array.isArray(templatesBySlug?.[x.slug])
            ? templatesBySlug[x.slug].length
            : 0,
        }))
        .sort((a,b) => a.title.localeCompare(b.title));

    const stdList_  = addCount(standards);
    const procList_ = addCount(procBasics);
    const allList_  = [...stdList_, ...procList_];

    return { stdList: stdList_, procList: procList_, allList: allList_ };
  }, [processes, templatesBySlug]);

  const filteredStd = useMemo(() => {
    const needle = strip(qCat);
    if (!needle) return stdList;
    return stdList.filter(c => strip(c.title).includes(needle));
  }, [stdList, qCat]);

  const filteredProc = useMemo(() => {
    const needle = strip(qCat);
    if (!needle) return procList;
    return procList.filter(c => strip(c.title).includes(needle));
  }, [procList, qCat]);

  const active = allList.find(x => x.slug === activeSlug) || null;
  const activeList = Array.isArray(templatesBySlug?.[activeSlug]) ? templatesBySlug[activeSlug] : [];

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);

    if (!activeSlug && allList.length) {
      const firstWithItems =
        (stdList.find(x => x.count > 0) || procList.find(x => x.count > 0)) ||
        (stdList[0] || procList[0]);
      if (firstWithItems) setActiveSlug(firstWithItems.slug);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, activeSlug, allList, stdList, procList]);

  useEffect(() => {
    setCopiedId('');
    gridRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
  }, [activeSlug]);

  if (!open) return null;

  /* --- EMBEDDED PANEL --- */
  if (embedded) {
    return (
      <div className="tpl-panel-root" style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0 }}>
        <div className="tpl-modal-body" style={{ flex:1, minHeight:0 }}>
          {/* Sidebar */}
          <aside className="tpl-sidebar" aria-label="Catégories">
            <div className="searchbar mb-2" style={{ overflow:'hidden' }}>
              <input
                value={qCat}
                onChange={(e)=>setQCat(e.target.value)}
                className="searchbar-input"
                placeholder="Rechercher une catégorie…"
                aria-label="Rechercher une catégorie"
              />
              <span className="searchbar-icon" aria-hidden="true">{Icon.search}</span>
            </div>

            {/* Standards */}
            {filteredStd.length > 0 && (
              <div className="tpl-sidebar-section">
                <div className="tpl-sidebar-label">Standards</div>
                <ul className="tpl-proc-list">
                  {filteredStd.map(cat => (
                    <li key={`std:${cat.slug}`}>
                      <button
                        className={`tpl-proc-btn ${cat.slug===activeSlug ? 'active' : ''}`}
                        onClick={() => setActiveSlug(cat.slug)}
                        aria-pressed={cat.slug===activeSlug}
                        title={cat.title}
                      >
                        <span className="proc-title">{cat.title}</span>
                        <span className={`proc-badge ${cat.count>0 ? '' : 'empty'}`}>{cat.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Process */}
            <div className="tpl-sidebar-section">
              <div className="tpl-sidebar-label">Process</div>
              <ul className="tpl-proc-list">
                {filteredProc.map(proc => (
                  <li key={`proc:${proc.slug}`}>
                    <button
                      className={`tpl-proc-btn ${proc.slug===activeSlug ? 'active' : ''}`}
                      onClick={() => setActiveSlug(proc.slug)}
                      aria-pressed={proc.slug===activeSlug}
                      title={proc.title}
                    >
                      <span className="proc-title">{proc.title}</span>
                      <span className={`proc-badge ${proc.count>0 ? '' : 'empty'}`}>{proc.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main */}
          <section className="tpl-main">
            <div className="tpl-results small text-muted">
              {Array.isArray(activeList) ? activeList.length : 0} résultat(s){' '}
              {active ? <>dans « <strong>{active.title}</strong> »</> : null}
            </div>

            <div className="tpl-grid" ref={gridRef} key={activeSlug}>
              {activeList.map((it, idx) => (
                <TemplateCard
                  key={`${activeSlug}:${it.id || idx}`}
                  item={it}
                  copiedId={copiedId}
                  setCopiedId={setCopiedId}
                />
              ))}

              {activeList.length === 0 && (
                <div className="note-card">Aucun template n’est défini pour cet onglet.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  /* (modal classique conservé si besoin ailleurs) */
  return null;
}
