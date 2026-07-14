import { useEffect, useState } from "react";
import { useCart } from "../App";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window { Stripe: any; }
}

function Checkout() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(0);
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  // Step 1: Load Stripe + create elements (but don't mount yet)
  useEffect(() => {
    let cancelled = false;

    const ensureStripeLoaded = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (window.Stripe) { resolve(); return; }
        const existing = document.querySelector('script[src="https://js.stripe.com/v3/"]');
        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () => reject(new Error("Stripe failed to load")));
          return;
        }
        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Stripe failed to load"));
        document.head.appendChild(script);
      });
    };

    const init = async () => {
      try {
        await ensureStripeLoaded();
        if (cancelled) return;

        const res = await api.post("/payment/create-payment-intent");
        const { client_secret, amount, publishable_key } = res.data;
        if (cancelled) return;

        setAmount(amount);

        const stripeInstance = window.Stripe(publishable_key);
        const elementsInstance = stripeInstance.elements({
          clientSecret: client_secret,
          appearance: {
            theme: "stripe",
            variables: { colorPrimary: "#4f46e5", borderRadius: "12px" }
          }
        });

        setStripe(stripeInstance);
        setElements(elementsInstance);
        setLoading(false);  // div renders now
      } catch (err: any) {
        if (cancelled) return;
        setError(err.response?.data?.detail || err.message || "Could not initialize payment");
        setLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  // Step 2: Mount the payment element AFTER the div exists in the DOM
  useEffect(() => {
    if (!loading && elements) {
      const paymentElement = elements.create("payment");
      paymentElement.mount("#payment-element");
      return () => { paymentElement.unmount(); };
    }
  }, [loading, elements]);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    setError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Please check your card details");
      setProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required"
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      try {
        await api.post("/orders/checkout");
        refreshCart();
        navigate("/payment-success");
      } catch (err: any) {
        setError(err.response?.data?.detail || "Order creation failed");
        setProcessing(false);
      }
    } else {
      setError("Payment was not completed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <span className="text-gray-600 font-medium">Total to pay</span>
          <span className="text-2xl font-bold text-indigo-600">${amount}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-400">Loading payment form...</p>
          </div>
        ) : (
          <>
            <div id="payment-element" className="mb-6" />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl px-4 py-3 mb-4">
              🧪 Test mode — use card: <strong>4242 4242 4242 4242</strong>, any future date, any CVC
            </div>

            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {processing ? "Processing..." : `Pay $${amount}`}
            </button>
          </>
        )}

        <button
          onClick={() => navigate("/cart")}
          className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to Cart
        </button>
      </div>
    </div>
  );
}

export default Checkout;
