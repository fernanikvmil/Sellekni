import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

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

function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
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
  const [mapQuery, setMapQuery] = useState("Algeria");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const targetRole = user?.role === "technicien" ? "client" : "technicien";

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("role", targetRole);
    if (selectedWilaya !== "all") params.set("wilaya", selectedWilaya);
    fetch(`/api/users/techniciens?${params}`)
      .then(r => r.json())
      .then(d => setTechniciens(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [selectedWilaya, targetRole]);

  const locateMe = () => {
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserPos([coords.latitude, coords.longitude]);
        setLocating(false);
      },
      () => { setLocError("Localisation refusée"); setLocating(false); },
      { timeout: 10000 }
    );
  };

  const handleWilayaChange = (w) => {
    setSelectedWilaya(w);
    setMapQuery(w === "all" ? "Algeria" : `${w}, Algeria`);
  };

  const handleTechClick = (tech) => {
    if (tech.wilaya) setMapQuery(`${tech.wilaya}, Algeria`);
  };

  const mapSrc = mapQuery === "Algeria"
    ? `https://www.google.com/maps/embed/v1/view?center=31.5,2.6596&zoom=5&key=${GOOGLE_MAPS_KEY}`
    : `https://www.google.com/maps/embed/v1/search?q=${encodeURIComponent(mapQuery)}&key=${GOOGLE_MAPS_KEY}`;

  // Trier par distance si position disponible
  const techs = userPos
    ? [...techniciens].sort((a, b) => {
        const ca = WILAYA_COORDS[a.wilaya], cb = WILAYA_COORDS[b.wilaya];
        if (!ca && !cb) return 0;
        if (!ca) return 1;
        if (!cb) return -1;
        return haversine(userPos, ca) - haversine(userPos, cb);
      })
    : techniciens;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <Navbar user={user} />

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 pt-20 pb-4 gap-3">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">
              Carte des <span className="text-violet-400">{targetRole === "technicien" ? "techniciens" : "clients"}</span>
            </h1>
            <p className="text-white/40 text-sm mt-0.5">
              {techs.length} {targetRole === "technicien" ? "technicien" : "client"}{techs.length > 1 ? "s" : ""}
              {userPos ? " · triés par proximité" : ""}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <select
                value={selectedWilaya}
                onChange={e => handleWilayaChange(e.target.value)}
                className="appearance-none bg-white/[0.05] border border-white/[0.1] text-white text-sm rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-violet-500/50 cursor-pointer hover:bg-white/[0.08] transition-colors"
              >
                <option value="all" className="bg-[#0a0a0f]">📍 Toutes les wilayas</option>
                {WILAYAS.map(w => <option key={w} value={w} className="bg-[#0a0a0f]">{w}</option>)}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none text-xs">▼</span>
            </div>

            <button
              onClick={locateMe}
              disabled={locating}
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-700 to-purple-500 hover:from-violet-600 hover:to-purple-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(139,92,246,0.4)] active:translate-y-0 disabled:opacity-60 transition-all duration-300"
            >
              {locating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "📍"}
              {locating ? "Localisation..." : userPos ? "Position activée ✓" : "Ma position"}
            </button>
          </div>
        </div>

        {locError && <p className="text-red-400 text-sm">{locError}</p>}

        {/* Corps : Map + Liste */}
        <div className="flex gap-4 flex-1" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>

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

          {/* Liste techniciens */}
          <div className="w-72 flex flex-col gap-2 overflow-y-auto pr-1">
            {techs.length === 0 ? (
              <div className="text-center py-10 text-white/30 text-sm">Aucun profil trouvé</div>
            ) : techs.map((tech, i) => {
              const coords = WILAYA_COORDS[tech.wilaya];
              const dist = userPos && coords ? haversine(userPos, coords) : null;
              return (
                <div
                  key={tech.username}
                  onClick={() => handleTechClick(tech)}
                  className="group cursor-pointer bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-violet-500/30 rounded-xl p-3 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    {userPos && <span className="text-white/20 text-xs w-5 text-center flex-shrink-0">#{i+1}</span>}
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center font-bold text-sm">
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
                      <span className="text-xs text-emerald-400 font-medium">📏 {dist.toLocaleString()} km</span>
                    )}
                  </div>
                  {/* Bouton voir profil */}
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/profil/${tech.username}`); }}
                    className="mt-2 w-full text-xs py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 hover:text-white border border-violet-500/20 hover:border-violet-500/50 transition-all duration-200 font-medium"
                  >
                    Voir le profil →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
