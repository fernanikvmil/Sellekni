import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Homepage from "./Homepage";
import Login from "./Login";
import Signin from "./Signin";
import Annonces from "./Annonces";
import Profile from "./profile";
import Forum from "./Forum";
import Detailannonces from "./Detailannonces";
import VerifyEmail from "./VerifyEmail";
import Messages from "./Messages";
import PublicProfile from "./PublicProfile";
import { startHeartbeat } from "./api";

function App() {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) return;
    const stop = startHeartbeat(user.username);
    return stop;
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/profil/:username" element={<PublicProfile />} />
      <Route path="/annonces" element={<Annonces/>}/>
      <Route path="/profile" element={<Profile/>}/>
      <Route path="/forum" element={<Forum/>}/>
      <Route path="/annonces/:id" element={<Detailannonces/>}/>
      <Route path="/services/:id" element={<Detailannonces/>}/>





    </Routes> 
  );
}

export default App;