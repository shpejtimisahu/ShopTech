import { useEffect, useState } from "react";
import { useCart } from "../App";
import { useToast } from "../components/Toast";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "http://127.0.0.1:8000";

function Cart() {
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const { showToast } = useToast();

  const fetchCart = () => {
    api.get("/cart/").then(res => {
      refreshCart();
      setCart(res.data);
      setLoading(false);
      res.data.forEach((item: any) => {
        api.get(`/products/${item.product_id}`)
          .then(r => setProducts(prev => ({ ...prev, [item.product_id]: r.data })))
          .catch(() => {});
      });
    }).catch(() => setLoading(false));
  };

  const increaseQty = (productId: number, qty: number) => {
    api.put(`/cart/update?product_id=${productId}&quantity=${qty + 1}`).then(fetchCart).catch(err => showToast(err.response?.data?.detail || "Could not update cart", "error"));
  };

  const decreaseQty = (productId: number, qty: number) => {
    if (qty <= 1) return;
    api.put(`/cart/update?product_id=${productId}&quantity=${qty - 1}`).then(fetchCart);
  };

  const removeItem = (productId: number) => {
    api.delete(`/cart/remove/${productId}`).then(fetchCart);
  };

  const checkout = () => {
    navigate("/checkout");
  };

  useEffect(() => { fetchCart(); }, []);

  const getImageSrc = (url: string) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  };

  const total = cart.reduce((sum, item) => {
    const p = products[item.product_id];
    return sum + (p ? p.price * item.quantity : 0);
  }, 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">Loading cart...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h2>

      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-gray-500 text-lg">Your cart is empty</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-indigo-600 font-semibold hover:underline"
          >
            Browse products →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {cart.map((item, idx) => {
            const product = products[item.product_id];
            return (
              <div key={item.id} className={`flex items-center gap-4 p-4 ${idx !== cart.length - 1 ? "border-b border-gray-100" : ""}`}>

                {/* Image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {product && getImageSrc(product.image_url) ? (
                    <img src={getImageSrc(product.image_url)!} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{product ? product.name : `Product #${item.product_id}`}</p>
                  <p className="text-sm text-gray-400">${product ? product.price : "..."} each</p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decreaseQty(item.product_id, item.quantity)}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  >−</button>
                  <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                  <button
                    onClick={() => increaseQty(item.product_id, item.quantity)}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  >+</button>
                </div>

                {/* Price */}
                <p className="font-semibold text-gray-900 w-16 text-right">
                  ${product ? product.price * item.quantity : "..."}
                </p>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg"
                >✕</button>
              </div>
            );
          })}

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">Total</span>
              <span className="text-2xl font-bold text-gray-900">${total}</span>
            </div>
            <button
              onClick={checkout}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Proceed to Payment →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
