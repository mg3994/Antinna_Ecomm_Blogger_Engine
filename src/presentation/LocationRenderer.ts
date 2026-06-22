import { LocationManager } from '../core/LocationManager';
import { UIManager } from './UIManager';

export class LocationRenderer {
  constructor(private locationManager: LocationManager) {}

  init(): void {
    const data = this.locationManager.getData();
    if (!data.pin && !data.city) {
      setTimeout(() => this.showModal(), 2000);
    }
    this.updateUI();
  }

  showModal(): void {
    UIManager.el('loc-modal-backdrop')?.classList.add('active');
  }

  hideModal(): void {
    UIManager.el('loc-modal-backdrop')?.classList.remove('active');
  }

  updateUI(): void {
    const data = this.locationManager.getData();
    const display = UIManager.el<HTMLInputElement>('loc-display-v2');
    const pinInput = UIManager.el<HTMLInputElement>('modal-pin-input');

    const text = data.city ? (data.pin ? `${data.city}, ${data.pin}` : data.city) : (data.pin || "");
    if (display) display.value = text;
    if (pinInput) pinInput.value = data.pin || "";
  }

  async handleRequestLocation(): Promise<void> {
    if (!navigator.geolocation) {
      UIManager.showToast("Geolocation not supported", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const geoData = await this.locationManager.reverseGeocode(latitude, longitude);
        this.locationManager.setData({ lat: latitude, lon: longitude, ...geoData });
        this.updateUI();
        this.hideModal();
        UIManager.showToast(`Location set to ${geoData.city || 'your area'}`, "success");
      },
      (err) => {
        UIManager.showToast("Location access denied", "error");
      }
    );
  }

  handleSetPin(): void {
    const input = UIManager.el<HTMLInputElement>('modal-pin-input');
    if (input && input.value.length === 6) {
      this.locationManager.setData({ pin: input.value });
      this.updateUI();
      this.hideModal();
      UIManager.showToast("Location updated!", "success");
    } else {
      UIManager.showToast("Enter a valid 6-digit PIN", "error");
    }
  }
}
