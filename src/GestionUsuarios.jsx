import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState("");
  
  // Formulario
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [nombreReal, setNombreReal] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("maestro");

  // Cargar usuarios existentes
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
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    setMensaje("");
    
    if (!nombreUsuario || !password || !nombreReal) {
      setMensaje("❌ Completa todos los campos");
      return;
    }

    const email = `${nombreUsuario}@ebd.local`;

    try {
      // Crear usuario en Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Guardar en Firestore
      await setDoc(doc(db, "usuarios", uid), {
        nombre_usuario: nombreUsuario,
        nombre_real: nombreReal,
        rol: rol,
        creado_en: new Date(),
        creado_por: auth.currentUser?.email?.replace("@ebd.local", "") || "admin"
      });

      setMensaje(`✅ Usuario "${nombreUsuario}" creado con rol "${rol}"`);
      
      // Limpiar formulario
      setNombreUsuario("");
      setNombreReal("");
      setPassword("");
      setRol("maestro");
      setMostrarFormulario(false);
      
      // Recargar lista
      await cargarUsuarios();
      
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setMensaje("❌ Ese nombre de usuario ya existe");
      } else {
        setMensaje(`❌ Error: ${error.message}`);
      }
    }
  };

  const eliminarUsuario = async (usuario) => {
    // No permitir eliminar a sí mismo
    const usuarioActual = auth.currentUser?.email?.replace("@ebd.local", "");
    if (usuario.nombre_usuario === usuarioActual) {
      setMensaje("❌ No puedes eliminar tu propio usuario");
      return;
    }

    if (confirm(`¿Eliminar a ${usuario.nombre_real} (${usuario.nombre_usuario})?`)) {
      try {
        // Eliminar de Firestore (no se puede eliminar de Auth fácilmente)
        await deleteDoc(doc(db, "usuarios", usuario.id));
        setMensaje(`✅ Usuario "${usuario.nombre_usuario}" eliminado`);
        await cargarUsuarios();
      } catch (error) {
        setMensaje("❌ Error al eliminar usuario");
      }
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold" style={{ color: "#153462" }}>👥 Gestión de Usuarios</h2>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}
        >
          + Nuevo Usuario
        </button>
      </div>

      {mensaje && (
        <div className="mb-4 p-3 rounded-lg text-center" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>
          {mensaje}
        </div>
      )}

      {/* Formulario para crear usuario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-md" style={{ backgroundColor: "#F6F6C9" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#153462" }}>➕ Nuevo Usuario</h3>
            
            <form onSubmit={crearUsuario}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>Nombre de usuario</label>
                <input
                  type="text"
                  placeholder="Ej: maestro_juan, lider_pedro"
                  className="w-full p-2 border rounded-lg"
                  style={{ borderColor: "#BAD1C2" }}
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value.toLowerCase())}
                  required
                />
                <p className="text-xs mt-1" style={{ color: "#4FA095" }}>El email será: {nombreUsuario}@ebd.local</p>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>Nombre real</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  className="w-full p-2 border rounded-lg"
                  style={{ borderColor: "#BAD1C2" }}
                  value={nombreReal}
                  onChange={(e) => setNombreReal(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>Contraseña</label>
                <input
                  type="text"
                  placeholder="Contraseña temporal"
                  className="w-full p-2 border rounded-lg"
                  style={{ borderColor: "#BAD1C2" }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>Rol</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  style={{ borderColor: "#BAD1C2" }}
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                >
                  <option value="admin">👑 Administrador</option>
                  <option value="lider">🌟 Líder</option>
                  <option value="maestro">📚 Maestro</option>
                  <option value="padre">👪 Padre</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}
                >
                  Crear Usuario
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="flex-1 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: "#BAD1C2", color: "#153462" }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      {loading ? (
        <div className="text-center py-10" style={{ color: "#4FA095" }}>Cargando...</div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-10 rounded-xl" style={{ backgroundColor: "#F6F6C9", color: "#4FA095" }}>
          No hay usuarios registrados
        </div>
      ) : (
        <div className="space-y-2">
          {usuarios.map((usuario) => (
            <div
              key={usuario.id}
              className="rounded-xl p-4 flex justify-between items-center"
              style={{ backgroundColor: "#F6F6C9" }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {usuario.rol === "admin" && "👑"}
                    {usuario.rol === "lider" && "🌟"}
                    {usuario.rol === "maestro" && "📚"}
                    {usuario.rol === "padre" && "👪"}
                  </span>
                  <div>
                    <h3 className="font-semibold" style={{ color: "#153462" }}>
                      {usuario.nombre_real}
                    </h3>
                    <p className="text-xs" style={{ color: "#4FA095" }}>
                      @{usuario.nombre_usuario} • {usuario.rol}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => eliminarUsuario(usuario)}
                className="px-3 py-1 rounded-lg text-sm"
                style={{ backgroundColor: "#BAD1C2", color: "#153462" }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Instrucciones */}
      <div className="mt-4 p-3 rounded-xl text-xs" style={{ backgroundColor: "#F6F6C9", color: "#4FA095" }}>
        💡 Los usuarios creados podrán iniciar sesión con su nombre de usuario y la contraseña asignada.
        El email se genera automáticamente como: usuario@ebd.local
      </div>
    </div>
  );
}