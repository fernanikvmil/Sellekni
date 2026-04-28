import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { SearchableDropdown } from "./Components";

const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra",
  "Béchar","Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret",
  "Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda","Skikda",
  "Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem",
  "M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi","Bordj Bou Arréridj",
  "Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela",
  "Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent",
  "Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar","Ouled Djellal",
  "Béni Abbès","In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Meniaa",
];

const SPECIALITES = [
  "Plomberie","Électricité","Menuiserie","Peinture","Carrelage",
  "Climatisation","Électronique","Informatique","Faux plafond",
  "Maçonnerie","Serrurerie","Jardinage","Déménagement","Nettoyage",
  "Soudure","Toiture","Vitrage","Réparation électroménager",
  "Installation sanitaire","Chauffage","Cuisines équipées","Ascenseurs",
];


function Stars({ note }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-sm ${i <= Math.round(note) ? "text-yellow-400" : "text-white/15"}`}>★</span>
      ))}
    </div>
  );
}

function TechnicienCard({ tech, rank }) {
  const navigate = useNavigate();
  const initials = tech.username?.slice(0, 2).toUpperCase();

  return (
    <div
      onClick={() => navigate(`/profil/${tech.username}`)}
      className="relative group cursor-pointer bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-violet-600/30 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(196,181,253,0.15)]"
    >
      {rank <= 3 && (
        <div className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
          #{rank}
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        {tech.photo ? (
          <img src={tech.photo} alt={tech.username} className="w-14 h-14 rounded-full object-cover ring-2 ring-violet-600/30" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600/40 to-violet-600/20 flex items-center justify-center text-white font-bold text-lg ring-2 ring-violet-600/20">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{tech.username}</p>
          <p className="text-violet-400 text-xs truncate">{tech.specialite || "Technicien"}</p>
          {tech.wilaya && (
            <p className="text-white/40 text-xs mt-0.5">📍 {tech.wilaya}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stars note={tech.moyenne} />
          <span className="text-white/60 text-sm font-medium">
            {tech.moyenne > 0 ? tech.moyenne.toFixed(1) : "—"}
          </span>
        </div>
        <span className="text-white/30 text-xs">{tech.totalNotes} avis</span>
      </div>

      {tech.bio && (
        <p className="mt-3 text-white/40 text-xs line-clamp-2 leading-relaxed">{tech.bio}</p>
      )}
    </div>
  );
}

export default function Techniciens() {
  const [techniciens, setTechniciens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wilaya, setWilaya] = useState("all");
  const [specialite, setSpecialite] = useState("all");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (wilaya !== "all") params.set("wilaya", wilaya);
    if (specialite !== "all") params.set("specialite", specialite);

    fetch(`/api/users/techniciens?${params}`)
      .then(res => res.json())
      .then(data => setTechniciens(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [wilaya, specialite]);

  return (
    <div className="min-h-screen bg-transparent text-white">
      <style>{`.custom-scroll::-webkit-scrollbar{width:3px}.custom-scroll::-webkit-scrollbar-track{background:transparent}.custom-scroll::-webkit-scrollbar-thumb{background:rgba(196,181,253,0.2);border-radius:99px}`}</style>
      <Navbar user={user} />

      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full bg-violet-600/8 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-28 pb-16">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white">
            Trouver un <span className="text-violet-400">technicien</span>
          </h1>
          <p className="text-white/40 mt-1 text-sm">
            {techniciens.length} technicien{techniciens.length !== 1 ? "s" : ""} disponible{techniciens.length !== 1 ? "s" : ""}
            {wilaya !== "all" ? ` à ${wilaya}` : ""}
          </p>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="w-56">
            <SearchableDropdown
              value={wilaya}
              onChange={setWilaya}
              options={WILAYAS}
              placeholder="📍 Toutes les wilayas"
              allLabel="📍 Toutes les wilayas"
              numbered
            />
          </div>
          <div className="w-56">
            <SearchableDropdown
              value={specialite}
              onChange={setSpecialite}
              options={SPECIALITES}
              placeholder="🔧 Toutes les spécialités"
              allLabel="🔧 Toutes les spécialités"
            />
          </div>
          {(wilaya !== "all" || specialite !== "all") && (
            <button
              onClick={() => { setWilaya("all"); setSpecialite("all"); }}
              className="px-4 py-2.5 text-sm text-white/50 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-xl transition-colors"
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>

        {/* Légende tri */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-white/25 text-xs">Triés par note :</span>
          <div className="flex items-center gap-1 text-xs text-yellow-400/60">
            <span>⭐ Meilleure note en haut</span>
          </div>
        </div>

        {/* Résultats */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-white/[0.05]" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-white/[0.05] rounded w-3/4" />
                    <div className="h-3 bg-white/[0.05] rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-white/[0.05] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : techniciens.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-white/40">Aucun technicien trouvé pour ces critères</p>
            <button
              onClick={() => { setWilaya("all"); setSpecialite("all"); }}
              className="mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Voir tous les techniciens
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {techniciens.map((tech, i) => (
              <TechnicienCard key={tech.username} tech={tech} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
