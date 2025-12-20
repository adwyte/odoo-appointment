import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVantaWaves } from "../hooks/useVantaWaves";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const vantaRef = useVantaWaves();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Login
      const { access_token } = await api.login(email, password);
      localStorage.setItem("access_token", access_token);

      // 2️⃣ Hydrate auth state IMMEDIATELY
      const me = await api.getMe();
      setUser(me);

      // 3️⃣ Navigate based on role
      navigate(
        me.role === "admin"
          ? "/admin"
          : me.role === "organiser"
          ? "/organiser"
          : "/dashboard",
        { replace: true }
      );
    } catch (err) {
      alert("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google/login";
  };

  return (
    <div
      ref={vantaRef}
      className="min-h-screen flex items-center justify-center px-4 relative"
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
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded-lg px-3 py-2 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-lg mb-3 hover:bg-gray-900 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        {/* GOOGLE SIGN IN */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border py-2 rounded-lg mb-4 hover:bg-gray-50 disabled:opacity-60"
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
