export class UIManager {
  static el<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T;
  }

  static setContent(id: string, content: string): void {
    const e = this.el(id);
    if (e) e.textContent = content;
  }

  static setHtml(id: string, html: string): void {
    const e = this.el(id);
    if (e) e.innerHTML = html;
  }

  static toggleClass(id: string, className: string, force?: boolean): void {
    const e = this.el(id);
    if (e) e.classList.toggle(className, force);
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
