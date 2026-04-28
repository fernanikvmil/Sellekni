import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    annonces: 0,
    posts: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [itemsList, setItemsList] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const [annoncesChart, setAnnoncesChart] = useState([]);
  const [postsChart, setPostsChart] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.email !== "sidhou999@gmail.com") {
      navigate("/login");
      return;
    }
    fetchStats();
    fetchChartData();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const [usersRes, annoncesRes, postsRes] = await Promise.all([
        fetch("/api/admin/users/count",   { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/annonces/count",{ headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/posts/count",   { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const usersData    = await usersRes.json();
      const annoncesData = await annoncesRes.json();
      const postsData    = await postsRes.json();
      setStats({
        users:   usersData.count   || 0,
        annonces:annoncesData.count|| 0,
        posts:   postsData.count   || 0,
      });
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [annoncesRes, postsRes] = await Promise.all([
        fetch("/api/admin/annonces/chart", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/posts/chart",    { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const annoncesData = await annoncesRes.json();
      const postsData    = await postsRes.json();
      setAnnoncesChart(annoncesData.data || []);
      setPostsChart(postsData.data    || []);
    } catch (error) {
      console.error("Erreur chargement graphiques:", error);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchList = async (type) => {
    setListLoading(true);
    setActiveTab(type);
    try {
      const token = localStorage.getItem("token");
      const res  = await fetch(`/api/admin/${type}/list`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setItemsList(data.items || []);
    } catch (error) {
      console.error("Erreur chargement liste:", error);
      setItemsList([]);
    } finally {
      setListLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm("Supprimer définitivement ?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/${type}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchList(type);
        fetchStats();
        fetchChartData();
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  const getViewUrl = (type, item) => {
    if (type === "annonces") return `/annonces/${item._id}`;
    if (type === "users")    return `/profil/${item.username}`;
    if (type === "posts")    return `/forum`;
    return "#";
  };

  const getMaxCount = (data, key = "total") => {
    if (!data.length) return 1;
    return Math.max(...data.map(d => d[key] || d.count || 0), 1);
  };

  return (
    <div className="min-h-screen bg-transparent p-8">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin .75s linear infinite}`}</style>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">⚙️ Page Admin</h1>
            <p className="text-white/40 text-sm">Gère tous les éléments du site</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-xl text-sm text-white/60 border border-white/10 hover:bg-white/5 transition-colors"
          >
            ← Retour au site
          </button>
        </div>

        {/* 3 cartes stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: "👤", label: "Utilisateurs",       key: "users",    type: "users"    },
            { icon: "📢", label: "Annonces & Services", key: "annonces", type: "annonces" },
            { icon: "📝", label: "Posts Forum",         key: "posts",    type: "posts"    },
          ].map(({ icon, label, key, type }) => (
            <div key={key} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:border-violet-600/30 transition-all duration-300">
              <p className="text-white/50 text-sm mb-1">{icon} {label}</p>
              <p className="text-4xl font-black text-white mt-2">
                {loading ? <span className="text-white/20">…</span> : stats[key]}
              </p>
              <button
                onClick={() => fetchList(type)}
                className="mt-4 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
              >
                Gérer →
              </button>
            </div>
          ))}
        </div>

        {/* Graphique Annonces & Services */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-5">📊 Annonces & services — 10 derniers jours</h3>
          {chartLoading ? (
            <div className="flex justify-center py-8">
              <div className="spin w-6 h-6 border-2 border-violet-600/30 border-t-violet-600 rounded-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {[
                { label: "📢 Annonces", dataKey: "annonces", color: "bg-violet-600" },
                { label: "🔧 Services", dataKey: "services", color: "bg-violet-500"   },
              ].map(({ label, dataKey, color }) => (
                <div key={dataKey}>
                  <p className="text-white/50 text-xs mb-3 font-medium">{label}</p>
                  <div className="space-y-2">
                    {annoncesChart.map((item, idx) => {
                      const max = getMaxCount(annoncesChart, dataKey);
                      const w   = max > 0 ? (item[dataKey] / max) * 100 : 0;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-white/40 text-xs w-12 text-right">{item.date}</span>
                          <div className="flex-1 bg-white/[0.06] rounded-full h-5 overflow-hidden">
                            <div
                              className={`${color} h-full rounded-full flex items-center justify-end pr-2 text-white text-[10px] font-semibold transition-all duration-700`}
                              style={{ width: `${Math.max(w, item[dataKey] > 0 ? 8 : 0)}%` }}
                            >
                              {item[dataKey] > 0 && item[dataKey]}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Graphique Posts */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8">
          <h3 className="text-white font-semibold mb-5">💬 Posts forum — 10 derniers jours</h3>
          {chartLoading ? (
            <div className="flex justify-center py-8">
              <div className="spin w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full" />
            </div>
          ) : (
            <div className="space-y-2">
              {postsChart.map((item, idx) => {
                const max = getMaxCount(postsChart, "count");
                const w   = max > 0 ? (item.count / max) * 100 : 0;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-white/40 text-xs w-12 text-right">{item.date}</span>
                    <div className="flex-1 bg-white/[0.06] rounded-full h-5 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full flex items-center justify-end pr-2 text-white text-[10px] font-semibold transition-all duration-700"
                        style={{ width: `${Math.max(w, item.count > 0 ? 8 : 0)}%` }}
                      >
                        {item.count > 0 && item.count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal liste */}
        {activeTab && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setActiveTab(null)}
          >
            <div
              className="bg-[#0A031E] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.08]">
                <h2 className="text-base font-bold text-white">
                  {activeTab === "users"    && "👤 Utilisateurs"}
                  {activeTab === "annonces" && "📢 Annonces & Services"}
                  {activeTab === "posts"    && "📝 Posts Forum"}
                </h2>
                <button onClick={() => setActiveTab(null)} className="text-white/40 hover:text-white text-xl">✕</button>
              </div>

              <div className="overflow-y-auto max-h-[65vh] p-4">
                {listLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="spin w-6 h-6 border-2 border-violet-600/30 border-t-violet-600 rounded-full" />
                  </div>
                ) : itemsList.length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-12">Aucun élément</p>
                ) : (
                  <div className="space-y-2">
                    {itemsList.map(item => (
                      <div
                        key={item._id}
                        className="flex justify-between items-center p-4 bg-white/[0.03] rounded-xl border border-white/[0.06] hover:border-white/10 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          {activeTab === "users" && (
                            <>
                              <p className="text-white text-sm font-semibold truncate">{item.username || "Sans nom"}</p>
                              <p className="text-white/40 text-xs truncate">{item.email}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.role === "technicien" ? "bg-violet-500/15 text-violet-300" : "bg-violet-600/15 text-violet-300"}`}>
                                {item.role || "client"}
                              </span>
                            </>
                          )}
                          {activeTab === "annonces" && (
                            <>
                              <p className="text-white text-sm font-semibold truncate">
                                {item.type === "service" ? "🔧 " : "📢 "}{item.titre || "Sans titre"}
                              </p>
                              <p className="text-violet-400 text-xs">{Number(item.prix).toLocaleString()} DA</p>
                              <p className="text-white/30 text-[10px] truncate">
                                {item.type === "service" ? "Service" : "Annonce"} · {item.categorie} · {item.wilaya || "—"}
                              </p>
                            </>
                          )}
                          {activeTab === "posts" && (
                            <>
                              <p className="text-white text-sm font-medium line-clamp-1">
                                {item.contenu?.substring(0, 70) || "Contenu vide"}{item.contenu?.length > 70 && "…"}
                              </p>
                              <p className="text-white/40 text-xs">Par {item.auteur || "Anonyme"}</p>
                              <p className="text-white/25 text-[10px]">❤️ {item.likes?.length || 0} · 💬 {item.commentaires?.length || 0}</p>
                            </>
                          )}
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          {activeTab !== "posts" && (
                            <button
                              onClick={() => navigate(getViewUrl(activeTab, item))}
                              className="px-3 py-1.5 bg-violet-500/15 text-violet-400 rounded-lg text-xs hover:bg-violet-500/25 transition-colors"
                            >
                              Voir
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(activeTab, item._id)}
                            className="px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-xs hover:bg-red-500/25 transition-colors"
                          >
                            Supp.
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
