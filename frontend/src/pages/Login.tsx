import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitLogin = async () => {
    const res = await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      alert("Invalid credentials");
      return;
    }

    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);

    const role = JSON.parse(atob(data.access_token.split(".")[1])).role;
    navigate(role === "admin" ? "/admin" : role === "organiser" ? "/organiser" : "/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-8">
        <h2 className="text-xl font-semibold mb-6">Login</h2>

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
          onClick={submitLogin}
          className="w-full bg-black text-white py-2 rounded-lg mb-3"
        >
          Sign In
        </button>

        <button
          onClick={() =>
            (window.location.href = "http://localhost:8000/auth/google/login")
          }
          className="w-full border py-2 rounded-lg mb-4"
        >
          Continue with Google
        </button>

        <div className="text-sm text-gray-500 flex justify-between">
          <span className="cursor-pointer">Forgot password?</span>
          <span
            className="cursor-pointer text-black"
            onClick={() => navigate("/signup")}
          >
            Create account
          </span>
        </div>
      </div>
    </div>
  );
}
