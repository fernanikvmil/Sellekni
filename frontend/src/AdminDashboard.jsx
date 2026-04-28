import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "";

// ─── helpers ─────────────────────────────────────────────────────────────────
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl text-sm font-medium shadow-xl transition-all duration-300 pointer-events-auto
            ${t.type === "success"
              ? "bg-green-500/20 border border-green-500/30 text-green-300"
              : t.type === "error"
              ? "bg-red-500/20 border border-red-500/30 text-red-300"
              : "bg-white/10 border border-white/20 text-white"
            }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[900] p-4">
      <div className="bg-[#0A031E] border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <p className="text-white font-semibold text-center mb-1">Confirmation</p>
        <p className="text-white/60 text-sm text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RoleModal ────────────────────────────────────────────────────────────────
function RoleModal({ open, user, onClose, onSave }) {
  const [role, setRole] = useState(user?.role || "client");
  useEffect(() => { if (user) setRole(user.role || "client"); }, [user]);
  if (!open || !user) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[900] p-4">
      <div className="bg-[#0A031E] border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <p className="text-white font-semibold mb-1">Changer le rôle</p>
        <p className="text-white/50 text-sm mb-5">Utilisateur : <span className="text-violet-300">{user.username}</span></p>
        <div className="flex gap-3 mb-6">
          {["client", "technicien"].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                role === r
                  ? "bg-violet-600 border-violet-600 text-white"
                  : "border-white/10 text-white/50 hover:bg-white/5"
              }`}
            >
              {r === "client" ? "👤 Client" : "🔧 Technicien"}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(user._id, role)}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-600 text-white text-sm font-semibold transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── UserDrawer ───────────────────────────────────────────────────────────────
function UserDrawer({ user, onClose, onDelete, onRoleChange }) {
  if (!user) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[800]"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#0A031E] border-l border-white/[0.08] z-[850] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
          <h2 className="text-white font-semibold">Détails utilisateur</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl transition-colors">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-600/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.photo
                ? <img src={user.photo} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-violet-300">{user.username?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <p className="text-white font-bold text-lg">{user.username}</p>
              <p className="text-white/40 text-sm">{user.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                user.role === "technicien"
                  ? "bg-violet-500/15 text-violet-300"
                  : "bg-violet-600/15 text-violet-300"
              }`}>
                {user.role || "client"}
              </span>
            </div>
          </div>

          {/* Info fields */}
          {[
            { label: "Wilaya", value: user.wilaya || "—" },
            { label: "Ville", value: user.ville || "—" },
            { label: "Téléphone", value: user.telephone || "—" },
            { label: "Spécialité", value: user.specialite || "—" },
            { label: "Vérifié", value: user.emailVerified ? "✅ Oui" : "❌ Non" },
            { label: "Inscrit le", value: user.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : "—" },
            { label: "Dernière activité", value: user.lastSeen ? new Date(user.lastSeen).toLocaleDateString("fr-FR") : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-white/[0.05]">
              <span className="text-white/40 text-sm">{label}</span>
              <span className="text-white text-sm">{value}</span>
            </div>
          ))}

          {user.bio && (
            <div>
              <p className="text-white/40 text-sm mb-1">Bio</p>
              <p className="text-white/80 text-sm bg-white/[0.03] rounded-xl p-3">{user.bio}</p>
            </div>
          )}

          {/* Notes */}
          {user.notations?.length > 0 && (
            <div>
              <p className="text-white/40 text-sm mb-2">Note moyenne</p>
              <p className="text-white font-semibold">
                ⭐ {(user.notations.reduce((s, n) => s + n.note, 0) / user.notations.length).toFixed(1)} / 5
                <span className="text-white/30 text-xs font-normal ml-1">({user.notations.length} avis)</span>
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-white/[0.08] flex gap-3">
          <button
            onClick={() => onRoleChange(user)}
            className="flex-1 py-2.5 rounded-xl bg-violet-600/20 border border-violet-600/30 text-violet-300 text-sm font-medium hover:bg-violet-600/30 transition-colors"
          >
            Changer rôle
          </button>
          <button
            onClick={() => onDelete(user._id)}
            className="flex-1 py-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 text-sm font-medium hover:bg-red-600/30 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",    icon: "📊", label: "Vue d'ensemble" },
  { id: "users",      icon: "👤", label: "Utilisateurs" },
  { id: "annonces",   icon: "📢", label: "Annonces" },
  { id: "posts",      icon: "💬", label: "Forum" },
  { id: "moderation", icon: "🛡️", label: "Modération" },
];

