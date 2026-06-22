import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartManager } from './CartManager';

describe('CartManager', () => {
  let cart: CartManager;

  beforeEach(() => {
    // Mock localStorage for the test environment
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value.toString();
        }),
        clear: vi.fn(() => {
          store = {};
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
      };
    })();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    window.localStorage.clear();
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
