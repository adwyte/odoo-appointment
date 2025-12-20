import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  const submit = async () => {
    const res = await fetch("http://localhost:8000/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert("Signup failed");
      return;
    }

    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-6">Create Account</h2>

        {["name", "email", "password"].map((f) => (
          <input
            key={f}
            placeholder={f}
            type={f === "password" ? "password" : "text"}
            className="w-full border px-3 py-2 mb-3 rounded-lg"
            onChange={(e) =>
              setForm({ ...form, [f]: e.target.value })
            }
          />
        ))}

        <select
          className="w-full border rounded-lg px-3 py-2 mb-4"
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
        >
          <option value="customer">Customer</option>
          <option value="organiser">Organiser</option>
          <option value="admin">Admin</option>
        </select>

        <button
          onClick={submit}
          className="w-full bg-black text-white py-2 rounded-lg"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
