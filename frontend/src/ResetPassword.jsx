import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Le flux de reset est entièrement géré dans ForgotPassword.jsx (3 étapes)
// Cette page redirige automatiquement pour éviter une page cassée
export default function ResetPassword() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/forgot-password", { replace: true });
  }, []);

  return null;
}
