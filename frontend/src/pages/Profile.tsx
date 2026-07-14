import { useEffect, useState } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get("/users/me"),
      api.get("/orders/")
    ]).then(([userRes, ordersRes]) => {
      setUser(userRes.data);
      setOrders(ordersRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleChangePassword = () => {
    setPwError("");
    setPwSuccess("");
    if (!oldPassword || !newPassword || !confirmPassword)
      return setPwError("Please fill in all fields");
    if (newPassword !== confirmPassword)
      return setPwError("New passwords do not match");
    if (newPassword.length < 6)
      return setPwError("New password must be at least 6 characters");

    api.put(`/users/me/change-password?old_password=${oldPassword}&new_password=${newPassword}`)
      .then(() => {
        setPwSuccess("Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
      })
      .catch(err => setPwError(err.response?.data?.detail || "Failed to change password"));
  };

  const totalSpent = orders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total_price, 0);

  const activeOrders = orders.filter(o => o.status === "pending").length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">Loading profile...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h2>

      {/* User info card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{user?.username}</h3>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            {user?.is_admin && (
              <span className="text-xs font-semibold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total Orders</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-2xl font-bold text-amber-500">{activeOrders}</p>
            <p className="text-xs text-gray-400 mt-0.5">Active Orders</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">${totalSpent}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total Spent</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <button
          onClick={() => navigate("/orders")}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📦</span>
            <span className="font-medium text-gray-800">My Orders</span>
          </div>
          <span className="text-gray-400">→</span>
        </button>

        <button
          onClick={() => { setShowPasswordForm(!showPasswordForm); setPwError(""); setPwSuccess(""); }}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <span className="font-medium text-gray-800">Change Password</span>
          </div>
          <span className="text-gray-400">{showPasswordForm ? "▲" : "▼"}</span>
        </button>

        {/* Change password form */}
        {showPasswordForm && (
          <div className="px-6 pb-5 pt-2 border-t border-gray-100 bg-gray-50">
            {pwError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 mb-3">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg px-4 py-2 mb-3">
                {pwSuccess}
              </div>
            )}
            <div className="space-y-3">
              <input
                type="password" placeholder="Current password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
              />
              <input
                type="password" placeholder="New password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <input
                type="password" placeholder="Confirm new password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <button
                onClick={handleChangePassword}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Save New Password
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        className="w-full bg-white border border-red-200 text-red-500 py-3 rounded-2xl font-semibold hover:bg-red-50 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}

export default Profile;
