const getToken = () => localStorage.getItem("token");

export const authHeaders = (extra = {}) => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

export const authFormHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Heartbeat — appelle toutes les 30s pour maintenir le statut "en ligne"
export const startHeartbeat = (username) => {
  const send = () => {
    fetch(`/api/users/${username}/heartbeat`, {
      method: "PATCH",
      headers: authHeaders(),
    }).catch(() => {});
  };
  send();
  const interval = setInterval(send, 30000);
  return () => clearInterval(interval);
};

// Calcule le statut à partir de lastSeen
export const getStatus = (lastSeen) => {
  if (!lastSeen) return { online: false, label: "Hors ligne" };
  const diff = Math.floor((new Date() - new Date(lastSeen)) / 1000);
  if (diff < 60) return { online: true, label: "En ligne" };
  if (diff < 3600) return { online: false, label: `Hors ligne depuis ${Math.floor(diff / 60)} min` };
  if (diff < 86400) return { online: false, label: `Hors ligne depuis ${Math.floor(diff / 3600)} h` };
  return { online: false, label: `Hors ligne depuis ${Math.floor(diff / 86400)} j` };
};
