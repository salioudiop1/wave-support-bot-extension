import React from 'react';
import { createRoot } from 'react-dom/client';
import TemplatesByProcessModal from './TemplatesModal.jsx';
import styles from './assistant.css?inline';

async function fetchJson(url) {
  if (!url) return null;
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    console.error('[TemplatesAdapter] fetchJson failed:', url, e);
    return null;
  }
}

async function loadTemplates(templatesUrl) {
  const j = await fetchJson(templatesUrl);
  if (!j) return { processes: [], templatesBySlug: {} };

  if (j && (j.templatesBySlug || j.processes)) {
    return {
      processes: Array.isArray(j.processes) ? j.processes : [],
      templatesBySlug: j.templatesBySlug || {},
    };
  }
  if (j && !Array.isArray(j)) {
    return { processes: [], templatesBySlug: j };
  }
  if (Array.isArray(j)) {
    return { processes: j, templatesBySlug: {} };
  }
  return { processes: [], templatesBySlug: {} };
}

async function loadProcesses(processesUrl) {
  const j = await fetchJson(processesUrl);
  if (!j) return [];
  if (Array.isArray(j)) return j;
  if (Array.isArray(j.processes)) return j.processes;
  return [];
}

window.WaveTemplates = {
  async mount(el, opts = {}) {
    const { open = true, templatesUrl, processesUrl } = opts;

    const { processes: pFromTemplates, templatesBySlug } = await loadTemplates(templatesUrl);
    const pFromIndex = await loadProcesses(processesUrl);
    const processes = pFromIndex.length ? pFromIndex : pFromTemplates;

    // Inject CSS (shadow si présent)
    const rootNode = el.getRootNode && el.getRootNode();
    const shadow = rootNode && rootNode.host ? rootNode : null;
    if (shadow && !shadow.__ASSIST_CSS__) {
      const tag = document.createElement('style');
      tag.textContent = styles;
      shadow.appendChild(tag);
      shadow.__ASSIST_CSS__ = true;
    } else if (!shadow) {
      const id = '__assist_css__';
      if (!document.getElementById(id)) {
        const tag = document.createElement('style');
        tag.id = id;
        tag.textContent = styles;
        document.head.appendChild(tag);
      }
    }

    const root = createRoot(el);
    root.render(
      <TemplatesByProcessModal
        open={open}
        onClose={()=>{}}
        templatesBySlug={templatesBySlug}
        processes={processes}
        embedded={true}            // <<< important : pas d’overlay, pas de header interne
      />
    );
    return root;
  },
};
