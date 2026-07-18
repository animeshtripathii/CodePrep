/**
 * loadRazorpay — lazy-loads the Razorpay checkout script on demand.
 *
 * Usage (inside handleSubscribe before opening the modal):
 *
 *   const loaded = await loadRazorpay();
 *   if (!loaded) { toast.error("Payment gateway failed to load."); return; }
 *   const rzp = new window.Razorpay(options);
 *   rzp.open();
 *
 * The script is injected only once; subsequent calls resolve immediately
 * because window.Razorpay is already defined.
 */
export function loadRazorpay() {
  return new Promise((resolve) => {
    // Already loaded — resolve immediately
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Avoid duplicate injections if called rapidly
    if (document.getElementById('razorpay-checkout-js')) {
      const existing = document.getElementById('razorpay-checkout-js');
      existing.addEventListener('load', () => resolve(!!window.Razorpay));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
