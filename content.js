// content.js
(() => {
  if (window.__WAVE_ASSIST_INJECTED__) return;
  window.__WAVE_ASSIST_INJECTED__ = true;

  const host = document.createElement('div');
  host.id = 'wave-assist-host';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // Rendre le shadow accessible au module
  window.__WAVE_ASSIST_SHADOW__ = shadow;
  host.shadowRoot.__WAVE_ASSIST_SHADOW__ = shadow;

  // Charger le module après l’expo
  const s = document.createElement('script');
  s.type = 'module';
  s.src = chrome.runtime.getURL('widget.js');
  s.onload = () => s.remove();
  shadow.appendChild(s);
})();
