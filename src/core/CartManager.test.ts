import { describe, it, expect, beforeEach } from 'vitest';
import { CartManager } from './CartManager';

describe('CartManager', () => {
  let cart: CartManager;

  beforeEach(() => {
    localStorage.clear();
    cart = new CartManager();
  });

  it('should add item and calculate total', () => {
    cart.addItem({
      name: 'Item 1',
      offers: { price: 100, priceCurrency: 'INR' }
    } as any);

    expect(cart.getTotalQuantity()).toBe(1);
    expect(cart.getOrder().totalPrice).toBe(100);
  });

  it('should increment quantity for same item', () => {
    const item = { name: 'Item 1', offers: { price: 100 } } as any;
    cart.addItem(item);
    cart.addItem(item);
    expect(cart.getTotalQuantity()).toBe(2);
    expect(cart.getOrder().totalPrice).toBe(200);
  });

  it('should remove item', () => {
    cart.addItem({ name: 'Item 1', offers: { price: 100 } } as any);
    cart.removeItem(0);
    expect(cart.getTotalQuantity()).toBe(0);
  });
});
