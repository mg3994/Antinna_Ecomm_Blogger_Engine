import { LocationData } from '../types/app';

export class LocationManager {
  private data: LocationData = { lat: null, lon: null, pin: null, city: null };
  private storageKey = "antinna_location";

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
      } catch (e) {}
    }
  }

  save(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  getData(): LocationData {
    return this.data;
  }

  setData(partial: Partial<LocationData>): void {
    this.data = { ...this.data, ...partial };
    this.save();
  }

  async reverseGeocode(lat: number, lon: number): Promise<Partial<LocationData>> {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
        headers: { 'User-Agent': 'Antinna-Blogger-Engine/1.0' }
      });
      const d = await res.json();
      if (d.address) {
        return {
          pin: d.address.postcode || this.data.pin,
          city: d.address.city || d.address.town || d.address.village || d.address.state_district
        };
      }
    } catch (e) {
      console.error("Geocoding failed", e);
    }
    return {};
  }
}
