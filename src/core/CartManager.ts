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

  private calculateTotal(): void {
    this.order.totalPrice = this.order.orderedItem.reduce((sum, item) => {
      if ((item as any).isUnavailable) return sum;
      const price = parseFloat(String((item.orderedItem.offers as Offer)?.price || 0));
      return sum + (price * item.orderQuantity);
    }, 0);
  }

  addItem(item: Product | Service, seller?: Organization, selectedVariants?: Record<string, string>): void {
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
          url: (item as any).url,
          ...specs,
          _selectedVariants: selectedVariants // Internal tracking for refresh
        },
        orderQuantity: 1,
        seller: seller,
        itemKey: itemKey
      } as any);
    }
    this.saveToStorage();
  }

  private generateItemKey(item: Product | Service, variants?: Record<string, string>): string {
    // Priority: SKU > ID > Name
    let key = item.sku || (item as any).id || item.name || '';
    if (variants) {
      const vString = Object.entries(variants).sort().map(([k, v]) => `${k}:${v}`).join('|');
      key += `|${vString}`;
    }
    return key;
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

      if (freshBaseData.hasVariant) {
          freshItem = SchemaExtractor.findMatchingVariant(freshBaseData, item.orderedItem._selectedVariants || {});
      } else if (freshBaseData.hasOfferCatalog) {
          const matchingOffer = SchemaExtractor.findMatchingServicePackage(freshBaseData, item.orderedItem.name);
          if (matchingOffer) {
              freshItem = {
                  ...item.orderedItem,
                  offers: {
                      "@type": "Offer",
                      price: matchingOffer.price,
                      priceCurrency: matchingOffer.priceCurrency
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
