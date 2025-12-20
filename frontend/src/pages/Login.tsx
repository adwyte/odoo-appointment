import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-[380px]">
        <h1 className="mb-2">ERP Login</h1>
        <p className="mb-6">Sign in to continue</p>

        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn btn-primary w-full mt-2">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
