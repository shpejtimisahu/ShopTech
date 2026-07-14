import { useEffect, useState } from "react";
import { useCart } from "../App";
import { useToast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "http://127.0.0.1:8000";
type FilterType = "all" | "active" | "cancelled";

function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const navigate = useNavigate();
  const { clearOrderNotifications } = useCart();
  const { showToast } = useToast();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    clearOrderNotifications();
    // Update stored statuses when user views orders
    api.get("/orders/")
      .then(res => {
        const newStored: any = {};
        res.data.forEach((order: any) => { newStored[order.id] = order.status; });
        localStorage.setItem("order_statuses", JSON.stringify(newStored));
      })
      .catch(() => {});
  }, []);

  const fetchOrders = () => {
    api.get("/orders/")
      .then(res => {
        // Sort: newest first
        const sorted = res.data.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const cancelOrder = (orderId: number) => {
    setConfirmId(orderId);
  };

  const doCancelOrder = () => {
    if (confirmId === null) return;
    api.put(`/orders/${confirmId}/cancel`)
      .then(() => { fetchOrders(); showToast("Order cancelled", "success"); })
      .catch(err => showToast(err.response?.data?.detail || "Could not cancel order", "error"))
      .finally(() => setConfirmId(null));
  };

  const confirmReceived = (orderId: number) => {
    api.put(`/orders/${orderId}/confirm-received`)
      .then(() => { fetchOrders(); showToast("Order confirmed as received! 🎉", "success"); })
      .catch(err => showToast(err.response?.data?.detail || "Could not confirm", "error"));
  };

  useEffect(() => { fetchOrders(); }, []);

  const getImageSrc = (url: string) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "pending":   return "bg-amber-100 text-amber-700";
      case "confirmed": return "bg-blue-100 text-blue-700";
      case "shipped":   return "bg-purple-100 text-purple-700";
      case "cancelled": return "bg-red-100 text-red-600";
      case "delivered": return "bg-green-100 text-green-700";
      default:          return "bg-gray-100 text-gray-600";
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === "active")    return order.status !== "cancelled";
    if (filter === "cancelled") return order.status === "cancelled";
    return true;
  });

  const activeCount    = orders.filter(o => o.status !== "cancelled").length;
  const cancelledCount = orders.filter(o => o.status === "cancelled").length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">Loading orders...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">

      <ConfirmModal
        open={confirmId !== null}
        title="Cancel Order?"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="Keep Order"
        danger
        onConfirm={doCancelOrder}
        onCancel={() => setConfirmId(null)}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
        <p className="text-sm text-gray-400">{orders.length} total</p>
      </div>

      {/* Filter tabs */}
      {orders.length > 0 && (
        <div className="flex gap-2 mb-5">
          {[
            { key: "all",       label: "All",       count: orders.length },
            { key: "active",    label: "Active",    count: activeCount },
            { key: "cancelled", label: "Cancelled", count: cancelledCount },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as FilterType)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filter === tab.key
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {tab.label}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-gray-500 text-lg">No orders yet</p>
          <button onClick={() => navigate("/")} className="mt-4 text-indigo-600 font-semibold hover:underline">
            Start shopping →
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-gray-400">No {filter} orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
              order.status === "cancelled" ? "border-red-100 opacity-75" : "border-gray-100"
            }`}>

              {/* Order header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.id}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric"
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span className="font-bold text-gray-900">${order.total_price}</span>
                </div>
              </div>

              {/* Order items */}
              <div className="px-5 py-3 space-y-3">
                {order.items.map((item: any) => (
                  <div key={item.product_id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {getImageSrc(item.product_image) ? (
                        <img src={getImageSrc(item.product_image)!} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">${item.price}</p>
                  </div>
                ))}
              </div>

              {/* Order tracking timeline */}
              {order.status !== "cancelled" ? (
                <div className="px-5 py-4 border-t border-gray-100">
                  {(() => {
                    const steps = [
                      { key: "pending", label: "Ordered", icon: "✓" },
                      { key: "confirmed", label: "Confirmed", icon: "📋" },
                      { key: "shipped", label: "Shipped", icon: "🚚" },
                      { key: "delivered", label: "Delivered", icon: "📦" },
                    ];
                    const order_flow = ["pending", "confirmed", "shipped", "delivered"];
                    const currentIndex = order_flow.indexOf(order.status);
                    return (
                      <div className="flex items-center">
                        {steps.map((step, i) => {
                          const reached = i <= currentIndex;
                          const isCurrent = i === currentIndex;
                          return (
                            <div key={step.key} className="flex items-center flex-1 last:flex-none">
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                                  reached
                                    ? (isCurrent && order.status !== "delivered" ? "bg-indigo-500 text-white" : "bg-green-500 text-white")
                                    : "bg-gray-200 text-gray-400"
                                }`}>
                                  {reached && !isCurrent ? "✓" : step.icon}
                                </div>
                                <span className={`text-xs font-medium mt-1.5 whitespace-nowrap ${reached ? "text-gray-600" : "text-gray-400"}`}>
                                  {step.label}
                                </span>
                              </div>
                              {i < steps.length - 1 && (
                                <div className={`flex-1 h-1 mx-2 rounded ${i < currentIndex ? "bg-green-500" : "bg-gray-200"}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="px-5 py-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-red-500 text-sm font-medium">
                    <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">✕</span>
                    This order was cancelled
                  </div>
                </div>
              )}

              {/* Cancel button */}
              {order.status === "pending" && (
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="text-sm text-red-500 font-semibold hover:text-red-700 transition-colors"
                  >
                    ✕ Cancel Order
                  </button>
                </div>
              )}

              {/* Confirm received button - only for shipped orders */}
              {order.status === "shipped" && (
                <div className="px-5 py-3 border-t border-gray-100 bg-green-50">
                  <button
                    onClick={() => confirmReceived(order.id)}
                    className="w-full bg-green-500 text-white py-2.5 rounded-xl font-semibold hover:bg-green-600 transition-colors text-sm"
                  >
                    ✓ Confirm Received
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Click when you have received your order
                  </p>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