function Sidebar({ active, onChange, onLogout, isSuperAdmin, mobileOpen, onMobileClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} />
      )}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 min-h-screen bg-[#060F25] border-r border-white/[0.07] flex flex-col transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/[0.07] flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg">⚙️ Sellekni</p>
            <p className="text-white/30 text-xs">
              {isSuperAdmin ? "Super-Admin" : "Admin"}
            </p>
          </div>
          <button onClick={onMobileClose} className="lg:hidden text-white/40 hover:text-white text-xl">✕</button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active === t.id
                  ? "bg-violet-600/20 border border-violet-600/25 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
          {isSuperAdmin && (
            <button
              onClick={() => onChange("admins")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active === "admins"
                  ? "bg-amber-500/20 border border-amber-500/25 text-amber-300"
                  : "text-amber-400/60 hover:bg-amber-500/10 hover:text-amber-300"
              }`}
            >
              <span>👑</span>
              Gestion Admins
            </button>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/[0.07]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400/70 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <span>🚪</span>
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, loading }) {
  return (
    <div className={`bg-white/[0.03] border ${color} rounded-2xl p-6`}>
      <p className="text-white/50 text-sm">{icon} {label}</p>
      <p className="text-4xl font-black text-white mt-2">
        {loading ? <span className="text-white/20">…</span> : value}
      </p>
    </div>
  );
}

// ─── BarChart ─────────────────────────────────────────────────────────────────
function BarChart({ data, dataKey, color, loading }) {
  const max = data.length ? Math.max(...data.map((d) => d[dataKey] || 0), 1) : 1;
  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="w-6 h-6 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );
  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const v = item[dataKey] || 0;
        const w = (v / max) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-white/40 text-xs w-12 text-right">{item.date}</span>
            <div className="flex-1 bg-white/[0.06] rounded-full h-5 overflow-hidden">
              <div
                className={`${color} h-full rounded-full flex items-center justify-end pr-2 text-white text-[10px] font-semibold transition-all duration-700`}
                style={{ width: `${Math.max(w, v > 0 ? 8 : 0)}%` }}
              >
                {v > 0 && v}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── OverviewPanel ────────────────────────────────────────────────────────────
function OverviewPanel({ stats, statsLoading, charts, chartsLoading }) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon="👤" label="Utilisateurs"        value={stats.users}    color="border-violet-600/20" loading={statsLoading} />
        <StatCard icon="📢" label="Annonces & Services" value={stats.annonces} color="border-violet-500/20"   loading={statsLoading} />
        <StatCard icon="💬" label="Posts Forum"         value={stats.posts}    color="border-green-500/20"  loading={statsLoading} />
      </div>

      {/* Annonces chart */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-5">📢 Annonces & Services — 10 derniers jours</h3>
        <div className="space-y-6">
          <div>
            <p className="text-white/50 text-xs mb-3 font-medium">📢 Annonces</p>
            <BarChart data={charts.annonces} dataKey="annonces" color="bg-violet-600" loading={chartsLoading} />
          </div>
          <div>
            <p className="text-white/50 text-xs mb-3 font-medium">🔧 Services</p>
            <BarChart data={charts.annonces} dataKey="services" color="bg-violet-500" loading={chartsLoading} />
          </div>
        </div>
      </div>

      {/* Posts chart */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-5">💬 Posts Forum — 10 derniers jours</h3>
        <BarChart data={charts.posts} dataKey="count" color="bg-green-500" loading={chartsLoading} />
      </div>
    </div>
  );
}

// ─── UsersPanel ───────────────────────────────────────────────────────────────
function UsersPanel({ onToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, userId: null });
  const [roleModal, setRoleModal] = useState({ open: false, user: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BACKEND}/api/admin/users/list`, { headers: authHeaders() });
      const d = await r.json();
      setUsers(d.items || []);
    } catch {
      onToast("Erreur chargement utilisateurs", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    setConfirmModal({ open: false, userId: null });
    setSelectedUser(null);
    try {
      await fetch(`${BACKEND}/api/admin/users/${id}`, { method: "DELETE", headers: authHeaders() });
      setUsers((u) => u.filter((x) => x._id !== id));
      onToast("Utilisateur supprimé", "success");
    } catch {
      onToast("Erreur suppression", "error");
    }
  };

  const handleRoleSave = async (id, role) => {
    setRoleModal({ open: false, user: null });
    try {
      const r = await fetch(`${BACKEND}/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ role }),
      });
      if (!r.ok) throw new Error();
      setUsers((u) => u.map((x) => (x._id === id ? { ...x, role } : x)));
      if (selectedUser?._id === id) setSelectedUser((u) => ({ ...u, role }));
      onToast("Rôle mis à jour", "success");
    } catch {
      onToast("Erreur mise à jour du rôle", "error");
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="flex-1 min-w-48 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-600/50"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
          >
            <option value="all">Tous les rôles</option>
            <option value="client">Client</option>
            <option value="technicien">Technicien</option>
          </select>
        </div>

        {/* Count */}
        <p className="text-white/30 text-sm">{filtered.length} utilisateur(s)</p>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-white/30 py-16">Aucun utilisateur trouvé</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => (
              <div
                key={u._id}
                onClick={() => setSelectedUser(u)}
                className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-violet-600/25 hover:bg-white/[0.04] cursor-pointer transition-all"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {u.photo
                    ? <img src={u.photo} alt="" className="w-full h-full object-cover" />
                    : <span className="text-violet-300 font-bold">{u.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{u.username}</p>
                  <p className="text-white/40 text-xs truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    u.role === "technicien"
                      ? "bg-violet-500/15 text-violet-300"
                      : "bg-violet-600/15 text-violet-300"
                  }`}>
                    {u.role || "client"}
                  </span>
                  {u.wilaya && <span className="text-white/25 text-xs hidden sm:inline">{u.wilaya}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      <UserDrawer
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onDelete={(id) => setConfirmModal({ open: true, userId: id })}
        onRoleChange={(u) => setRoleModal({ open: true, user: u })}
      />

      <ConfirmModal
        open={confirmModal.open}
        message="Supprimer cet utilisateur ? Cette action est irréversible."
        onConfirm={() => handleDelete(confirmModal.userId)}
        onCancel={() => setConfirmModal({ open: false, userId: null })}
      />

      <RoleModal
        open={roleModal.open}
        user={roleModal.user}
        onClose={() => setRoleModal({ open: false, user: null })}
        onSave={handleRoleSave}
      />
    </>
  );
}

// ─── GenericContentPanel ──────────────────────────────────────────────────────
function ContentPanel({ type, onToast }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BACKEND}/api/admin/${type}/list`, { headers: authHeaders() });
      const d = await r.json();
      setItems(d.items || []);
    } catch {
      onToast("Erreur chargement", "error");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    setConfirmModal({ open: false, id: null });
    try {
      await fetch(`${BACKEND}/api/admin/${type}/${id}`, { method: "DELETE", headers: authHeaders() });
      setItems((i) => i.filter((x) => x._id !== id));
      onToast("Supprimé avec succès", "success");
    } catch {
      onToast("Erreur suppression", "error");
    }
  };

  const isAnnonces = type === "annonces";
  const isPosts = type === "posts";

  const filtered = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (isAnnonces) return item.titre?.toLowerCase().includes(q) || item.auteur?.toLowerCase().includes(q);
    return item.contenu?.toLowerCase().includes(q) || item.auteur?.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="space-y-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAnnonces ? "Rechercher par titre ou auteur..." : "Rechercher dans les posts..."}
          className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-600/50"
        />
        <p className="text-white/30 text-sm">{filtered.length} résultat(s)</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-white/30 py-16">Aucun contenu</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <div
                key={item._id}
                className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-white/10 transition-all"
              >
                {/* Thumb */}
                {item.photo && (
                  <img
                    src={item.photo}
                    alt=""
                    className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  {isAnnonces && (
                    <>
                      <p className="text-white font-medium text-sm truncate">
                        {item.type === "service" ? "🔧 " : "📢 "}{item.titre}
                      </p>
                      <p className="text-violet-400 text-xs">{Number(item.prix).toLocaleString()} DA</p>
                      <p className="text-white/30 text-xs">
                        {item.auteur} · {item.wilaya || "—"} · {item.categorie}
                      </p>
                    </>
                  )}
                  {isPosts && (
                    <>
                      <p className="text-white/80 text-sm line-clamp-2">
                        {item.contenu || "Sans contenu"}
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        Par {item.auteur} · ❤️ {item.likes?.length || 0} · 💬 {item.commentaires?.length || 0}
                      </p>
                    </>
                  )}
                  <p className="text-white/20 text-[10px] mt-1">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fr-FR") : ""}
                  </p>
                </div>

                <div className="flex gap-2 flex-shrink-0 self-start">
                  {isAnnonces && (
                    <button
                      onClick={() => navigate(`/annonces/${item._id}`)}
                      className="px-3 py-1.5 bg-violet-500/15 text-violet-400 rounded-lg text-xs hover:bg-violet-500/25 transition-colors"
                    >
                      Voir
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmModal({ open: true, id: item._id })}
                    className="px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-xs hover:bg-red-500/25 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmModal.open}
        message="Supprimer ce contenu définitivement ?"
        onConfirm={() => handleDelete(confirmModal.id)}
        onCancel={() => setConfirmModal({ open: false, id: null })}
      />
    </>
  );
}

// ─── ContentViewModal ─────────────────────────────────────────────────────────
function ContentViewModal({ open, item, onClose, onDelete }) {
  const [content, setContent] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    setFetching(true);
    setNotFound(false);
    setContent(null);
    fetch(`${BACKEND}/api/admin/content/${item.contentType}/${item.contentId}`, { headers: authHeaders() })
      .then(r => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then(data => { if (data) setContent(data.content); })
      .catch(() => setNotFound(true))
      .finally(() => setFetching(false));
  }, [open, item?.contentId]);

  if (!open || !item) return null;

  const typeLabel = item.contentType === "post" ? "💬 Publication forum" : item.contentType === "annonce" ? "📢 Annonce" : "🔧 Service";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[900] p-4">
      <div className="bg-[#0A031E] border border-white/[0.1] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] flex-shrink-0">
          <div>
            <p className="text-white font-semibold">{typeLabel}</p>
            <p className="text-white/40 text-xs mt-0.5">Par <span className="text-violet-300">{item.contentAuthor}</span></p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {fetching ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
            </div>
          ) : notFound ? (
            <div className="text-center py-12">
              <p className="text-5xl mb-4">🗑️</p>
              <p className="text-white/70 font-semibold">Contenu déjà supprimé</p>
              <p className="text-white/30 text-sm mt-2">Ce contenu a été supprimé avant d'être modéré.</p>
            </div>
          ) : content ? (
            <div className="space-y-4">
              {content.photo && (
                <img src={content.photo} alt="" className="w-full h-52 object-cover rounded-xl border border-white/[0.08]" />
              )}
              {content.titre && (
                <div>
                  <p className="text-white font-bold text-lg leading-snug">{content.titre}</p>
                  {content.prix !== undefined && (
                    <p className="text-emerald-400 font-semibold mt-1">{Number(content.prix).toLocaleString()} DA</p>
                  )}
                </div>
              )}
              {content.contenu && (
                <p className="text-white/75 text-sm leading-relaxed">{content.contenu}</p>
              )}
              {content.description && (
                <p className="text-white/55 text-sm leading-relaxed">{content.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {content.wilaya   && <span className="text-xs bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 rounded-lg text-white/50">📍 {content.wilaya}</span>}
                {content.categorie && <span className="text-xs bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 rounded-lg text-white/50">{content.categorie}</span>}
                {content.likes    && <span className="text-xs bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 rounded-lg text-white/50">❤️ {content.likes.length}</span>}
                {content.commentaires && <span className="text-xs bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 rounded-lg text-white/50">💬 {content.commentaires.length}</span>}
              </div>
              {item.reason && (
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
                  <p className="text-amber-400 text-xs font-semibold mb-1">Raison du signalement</p>
                  <p className="text-amber-200/80 text-sm">{item.reason}</p>
                </div>
              )}
              <div className="text-xs text-white/25">
                Signalé par : <span className="text-white/50">{item.signaledBy}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-white/[0.08] flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">
            Fermer
          </button>
          {!fetching && !notFound && content && (
            <button onClick={() => { onClose(); onDelete(item); }}
              className="flex-1 py-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-600/30 transition-colors">
              🗑️ Supprimer le contenu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ModerationPanel ──────────────────────────────────────────────────────────
function ModerationPanel({ onToast }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false, item: null });
  const [viewModal, setViewModal] = useState({ open: false, item: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BACKEND}/api/admin/moderation/signaled`, { headers: authHeaders() });
      const d = await r.json();
      setItems(d.items || []);
    } catch {
      onToast("Erreur chargement modération", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (item) => {
    setConfirmModal({ open: false, item: null });
    try {
      const endpoint = item.contentType === "post" ? "posts" : "annonces";
      await fetch(`${BACKEND}/api/admin/${endpoint}/${item.contentId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setItems((i) => i.filter((x) => x._id !== item._id));
      onToast("Contenu supprimé", "success");
    } catch {
      onToast("Erreur suppression", "error");
    }
  };

  const handleIgnore = async (id) => {
    try {
      await fetch(`${BACKEND}/api/admin/moderation/${id}/ignorer`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      setItems((i) => i.filter((x) => x._id !== id));
      onToast("Signalement ignoré", "success");
    } catch {
      onToast("Erreur", "error");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Effacer tout l'historique des signalements ? Cette action est irréversible.")) return;
    try {
      await fetch(`${BACKEND}/api/admin/moderation/all`, { method: "DELETE", headers: authHeaders() });
      setItems([]);
      onToast("Historique effacé", "success");
    } catch {
      onToast("Erreur", "error");
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 text-sm flex-1">
            🛡️ Contenus signalés par les utilisateurs — {items.length} signalement{items.length !== 1 ? "s" : ""}
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors whitespace-nowrap"
            >
              🗑️ Effacer tout l'historique
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">✅</p>
            <p className="text-white/40 text-sm">Aucun contenu signalé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item._id}
                className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                        {item.contentType === "post" ? "💬 Post" : item.contentType === "annonce" ? "📢 Annonce" : "🔧 Service"}
                      </span>
                      <span className="text-white/30 text-xs">
                        Signalé par <span className="text-white/60">{item.signaledBy}</span>
                      </span>
                    </div>
                    <p className="text-white/80 text-sm line-clamp-2">{item.contentPreview}</p>
                    <p className="text-white/30 text-xs mt-1">
                      Auteur : {item.contentAuthor} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fr-FR") : ""}
                    </p>
                    {item.reason && (
                      <p className="text-amber-300/70 text-xs mt-1">Raison : {item.reason}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap sm:flex-shrink-0">
                    <button
                      onClick={() => setViewModal({ open: true, item })}
                      className="px-3 py-1.5 bg-violet-500/15 text-violet-400 rounded-lg text-xs hover:bg-violet-500/25 transition-colors"
                    >
                      👁️ Voir
                    </button>
                    <button
                      onClick={() => handleIgnore(item._id)}
                      className="px-3 py-1.5 bg-white/5 text-white/50 rounded-lg text-xs hover:bg-white/10 transition-colors"
                    >
                      Ignorer
                    </button>
                    <button
                      onClick={() => setConfirmModal({ open: true, item })}
                      className="px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-xs hover:bg-red-500/25 transition-colors"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmModal.open}
        message="Supprimer ce contenu signalé définitivement ?"
        onConfirm={() => handleDelete(confirmModal.item)}
        onCancel={() => setConfirmModal({ open: false, item: null })}
      />

      <ContentViewModal
        open={viewModal.open}
        item={viewModal.item}
        onClose={() => setViewModal({ open: false, item: null })}
        onDelete={(item) => setConfirmModal({ open: true, item })}
      />
    </>
  );
}

// ─── AdminsPanel (superadmin only) ───────────────────────────────────────────
function AdminsPanel({ onToast }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, adminId: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BACKEND}/api/admin/admins/list`, { headers: authHeaders() });
      const d = await r.json();
      setAdmins(d.admins || []);
    } catch {
      onToast("Erreur chargement des admins", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setAdding(true);
    try {
      const r = await fetch(`${BACKEND}/api/admin/admins/add`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { onToast(d.message || "Erreur", "error"); return; }
      onToast(d.message, "success");
      setEmail("");
      load();
    } catch {
      onToast("Erreur lors de l'ajout", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleRevoke = async (id) => {
    setConfirmModal({ open: false, adminId: null });
    try {
      const r = await fetch(`${BACKEND}/api/admin/admins/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const d = await r.json();
      if (!r.ok) { onToast(d.message || "Erreur", "error"); return; }
      setAdmins((a) => a.filter((x) => x._id !== id));
      onToast("Droits révoqués", "success");
    } catch {
      onToast("Erreur lors de la révocation", "error");
    }
  };

  return (
    <>
      <div className="space-y-5 max-w-2xl">
        {/* Add admin */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-1">➕ Ajouter un administrateur</h3>
          <p className="text-white/40 text-sm mb-4">
            L'utilisateur devra utiliser son email pour se connecter au panel admin.
          </p>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Email de l'utilisateur..."
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-600/60 placeholder-white/20"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !email.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-600 text-white transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {adding ? "..." : "Ajouter"}
            </button>
          </div>
        </div>

        {/* List of admins */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">
              🛡️ Administrateurs actifs
              <span className="ml-2 text-white/30 font-normal">({admins.length})</span>
            </h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-white/10 border-t-violet-600 rounded-full animate-spin" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-10 text-white/25 text-sm">
              Aucun administrateur ajouté
            </div>
          ) : (
            admins.map((admin) => (
              <div key={admin._id} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-600/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {admin.photo
                    ? <img src={admin.photo} alt="" className="w-full h-full object-cover" />
                    : <span className="text-violet-300 font-bold text-sm">{admin.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{admin.username}</p>
                  <p className="text-white/40 text-xs truncate">{admin.email}</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-violet-600/15 text-violet-300 font-semibold flex-shrink-0">
                  Admin
                </span>
                <button
                  onClick={() => setConfirmModal({ open: true, adminId: admin._id })}
                  className="px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-xs hover:bg-red-500/25 transition-colors flex-shrink-0"
                >
                  Révoquer
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        message="Révoquer les droits administrateur de cet utilisateur ?"
        onConfirm={() => handleRevoke(confirmModal.adminId)}
        onCancel={() => setConfirmModal({ open: false, adminId: null })}
      />
    </>
  );
}

// ─── AdminDashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [toasts, setToasts] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Overview data
  const [stats, setStats] = useState({ users: 0, annonces: 0, posts: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [charts, setCharts] = useState({ annonces: [], posts: [] });
  const [chartsLoading, setChartsLoading] = useState(true);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("isSuperAdmin");
    navigate("/admin/login");
  };

  // Check if superadmin on mount
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${BACKEND}/api/admin/verify`, { headers: authHeaders() });
        const d = await r.json();
        setIsSuperAdmin(d.isSuperAdmin || false);
      } catch {}
    };
    check();
  }, []);

  // Load overview data
  useEffect(() => {
    if (activeTab !== "overview") return;

    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const [ur, ar, pr] = await Promise.all([
          fetch(`${BACKEND}/api/admin/users/count`, { headers: authHeaders() }),
          fetch(`${BACKEND}/api/admin/annonces/count`, { headers: authHeaders() }),
          fetch(`${BACKEND}/api/admin/posts/count`, { headers: authHeaders() }),
        ]);
        const [ud, ad, pd] = await Promise.all([ur.json(), ar.json(), pr.json()]);
        setStats({ users: ud.count || 0, annonces: ad.count || 0, posts: pd.count || 0 });
      } catch {
        addToast("Erreur chargement statistiques", "error");
      } finally {
        setStatsLoading(false);
      }
    };

    const loadCharts = async () => {
      setChartsLoading(true);
      try {
        const [ar, pr] = await Promise.all([
          fetch(`${BACKEND}/api/admin/annonces/chart`, { headers: authHeaders() }),
          fetch(`${BACKEND}/api/admin/posts/chart`, { headers: authHeaders() }),
        ]);
        const [ad, pd] = await Promise.all([ar.json(), pr.json()]);
        setCharts({ annonces: ad.data || [], posts: pd.data || [] });
      } catch {
        addToast("Erreur chargement graphiques", "error");
      } finally {
        setChartsLoading(false);
      }
    };

    loadStats();
    loadCharts();
  }, [activeTab, addToast]);

  const ALL_TABS = [...TABS, { id: "admins", icon: "👑", label: "Gestion Admins" }];
  const tabTitle = ALL_TABS.find((t) => t.id === activeTab);

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        active={activeTab}
        onChange={(tab) => { setActiveTab(tab); setMobileNavOpen(false); }}
        onLogout={handleLogout}
        isSuperAdmin={isSuperAdmin}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      {/* Main */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto w-full min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white transition-colors flex-shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
                {tabTitle?.icon} {tabTitle?.label}
              </h1>
              <p className="text-white/30 text-xs sm:text-sm mt-0.5 hidden sm:block">Panel d'administration Sellekni</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-center w-40 rounded-2xl h-12 relative text-white text-base font-semibold group flex-shrink-0 overflow-hidden border border-white/[0.08]"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div className="rounded-xl h-10 w-1/4 grid place-items-center absolute left-0 top-0 group-hover:w-full z-10 duration-500"
              style={{ background: "linear-gradient(135deg,#8B5CF6,#1F48B5)" }}>
              <svg width="20px" height="20px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path fill="#ffffff" d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z" />
                <path fill="#ffffff" d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z" />
              </svg>
            </div>
            <p className="translate-x-3 relative z-0">Go Back</p>
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <OverviewPanel
            stats={stats}
            statsLoading={statsLoading}
            charts={charts}
            chartsLoading={chartsLoading}
          />
        )}
        {activeTab === "users" && <UsersPanel onToast={addToast} />}
        {activeTab === "annonces" && <ContentPanel type="annonces" onToast={addToast} />}
        {activeTab === "posts" && <ContentPanel type="posts" onToast={addToast} />}
        {activeTab === "moderation" && <ModerationPanel onToast={addToast} />}
        {activeTab === "admins" && isSuperAdmin && <AdminsPanel onToast={addToast} />}
      </main>

      <Toast toasts={toasts} />
    </div>
  );
}
