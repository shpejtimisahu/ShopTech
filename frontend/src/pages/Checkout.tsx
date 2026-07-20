import { useState } from "react";
import { useCart } from "../App";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";

function Checkout() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { refreshCart, refreshOrderNotifications } = useCart();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
  });

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const isValid =
    form.full_name.trim() &&
    form.phone.trim() &&
    form.address.trim() &&
    form.city.trim();

  const handlePlaceOrder = async () => {
    if (!isValid) {
      setError("Please fill in all required fields.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      await api.post("/orders/checkout", form);
      refreshCart();
      refreshOrderNotifications();
      navigate("/payment-success");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not place order. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
          💵 <span>Cash on Delivery — pay when your order arrives.</span>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Full name *</label>
            <input
              type="text"
              value={form.full_name}
              onChange={handleChange("full_name")}
              placeholder="First and last name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone number *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={handleChange("phone")}
              placeholder="044 123 456"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Address *</label>
            <input
              type="text"
              value={form.address}
              onChange={handleChange("address")}
              placeholder="Street name and number"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={handleChange("city")}
                placeholder="Prishtinë"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Postal code</label>
              <input
                type="text"
                value={form.postal_code}
                onChange={handleChange("postal_code")}
                placeholder="10000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={processing}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {processing ? "Placing order..." : "Place Order (Cash on Delivery)"}
        </button>

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
