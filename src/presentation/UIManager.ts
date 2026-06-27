export class UIManager {
  static el<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T;
  }

  static query<T extends HTMLElement>(selector: string): T | null {
    return document.querySelector(selector) as T;
  }

  static setContent(idOrSelector: string, content: string): void {
    const e = this.el(idOrSelector) || this.query(idOrSelector);
    if (e) e.textContent = content;
  }

  static setHtml(idOrSelector: string, html: string): void {
    const e = this.el(idOrSelector) || this.query(idOrSelector);
    if (e) e.innerHTML = html;
  }

  static toggleClass(idOrSelector: string, className: string, force?: boolean): void {
    const e = this.el(idOrSelector) || this.query(idOrSelector);
    if (e) e.classList.toggle(className, force);
  }

  static injectModalStyles(): void {
    if (document.getElementById('antinna-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'antinna-modal-styles';
    style.textContent = `
      .antinna-geo-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 4000; display: none; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
      .antinna-geo-backdrop.active { display: flex; opacity: 1; pointer-events: auto; }
      .antinna-geo-content { background: var(--card); width: 95%; max-width: 500px; padding: 25px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); position: relative; max-height: 90vh; overflow-y: auto; color: var(--text); }
      .antinna-geo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .antinna-geo-header h3 { margin: 0; font-size: 1.3rem; font-weight: 800; }
      .antinna-geo-close { background: none; border: none; font-size: 1.8rem; cursor: pointer; color: var(--text); opacity: 0.5; }
      .antinna-geo-subtitle { font-size: 0.85rem; color: #777; margin: 0 0 15px 0; }
      .antinna-geo-search-container { position: relative; width: 100%; }
      .antinna-geo-search-container input { width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid #ddd; outline: none; font-size: 1rem; background: var(--bg); color: var(--text); box-sizing: border-box; }
      html.dark .antinna-geo-search-container input { border-color: #334155; }
      .antinna-geo-dropdown { position: absolute; top: 100%; left: 0; width: 100%; background: var(--card); border: 1px solid #ddd; border-radius: 0 0 10px 10px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); max-height: 200px; overflow-y: auto; z-index: 1001; display: none; }
      html.dark .antinna-geo-dropdown { border-color: #334155; }
      .antinna-geo-dropdown-item { padding: 12px; cursor: pointer; font-size: 0.9rem; border-bottom: 1px solid #eee; }
      html.dark .antinna-geo-dropdown-item { border-bottom-color: #334155; }
      .antinna-geo-dropdown-item:hover { background: #f0f0f0; color: var(--accent); }
      html.dark .antinna-geo-dropdown-item:hover { background: #334155; }
      #antinna-geo-map-canvas { width: 100%; height: 250px; border-radius: 12px; margin-top: 15px; background: #eee; border: 1px solid #ddd; }
      html.dark #antinna-geo-map-canvas { border-color: #334155; background: #0f172a; }
      .antinna-geo-status { margin-top: 8px; font-size: 0.8rem; color: var(--accent); font-weight: 600; min-height: 18px; }
      .antinna-geo-metrics { background: #f0f7ff; padding: 15px; margin-top: 15px; border-radius: 12px; border-left: 5px solid #34a853; font-size: 0.9rem; }
      html.dark .antinna-geo-metrics { background: #1e293b; border-color: #059669; }
      .antinna-geo-tag { font-family: monospace; font-size: 0.75rem; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #475569; }
      html.dark .antinna-geo-tag { background: #334155; color: #cbd5e1; }
    `;
    document.head.appendChild(style);
  }

  static showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const e = document.createElement("div");
    e.style.cssText = "position:fixed;bottom:24px;right:24px;color:white;padding:12px 24px;border-radius:10px;font-weight:600;z-index:3000;transition: opacity 0.3s; background:" + (type === "success" ? "#10b981" : "#ef4444");
    e.textContent = message;
    document.body.appendChild(e);
    setTimeout(() => {
      e.style.opacity = "0";
      setTimeout(() => e.remove(), 300);
    }, 3000);
  }
}
