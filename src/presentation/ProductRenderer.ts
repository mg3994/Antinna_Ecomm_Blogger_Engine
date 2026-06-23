import { Product, ProductGroup, Service, Offer, Organization } from '../types/schema';
import { AppState } from '../types/app';
import { UIManager } from './UIManager';
import { SchemaExtractor } from '../core/SchemaExtractor';

export class ProductRenderer {
  render(p: Product | ProductGroup | Service, state: AppState, onVariantChange: (attr: string, val: string) => void): void {
    const variant = SchemaExtractor.findMatchingVariant(p, state.selectedVariants, state.lastClickedAttribute);

    if (variant && (p as any).variesBy) {
        (p as any).variesBy.forEach((u: string) => {
          const a = u.split(/[\/#]/).pop() || '';
          if (variant[a]) state.selectedVariants[a] = String(variant[a]);
        });
    }

    UIManager.setContent("p-name", variant.name || p.name);
    UIManager.setContent("p-desc", variant.description || p.description);
    UIManager.setContent("p-sku", variant.sku ? "SKU: " + variant.sku : "");

    const brand = typeof (variant.brand || p.brand) === "string"
      ? (variant.brand || p.brand)
      : ((variant.brand as Organization)?.name || (p.brand as Organization)?.name);
    UIManager.setContent("p-brand", brand || "");

    const offer = (variant.offers || p.offers) as Offer;
    const priceEl = UIManager.el("p-price");
    if (priceEl && offer) {
      const { price, currency } = SchemaExtractor.extractPrice(offer);
      priceEl.textContent = `${currency} ${price}`;
      priceEl.classList.toggle("blurry", offer.availability === "https://schema.org/OutOfStock");
    }

    this.renderStockBadge(offer);
    this.renderAreaServed(p as Service);

    const imgs = Array.isArray(variant.image || p.image) ? (variant.image || p.image) : [variant.image || p.image];
    this.renderCarousel(imgs.filter(Boolean));

    this.renderVariants(p, state, onVariantChange);
    this.renderSpecs(variant, p);
    this.renderOtherServices(offer?.seller || p.seller || (p as Service).provider, p);
  }

  private renderStockBadge(offer: Offer): void {
    const st = UIManager.el("stock-badge-container");
    if (st && offer) {
      const av = offer.availability;
      let label = 'Out of Stock', css = 'out-stock', available = false;
      if (av === 'https://schema.org/InStock' || av === 'https://schema.org/OnlineOnly') {
        label = 'In Stock'; css = 'in-stock'; available = true;
      } else if (av === 'https://schema.org/InStoreOnly') {
        label = 'In-Store Only'; css = 'instore-only'; available = false;
      } else if (av === 'https://schema.org/PreOrder') {
        label = 'Pre-Order'; css = 'pre-order'; available = true;
      }
      st.innerHTML = `<span class="stock-badge ${css}">${label}</span>`;
      const addBtn = UIManager.el<HTMLButtonElement>("add-to-cart-btn");
      if (addBtn) addBtn.disabled = !available;
    }
  }

  private renderAreaServed(s: Service): void {
    const pDesc = UIManager.el('p-desc');
    if (s && s.areaServed && pDesc) {
      const area = typeof s.areaServed === 'string' ? s.areaServed : ((s.areaServed as any).name || (s.areaServed as any)['@type']);
      const existing = UIManager.el('svc-area-badge');
      if (existing) existing.remove();
      const ab = document.createElement('div');
      ab.id = 'svc-area-badge';
      ab.className = 'geo-badge';
      ab.style.background = '#e8f5e9';
      ab.style.color = '#2e7d32';
      ab.style.marginBottom = '15px';
      ab.innerHTML = `&#127760; <b>Area Served:</b> ${area}`;
      pDesc.before(ab);
    }
  }

  private renderCarousel(imgs: any[]): void {
    const inner = UIManager.el("carousel-inner");
    const thumbRow = UIManager.el("thumbnail-row");
    if (!inner) return;
    inner.innerHTML = "";
    if (thumbRow) thumbRow.innerHTML = "";

    imgs.forEach((s, i) => {
      const url = s.url || s;
      const d = document.createElement("div");
      d.className = "carousel-item";
      d.innerHTML = `<img src="${url}"/>`;
      inner.appendChild(d);
      if (thumbRow && imgs.length > 1) {
        const t = document.createElement("img") as HTMLImageElement;
        t.className = "thumb" + (i === 0 ? " active" : "");
        t.src = url;
        t.onclick = () => (window as any).AntinnaEngine.goToSlide(i);
        thumbRow.appendChild(t);
      }
    });
    inner.style.transform = "translateX(0)";
  }

  private renderVariants(p: any, state: AppState, onVariantChange: (attr: string, val: string) => void): void {
    const vc = UIManager.el("p-variants");
    if (vc && !vc.children.length) {
      if (p.variesBy) {
        p.variesBy.forEach((u: string) => {
          const a = u.split(/[\/#]/).pop() || '';
          const vals = [...new Set(p.hasVariant.map((x: any) => x[a]).filter(Boolean))];
          if (vals.length === 0) return;
          const g = document.createElement("div");
          g.className = "v-group";
          g.innerHTML = `<span class="v-label">Select ${a}</span>`;
          const os = document.createElement("div");
          os.className = "v-options";
          vals.forEach((vl: any) => {
            const btn = document.createElement("button");
            btn.className = "v-btn";
            btn.dataset.attr = a;
            btn.dataset.val = String(vl);
            if (a.toLowerCase() === "color") {
              btn.classList.add("v-color");
              const vm = p.hasVariant.find((x: any) => String(x[a]) === String(vl));
              const vi = vm && (Array.isArray(vm.image) ? vm.image[0] : vm.image);
              if (vi) {
                const url = vi.url || vi;
                btn.style.backgroundImage = `url('${url}')`;
              } else {
                btn.style.backgroundColor = String(vl);
              }
              btn.title = String(vl);
            } else {
              btn.textContent = String(vl);
            }
            btn.onclick = () => onVariantChange(a, String(vl));
            os.appendChild(btn);
          });
          g.appendChild(os);
          vc.appendChild(g);
          if (!state.selectedVariants[a]) state.selectedVariants[a] = String(vals[0]);
        });
      } else if (p.hasOfferCatalog) {
        const g = document.createElement("div");
        g.className = "v-group";
        g.innerHTML = `<span class="v-label">Available Packages</span>`;
        const os = document.createElement("div");
        os.className = "v-options";
        p.hasOfferCatalog.itemListElement.forEach((off: any) => {
          const btn = document.createElement("button");
          btn.className = "v-btn";
          btn.innerHTML = `${off.itemOffered?.name || off.name}<br/><small>${off.priceCurrency || "INR"} ${off.price}</small>`;
          btn.onclick = () => {
            state.selectedPackage = off;
            UIManager.setContent('p-price', `${off.priceCurrency} ${off.price}`);
            document.querySelectorAll('.v-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
          };
          os.appendChild(btn);
        });
        g.appendChild(os);
        vc.appendChild(g);
      }
    }

    document.querySelectorAll<HTMLButtonElement>(".v-btn[data-attr]").forEach(btn => {
      const a = btn.dataset.attr || '';
      const vL = btn.dataset.val || btn.textContent;
      btn.classList.toggle("active", state.selectedVariants[a] === vL);
    });

    this.checkAvailability(p, state);
  }

  private checkAvailability(p: any, state: AppState): void {
    if (!p || !p.hasVariant) return;
    document.querySelectorAll<HTMLButtonElement>('.v-btn[data-attr]').forEach(btn => {
      const a = btn.dataset.attr || '';
      const v = btn.dataset.val || '';
      const test = { ...state.selectedVariants, [a]: v };
      const match = p.hasVariant.find((x: any) =>
        Object.entries(test).every(([k, val]) => !x[k] || String(x[k]) === String(val))
      );
      const out = match && match.offers && match.offers.availability === 'https://schema.org/OutOfStock';
      btn.style.opacity = !match ? '0.3' : (out ? '0.6' : '1');
      btn.style.borderStyle = !match ? 'dashed' : 'solid';
    });
  }

  private renderSpecs(variant: any, p: any): void {
    const sp = UIManager.el("p-specs");
    const sl = UIManager.el("specs-list");
    if (sp && sl) {
      const flds: any = {
        'Model': variant.model || p.model,
        'Material': variant.material || p.material,
        'GTIN': variant.gtin13 || variant.gtin8 || '',
        'Weight': (variant.weight || p.weight)?.value || (variant.weight || p.weight)
      };
      let h = '';
      for (let [l, k] of Object.entries(flds)) {
        if (k) h += `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.05);"><span style="opacity:0.6;">${l}</span><span style="font-weight:700;">${k}</span></div>`;
      }
      if (h) {
        sp.style.display = "block";
        sl.innerHTML = h;
      } else {
        sp.style.display = "none";
      }
    }
  }

  renderSeller(s: Organization | any): void {
    const box = UIManager.el("p-seller");
    const inf = UIManager.el("seller-info");
    const maps = UIManager.el<HTMLAnchorElement>("maps-link");
    if (!box || !inf) return;
    if (!s) {
      box.style.display = "none";
      return;
    }
    box.style.display = "block";
    inf.innerHTML = `<strong>${s.name || "Antinna"}</strong><br/>${s.telephone ? `&#128222; ${s.telephone}<br/>` : ""}${s.email ? `&#128231; <a href="mailto:${s.email}">${s.email}</a><br/>` : ""}${s.address ? `📍 ${s.address.streetAddress || ""}, ${s.address.addressLocality || ""}` : ""}`;
    if (maps) {
      if (s.hasMap || s.geo) {
        maps.style.display = "inline-flex";
        maps.href = s.hasMap || `https://www.google.com/maps/search/?api=1&query=${s.geo.latitude},${s.geo.longitude}`;
      } else {
        maps.style.display = "none";
      }
    }
  }

  private renderOtherServices(s: Organization | any, p: any): void {
    const otherSec = UIManager.el("other-services");
    const otherList = UIManager.el("other-services-list");
    if (!otherSec || !otherList) return;

    let svcs: any[] = [];
    if (s?.hasOfferCatalog && s.hasOfferCatalog.itemListElement) {
      svcs = s.hasOfferCatalog.itemListElement;
    } else if (s?.knowsAbout) {
      svcs = Array.isArray(s.knowsAbout) ? s.knowsAbout : [s.knowsAbout];
    }

    if (svcs.length > 0) {
      otherSec.style.display = "block";
      otherList.innerHTML = svcs.map((ser: any) => {
        const n = ser.name || ser.itemOffered?.name || ser;
        const pr = ser.price || ser.itemOffered?.offers?.price || '';
        const cr = ser.priceCurrency || 'INR';
        const ci = ser.itemOffered ? { ...ser.itemOffered } : (typeof ser === 'object' ? { ...ser } : { name: ser });

        // EXPLICITLY set @type to Service for catalog items
        if (!ci["@type"]) ci["@type"] = "Service";
        if (!ci.offers) ci.offers = { "@type": "Offer", price: pr, priceCurrency: cr };

        const url = p.url || window.location.href.split('?')[0].split('#')[0];
        const itemWithUrl = { ...ci, url };

        let btnH = `<button class="v-btn" style="width:100%;padding:10px;font-size:0.85rem;" onclick="CartManager.addItem(${JSON.stringify(itemWithUrl).replace(/"/g, '&quot;')}, ${JSON.stringify(s).replace(/"/g, '&quot;')}); CartRenderer.updateUI();">Add Service</button>`;

        return `<div class="h-card"><div style="font-weight:700;margin-bottom:10px;height:3em;overflow:hidden;">${n}</div><div class="price" style="font-size:1.2rem;margin-bottom:15px;">${pr ? cr + ' ' + pr : 'Free/Included'}</div>${btnH}</div>`;
      }).join('');
    } else {
      otherSec.style.display = "none";
    }
  }
}
