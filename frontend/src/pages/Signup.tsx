import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVantaWaves } from "../hooks/useVantaWaves";
import { API_BASE, API_BASE_URL } from "../config";

export default function Signup() {
  const vantaRef = useVantaWaves();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "customer",
  });

  const handleSignup = async () => {
    if (!form.email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    if (form.password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert("Signup failed");
      return;
    }

    // Auto-login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
    });

    const data = await loginRes.json();
    localStorage.setItem("access_token", data.access_token);

    const role = JSON.parse(atob(data.access_token.split(".")[1])).role;
    navigate(role === "admin" ? "/admin" : role === "organiser" ? "/organiser" : "/dashboard");
  };


  const handleGoogleSignup = () => {
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  };

  return (
    <div
      ref={vantaRef}
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 bg-white rounded-xl shadow-lg w-full max-w-sm p-8">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Create your account
        </h2>

        <input
          placeholder="Full name"
          className="w-full border rounded-lg px-3 py-2 mb-3"
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />

        <input
          placeholder="Email"
          className="w-full border rounded-lg px-3 py-2 mb-3"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded-lg px-3 py-2 mb-3"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <select
          className="w-full border rounded-lg px-3 py-2 mb-4"
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="customer">Customer</option>
          <option value="organiser">Organiser</option>
          <option value="admin">Admin</option>
        </select>

        <button
          onClick={handleSignup}
          className="w-full bg-black text-white py-2 rounded-lg mb-3 hover:bg-gray-900"
        >
          Sign Up
        </button>

        {/* GOOGLE SIGN UP */}
        <button
          onClick={handleGoogleSignup}
          className="w-full border py-2 rounded-lg mb-4 hover:bg-gray-50"
        >
          Sign up with Google
        </button>

        <p className="text-sm text-center text-gray-500">
          Already have an account?{" "}
          <span
            className="text-black cursor-pointer font-medium"
            onClick={() => navigate("/login")}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}
