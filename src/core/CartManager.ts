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
    // 1. Ensure URL is present
    const url = item.url || window.location.href.split('?')[0].split('#')[0];

    // 2. Generate key using DEEP COPY logic if needed, but generateItemKey handles it
    const itemKey = this.generateItemKey({ ...item, url }, selectedVariants);

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

      // 3. Create a DEEP COPY of the item to prevent reference leakage
      const itemCopy = JSON.parse(JSON.stringify(item));

      this.order.orderedItem.push({
        "@type": "OrderItem",
        orderedItem: {
          ...itemCopy,
          url: url,
          _selectedVariants: selectedVariants ? { ...selectedVariants } : undefined
        },
        orderQuantity: 1,
        seller: seller ? JSON.parse(JSON.stringify(seller)) : undefined,
        itemKey: itemKey
      } as any);
    }
    this.saveToStorage();
  }

  private generateItemKey(item: Product | Service | any, variants?: Record<string, string>): string {
    let url = item.url || '';
    if (url.includes('?')) url = url.split('?')[0];
    if (url.includes('#')) url = url.split('#')[0];
    url = url.toLowerCase().replace(/\/$/, "");

    const type = item["@type"] || "Product";
    const name = item.name || '';
    const sku = item.sku || '';

    // For ProductGroups, the combination of attributes makes the variant unique
    let variantString = '';
    if (variants) {
      const sortedKeys = Object.keys(variants).sort();
      variantString = sortedKeys.map(k => `${k}:${variants[k]}`).join('|');
    }

    return `${url}::${type}::${sku}::${name}::${variantString}`;
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

      const cartItemType = item.orderedItem["@type"];
      let freshMatch = null;

      if (cartItemType === "Product" && freshBaseData.hasVariant) {
          freshMatch = SchemaExtractor.findMatchingVariant(freshBaseData, item.orderedItem._selectedVariants || {});
      }

      if (cartItemType === "Service") {
          const catalogSource = freshBaseData.hasOfferCatalog ? freshBaseData :
                              (freshBaseData.offers?.seller?.hasOfferCatalog ? freshBaseData.offers.seller :
                              (freshBaseData.provider?.hasOfferCatalog ? freshBaseData.provider : null));

          if (catalogSource) {
              const matchingOffer = SchemaExtractor.findMatchingServicePackage(catalogSource, item.orderedItem.name);
              if (matchingOffer) {
                  const { price, currency } = SchemaExtractor.extractPrice(matchingOffer);
                  freshMatch = {
                      ...item.orderedItem,
                      "@type": "Service",
                      offers: { "@type": "Offer", price, priceCurrency: currency }
                  };
              }
          }
      }

      if (!freshMatch && freshBaseData["@type"] === cartItemType) {
          freshMatch = freshBaseData;
      }

      if (freshMatch) {
          const { price, currency } = SchemaExtractor.extractPrice(freshMatch.offers);
          item.orderedItem.offers = {
              "@type": "Offer",
              price: price,
              priceCurrency: currency,
              availability: freshMatch.offers?.availability
          };
          item.orderedItem.image = freshMatch.image || item.orderedItem.image;
          item.orderedItem.name = freshMatch.name || item.orderedItem.name;
          item.orderedItem["@type"] = cartItemType;
      } else {
          if (cartItemType === "Service" || item.orderedItem._selectedVariants) {
              item.isUnavailable = true;
          }
      }
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
