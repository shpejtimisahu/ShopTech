import { useEffect, useState } from "react";
import { usePendingOrders } from "../App";
import { useToast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { api } from "../api/api";

const BACKEND_URL = "http://127.0.0.1:8000";
type Tab = "dashboard" | "products" | "orders" | "users";

function Admin() {
  const [tab, setTab] = useState<Tab>("dashboard");

  const { refreshPending } = usePendingOrders();
  const { showToast } = useToast();
  const [confirm, setConfirm] = useState<{ title: string; message: string; onYes: () => void } | null>(null);

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [productFilter, setProductFilter] = useState("all");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const emptyForm = { name: "", description: "", price: "", stock: "", image_url: "", category: "Other" };
  const [form, setForm] = useState(emptyForm);

  // Users state
  const [users, setUsers] = useState<any[]>([]);

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState("all");

  // Dashboard stats state
  const [stats, setStats] = useState<any>(null);

  const fetchStats = () => {
    api.get("/stats/admin/overview").then(res => setStats(res.data)).catch(() => {});
  };

  const fetchUsers = () => {
    api.get("/users/all").then(res => setUsers(res.data));
  };

  const fetchProducts = () => {
    api.get("/products/admin/all").then(res => setProducts(res.data));
  };

  const fetchOrders = () => {
    api.get("/orders/admin/all").then(res => setOrders(res.data));
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchUsers();
    fetchStats();
  }, []);

  // ─── Product handlers ───────────────────────────────────────
  const handleSubmit = () => {
    if (!form.name) return showToast("Product name is required", "error");
    if (!form.price) return showToast("Price is required", "error");
    if (!form.stock) return showToast("Stock is required", "error");
    if (!form.description) return showToast("Description is required", "error");

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      image_url: form.image_url || null,
      category: form.category || "Other"
    };

    const request = editingProduct
      ? api.put(`/products/${editingProduct.id}`, payload)
      : api.post("/products/", payload);

    request.then(async (res) => {
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        await api.post(`/products/${res.data.id}/upload-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      fetchProducts();
      setForm(emptyForm);
      setImageFile(null);
      setEditingProduct(null);
      setShowForm(false);
    }).catch(() => showToast("Error saving product", "error"));
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      image_url: product.image_url || "",
      category: product.category || "Other"
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (productId: number) => {
    setConfirm({
      title: "Delete Product?",
      message: "This will permanently delete the product. This cannot be undone.",
      onYes: () => {
        api.delete(`/products/${productId}`)
          .then(() => { fetchProducts(); showToast("Product deleted", "success"); })
          .catch(() => showToast("Error deleting product", "error"))
          .finally(() => setConfirm(null));
      }
    });
  };

  // ─── Order handlers ──────────────────────────────────────────
  const makeAdmin = (userId: number) => {
    api.post(`/users/make-admin/${userId}`)
      .then(() => fetchUsers())
      .catch(err => showToast(err.response?.data?.detail || "Could not make admin", "error"));
  };

  const removeAdmin = (userId: number) => {
    setConfirm({
      title: "Remove Admin?",
      message: "Remove admin role from this user?",
      onYes: () => {
        api.post(`/users/remove-admin/${userId}`)
          .then(() => { fetchUsers(); showToast("Admin role removed", "success"); })
          .catch(err => showToast(err.response?.data?.detail || "Could not remove admin", "error"))
          .finally(() => setConfirm(null));
      }
    });
  };

  const updateOrderStatus = (orderId: number, newStatus: string) => {
    api.put(`/orders/admin/${orderId}/status?new_status=${newStatus}`)
      .then(() => { fetchOrders(); refreshPending(); })
      .catch(err => showToast(err.response?.data?.detail || "Could not update status", "error"));
  };

  const clearHistory = () => {
    setConfirm({
      title: "Clear All History?",
      message: "This will permanently delete ALL order history. This cannot be undone!",
      onYes: () => {
        api.delete("/orders/admin/clear-history")
          .then(() => { fetchOrders(); showToast("Order history cleared", "success"); })
          .catch(err => showToast(err.response?.data?.detail || "Could not clear history", "error"))
          .finally(() => setConfirm(null));
      }
    });
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "pending":   return "bg-amber-100 text-amber-700";
      case "confirmed": return "bg-blue-100 text-blue-700";
      case "shipped":   return "bg-purple-100 text-purple-700";
      case "delivered": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-600";
      default:          return "bg-gray-100 text-gray-600";
    }
  };

  const filteredOrders = orders.filter(o => {
    if (orderFilter === "pending")   return o.status === "pending";
    if (orderFilter === "delivered") return o.status === "delivered";
    if (orderFilter === "cancelled") return o.status === "cancelled";
    return true;
  });

  const inStock    = products.filter(p => p.stock > 0).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;

  return (
    <div className="max-w-5xl mx-auto">

      <ConfirmModal
        open={confirm !== null}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        confirmText="Yes, Continue"
        danger
        onConfirm={() => confirm?.onYes()}
        onCancel={() => setConfirm(null)}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
          <p className="text-sm text-gray-400 mt-1">
            {inStock} in stock · <span className="text-red-500">{outOfStock} out of stock</span>
            {" · "}
            <span className="text-amber-500">{pendingOrders} pending orders</span>
          </p>
        </div>
        {tab === "products" && (
          <button
            onClick={() => { setShowForm(!showForm); setEditingProduct(null); setForm(emptyForm); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
          >
            {showForm ? "Cancel" : "+ Add Product"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "dashboard", label: "📊 Dashboard" },
          { key: "products", label: "🛍️ Products" },
          { key: "orders",   label: "📦 Orders" },
          { key: "users",    label: "👥 Users" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`relative px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {t.label}
            {t.key === "orders" && pendingOrders > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingOrders > 9 ? "9+" : pendingOrders}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── DASHBOARD TAB ─── */}
      {tab === "dashboard" && stats && (
        <div className="space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">💰</div>
              </div>
              <p className="text-2xl font-bold text-gray-900">${stats.total_revenue.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-0.5">Total Revenue</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl">📦</div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
              <p className="text-sm text-gray-400 mt-0.5">Total Orders</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">🛍️</div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_products}</p>
              <p className="text-sm text-gray-400 mt-0.5">Products</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">👥</div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
              <p className="text-sm text-gray-400 mt-0.5">Customers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Sales chart - last 7 days */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-1">Sales This Year</h3>
              <p className="text-sm text-gray-400 mb-6">Revenue per month</p>
              <div className="flex items-end justify-between gap-1 h-40">
                {stats.sales_by_day.map((day: any, i: number) => {
                  const maxRev = Math.max(...stats.sales_by_day.map((d: any) => d.revenue), 1);
                  const height = day.revenue > 0 ? (day.revenue / maxRev) * 100 : 2;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col justify-end h-32 relative group">
                        <div className="w-full rounded-t-md transition-all hover:opacity-80"
                          style={{
                            height: `${height}%`,
                            background: "linear-gradient(180deg, #818cf8, #6366f1)",
                            minHeight: "4px"
                          }}>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-10">
                            ${day.revenue}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{day.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Orders by status */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-1">Orders by Status</h3>
              <p className="text-sm text-gray-400 mb-6">Distribution of all orders</p>
              {(() => {
                const s = stats.orders_by_status;
                const totalOrders = s.pending + s.delivered + s.cancelled || 1;
                const bars = [
                  { label: "Pending", value: s.pending, color: "bg-amber-400", text: "text-amber-600" },
                  { label: "Delivered", value: s.delivered, color: "bg-green-500", text: "text-green-600" },
                  { label: "Cancelled", value: s.cancelled, color: "bg-red-400", text: "text-red-500" },
                ];
                return (
                  <div className="space-y-4">
                    {bars.map(bar => (
                      <div key={bar.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{bar.label}</span>
                          <span className={`font-semibold ${bar.text}`}>{bar.value}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${bar.color} rounded-full transition-all`}
                            style={{ width: `${(bar.value / totalOrders) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Stock alerts */}
              <div className="mt-6 pt-6 border-t border-gray-100 flex gap-4">
                <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{stats.low_stock}</p>
                  <p className="text-xs text-amber-600/70 mt-0.5">Low Stock</p>
                </div>
                <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-500">{stats.out_of_stock}</p>
                  <p className="text-xs text-red-500/70 mt-0.5">Out of Stock</p>
                </div>
              </div>
            </div>
          </div>

          {/* Best sellers */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-1">🏆 Best Selling Products</h3>
            <p className="text-sm text-gray-400 mb-5">Top products by quantity sold</p>
            {stats.best_sellers.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No sales data yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.best_sellers.map((p: any, i: number) => (
                  <div key={p.id} className="flex items-center gap-4">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      i === 0 ? "bg-yellow-100 text-yellow-600" :
                      i === 1 ? "bg-gray-100 text-gray-500" :
                      i === 2 ? "bg-orange-100 text-orange-500" : "bg-gray-50 text-gray-400"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url.startsWith("http") ? p.image_url : `${BACKEND_URL}${p.image_url}`}
                          alt={p.name} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">${p.price}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-indigo-600">{p.total_sold}</p>
                      <p className="text-xs text-gray-400">sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PRODUCTS TAB ─── */}
      {tab === "products" && (
        <>
          {showForm && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <h3 className="text-lg font-bold mb-4">{editingProduct ? "Edit Product" : "New Product"}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Gaming Laptop"
                    className="border border-gray-200 p-2.5 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea placeholder="e.g. High performance gaming laptop..."
                    className="border border-gray-200 p-2.5 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) <span className="text-red-500">*</span></label>
                  <input type="text" inputMode="numeric" placeholder="e.g. 850"
                    className="border border-gray-200 p-2.5 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.price} onChange={e => setForm({ ...form, price: e.target.value.replace(/[^0-9]/g, "") })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock <span className="text-red-500">*</span></label>
                  <input type="text" inputMode="numeric" placeholder="e.g. 10"
                    className="border border-gray-200 p-2.5 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value.replace(/[^0-9]/g, "") })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input type="text" placeholder="https://example.com/image.jpg"
                    className="border border-gray-200 p-2.5 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="border border-gray-200 p-2.5 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {["Laptops & Computers","Phones & Tablets","Gaming","Accessories","Monitors","Audio","Cameras","Other"].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                  <input type="file" accept="image/*" className="w-full border border-gray-200 p-2 rounded-xl"
                    onChange={e => setImageFile(e.target.files?.[0] || null)} />
                  {imageFile && <p className="text-sm text-green-600 mt-1">✓ {imageFile.name}</p>}
                </div>
              </div>
              <button onClick={handleSubmit}
                className="mt-4 w-full bg-green-500 text-white py-2.5 rounded-xl hover:bg-green-600 transition-colors font-semibold">
                {editingProduct ? "Save Changes" : "Create Product"}
              </button>
            </div>
          )}

          {/* Stock filter pills */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "all", label: `All (${products.length})` },
              { key: "in-stock", label: `In Stock (${products.filter(p => p.stock > 0).length})` },
              { key: "out-of-stock", label: `Out of Stock (${products.filter(p => p.stock === 0).length})` },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setProductFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  productFilter === f.key
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-indigo-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100">
                <tr>
                  <th className="p-3 text-left">Image</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Stock</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = products.filter(p => {
                    if (productFilter === "in-stock") return p.stock > 0;
                    if (productFilter === "out-of-stock") return p.stock === 0;
                    return true;
                  });
                  if (filtered.length === 0) {
                    return <tr><td colSpan={6} className="p-8 text-center text-gray-400">No products in this filter.</td></tr>;
                  }
                  return filtered.map(p => (
                  <tr key={p.id} className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${p.stock === 0 ? "opacity-60" : ""}`}>
                    <td className="p-3">
                      {p.image_url ? (
                        <img src={p.image_url.startsWith("http") ? p.image_url : `${BACKEND_URL}${p.image_url}`}
                          alt={p.name} className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xs">No img</div>
                      )}
                    </td>
                    <td className="p-3 font-medium text-gray-900">{p.name}</td>
                    <td className="p-3 text-gray-500 max-w-xs truncate">{p.description}</td>
                    <td className="p-3 font-semibold text-indigo-600">${p.price}</td>
                    <td className="p-3">
                      {p.stock === 0 ? (
                        <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">Out of Stock</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">{p.stock} left</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(p)}
                          className="bg-amber-400 text-white px-3 py-1 rounded-lg text-xs hover:bg-amber-500 transition-colors">Edit</button>
                        <button onClick={() => handleDelete(p.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </>
      )}


      {/* USERS TAB */}
      {tab === "users" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No users found.</td></tr>
              )}
              {users.map(u => (
                <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-gray-400">#{u.id}</td>
                  <td className="p-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {u.username[0].toUpperCase()}
                      </div>
                      {u.username}
                    </div>
                  </td>
                  <td className="p-3 text-gray-500">{u.email}</td>
                  <td className="p-3">
                    {u.is_admin ? (
                      <span className="bg-purple-100 text-purple-600 text-xs font-semibold px-2 py-1 rounded-full">Admin</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-1 rounded-full">User</span>
                    )}
                  </td>
                  <td className="p-3">
                    {u.is_admin ? (
                      u.username === "admin" ? (
                        <span className="text-xs px-3 py-1 rounded-lg bg-gray-50 text-gray-400 italic">
                          Primary Admin
                        </span>
                      ) : (
                        <button onClick={() => removeAdmin(u.id)}
                          className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-500 font-semibold hover:bg-red-100 transition-colors">
                          Remove Admin
                        </button>
                      )
                    ) : (
                      <button onClick={() => makeAdmin(u.id)}
                        className="text-xs px-3 py-1 rounded-lg bg-purple-50 text-purple-600 font-semibold hover:bg-purple-100 transition-colors">
                        Make Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── ORDERS TAB ─── */}
      {tab === "orders" && (
        <>
          {/* Clear history button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={clearHistory}
              disabled={orders.length === 0}
              className="text-sm bg-red-50 border border-red-200 text-red-500 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors font-semibold disabled:opacity-40"
            >
              🗑️ Clear All History
            </button>
          </div>

          {/* Order filter */}
          <div className="flex gap-2 mb-5">
            {[
              { key: "all",       label: "All",       count: orders.length },
              { key: "pending",   label: "Pending",   count: orders.filter(o => o.status === "pending").length },
              { key: "delivered", label: "Delivered", count: orders.filter(o => o.status === "delivered").length },
              { key: "cancelled", label: "Cancelled", count: orders.filter(o => o.status === "cancelled").length },
            ].map(f => (
              <button key={f.key} onClick={() => setOrderFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  orderFilter === f.key
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-indigo-300"
                }`}>
                {f.label}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${orderFilter === f.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredOrders.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
                No {orderFilter !== "all" ? orderFilter : ""} orders found.
              </div>
            )}
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

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
                <div className="px-5 py-3 space-y-2">
                  {order.items.map((item: any) => (
                    <div key={item.product_id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.product_image ? (
                          <img src={item.product_image.startsWith("http") ? item.product_image : `${BACKEND_URL}${item.product_image}`}
                            alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">${item.price}</p>
                    </div>
                  ))}
                </div>

                {/* Delivery / contact details (Cash on Delivery) */}
                {(order.address || order.full_name || order.phone) && (
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60">
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">📦 Delivery details</p>
                    <div className="text-sm text-gray-700 space-y-0.5">
                      {order.full_name && <p><span className="text-gray-400">Name:</span> {order.full_name}</p>}
                      {order.phone && <p><span className="text-gray-400">Phone:</span> {order.phone}</p>}
                      {order.address && (
                        <p>
                          <span className="text-gray-400">Address:</span> {order.address}
                          {order.city ? `, ${order.city}` : ""}
                          {order.postal_code ? ` ${order.postal_code}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Status update actions - progressive flow */}
                {order.status !== "delivered" && order.status !== "cancelled" && (
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium mr-1">Update status:</span>
                    {order.status === "pending" && (
                      <button onClick={() => updateOrderStatus(order.id, "confirmed")}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-colors">
                        → Confirm Order
                      </button>
                    )}
                    {order.status === "confirmed" && (
                      <button onClick={() => updateOrderStatus(order.id, "shipped")}
                        className="text-xs px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200 transition-colors">
                        → Mark as Shipped
                      </button>
                    )}
                    {order.status === "shipped" && (
                      <span className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-500 italic">
                        Waiting for customer to confirm receipt
                      </span>
                    )}
                    <button onClick={() => updateOrderStatus(order.id, "cancelled")}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition-colors ml-auto">
                      ✕ Cancel Order
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Admin;
