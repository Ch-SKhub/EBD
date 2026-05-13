import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

export default function GestionUsuariosLider() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "usuarios"));
      const lista = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      setUsuarios(lista);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getColorRol = (rol) => {
    switch(rol) {
      case "admin": return "#153462";
      case "lider": return "#4FA095";
      case "maestro": return "#BAD1C2";
      default: return "#4FA095";
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4" style={{ color: "#153462" }}>👥 Usuarios del Sistema</h2>

      {loading ? (
        <div className="text-center py-10" style={{ color: "#4FA095" }}>Cargando...</div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-10 rounded-xl" style={{ backgroundColor: "#F6F6C9", color: "#4FA095" }}>No hay usuarios registrados</div>
      ) : (
        <div className="space-y-2">
          {usuarios.map((usuario) => (
            <div key={usuario.id} className="rounded-xl p-4" style={{ backgroundColor: "#F6F6C9" }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {usuario.rol === "admin" && "👑"}
                  {usuario.rol === "lider" && "🌟"}
                  {usuario.rol === "maestro" && "📚"}
                  {usuario.rol === "padre" && "👪"}
                </span>
                <div>
                  <h3 className="font-semibold" style={{ color: "#153462" }}>{usuario.nombre_real}</h3>
                  <p className="text-xs" style={{ color: "#4FA095" }}>@{usuario.nombre_usuario} • {usuario.rol}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}