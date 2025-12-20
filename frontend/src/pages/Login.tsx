import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVantaWaves } from "../hooks/useVantaWaves";

export default function Login() {
  const vantaRef = useVantaWaves();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const redirectByRole = (token: string) => {
    const role = JSON.parse(atob(token.split(".")[1])).role;
    navigate(
      role === "admin"
        ? "/admin"
        : role === "organiser"
        ? "/organiser"
        : "/dashboard"
    );
  };

  const handleLogin = async () => {
    const res = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      alert("Invalid email or password");
      return;
    }

    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);
    redirectByRole(data.access_token);
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google/login";
  };

  return (
    <div
      ref={vantaRef}
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 bg-white rounded-xl shadow-lg w-full max-w-sm p-8">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Sign in to UrbanCare
        </h2>

        <input
          placeholder="Email"
          className="w-full border rounded-lg px-3 py-2 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded-lg px-3 py-2 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-black text-white py-2 rounded-lg mb-3 hover:bg-gray-900"
        >
          Sign In
        </button>

        {/* GOOGLE SIGN IN */}
        <button
          onClick={handleGoogleLogin}
          className="w-full border py-2 rounded-lg mb-4 hover:bg-gray-50"
        >
          Continue with Google
        </button>

        <div className="text-sm text-gray-500 flex justify-between">
          <span className="cursor-pointer hover:text-black">
            Forgot password?
          </span>
          <span
            className="cursor-pointer text-black font-medium"
            onClick={() => navigate("/signup")}
          >
            Create account
          </span>
        </div>
      </div>
    </div>
  );
}
