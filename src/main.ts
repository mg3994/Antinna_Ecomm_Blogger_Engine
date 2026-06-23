import { AppState } from './types/app';
import { SchemaExtractor } from './core/SchemaExtractor';
import { CartManager } from './core/CartManager';
import { LocationManager } from './core/LocationManager';
import { BloggerDataService } from './infrastructure/BloggerDataService';
import { GooglePayService } from './infrastructure/GooglePayService';
import { ProductRenderer } from './presentation/ProductRenderer';
import { CartRenderer } from './presentation/CartRenderer';
import { LocationRenderer } from './presentation/LocationRenderer';
import { UIManager } from './presentation/UIManager';

export class App {
  private state: AppState = {
    product: null,
    selectedVariants: {},
    currentSlide: 0,
    quantity: 1,
    lastClickedAttribute: null,
    selectedPackage: null
  };

  private gridPageSize = 20;
  private gridStartIndex = 1;

  public CartManager = new CartManager();
  public LocationManager = new LocationManager();
  public BloggerDataService = new BloggerDataService();
  public GooglePayService = new GooglePayService();

  public ProductRenderer = new ProductRenderer();
  public CartRenderer = new CartRenderer(this.CartManager);
  public LocationRenderer = new LocationRenderer(this.LocationManager);

  constructor() {
    this.exposeGlobals();
    this.init();
  }

  private exposeGlobals(): void {
    (window as any).AntinnaEngine = this;
    (window as any).CartManager = this.CartManager;
    (window as any).LocationManager = this.LocationManager;
    (window as any).CartRenderer = this.CartRenderer;
    (window as any).LocationRenderer = this.LocationRenderer;
    (window as any).GooglePayService = this.GooglePayService;
    (window as any).UIManager = UIManager;

    (window as any).nextSlide = () => this.goToSlide(this.state.currentSlide + 1);
    (window as any).prevSlide = () => this.goToSlide(this.state.currentSlide - 1);
    (window as any).goToSlide = (i: number) => this.goToSlide(i);
    (window as any).syncDots = (el: HTMLElement) => this.syncDots(el);
    (window as any).showToast = (m: string, t: 'success' | 'error') => UIManager.showToast(m, t);
    (window as any).loadMorePosts = () => this.loadMorePosts();
    (window as any).refreshCartData = () => this.refreshCartData();
  }

  private init(): void {
    document.addEventListener("DOMContentLoaded", () => {
      this.LocationRenderer.init();
      this.CartRenderer.renderFab();
      this.setupEventListeners();
      this.loadProductData();
      this.loadGridData();
    });
  }

  private setupEventListeners(): void {
    const qtyPlus = UIManager.el("qty-plus");
    const qtyMinus = UIManager.el("qty-minus");
    const addBtn = UIManager.el("add-to-cart-btn");
    const searchForm = UIManager.el<HTMLFormElement>("search-form");
    const confirmBtn = UIManager.el("cart-confirm-btn");
    const cartFab = UIManager.el("cart-fab");

    if (qtyPlus) qtyPlus.onclick = () => {
      this.state.quantity++;
      UIManager.setContent("qty-val", String(this.state.quantity));
    };

    if (qtyMinus) qtyMinus.onclick = () => {
      if (this.state.quantity > 1) {
        this.state.quantity--;
        UIManager.setContent("qty-val", String(this.state.quantity));
      }
    };

    if (addBtn) addBtn.onclick = () => this.handleAddToCart();

    if (confirmBtn) {
      confirmBtn.onclick = () => {
        this.GooglePayService.initPayment(this.CartManager.getOrder());
      };
    }

    if (searchForm) {
      searchForm.onsubmit = (e) => {
        const q = UIManager.el<HTMLInputElement>("search-q");
        const loc = this.LocationManager.getData();
        const extra = loc.pin || loc.city || "";
        if (q && extra && !q.value.includes(extra)) {
          q.value = q.value + " " + extra;
        }
      };
    }
  }

  private loadProductData(): void {
    setTimeout(() => {
      const rawBody = UIManager.el("post-body-raw");
      if (rawBody) {
        const data = SchemaExtractor.extractJsonLd<any>(rawBody.textContent || "");
        if (data) {
          this.state.product = data;
          this.ProductRenderer.render(data, this.state, (attr, val) => {
            this.state.selectedVariants[attr] = val;
            this.state.lastClickedAttribute = attr;
            this.ProductRenderer.render(this.state.product!, this.state, () => {});
          });
          this.ProductRenderer.renderSeller(data.offers?.seller || data.seller || data.provider);
        }
      }
      UIManager.toggleClass("initializing-state", "hidden", true);
      UIManager.toggleClass("carousel-section", "hidden", false);
      UIManager.toggleClass("details-section", "hidden", false);
    }, 100);
  }

  private async loadGridData(): Promise<void> {
    const cards = document.querySelectorAll<HTMLAnchorElement>(".card");
    if (cards.length === 0) return;

    const { entries } = await this.BloggerDataService.fetchFeedData(50, 1);
    cards.forEach(card => {
      const url = card.href.split("?")[0].split("#")[0];
      const entry = entries.find(e => e.link.some((l: any) => l.rel === "alternate" && l.href.includes(url)));
      const data = entry
        ? this.BloggerDataService.extractSchemaFromEntry(entry)
        : SchemaExtractor.extractJsonLd<any>(card.querySelector(".grid-data")?.textContent || "");

      if (data) {
        this.renderGridCard(card, data);
      }
    });
  }

