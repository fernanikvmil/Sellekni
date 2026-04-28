import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erreur de connexion");
        return;
      }
      localStorage.setItem("adminToken", data.token);
      navigate("/admin/dashboard");
    } catch {
      setError("Erreur réseau, vérifiez votre connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-violet-600/20 border border-violet-600/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚙️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Panel Admin</h1>
          <p className="text-white/40 text-sm mt-1">Accès réservé aux administrateurs</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-600/50 transition-colors"
              placeholder="admin@email.com"
              required
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Mot de passe</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-600/50 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-600 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connexion...
              </span>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <p className="text-center text-white/20 text-xs mt-6">
          Sellekni Admin · Accès restreint
        </p>
      </div>
    </div>
  );
}
