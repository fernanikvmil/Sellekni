import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "";

export default function ProtectedAdminRoute({ children }) {
  const [status, setStatus] = useState("checking"); // "checking" | "ok" | "fail"

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setStatus("fail");
      return;
    }
    fetch(`${BACKEND}/api/admin/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? setStatus("ok") : setStatus("fail")))
      .catch(() => setStatus("fail"));
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "fail") return <Navigate to="/admin/login" replace />;

  return children;
}
