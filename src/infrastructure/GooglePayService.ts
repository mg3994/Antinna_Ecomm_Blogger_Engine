import { Order } from '../types/schema';

export class GooglePayService {
  private merchantId = "BCR2DN5TVPLKL4KZ";
  private merchantName = "Antinna";

  async initPayment(order: Order): Promise<void> {
    if (!(window as any).PaymentRequest) {
      alert("Payment Request API not supported in this browser.");
      return;
    }

    const supportedInstruments = [
      {
        supportedMethods: 'https://tez.google.com/pay',
        data: {
          pa: 'antinna@okicici',
          pn: this.merchantName,
          tr: `TR${Date.now()}`,
          url: window.location.href,
          mc: '5411',
          tn: `Order from ${this.merchantName}`,
        },
      }
    ];

    const details = {
      total: {
        label: 'Total Amount',
        amount: {
          currency: order.priceCurrency || 'INR',
          value: String(order.totalPrice),
        },
      },
      displayItems: order.orderedItem.map(item => ({
        label: item.orderedItem.name || 'Product',
        amount: {
          currency: order.priceCurrency || 'INR',
          value: String(parseFloat(String((item.orderedItem.offers as any)?.price || 0)) * item.orderQuantity),
        },
      })),
    };

    try {
      const request = new (window as any).PaymentRequest(supportedInstruments, details);
      const canPay = await request.canMakePayment();
      if (canPay) {
        const response = await request.show();
        console.log("Payment response:", response);
      } else {
        alert("Cannot make payment with Google Pay.");
      }
    } catch (e) {
      console.error("Payment Error:", e);
    }
  }
}
