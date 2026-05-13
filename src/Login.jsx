import { useState } from "react";
import { auth } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const email = `${username}@ebd.local`;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (onLogin) onLogin(userCredential.user);
    } catch (err) {
      setError("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #4FA095 0%, #153462 100%)" }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-md p-6" style={{ backgroundColor: "#F6F6C9" }}>
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">📖✨</div>
          <h1 className="text-2xl font-bold" style={{ color: "#153462" }}>Escuela Bíblica</h1>
          <p className="text-sm mt-1" style={{ color: "#4FA095" }}>Sistema de Puntos y Mercadito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-sm mb-1" style={{ color: "#153462" }}>👤 Usuario</label>
            <input
              type="text"
              placeholder="Ej: admin, maestro_juan"
              className="w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-4FA095"
              style={{ borderColor: "#BAD1C2", backgroundColor: "white" }}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
            />
          </div>

          <div>
            <label className="block font-medium text-sm mb-1" style={{ color: "#153462" }}>🔒 Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-4FA095"
              style={{ borderColor: "#BAD1C2", backgroundColor: "white" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm text-center" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-base transition-all duration-200 disabled:opacity-50"
            style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#153462"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#4FA095"}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="text-center mt-6 text-xs" style={{ color: "#BAD1C2" }}>
          Contacta al administrador para obtener tu usuario
        </div>
      </div>
    </div>
  );
}