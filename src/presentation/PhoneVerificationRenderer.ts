import { UIManager } from './UIManager';

export class PhoneVerificationRenderer {
  private confirmationResult: any = null;

  public render(): void {
    let modal = UIManager.el('antinna-phone-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'antinna-phone-modal';
      modal.className = 'antinna-geo-backdrop';
      UIManager.injectModalStyles();
      modal.innerHTML = `
        <div class="antinna-geo-content">
          <div class="antinna-geo-header">
            <h3>Phone Verification</h3>
            <button class="antinna-geo-close" onclick="document.getElementById('antinna-phone-modal').classList.remove('active')">&times;</button>
          </div>
          <p class="antinna-geo-subtitle">
            Please link your phone number to continue with the order.
          </p>

          <div id="phone-input-container">
            <div class="antinna-geo-search-container">
                <input id="antinna-phone-number" type="tel" placeholder="+91 98765 43210" autocomplete="off">
            </div>
            <div id="recaptcha-container" style="margin-top:15px;"></div>
            <button id="antinna-send-otp-btn" class="v-btn active" style="width:100%; margin-top:20px;">Send OTP</button>
          </div>

          <div id="otp-input-container" style="display:none;">
            <div class="antinna-geo-search-container">
                <input id="antinna-otp-code" type="text" placeholder="Enter 6-digit OTP" maxlength="6" autocomplete="off">
            </div>
            <button id="antinna-verify-otp-btn" class="v-btn active" style="width:100%; margin-top:20px;">Verify & Link</button>
            <button class="qty-btn" style="border:none; margin-top:10px; background:none; width:100%;" onclick="document.getElementById('phone-input-container').style.display='block'; document.getElementById('otp-input-container').style.display='none';">Back</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      this.setupListeners();
    }

    modal.classList.add('active');
    this.initRecaptcha();
  }

  private setupListeners(): void {
      const sendBtn = UIManager.el('antinna-send-otp-btn');
      const verifyBtn = UIManager.el('antinna-verify-otp-btn');

      if (sendBtn) sendBtn.onclick = () => this.handleSendOTP();
      if (verifyBtn) verifyBtn.onclick = () => this.handleVerifyOTP();
  }

  private initRecaptcha(): void {
      const auth = (window as any).firebaseAuth;
      if (!auth) return;

      if (!(window as any).recaptchaVerifier) {
          try {
            // Importing from CDN within the script might be tricky if not pre-loaded.
            // Assuming Firebase Auth JS is already available via the auth-engine script.
            const { RecaptchaVerifier } = (window as any).firebaseAuthInternal || {};
            // Fallback: if we can't find RecaptchaVerifier on window, we might need the user to have it.
            // Typically it's available if firebase-auth.js is loaded.

            // For IIFE/CDN usage, it is often under firebase.auth.RecaptchaVerifier or similar.
            // Since we used ESM in auth-engine, we'll try to get it from the global scope if exposed.
          } catch(e) {}
      }
  }

  private async handleSendOTP(): Promise<void> {
    const phoneInput = UIManager.el<HTMLInputElement>('antinna-phone-number');
    const phone = phoneInput?.value.trim();
    if (!phone) {
        UIManager.showToast("Please enter a phone number", "error");
        return;
    }

    const auth = (window as any).firebaseAuth;
    const user = auth.currentUser;
    if (!user) return;

    UIManager.showToast("Sending OTP...", "success");

    try {
        // Link with phone number
        // Note: For this to work, RecaptchaVerifier must be initialized.
        // We assume it's set up in the background or via a global helper.
        // In a real Blogger environment, we'd ensure the Firebase UI/Auth is fully ready.

        const { linkWithPhoneNumber, RecaptchaVerifier } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");

        if (!(window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible'
            });
        }

        this.confirmationResult = await linkWithPhoneNumber(user, phone, (window as any).recaptchaVerifier);

        UIManager.el('phone-input-container')!.style.display = 'none';
        UIManager.el('otp-input-container')!.style.display = 'block';
        UIManager.showToast("OTP sent successfully!", "success");
    } catch (error: any) {
        console.error("Phone linking failed", error);
        UIManager.showToast(error.message || "Failed to send OTP", "error");
    }
  }

  private async handleVerifyOTP(): Promise<void> {
    const otpInput = UIManager.el<HTMLInputElement>('antinna-otp-code');
    const code = otpInput?.value.trim();
    if (!code || code.length !== 6) {
        UIManager.showToast("Enter a valid 6-digit OTP", "error");
        return;
    }

    if (!this.confirmationResult) return;

    UIManager.showToast("Verifying...", "success");

    try {
        await this.confirmationResult.confirm(code);
        UIManager.showToast("Phone linked successfully!", "success");
        UIManager.el('antinna-phone-modal')?.classList.remove('active');
        (window as any).hasPhoneLinked = true;

        // Proceed to next step
        (window as any).AntinnaEngine.showGeoVerification();
    } catch (error: any) {
        console.error("OTP Verification failed", error);
        UIManager.showToast("Invalid OTP code", "error");
    }
  }
}
