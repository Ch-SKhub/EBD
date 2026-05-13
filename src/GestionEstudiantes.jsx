import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import QRCode from "qrcode";

export default function GestionEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarQR, setMostrarQR] = useState(null);
  
  // Formulario
  const [nombre, setNombre] = useState("");
  const [apodo, setApodo] = useState("");
  const [grado, setGrado] = useState("Pequeños");
  const [puntos, setPuntos] = useState(0);

  // Cargar estudiantes al iniciar
  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "estudiantes"));
      const lista = [];
      for (const doc of querySnapshot.docs) {
        const estudiante = { id: doc.id, ...doc.data() };
        // Generar URL del QR para cada estudiante
        const qrUrl = `${window.location.origin}/scan?estudianteId=${doc.id}`;
        estudiante.qrDataUrl = await QRCode.toDataURL(qrUrl);
        lista.push(estudiante);
      }
      setEstudiantes(lista);
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
    } finally {
      setLoading(false);
    }
  };

  const guardarEstudiante = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        const estudianteRef = doc(db, "estudiantes", editandoId);
        await updateDoc(estudianteRef, {
          nombre,
          apodo,
          grado,
          puntos: parseInt(puntos)
        });
      } else {
        await addDoc(collection(db, "estudiantes"), {
          nombre,
          apodo,
          grado,
          puntos: parseInt(puntos),
          activo: true,
          creado_en: new Date()
        });
      }
      setNombre("");
      setApodo("");
      setGrado("Pequeños");
      setPuntos(0);
      setEditandoId(null);
      setMostrarFormulario(false);
      await cargarEstudiantes();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar el estudiante");
    }
  };

  const editarEstudiante = (estudiante) => {
    setNombre(estudiante.nombre);
    setApodo(estudiante.apodo || "");
    setGrado(estudiante.grado);
    setPuntos(estudiante.puntos);
    setEditandoId(estudiante.id);
    setMostrarFormulario(true);
  };

  const eliminarEstudiante = async (id) => {
    if (confirm("¿Estás seguro de eliminar este estudiante?")) {
      try {
        await deleteDoc(doc(db, "estudiantes", id));
        await cargarEstudiantes();
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Error al eliminar el estudiante");
      }
    }
  };

  const cancelarFormulario = () => {
    setNombre("");
    setApodo("");
    setGrado("Pequeños");
    setPuntos(0);
    setEditandoId(null);
    setMostrarFormulario(false);
  };

  const verQR = (estudiante) => {
    setMostrarQR(estudiante);
  };

  const cerrarQR = () => {
    setMostrarQR(null);
  };

  const imprimirQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR - ${mostrarQR.nombre}</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 20px; }
            .qr { margin: 20px auto; }
            .info { margin-top: 20px; }
            button { margin-top: 20px; padding: 10px 20px; }
          </style>
        </head>
        <body>
          <h2>${mostrarQR.nombre} ${mostrarQR.apodo ? `(${mostrarQR.apodo})` : ''}</h2>
          <p>Grupo: ${mostrarQR.grado}</p>
          <div class="qr">
            <img src="${mostrarQR.qrDataUrl}" width="200" height="200" />
          </div>
          <p class="info">📖 Escuela Bíblica<br>Escanea para registrar asistencia</p>
          <button onclick="window.print()">🖨️ Imprimir</button>
        </body>
      </html>
    `);
  };

  return (
    <div className="p-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold" style={{ color: "#153462" }}>👥 Gestión de Estudiantes</h2>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}
        >
          + Nuevo Estudiante
        </button>
      </div>

      {/* Formulario (modal) */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-md" style={{ backgroundColor: "#F6F6C9" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#153462" }}>
              {editandoId ? "✏️ Editar Estudiante" : "➕ Nuevo Estudiante"}
            </h3>
            
            <form onSubmit={guardarEstudiante}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>Nombre completo</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  style={{ borderColor: "#BAD1C2" }}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>Apodo (opcional)</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  style={{ borderColor: "#BAD1C2" }}
                  value={apodo}
                  onChange={(e) => setApodo(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>Grupo</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  style={{ borderColor: "#BAD1C2" }}
                  value={grado}
                  onChange={(e) => setGrado(e.target.value)}
                >
                  <option value="Pequeños">👶 Pequeños</option>
                  <option value="Grandes">🧒 Grandes</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>Puntos iniciales</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  style={{ borderColor: "#BAD1C2" }}
                  value={puntos}
                  onChange={(e) => setPuntos(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={cancelarFormulario}
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

      {/* Modal para ver QR */}
      {mostrarQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-sm text-center" style={{ backgroundColor: "#F6F6C9" }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#153462" }}>
              {mostrarQR.nombre}
            </h3>
            <p className="text-sm mb-4" style={{ color: "#4FA095" }}>
              {mostrarQR.grado} • {mostrarQR.puntos} puntos
            </p>
            <div className="flex justify-center mb-4">
              <img src={mostrarQR.qrDataUrl} alt="QR" width="200" height="200" />
            </div>
            <p className="text-xs mb-4" style={{ color: "#BAD1C2" }}>
              Escanea con el celular del maestro para registrar asistencia
            </p>
            <div className="flex gap-2">
              <button
                onClick={imprimirQR}
                className="flex-1 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={cerrarQR}
                className="flex-1 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: "#BAD1C2", color: "#153462" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de estudiantes */}
      {loading ? (
        <div className="text-center py-10" style={{ color: "#4FA095" }}>Cargando...</div>
      ) : estudiantes.length === 0 ? (
        <div className="text-center py-10 rounded-xl" style={{ backgroundColor: "#F6F6C9", color: "#4FA095" }}>
          No hay estudiantes registrados. Presiona "+ Nuevo Estudiante" para comenzar.
        </div>
      ) : (
        <div className="space-y-2">
          {estudiantes.map((estudiante) => (
            <div
              key={estudiante.id}
              className="rounded-xl p-4 flex justify-between items-center"
              style={{ backgroundColor: "#F6F6C9" }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👧</span>
                  <div>
                    <h3 className="font-semibold" style={{ color: "#153462" }}>
                      {estudiante.nombre} {estudiante.apodo && `(${estudiante.apodo})`}
                    </h3>
                    <p className="text-xs" style={{ color: "#4FA095" }}>
                      {estudiante.grado} • {estudiante.puntos} puntos
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => verQR(estudiante)}
                  className="px-3 py-1 rounded-lg text-sm"
                  style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}
                >
                  📱 QR
                </button>
                <button
                  onClick={() => editarEstudiante(estudiante)}
                  className="px-3 py-1 rounded-lg text-sm"
                  style={{ backgroundColor: "#BAD1C2", color: "#153462" }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => eliminarEstudiante(estudiante.id)}
                  className="px-3 py-1 rounded-lg text-sm"
                  style={{ backgroundColor: "#BAD1C2", color: "#153462" }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}