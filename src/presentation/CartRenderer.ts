import { CartManager } from '../core/CartManager';
import { UIManager } from './UIManager';
import { SchemaExtractor } from '../core/SchemaExtractor';

export class CartRenderer {
  constructor(private cartManager: CartManager) {}

  renderFab(): void {
    const container = UIManager.el("cart-fab-container");
    if (!container) return;

    let fab = UIManager.el("cart-fab");
    if (!fab) {
      fab = document.createElement("div");
      fab.id = "cart-fab";
      fab.className = "cart-fab";
      fab.onclick = () => (window as any).AntinnaEngine.refreshCartData();
      container.appendChild(fab);
    }
    this.updateUI();
  }

  updateUI(): void {
    const count = this.cartManager.getTotalQuantity();
    const fab = UIManager.el("cart-fab");
    if (fab) {
      fab.innerHTML = `🛒 <span class="cart-count">${count}</span>`;
      fab.style.transform = count > 0 ? "scale(1)" : "scale(0)";
    }
    const confirmBtn = UIManager.el<HTMLButtonElement>("cart-confirm-btn");
    if (confirmBtn) confirmBtn.disabled = count === 0;
  }

  showModal(): void {
    const backdrop = UIManager.el("cart-modal-backdrop");
    const drawer = UIManager.el("cart-drawer");
    const list = UIManager.el("cart-items-list");
    if (!list) return;

    const order = this.cartManager.getOrder();
    list.innerHTML = order.orderedItem.map((item, idx) => {
      const isUnavailable = (item as any).isUnavailable;
      const opacity = isUnavailable ? '0.5' : '1';
      const statusText = isUnavailable ? '<div style="color:red; font-size:0.7rem; font-weight:800;">Currently Unavailable</div>' : '';
      const { price, currency } = SchemaExtractor.extractPrice(item.orderedItem.offers);

      return `
        <div style="display:flex; gap:15px; padding:15px; border-bottom:1px solid rgba(0,0,0,0.05); align-items:center; opacity:${opacity};">
           <img src="${this.getItemImage(item.orderedItem)}" style="width:60px; height:60px; border-radius:10px; object-fit:cover;"/>
           <div style="flex:1;">
              <div style="font-weight:700;font-size:0.9rem;">${item.orderedItem.name}</div>
              ${statusText}
              <div style="color:var(--accent); font-weight:800; font-size:0.85rem; margin-top:4px;">${currency} ${price}</div>
              <div style="display:flex; align-items:center; gap:12px; margin-top:10px;">
                 <button class="qty-btn" style="width:24px; height:24px; font-size:0.8rem;" ${isUnavailable ? 'disabled' : ''} onclick="CartManager.updateQty(${idx},-1); CartRenderer.showModal();">-</button>
                 <span style="font-weight:800;">${item.orderQuantity}</span>
                 <button class="qty-btn" style="width:24px; height:24px; font-size:0.8rem;" ${isUnavailable ? 'disabled' : ''} onclick="CartManager.updateQty(${idx},1); CartRenderer.showModal();">+</button>
              </div>
           </div>
           <button onclick="CartManager.removeItem(${idx}); CartRenderer.showModal();" style="background:none;border:none;color:#ff3b30;cursor:pointer;font-size:1.2rem; padding:10px;">×</button>
        </div>
      `;
    }).join("") || '<div style="text-align:center; padding:50px; opacity:0.5; font-weight:700;">Bag is empty</div>';

    const totalEl = UIManager.el("cart-total-price");
    if (totalEl) totalEl.textContent = `${order.priceCurrency} ${order.totalPrice}`;

    backdrop?.classList.add("active");
    drawer?.classList.add("active");
    this.updateUI();
  }

  hideModal(): void {
    UIManager.el("cart-modal-backdrop")?.classList.remove("active");
    UIManager.el("cart-drawer")?.classList.remove("active");
  }

  private getItemImage(item: any): string {
    if (Array.isArray(item.image)) return item.image[0]?.url || item.image[0] || '';
    return item.image?.url || item.image || '';
  }
}
