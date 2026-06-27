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
      if (!this.isItemOrderable(item)) return sum;
      const { price } = SchemaExtractor.extractPrice(item.orderedItem.offers);
      return sum + (parseFloat(price) * item.orderQuantity);
    }, 0);
  }

  public isItemOrderable(item: any): boolean {
      if (item.isUnavailable) return false;
      const av = SchemaExtractor.extractAvailability(item.orderedItem.offers);
      return av !== "https://schema.org/OutOfStock" && av !== "https://schema.org/SoldOut";
  }

  public checkQuantityConstraint(offer: any, currentQty: number, delta: number): { allowed: boolean, message?: string } {
      if (!offer?.eligibleQuantity) return { allowed: true };
      const eq = offer.eligibleQuantity;
      const min = eq.minValue !== undefined ? Number(eq.minValue) : 0;
      const max = eq.maxValue !== undefined ? Number(eq.maxValue) : Infinity;

      const newQty = currentQty + delta;
      if (newQty < min) return { allowed: false, message: `Minimum quantity is ${min}` };
      if (newQty > max) return { allowed: false, message: `Maximum quantity is ${max}` };

      return { allowed: true };
  }

  addItem(item: Product | Service, seller?: Organization, selectedVariants?: Record<string, string>, addons: any[] = []): void {
    const availability = SchemaExtractor.extractAvailability(item.offers);
    if (availability === "https://schema.org/OutOfStock") {
        // Prevent adding if out of stock
        return;
    }

    if (!item.url) {
        item.url = window.location.href.split('?')[0].split('#')[0];
    }

    const itemKey = this.generateItemKey(item, selectedVariants);

    const existing = this.order.orderedItem.find(
      (oi) => (oi as any).itemKey === itemKey
    );

    if (existing) {
      const constraint = this.checkQuantityConstraint(item.offers, existing.orderQuantity, 1);
      if (!constraint.allowed) {
          if (constraint.message) (window as any).showToast(constraint.message, 'error');
          return;
      }
      existing.orderQuantity++;
    } else {
      const constraint = this.checkQuantityConstraint(item.offers, 0, 1);
      if (!constraint.allowed) {
          if (constraint.message) (window as any).showToast(constraint.message, 'error');
          return;
      }
      const specs: any = {};
      const fields = [
        'material', 'color', 'size', 'gtin13', 'sku',
        'weight', 'height', 'width', 'depth', 'description'
      ];

      fields.forEach(field => {
        if ((item as any)[field]) specs[field] = (item as any)[field];
      });

      const itemCopy = JSON.parse(JSON.stringify(item));

      this.order.orderedItem.push({
        "@type": "OrderItem",
        orderedItem: {
          ...itemCopy,
          url: item.url,
          _selectedVariants: selectedVariants ? { ...selectedVariants } : undefined
        },
        orderQuantity: 1,
        seller: seller ? JSON.parse(JSON.stringify(seller)) : undefined,
        itemKey: itemKey
      } as any);
    }

    // Process Addons
    if (addons.length > 0) {
        const parentKey = itemKey;
        addons.forEach(addonOffer => {
            const addonItem = addonOffer.itemOffered || addonOffer;
            const addonKey = this.generateItemKey(addonItem, undefined, parentKey);

            const existingAddon = this.order.orderedItem.find(oi => (oi as any).itemKey === addonKey);
            if (!existingAddon) {
                this.order.orderedItem.push({
                    "@type": "OrderItem",
                    orderedItem: { ...addonItem, url: item.url, _parentKey: parentKey },
                    orderQuantity: addonOffer._selectedQty || 1,
                    seller: seller,
                    itemKey: addonKey
                } as any);
            }
        });
    }

    this.saveToStorage();
  }

  private generateItemKey(item: Product | Service | any, variants?: Record<string, string>, parentKey?: string): string {
    let url = item.url || '';
    if (url.includes('?')) url = url.split('?')[0];
    if (url.includes('#')) url = url.split('#')[0];
    url = url.toLowerCase().replace(/\/$/, "");

    const type = item["@type"] || "Product";
    const name = item.name || '';
    const sku = item.sku || '';

    let variantString = '';
    if (variants) {
      const sortedKeys = Object.keys(variants).sort();
      variantString = sortedKeys.map(k => `${k}:${variants[k]}`).join('|');
    }

    let key = `${url}::${type}::${sku}::${name}::${variantString}`;
    if (parentKey) key += `::parent:${parentKey}`;
    return key;
  }

  removeItem(index: number): void {
    const item = this.order.orderedItem[index] as any;
    if (!item) return;

    const itemKey = item.itemKey;
    this.order.orderedItem.splice(index, 1);

    // Cascading remove addons
    this.order.orderedItem = this.order.orderedItem.filter(oi => (oi as any).orderedItem._parentKey !== itemKey);

    this.saveToStorage();
  }

  updateQty(index: number, delta: number): void {
    const item = this.order.orderedItem[index] as any;
    if (!item) return;

    const constraint = this.checkQuantityConstraint(item.orderedItem.offers, item.orderQuantity, delta);
    if (!constraint.allowed) {
        if (constraint.message) (window as any).showToast(constraint.message, 'error');
        return;
    }

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
      let freshMatch = null;
      const cartItem = item.orderedItem;
      const dataSources = Array.isArray(freshBaseData) ? freshBaseData : [freshBaseData];

      for (const source of dataSources) {
          const allCatalogs = SchemaExtractor.findAllCatalogs(source);
          for (const catalog of allCatalogs) {
              const matchedPackage = SchemaExtractor.findMatchingServicePackage({ hasOfferCatalog: catalog }, cartItem.name);
              if (matchedPackage) {
                  const { price, currency } = SchemaExtractor.extractPrice(matchedPackage);
                  const availability = SchemaExtractor.extractAvailability(matchedPackage);
                  freshMatch = {
                      ...cartItem,
                      ...(matchedPackage.itemOffered || matchedPackage),
                      "@type": (matchedPackage.itemOffered?.["@type"] || matchedPackage["@type"] || cartItem["@type"]),
                      offers: { "@type": "Offer", price, priceCurrency: currency, availability }
                  };
                  break;
              }
          }
          if (freshMatch) break;

          if (cartItem["@type"] === "Product" && source.hasVariant) {
              const variantMatch = SchemaExtractor.findMatchingVariant(source, cartItem._selectedVariants || {});
              if (variantMatch) {
                  freshMatch = variantMatch;
                  break;
              }
          }

          const sourceId = source.sku || source.identifier || source.name;
          const cartId = cartItem.sku || cartItem.identifier || cartItem.name;
          if (source["@type"] === cartItem["@type"] && sourceId === cartId) {
              freshMatch = source;
              break;
          }
      }

      if (freshMatch) {
          item.isUnavailable = false;
          const { price, currency } = SchemaExtractor.extractPrice(freshMatch.offers || freshMatch);
          const availability = SchemaExtractor.extractAvailability(freshMatch.offers || freshMatch);

          item.orderedItem.offers = {
              "@type": "Offer",
              price: price,
              priceCurrency: currency,
              availability: availability
          };
          item.orderedItem.image = freshMatch.image || item.orderedItem.image;
          item.orderedItem.name = freshMatch.name || item.orderedItem.name;
          item.orderedItem.description = freshMatch.description || item.orderedItem.description;
      } else {
          item.isUnavailable = true;
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
