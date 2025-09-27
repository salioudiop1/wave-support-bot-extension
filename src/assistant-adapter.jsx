// src/assistant-adapter.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import ProcessAssistantModal from './ProcessAssistantModal.jsx';
import styles from './assistant.css?inline';

/* ---------------------------------------------------
   Loaders robustes (acceptent plusieurs formats)
   --------------------------------------------------- */

async function fetchJson(url) {
  if (!url) return null;
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    console.error('[Assist] fetchJson failed:', url, e);
    return null;
  }
}

/** Charge le fichier de templates.
 *  Accepte :
 *   - { processes, templatesBySlug }
 *   - { "<slug>": [ {id,label,langs…}, … ], … }  (mapping brut)
 *   - [ {slug,title,…}, … ] (liste de processes)
 */
async function loadTemplates(templatesUrl) {
  const j = await fetchJson(templatesUrl);
  if (!j) return { processes: [], templatesBySlug: {} };

  // Format attendu
  if (j && (j.templatesBySlug || j.processes)) {
    return {
      processes: Array.isArray(j.processes) ? j.processes : [],
      templatesBySlug: j.templatesBySlug || {},
    };
  }

  // Mapping brut par slug
  if (j && !Array.isArray(j)) {
    return { processes: [], templatesBySlug: j };
  }

  // Tableau => probablement une liste de process
  if (Array.isArray(j)) {
    return { processes: j, templatesBySlug: {} };
  }

  return { processes: [], templatesBySlug: {} };
}

/** Charge la liste des processes (index dédié). */
async function loadProcesses(processesUrl) {
  const j = await fetchJson(processesUrl);
  if (!j) return [];
  if (Array.isArray(j)) return j;                 // [ {slug,title,…} ]
  if (Array.isArray(j.processes)) return j.processes;
  return [];
}

/** Fallback : dérive une liste de process à partir des flows. */
async function loadProcessesFromFlows(flowsUrl) {
  const j = await fetchJson(flowsUrl);
  if (!j || !j.flows) return [];
  try {
    return Object.entries(j.flows).map(([slug, f]) => ({
      slug,
      title: f?.title || slug,
      summary: f?.summary || '',
      tags: f?.tags || [],
    }));
  } catch {
    return [];
  }
}

/* ---------------------------------------------------
   Export global : window.WaveAssist.mount(el, opts)
   --------------------------------------------------- */

window.WaveAssist = {
  /**
   * @param {HTMLElement} el - conteneur de montage
   * @param {Object} opts
   *  - open         : bool (par défaut true)
   *  - flowsUrl     : string (obligatoire pour les flows)
   *  - templatesUrl : string (fichier des templates)
   *  - processesUrl : string (fichier de la liste de process)
   *  - __logoUrl    : string (injecté par widget.js ; prioritaire)
   */
  async mount(el, opts = {}) {
    const {
      open = true,
      flowsUrl,
      templatesUrl,       // ex: new URL('templates/templates.json', import.meta.url).href
      processesUrl,       // ex: new URL('processes/index.json', import.meta.url).href
      __logoUrl,          // prioritaire si fourni par widget.js
    } = opts;

    // 1) Charger templates (peut ramener aussi une liste de processes)
    const { processes: pFromTemplates, templatesBySlug } = await loadTemplates(templatesUrl);

    // 2) Charger la liste de processes dédiée (prend le dessus si non-vide)
    const pFromIndex = await loadProcesses(processesUrl);

    // 3) Fallback depuis flows si toujours vide
    let processes = pFromIndex.length ? pFromIndex : pFromTemplates;
    if ((!processes || processes.length === 0) && flowsUrl) {
      const pFromFlows = await loadProcessesFromFlows(flowsUrl);
      if (pFromFlows.length) processes = pFromFlows;
    }

    // 4) Injecter le CSS dans le Shadow root (ou à défaut dans le document)
    const rootNode = el.getRootNode && el.getRootNode();
    const shadow = rootNode && rootNode.host ? rootNode : null;
    if (shadow && !shadow.__ASSIST_CSS__) {
      const tag = document.createElement('style');
      tag.textContent = styles;
      shadow.appendChild(tag);
      shadow.__ASSIST_CSS__ = true;
    } else if (!shadow) {
      // fallback hors shadow root
      const id = '__assist_css__';
      if (!document.getElementById(id)) {
        const tag = document.createElement('style');
        tag.id = id;
        tag.textContent = styles;
        document.head.appendChild(tag);
      }
    }

    // 5) Assets (logo) — priorité à __logoUrl, puis chrome.runtime.getURL, puis import.meta.url
    const logoUrl =
      (__logoUrl && String(__logoUrl)) ||
      (typeof chrome !== 'undefined' && chrome.runtime?.getURL
        ? chrome.runtime.getURL('assets/logo.png')
        : new URL('assets/logo.png', import.meta.url).href);

    // 6) Wrapper avec props internes
    const WithFlows = (p) => (
      <ProcessAssistantModal
        {...p}
        __flowsUrl={flowsUrl}
        __logoUrl={logoUrl}
        __headerless={true}
      />
    );

    // 7) Mount React
    const root = createRoot(el);
    root.render(
      <WithFlows open={open} processes={processes} templatesBySlug={templatesBySlug} />
    );
    return root;
  },
};
