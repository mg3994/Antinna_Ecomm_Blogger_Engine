import { Order, OrderItem, Product, Service, Organization, Offer } from '../types/schema';

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
      const price = parseFloat(String((item.orderedItem.offers as Offer)?.price || 0));
      return sum + (price * item.orderQuantity);
    }, 0);
  }

  addItem(item: Product | Service, seller?: Organization): void {
    const existing = this.order.orderedItem.find(
      (oi) => oi.orderedItem.name === item.name
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
          ...specs
        },
        orderQuantity: 1,
        seller: seller
      } as OrderItem);
    }
    this.saveToStorage();
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
