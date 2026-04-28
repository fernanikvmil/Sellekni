import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { authHeaders } from "./api";

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

const WILAYA_COORDS = {
  "Adrar": [27.8744, -0.2914], "Chlef": [36.1647, 1.3317], "Laghouat": [33.8003, 2.8645],
  "Oum El Bouaghi": [35.8694, 7.1117], "Batna": [35.5556, 6.1742], "Béjaïa": [36.7515, 5.0564],
  "Biskra": [34.8503, 5.7278], "Béchar": [31.6238, -2.2165], "Blida": [36.4722, 2.8289],
  "Bouira": [36.3731, 3.9003], "Tamanrasset": [22.7851, 5.5228], "Tébessa": [35.4042, 8.1248],
  "Tlemcen": [34.8828, -1.3167], "Tiaret": [35.3708, 1.3172], "Tizi Ouzou": [36.7169, 4.0497],
  "Alger": [36.7372, 3.0865], "Djelfa": [34.6703, 3.2639], "Jijel": [36.8197, 5.7661],
  "Sétif": [36.1908, 5.4103], "Saïda": [34.8308, 0.1508], "Skikda": [36.8761, 6.9069],
  "Sidi Bel Abbès": [35.1897, -0.6311], "Annaba": [36.9000, 7.7667], "Guelma": [36.4619, 7.4328],
  "Constantine": [36.3650, 6.6147], "Médéa": [36.2636, 2.7539], "Mostaganem": [35.9319, 0.0892],
  "M'Sila": [35.7047, 4.5439], "Mascara": [35.3958, 0.1408], "Ouargla": [31.9539, 5.3253],
  "Oran": [35.6969, -0.6331], "El Bayadh": [33.6833, 1.0167], "Illizi": [26.5000, 8.4667],
  "Bordj Bou Arréridj": [36.0667, 4.7667], "Boumerdès": [36.7569, 3.4772], "El Tarf": [36.7667, 8.3167],
  "Tindouf": [27.6731, -8.1478], "Tissemsilt": [35.6053, 1.8119], "El Oued": [33.3689, 6.8633],
  "Khenchela": [35.4353, 7.1436], "Souk Ahras": [36.2864, 7.9514], "Tipaza": [36.5897, 2.4472],
  "Mila": [36.4500, 6.2667], "Aïn Defla": [36.2639, 1.9669], "Naâma": [33.2672, -0.3125],
  "Aïn Témouchent": [35.2983, -1.1406], "Ghardaïa": [32.4908, 3.6736], "Relizane": [35.7381, 0.5561],
  "Timimoun": [29.2639, 0.2303], "Bordj Badji Mokhtar": [21.3294, 0.9456],
  "Ouled Djellal": [34.4181, 5.0722], "Béni Abbès": [30.1281, -2.1664],
  "In Salah": [27.1978, 2.4681], "In Guezzam": [19.5681, 5.7736],
  "Touggourt": [33.1014, 6.0669], "Djanet": [24.5553, 9.4853],
  "El M'Ghair": [33.9525, 5.9228], "El Meniaa": [30.5833, 2.8833],
};

const GOOGLE_MAPS_KEY = "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8";

const SPECIALITES = [
  { label: "💧 Plomberie",                  value: "Plomberie" },
  { label: "⚡ Électricité",               value: "Électricité" },
  { label: "🪵 Menuiserie",               value: "Menuiserie" },
  { label: "🎨 Peinture",                 value: "Peinture" },
  { label: "🟫 Carrelage",               value: "Carrelage" },
  { label: "❄️ Climatisation",            value: "Climatisation" },
  { label: "📺 Électronique",             value: "Électronique" },
  { label: "💻 Informatique",             value: "Informatique" },
  { label: "🏗️ Faux plafond",            value: "Faux plafond" },
  { label: "🧱 Maçonnerie",              value: "Maçonnerie" },
  { label: "🔐 Serrurerie",              value: "Serrurerie" },
  { label: "🌿 Jardinage",               value: "Jardinage" },
  { label: "🚚 Déménagement",            value: "Déménagement" },
  { label: "🧹 Nettoyage",              value: "Nettoyage" },
  { label: "🔥 Soudure",               value: "Soudure" },
  { label: "🏠 Toiture",               value: "Toiture" },
  { label: "🪟 Vitrage",              value: "Vitrage" },
  { label: "🔧 Réparation électroménager", value: "Réparation électroménager" },
  { label: "🚿 Installation sanitaire",   value: "Installation sanitaire" },
  { label: "🌡️ Chauffage",              value: "Chauffage" },
  { label: "🍳 Cuisines équipées",        value: "Cuisines équipées" },
  { label: "🛗 Ascenseurs",             value: "Ascenseurs" },
];

