import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api/api";

function AdminRoute({ children }: any) {
  const token = localStorage.getItem("token");
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    if (!token) return;
    api.get("/users/me")
      .then(res => setStatus(res.data.is_admin ? "allowed" : "denied"))
      .catch(() => setStatus("denied"));
  }, [token]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Checking access...</p>
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/" />;
  }

  return children;
}

export default AdminRoute;
