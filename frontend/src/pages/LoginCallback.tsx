import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function LoginCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/login");
      return;
    }

    localStorage.setItem("access_token", token);

    api.getMe()
      .then((user) => {
        setUser(user);
        navigate(
          user.role === "admin"
            ? "/admin"
            : user.role === "organiser"
            ? "/organiser"
            : "/dashboard",
          { replace: true }
        );
      })
      .catch(() => navigate("/login"));
  }, []);

  return <div className="min-h-screen flex items-center justify-center">Signing you in…</div>;
}