function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function WilayaSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all duration-200 min-w-[170px] ${
          open ? "bg-violet-600/10 border-violet-600/50 text-white" : "bg-white/[0.05] border-white/[0.1] text-white hover:bg-white/[0.08]"
        }`}
      >
        <span className={value !== "all" ? "text-white" : "text-white/50"}>
          {value !== "all" ? `📍 ${value}` : "📍 Toutes les wilayas"}
        </span>
        <svg className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-violet-400" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {open && (
        <div className="absolute z-50 w-full top-full mt-1 rounded-xl bg-[#07021A] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1 custom-scroll">
            <button
              type="button"
              onClick={() => { onChange("all"); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2 ${
                value === "all" ? "bg-violet-600/20 text-violet-300" : "text-white/60 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {value === "all" && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
              📍 Toutes les wilayas
            </button>
            {WILAYAS.map(w => (
              <button
                key={w}
                type="button"
                onClick={() => { onChange(w); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2 ${
                  value === w ? "bg-violet-600/20 text-violet-300" : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {value === w && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SpecialiteSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = SPECIALITES.find(s => s.value === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all duration-200 min-w-[190px] ${
          open ? "bg-violet-600/10 border-violet-600/50 text-white" : "bg-white/[0.05] border-white/[0.1] text-white hover:bg-white/[0.08]"
        }`}
      >
        <span className={selected ? "text-white" : "text-white/50"}>
          {selected ? selected.label : "🔧 Toutes les spécialités"}
        </span>
        <svg className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-violet-400" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {open && (
        <div className="absolute z-50 w-full top-full mt-1 rounded-xl bg-[#07021A] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1 custom-scroll">
            <button
              type="button"
              onClick={() => { onChange("all"); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2 ${
                value === "all" ? "bg-violet-600/20 text-violet-300" : "text-white/60 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {value === "all" && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
              🔧 Toutes les spécialités
            </button>
            {SPECIALITES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => { onChange(s.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2 ${
                  value === s.value ? "bg-violet-600/20 text-violet-300" : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {value === s.value && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stars({ note }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-xs ${i <= Math.round(note) ? "text-yellow-400" : "text-white/15"}`}>★</span>
      ))}
    </div>
  );
}

export default function MapTechniciens() {
  const navigate = useNavigate();
  const [techniciens, setTechniciens] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [selectedWilaya, setSelectedWilaya] = useState("all");
  const [selectedSpecialite, setSelectedSpecialite] = useState("all");
  const [mapQuery, setMapQuery] = useState("Algeria");
  const [watchId, setWatchId] = useState(null);
  const [mobileView, setMobileView] = useState("map"); // "map" | "list"
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isTechnicien = user?.role === "technicien";
  const targetRole = isTechnicien ? "client" : "technicien";

  // Trouve la wilaya la plus proche des coordonnées GPS
  const getNearestWilaya = (lat, lng) => {
    let nearest = null;
    let minDist = Infinity;
    for (const [w, [wLat, wLng]] of Object.entries(WILAYA_COORDS)) {
      const d = Math.sqrt((lat - wLat) ** 2 + (lng - wLng) ** 2);
      if (d < minDist) { minDist = d; nearest = w; }
    }
    return nearest;
  };

  const saveLocationToBackend = async (lat, lng) => {
    // Lire le user frais depuis localStorage à chaque appel (évite closure stale)
    const freshUser = JSON.parse(localStorage.getItem("user") || "null");
    if (!freshUser) return;
    try {
      // Sauvegarde coordonnées GPS
      await fetch(`/api/users/${freshUser.username}/location`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });

      // Toujours sauvegarder les coords exactes dans localStorage (pour le profil)
      const nearestWilaya = getNearestWilaya(lat, lng);
      const wilayaChanged = nearestWilaya && nearestWilaya !== freshUser.wilaya;

      if (wilayaChanged) {
        const res = await fetch(`/api/users/${freshUser.username}/modifier`, {
          method: "PATCH",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ wilaya: nearestWilaya }),
        });
        if (res.ok) {
          const updatedUser = { ...freshUser, wilaya: nearestWilaya, location: { lat, lng } };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          window.dispatchEvent(new Event("userUpdated"));
        }
      } else {
        // Wilaya inchangée mais on met à jour les coords dans localStorage
        const updatedUser = { ...freshUser, location: { lat, lng } };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("userUpdated"));
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams();
    params.set("role", targetRole);
    if (selectedWilaya !== "all") params.set("wilaya", selectedWilaya);
    fetch(`/api/users/techniciens?${params}`)
      .then(r => r.json())
      .then(d => setTechniciens(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [selectedWilaya, targetRole]);

  // Géolocalisation automatique au chargement
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = [coords.latitude, coords.longitude];
        setUserPos(pos);
        setMapQuery(`exact:${coords.latitude},${coords.longitude}`);
        saveLocationToBackend(coords.latitude, coords.longitude);
      },
      () => {},
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  // Cleanup watchPosition on unmount
  useEffect(() => {
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [watchId]);

  const locateMe = () => {
    setLocating(true);
    setLocError("");
    // Arrêter le watch précédent si actif
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);

    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const pos = [coords.latitude, coords.longitude];
        setUserPos(pos);
        setMapQuery(`exact:${coords.latitude},${coords.longitude}`);
        saveLocationToBackend(coords.latitude, coords.longitude);
        setLocating(false);
        setLocError("");
      },
      (err) => {
        if (err.code === 1) {
          setLocError("Localisation refusée — autorisez l'accès dans les paramètres de votre navigateur");
        } else if (err.code === 2) {
          setLocError("Position indisponible — vérifiez que le GPS est activé");
        } else {
          setLocError("Délai dépassé — réessayez");
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    setWatchId(id);
  };

  const handleWilayaChange = (w) => {
    setSelectedWilaya(w);
    setMapQuery(w === "all" ? "Algeria" : `${w}, Algeria`);
  };

  const getTechCoords = (tech) => {
    if (tech.location?.lat && tech.location?.lng) return [tech.location.lat, tech.location.lng];
    return WILAYA_COORDS[tech.wilaya] || null;
  };

  const handleTechClick = (tech) => {
    if (tech.location?.lat && tech.location?.lng) {
      setMapQuery(`exact:${tech.location.lat},${tech.location.lng}`);
    } else if (tech.wilaya) {
      setMapQuery(`${tech.wilaya}, Algeria`);
    }
  };

  const mapSrc = mapQuery.startsWith("exact:")
    ? `https://www.google.com/maps/embed/v1/search?q=${mapQuery.replace("exact:", "")}&zoom=16&key=${GOOGLE_MAPS_KEY}`
    : mapQuery === "Algeria"
      ? `https://www.google.com/maps/embed/v1/view?center=31.5,2.6596&zoom=5&key=${GOOGLE_MAPS_KEY}`
      : `https://www.google.com/maps/embed/v1/search?q=${encodeURIComponent(mapQuery)}&key=${GOOGLE_MAPS_KEY}`;

  // Filtrer par spécialité + trier par distance (coordonnées exactes prioritaires)
  const techs = (() => {
    let list = selectedSpecialite === "all"
      ? techniciens
      : techniciens.filter(t => t.specialite === selectedSpecialite);
    if (userPos) {
      list = [...list].sort((a, b) => {
        const ca = getTechCoords(a), cb = getTechCoords(b);
        if (!ca && !cb) return 0;
        if (!ca) return 1;
        if (!cb) return -1;
        return haversine(userPos, ca) - haversine(userPos, cb);
      });
    }
    return list;
  })();

  // ── Shared list of tech cards (used in both mobile and desktop) ──
  const TechList = () => (
    <>
      {!user ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4 py-10 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center text-2xl">🔒</div>
          <div>
            <p className="text-white font-semibold text-sm mb-1">Connexion requise</p>
            <p className="text-white/40 text-xs leading-relaxed">Connectez-vous pour voir les profils disponibles.</p>
          </div>
        </div>
      ) : techs.length === 0 ? (
        <div className="text-center py-10 text-white/30 text-sm">Aucun profil trouvé</div>
      ) : techs.map((tech, i) => {
        const coords = getTechCoords(tech);
        const dist = userPos && coords ? haversine(userPos, coords) : null;
        const hasExactLocation = !!(tech.location?.lat && tech.location?.lng);
        return (
          <div
            key={tech.username}
            onClick={() => { handleTechClick(tech); setMobileView("map"); }}
            className="group cursor-pointer bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-violet-600/30 rounded-xl p-3 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              {userPos && <span className="text-white/20 text-xs w-5 text-center flex-shrink-0">#{i+1}</span>}
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-violet-600 to-violet-600 flex items-center justify-center font-bold text-sm">
                {tech.photo
                  ? <img src={tech.photo} alt={tech.username} className="w-full h-full object-cover" />
                  : tech.username.slice(0,2).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{tech.username}</p>
                <p className="text-xs text-violet-400/70 truncate">{tech.specialite || targetRole}</p>
                {tech.wilaya && <p className="text-xs text-white/30 truncate">📍 {tech.wilaya}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <Stars note={tech.moyenne} />
                {tech.moyenne > 0 && <span className="text-xs text-yellow-400">{tech.moyenne}</span>}
              </div>
              {dist !== null && (
                <span className="text-xs text-emerald-400 font-medium" title={hasExactLocation ? "Position GPS exacte" : "Centre de la wilaya"}>
                  📏 {dist.toLocaleString()} km{hasExactLocation ? " 🎯" : ""}
                </span>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); navigate(`/profil/${tech.username}`); }}
              className="mt-2 w-full text-xs py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 hover:text-white border border-violet-600/20 hover:border-violet-600/50 transition-all duration-200 font-medium"
            >
              Voir le profil →
            </button>
          </div>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <style>{`.custom-scroll::-webkit-scrollbar{width:4px}.custom-scroll::-webkit-scrollbar-track{background:transparent}.custom-scroll::-webkit-scrollbar-thumb{background:rgba(196,181,253,0.3);border-radius:99px}.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      <Navbar user={user} />

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-3 md:px-4 pt-20 pb-4 gap-3">

        {/* ── Header ── */}
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">
            Carte des <span className="text-violet-400">{targetRole === "technicien" ? "techniciens" : "clients"}</span>
          </h1>
          <p className="text-white/40 text-xs md:text-sm mt-0.5">
            {techs.length} {targetRole === "technicien" ? "technicien" : "client"}{techs.length > 1 ? "s" : ""}
            {selectedSpecialite !== "all" && <span className="text-violet-400"> · {selectedSpecialite}</span>}
            {userPos ? " · triés par proximité" : ""}
          </p>
        </div>

        {/* ── Filters + GPS buttons on the same row ── */}
        <div className="flex flex-wrap items-center gap-2">
          <WilayaSelect value={selectedWilaya} onChange={handleWilayaChange} />
          <SpecialiteSelect value={selectedSpecialite} onChange={setSelectedSpecialite} />

          {/* GPS buttons pushed to the right */}
          <div className="flex gap-2 ml-auto">
            {userPos ? (
              <>
                <button
                  onClick={locateMe}
                  disabled={locating}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-semibold text-xs md:text-sm text-white bg-gradient-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-400 disabled:opacity-60 transition-all duration-300"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  {locating ? "Mise à jour..." : "Position active"}
                </button>
                <button
                  onClick={() => {
                    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); setWatchId(null); }
                    setUserPos(null);
                    setMapQuery("Algeria");
                    setLocError("");
                  }}
                  title="Désactiver la localisation"
                  className="flex items-center gap-1.5 px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                >
                  📵 Désactiver
                </button>
              </>
            ) : (
              <button
                onClick={locateMe}
                disabled={locating}
                className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-semibold text-xs md:text-sm text-white bg-gradient-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(196,181,253,0.4)] active:translate-y-0 disabled:opacity-60 transition-all duration-300"
              >
                {locating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "📍"}
                {locating ? "Localisation..." : "Ma position"}
              </button>
            )}
          </div>
        </div>

        {locError && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs md:text-sm">
            <span className="text-base flex-shrink-0">📵</span>
            <span>{locError}</span>
          </div>
        )}

        {/* ── GPS compact banner for technicians on mobile ── */}
        {isTechnicien && (
          <div className="md:hidden">
            {userPos ? (
              <div className="flex items-center gap-3 rounded-xl border border-violet-600/40 bg-violet-600/10 px-3 py-2.5">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-green-400 text-[11px] font-bold uppercase tracking-wider">GPS Actif</p>
                  <p className="text-violet-300 text-[11px] font-mono truncate">
                    {userPos[0].toFixed(4)}, {userPos[1].toFixed(4)} · {getNearestWilaya(userPos[0], userPos[1])}
                  </p>
                </div>
                <button
                  onClick={() => { setMapQuery(`exact:${userPos[0]},${userPos[1]}`); setMobileView("map"); }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-600/30 text-sky-300 border border-violet-600/30 flex-shrink-0"
                >
                  📍 Voir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
                <span className="text-lg flex-shrink-0">📍</span>
                <p className="text-white/40 text-xs flex-1">Activez votre GPS pour partager votre position avec les clients.</p>
                <button
                  onClick={locateMe}
                  disabled={locating}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-600/20 flex-shrink-0 disabled:opacity-50"
                >
                  {locating ? "..." : "Activer"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Mobile tab switcher ── */}
        <div className="md:hidden flex rounded-xl bg-white/[0.04] border border-white/[0.07] p-1 gap-1">
          <button
            onClick={() => setMobileView("map")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              mobileView === "map"
                ? "bg-violet-600 text-white shadow-[0_2px_12px_rgba(196,181,253,0.4)]"
                : "text-white/50 hover:text-white"
            }`}
          >
            🗺️ Carte
          </button>
          <button
            onClick={() => setMobileView("list")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              mobileView === "list"
                ? "bg-violet-600 text-white shadow-[0_2px_12px_rgba(196,181,253,0.4)]"
                : "text-white/50 hover:text-white"
            }`}
          >
            👥 Liste
            {techs.length > 0 && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${mobileView === "list" ? "bg-white/20" : "bg-violet-600/40 text-violet-300"}`}>
                {techs.length}
              </span>
            )}
          </button>
        </div>

        {/* ══════════════════════════════════════════
            MOBILE LAYOUT
        ══════════════════════════════════════════ */}
        <div className="md:hidden flex-1" style={{ minHeight: 420 }}>
          {mobileView === "map" ? (
            <div className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl" style={{ height: "calc(100vh - 320px)", minHeight: 360 }}>
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={mapSrc}
                title="Carte"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto custom-scroll" style={{ height: "calc(100vh - 320px)", minHeight: 360 }}>
              <TechList />
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            DESKTOP LAYOUT (3 columns)
        ══════════════════════════════════════════ */}
        <div className="hidden md:flex gap-4 flex-1" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>

          {/* ── Sidebar gauche : position du technicien connecté ── */}
          {isTechnicien && (
            <div className="w-60 flex-shrink-0 flex flex-col gap-3">
              {userPos ? (
                <div className="rounded-2xl border border-violet-600/40 bg-gradient-to-b from-violet-600/15 to-violet-600/5 p-4 shadow-[0_0_30px_rgba(196,181,253,0.15)]">
                  {/* Badge live */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-green-400 text-[11px] font-bold uppercase tracking-wider">GPS Actif</span>
                  </div>

                  {/* Avatar + info */}
                  <div className="flex flex-col items-center text-center mb-3">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 to-violet-600 flex items-center justify-center font-black text-lg mb-2 ring-2 ring-violet-600/40">
                      {user.photo
                        ? <img src={user.photo} alt="avatar" className="w-full h-full object-cover" />
                        : user.username?.slice(0, 2).toUpperCase()
                      }
                    </div>
                    <p className="text-sm font-bold text-white">{user.username}</p>
                    <p className="text-xs text-violet-400/80 mt-0.5">{user.specialite || "Technicien"}</p>
                  </div>

                  {/* Coordonnées + wilaya détectée */}
                  <div className="bg-black/30 rounded-xl p-3 mb-3 font-mono text-[10px]">
                    <div className="flex justify-between text-white/40 mb-1">
                      <span>LAT</span><span className="text-violet-300">{userPos[0].toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-white/40 mb-1">
                      <span>LNG</span><span className="text-violet-300">{userPos[1].toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-white/40">
                      <span>WILAYA</span>
                      <span className="text-green-300 font-sans">{getNearestWilaya(userPos[0], userPos[1])}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-white/30 text-center mb-3">
                    🔄 Position + wilaya mises à jour automatiquement
                  </p>

                  <button
                    onClick={() => setMapQuery(`exact:${userPos[0]},${userPos[1]}`)}
                    className="w-full text-xs py-2 rounded-xl bg-violet-600/40 hover:bg-violet-600/60 text-sky-200 border border-violet-600/40 transition-all duration-200 font-semibold"
                  >
                    📍 Voir sur la carte
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center text-xl mx-auto mb-3">📍</div>
                  <p className="text-white/50 text-xs font-medium mb-1">Votre position</p>
                  <p className="text-white/25 text-[11px] leading-relaxed mb-3">
                    Activez votre GPS pour partager votre position exacte avec les clients.
                  </p>
                  <button
                    onClick={locateMe}
                    disabled={locating}
                    className="w-full text-xs py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-600/30 transition-all font-medium disabled:opacity-50"
                  >
                    {locating ? "Localisation..." : "Activer le GPS"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Google Maps */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={mapSrc}
              title="Carte"
            />
          </div>

          {/* Liste techniciens / clients */}
          <div className="w-72 flex flex-col gap-2 overflow-y-auto pr-1 custom-scroll">
            <TechList />
          </div>
        </div>

      </div>
    </div>
  );
}