  public async loadMorePosts(): Promise<void> {
    this.gridStartIndex += this.gridPageSize;
    const { entries, totalResults } = await this.BloggerDataService.fetchFeedData(this.gridPageSize, this.gridStartIndex);

    const grid = UIManager.el("app-grid");
    if (!grid) return;

    entries.forEach(entry => {
      const data = this.BloggerDataService.extractSchemaFromEntry(entry);
      if (data) {
        const url = entry.link.find((l: any) => l.rel === "alternate")?.href || "#";
        const card = document.createElement("a");
        card.className = "card";
        card.href = url;
        card.innerHTML = `
          <div class="card-img-wrapper">
             <div class="card-img-scroll" onscroll="AntinnaEngine.syncDots(this)">
                <img class="card-img" src="${(Array.isArray(data.image) ? data.image[0] : (data.image?.url || data.image)) || 'https://via.placeholder.com/400x300?text=Antinna'}" loading="lazy"/>
             </div>
             <div class="card-dots"></div>
          </div>
          <div class="card-body">
            <div class="card-badge">${(data["@type"] === 'ProductGroup' || data["@type"] === 'Product') ? 'Product' : 'Service'}</div>
            <h3 class="card-title">${data.name || "Untitled"}</h3>
            <div class="card-price">${(data.offers?.priceCurrency || "INR") + " " + (data.offers?.price || "")}</div>
          </div>
        `;
        grid.appendChild(card);
        this.renderGridCard(card, data);
      }
    });

    if (this.gridStartIndex + this.gridPageSize > totalResults) {
      UIManager.el("load-more-btn")?.classList.add("hidden");
    }
  }

  public async refreshCartData(): Promise<void> {
    const order = this.CartManager.getOrder();
    const { entries } = await this.BloggerDataService.fetchFeedData(100, 1);

    order.orderedItem.forEach((item, idx) => {
      const url = item.orderedItem.url;
      if (!url) return;

      const entry = entries.find(e => e.link.some((l: any) => l.rel === "alternate" && l.href.includes(url)));
      const data = entry ? this.BloggerDataService.extractSchemaFromEntry(entry) : null;

      this.CartManager.updateItemDetails(idx, data);
    });

    this.CartRenderer.showModal();
  }

  private renderGridCard(card: HTMLElement, data: any): void {
    const badge = card.querySelector(".card-badge");
    const price = card.querySelector(".card-price");
    const scroll = card.querySelector(".card-img-scroll");
    const dots = card.querySelector(".card-dots");

    if (badge) badge.textContent = (data["@type"] === 'ProductGroup' || data["@type"] === 'Product') ? 'Product' : 'Service';

    const variant = data.hasVariant ? data.hasVariant[0] : data;
    if (variant.offers && price) {
      price.textContent = (variant.offers.priceCurrency || "INR") + " " + (variant.offers.price || "");
    }

    const imgs = Array.isArray(data.image) ? data.image : [data.image];
    if (imgs[0] && scroll) {
      scroll.innerHTML = imgs.map((img: any) => `<img class="card-img" src="${img.url || img}" loading="lazy"/>`).join('');
      if (dots && imgs.length > 1) {
        dots.innerHTML = imgs.map((_: any, i: number) => `<div class="dot ${i === 0 ? 'active' : ''}"></div>`).join('');
      }
    }
  }

  private handleAddToCart(): void {
    const p = this.state.product as any;
    if (!p) return;

    let variant = p.hasVariant
      ? p.hasVariant.find((x: any) => Object.entries(this.state.selectedVariants).every(([k, v]) => x[k] === v)) || p.hasVariant[0]
      : p;

    if (this.state.selectedPackage) {
      variant = {
        ...variant,
        name: this.state.selectedPackage.itemOffered?.name || this.state.selectedPackage.name,
        offers: {
          price: this.state.selectedPackage.price,
          priceCurrency: this.state.selectedPackage.priceCurrency
        }
      };
    }

    // Include the current URL in the variant for cart refreshing
    const itemToStore = { ...variant, url: window.location.href.split('?')[0].split('#')[0] };

    for (let i = 0; i < this.state.quantity; i++) {
      this.CartManager.addItem(itemToStore, itemToStore.offers?.seller || p.seller || p.provider);
    }
    this.CartRenderer.updateUI();
    UIManager.showToast("Added to Bag", "success");
  }

  public goToSlide(i: number): void {
    const inner = UIManager.el("carousel-inner");
    const items = document.querySelectorAll(".carousel-item");
    if (!inner || items.length === 0) return;

    if (i < 0) i = items.length - 1;
    if (i >= items.length) i = 0;

    this.state.currentSlide = i;
    inner.style.transform = `translateX(-${i * 100}%)`;

    document.querySelectorAll(".thumb").forEach((t, x) => t.classList.toggle("active", x === i));
  }

  public syncDots(el: HTMLElement): void {
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    const dots = el.parentElement?.querySelectorAll('.dot');
    dots?.forEach((d, i) => d.classList.toggle('active', i === idx));
  }
}

new App();
