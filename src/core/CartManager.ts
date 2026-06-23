import { Order, OrderItem, Product, Service, Organization, Offer } from '../types/schema';
import { SchemaExtractor } from './SchemaExtractor';

export class CartManager {
  private order: Order;
  private storageKey = "antinna_cart_order";

  constructor() {
    this.order = this.loadFromStorage() || {
      "@type": "Order",
      orderedItem: [],
      totalPrice: 0,
      priceCurrency: "INR",
    };
    this.deduplicate();
  }

  private loadFromStorage(): Order | null {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private saveToStorage(): void {
    this.calculateTotal();
    localStorage.setItem(this.storageKey, JSON.stringify(this.order));
  }

  private deduplicate(): void {
      const uniqueItems: Record<string, any> = {};
      const newOrderedItems: any[] = [];

      this.order.orderedItem.forEach((item: any) => {
          const key = item.itemKey || this.generateItemKey(item.orderedItem, item._selectedVariants);
          if (uniqueItems[key]) {
              uniqueItems[key].orderQuantity += item.orderQuantity;
          } else {
              item.itemKey = key;
              uniqueItems[key] = item;
              newOrderedItems.push(item);
          }
      });

      this.order.orderedItem = newOrderedItems;
      this.calculateTotal();
  }

  private calculateTotal(): void {
    this.order.totalPrice = this.order.orderedItem.reduce((sum, item) => {
      if ((item as any).isUnavailable) return sum;
      const { price } = SchemaExtractor.extractPrice(item.orderedItem.offers);
      return sum + (parseFloat(price) * item.orderQuantity);
    }, 0);
  }

  addItem(item: Product | Service, seller?: Organization, selectedVariants?: Record<string, string>): void {
    // Ensure URL is present for syncing
    if (!item.url) {
        item.url = window.location.href.split('?')[0].split('#')[0];
    }

    const itemKey = this.generateItemKey(item, selectedVariants);

    const existing = this.order.orderedItem.find(
      (oi) => (oi as any).itemKey === itemKey
    );

    if (existing) {
      existing.orderQuantity++;
    } else {
      const specs: any = {};
      const fields = [
        'material', 'color', 'size', 'gtin13', 'sku',
        'weight', 'height', 'width', 'depth'
      ];

      fields.forEach(field => {
        if ((item as any)[field]) specs[field] = (item as any)[field];
      });

      this.order.orderedItem.push({
        "@type": "OrderItem",
        orderedItem: {
          "@type": item["@type"] || "Product",
          name: item.name,
          image: item.image,
          offers: item.offers,
          url: item.url,
          ...specs,
          _selectedVariants: selectedVariants
        },
        orderQuantity: 1,
        seller: seller,
        itemKey: itemKey
      } as any);
    }
    this.saveToStorage();
  }

  private generateItemKey(item: Product | Service | any, variants?: Record<string, string>): string {
    let url = item.url || '';
    if (url.includes('?')) url = url.split('?')[0];
    if (url.includes('#')) url = url.split('#')[0];

    let identifier = item.sku || item.id || item.name || '';
    let config = '';
    if (variants) {
      config = Object.entries(variants).sort().map(([k, v]) => `${k}:${v}`).join('|');
    }

    return `${url}::${identifier}::${config}`;
  }

  removeItem(index: number): void {
    const item = this.order.orderedItem[index];
    if (!item) return;
    this.order.orderedItem.splice(index, 1);
    this.saveToStorage();
  }

  updateQty(index: number, delta: number): void {
    const item = this.order.orderedItem[index];
    if (!item) return;
    item.orderQuantity += delta;
    if (item.orderQuantity <= 0) {
      this.removeItem(index);
    } else {
      this.saveToStorage();
    }
  }

  updateItemDetails(index: number, freshBaseData: any | null): void {
    const item = this.order.orderedItem[index] as any;
    if (!item) return;

    if (!freshBaseData) {
      item.isUnavailable = true;
    } else {
      item.isUnavailable = false;

      let freshItem = freshBaseData;

      // Check if it's a ProductGroup/Product containing variants
      if (freshBaseData.hasVariant) {
          freshItem = SchemaExtractor.findMatchingVariant(freshBaseData, item.orderedItem._selectedVariants || {});
      }

      // If the fresh base data itself has an offer catalog (regardless of whether it's a Product or Service at top level)
      // and our cart item matches an entry in that catalog.
      const catalogSource = freshBaseData.hasOfferCatalog ? freshBaseData :
                          (freshBaseData.offers?.seller?.hasOfferCatalog ? freshBaseData.offers.seller :
                          (freshBaseData.provider?.hasOfferCatalog ? freshBaseData.provider : null));

      if (catalogSource) {
          const matchingOffer = SchemaExtractor.findMatchingServicePackage(catalogSource, item.orderedItem.name);
          if (matchingOffer) {
              const { price, currency } = SchemaExtractor.extractPrice(matchingOffer);
              freshItem = {
                  ...item.orderedItem,
                  offers: {
                      "@type": "Offer",
                      price: price,
                      priceCurrency: currency
                  }
              };
          }
      }

      item.orderedItem.offers = freshItem.offers || item.orderedItem.offers;
      item.orderedItem.image = freshItem.image || item.orderedItem.image;
      item.orderedItem.name = freshItem.name || item.orderedItem.name;
    }
    this.saveToStorage();
  }

  getOrder(): Order {
    return this.order;
  }

  getTotalQuantity(): number {
    return this.order.orderedItem.reduce((sum, item) => sum + item.orderQuantity, 0);
  }

  clear(): void {
    this.order.orderedItem = [];
    this.saveToStorage();
  }
}
