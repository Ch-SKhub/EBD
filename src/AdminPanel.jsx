import { useState } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function AdminUsuarios() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("maestro");
  const [nombreReal, setNombreReal] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const crearUsuario = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    const email = `${username}@escuela.local`;

    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Guardar información adicional en Firestore
      await setDoc(doc(db, "usuarios", uid), {
        nombre_usuario: username,
        rol: rol,
        nombre_real: nombreReal,
        creado_en: new Date()
      });

      setMensaje(`✅ Usuario "${username}" creado con rol "${rol}"`);
      setUsername("");
      setPassword("");
      setNombreReal("");
      
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("❌ Ese nombre de usuario ya existe");
      } else {
        setError(`❌ Error: ${err.message}`);
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">👥 Gestionar Usuarios</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
        <h3 className="text-xl font-semibold mb-4">Crear nuevo usuario</h3>
        
        {mensaje && <div className="bg-green-100 text-green-700 p-2 rounded mb-4">{mensaje}</div>}
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
        
        <form onSubmit={crearUsuario}>
          <div className="mb-3">
            <label className="block text-gray-700 mb-1">Nombre de usuario</label>
            <input
              type="text"
              placeholder="Ej: maestro_juan"
              className="w-full p-2 border rounded"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 mb-1">Nombre real</label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              className="w-full p-2 border rounded"
              value={nombreReal}
              onChange={(e) => setNombreReal(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 mb-1">Contraseña</label>
            <input
              type="text"
              placeholder="Contraseña temporal"
              className="w-full p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Rol</label>
            <select
              className="w-full p-2 border rounded"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
            >
              <option value="admin">👑 Administrador</option>
              <option value="lider">🌟 Líder</option>
              <option value="maestro">📚 Maestro</option>
              <option value="padre">👪 Padre</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Crear Usuario
          </button>
        </form>
      </div>
    </div>
  );
}