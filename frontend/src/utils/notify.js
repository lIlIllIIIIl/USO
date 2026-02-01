/**
 * Affiche une notification en haut à gauche (vanilla, sans lib).
 * @param {string} message - Texte à afficher
 * @param { 'success' | 'error' } [type='success'] - Type pour le style
 * @param {number} [duration=4000] - Durée en ms avant disparition
 */
export function notify(message, type = 'success', duration = 4000) {
  const id = 'uso-notify-' + Date.now();
  const sheet = document.getElementById('uso-notify-styles');
  if (!sheet) {
    const style = document.createElement('style');
    style.id = 'uso-notify-styles';
    style.textContent = `
      .uso-notify {
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 9999;
        padding: 0.75rem 1.25rem;
        border-radius: 8px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 0.95rem;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: uso-notify-in 0.3s ease;
      }
      .uso-notify--success {
        background: #5EC26A;
        color: #fff;
      }
      .uso-notify--error {
        background: #c62828;
        color: #fff;
        border: 1px solid #b71c1c;
      }
      @keyframes uso-notify-in {
        from { opacity: 0; transform: translateX(-1rem); }
        to { opacity: 1; transform: translateX(0); }
      }
      .uso-notify.uso-notify-out {
        animation: uso-notify-out 0.25s ease forwards;
      }
      @keyframes uso-notify-out {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(-1rem); }
      }
    `;
    document.head.appendChild(style);
  }

  const el = document.createElement('div');
  el.id = id;
  el.className = `uso-notify uso-notify--${type}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);

  const remove = () => {
    el.classList.add('uso-notify-out');
    setTimeout(() => el.remove(), 260);
  };

  const t = setTimeout(remove, duration);
  el.addEventListener('click', () => {
    clearTimeout(t);
    remove();
  });
}
