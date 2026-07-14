import { useEffect, useState, createContext, useContext } from "react";
import { api } from "./api/api";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Returns from "./pages/Returns";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./components/Toast";

export const PendingOrdersContext = createContext<{
  pendingOrders: number;
  refreshPending: () => void;
  cartCount: number;
  refreshCart: () => void;
  orderNotifications: number;
  cancelledNotifications: number;
  clearOrderNotifications: () => void;
}>({ pendingOrders: 0, refreshPending: () => {}, cartCount: 0, refreshCart: () => {}, orderNotifications: 0, cancelledNotifications: 0, clearOrderNotifications: () => {} });

export const usePendingOrders = () => useContext(PendingOrdersContext);
export const useCart = () => useContext(PendingOrdersContext);

function Navbar({ isAdmin, onLogout }: { isAdmin: boolean; onLogout: () => void }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const { pendingOrders, cartCount, orderNotifications, cancelledNotifications } = usePendingOrders();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <nav style={{ fontFamily: "'Outfit', sans-serif" }} className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hexGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#a855f7"/>
                </linearGradient>
              </defs>
              <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="url(#hexGrad)"/>
              <polygon points="16,7 24,12 24,21 16,26 8,21 8,12" fill="white" fillOpacity="0.08"/>
              <polygon points="16,7 24,12 24,21 16,26 8,21 8,12" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.25"/>
              <circle cx="16" cy="16" r="3" fill="white" fillOpacity="0.3"/>
              <circle cx="16" cy="16" r="1.5" fill="white" fillOpacity="0.5"/>
            </svg>
            <span className="font-bold text-lg tracking-tight text-gray-900">Shop<span className="text-indigo-600">Tech</span></span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { path: "/", label: "🏠 Home" },
              { path: "/cart", label: "🛒 Cart", show: !!token },
              { path: "/orders", label: "📦 Orders", show: !!token },
            ].filter(l => l.show !== false).map(link => (
              <Link key={link.path} to={link.path}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}>
                {link.label}
                {link.path === "/cart" && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
                {link.path === "/orders" && (cancelledNotifications > 0 || orderNotifications > 0) && (
                  <span className={`absolute -top-1 -right-1 ${cancelledNotifications > 0 ? "bg-red-500" : "bg-green-500"} text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
                    {cancelledNotifications > 0 ? cancelledNotifications : orderNotifications}
                  </span>
                )}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin"
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive("/admin") ? "bg-purple-50 text-purple-600" : "text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                }`}>
                ⚙️ Admin
                {pendingOrders > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingOrders > 9 ? "9+" : pendingOrders}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-2">
            {!token ? (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-all">Login</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200">
                  Register
                </Link>
              </>
            ) : (
              <Link to="/profile"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  isActive("/profile") ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  👤
                </div>
                Profile
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [orderNotifications, setOrderNotifications] = useState(0);
  const [cancelledNotifications, setCancelledNotifications] = useState(0);

  const refreshPending = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    api.get("/orders/admin/all").then(res => {
      setPendingOrders(res.data.filter((o: any) => o.status === "pending").length);
    }).catch(() => {});
  };

  const refreshCart = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    api.get("/cart/").then(res => {
      setCartCount(res.data.reduce((sum: number, item: any) => sum + item.quantity, 0));
    }).catch(() => {});
  };

  const refreshOrderNotifications = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    api.get("/orders/").then(res => {
      const stored = JSON.parse(localStorage.getItem("order_statuses") || "{}");
      let newDelivered = 0, newCancelled = 0;
      res.data.forEach((order: any) => {
        const prev = stored[order.id];
        if (prev && prev !== order.status) {
          if (order.status === "delivered") newDelivered++;
          if (order.status === "cancelled") newCancelled++;
        }
      });
      const newStored: any = {};
      res.data.forEach((o: any) => { newStored[o.id] = o.status; });
      localStorage.setItem("order_statuses", JSON.stringify(newStored));
      setOrderNotifications(newDelivered);
      setCancelledNotifications(newCancelled);
    }).catch(() => {});
  };

  const clearOrderNotifications = () => {
    setOrderNotifications(0);
    setCancelledNotifications(0);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.get("/users/me").then(res => {
        setIsAdmin(res.data.is_admin);
        if (res.data.is_admin) refreshPending();
        refreshCart();
        refreshOrderNotifications();
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(refreshPending, 20000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const interval = setInterval(refreshOrderNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("order_statuses");
    setIsAdmin(false);
    setPendingOrders(0);
    setCartCount(0);
    setOrderNotifications(0);
    setCancelledNotifications(0);
    window.location.href = "/login";
  };

  return (
    <ToastProvider>
    <PendingOrdersContext.Provider value={{ pendingOrders, refreshPending, cartCount, refreshCart, orderNotifications, cancelledNotifications, clearOrderNotifications }}>
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <Navbar isAdmin={isAdmin} onLogout={handleLogout} />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </PendingOrdersContext.Provider>
    </ToastProvider>
  );
}

export default App;
