import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/login");
      return;
    }

    localStorage.setItem("access_token", token);

    const payload = JSON.parse(atob(token.split(".")[1]));
    const role = payload.role;

    if (role === "admin") navigate("/admin");
    else if (role === "organiser") navigate("/organiser");
    else navigate("/dashboard");
  }, []);

  return null;
}
