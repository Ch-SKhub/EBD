import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import QRCode from "qrcode";

export default function PerfilLider({ userData }) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarQR, setMostrarQR] = useState(null);
  
  const [nombre, setNombre] = useState("");
  const [apodo, setApodo] = useState("");
  const [grado, setGrado] = useState("Pequeños");
  const [puntos, setPuntos] = useState(0);

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
        const qrUrl = `${window.location.origin}/scan?estudianteId=${doc.id}`;
        estudiante.qrDataUrl = await QRCode.toDataURL(qrUrl);
        lista.push(estudiante);
      }
      setEstudiantes(lista);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const guardarEstudiante = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        const estudianteRef = doc(db, "estudiantes", editandoId);
        await updateDoc(estudianteRef, { nombre, apodo, grado, puntos: parseInt(puntos) });
      } else {
        await addDoc(collection(db, "estudiantes"), {
          nombre, apodo, grado, puntos: parseInt(puntos), activo: true, creado_en: new Date()
        });
      }
      setNombre(""); setApodo(""); setGrado("Pequeños"); setPuntos(0);
      setEditandoId(null); setMostrarFormulario(false);
      await cargarEstudiantes();
    } catch (error) {
      alert("Error al guardar");
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
    if (confirm("¿Eliminar este estudiante?")) {
      try {
        await deleteDoc(doc(db, "estudiantes", id));
        await cargarEstudiantes();
      } catch (error) {
        alert("Error al eliminar");
      }
    }
  };

  const verQR = (estudiante) => setMostrarQR(estudiante);
  const cerrarQR = () => setMostrarQR(null);

  const imprimirQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>QR - ${mostrarQR.nombre}</title>
      <style>body{font-family:Arial;text-align:center;padding:20px}.qr{margin:20px auto}button{margin-top:20px;padding:10px 20px}</style>
      </head><body>
      <h2>${mostrarQR.nombre} ${mostrarQR.apodo ? `(${mostrarQR.apodo})` : ''}</h2>
      <p>Grupo: ${mostrarQR.grado}</p>
      <div class="qr"><img src="${mostrarQR.qrDataUrl}" width="200" height="200" /></div>
      <p>📖 Escuela Bíblica<br>Escanea para registrar asistencia</p>
      <button onclick="window.print()">🖨️ Imprimir</button>
      </body></html>
    `);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold" style={{ color: "#153462" }}>👥 Gestión de Estudiantes</h2>
        <button onClick={() => setMostrarFormulario(true)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>+ Nuevo Estudiante</button>
      </div>

      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-md" style={{ backgroundColor: "#F6F6C9" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#153462" }}>{editandoId ? "✏️ Editar" : "➕ Nuevo"}</h3>
            <form onSubmit={guardarEstudiante}>
              <input type="text" placeholder="Nombre" className="w-full p-2 border rounded-lg mb-3" style={{ borderColor: "#BAD1C2" }} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              <input type="text" placeholder="Apodo" className="w-full p-2 border rounded-lg mb-3" style={{ borderColor: "#BAD1C2" }} value={apodo} onChange={(e) => setApodo(e.target.value)} />
              <select className="w-full p-2 border rounded-lg mb-3" style={{ borderColor: "#BAD1C2" }} value={grado} onChange={(e) => setGrado(e.target.value)}>
                <option value="Pequeños">👶 Pequeños</option><option value="Grandes">🧒 Grandes</option>
              </select>
              <input type="number" placeholder="Puntos" className="w-full p-2 border rounded-lg mb-4" style={{ borderColor: "#BAD1C2" }} value={puntos} onChange={(e) => setPuntos(e.target.value)} />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 rounded-lg font-semibold" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>Guardar</button>
                <button type="button" onClick={() => { setMostrarFormulario(false); setEditandoId(null); }} className="flex-1 py-2 rounded-lg font-semibold" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 text-center" style={{ backgroundColor: "#F6F6C9" }}>
            <h3 className="text-lg font-bold" style={{ color: "#153462" }}>{mostrarQR.nombre}</h3>
            <img src={mostrarQR.qrDataUrl} alt="QR" width="200" height="200" className="mx-auto my-4" />
            <div className="flex gap-2">
              <button onClick={imprimirQR} className="flex-1 py-2 rounded-lg font-semibold" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>🖨️ Imprimir</button>
              <button onClick={cerrarQR} className="flex-1 py-2 rounded-lg font-semibold" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-10" style={{ color: "#4FA095" }}>Cargando...</div> : estudiantes.length === 0 ? (
        <div className="text-center py-10 rounded-xl" style={{ backgroundColor: "#F6F6C9", color: "#4FA095" }}>No hay estudiantes. Presiona "+ Nuevo Estudiante"</div>
      ) : (
        <div className="space-y-2">
          {estudiantes.map((est) => (
            <div key={est.id} className="rounded-xl p-4 flex justify-between items-center" style={{ backgroundColor: "#F6F6C9" }}>
              <div><div className="flex items-center gap-2"><span className="text-xl">👧</span><div><h3 className="font-semibold" style={{ color: "#153462" }}>{est.nombre} {est.apodo && `(${est.apodo})`}</h3><p className="text-xs" style={{ color: "#4FA095" }}>{est.grado} • {est.puntos} pts</p></div></div></div>
              <div className="flex gap-2">
                <button onClick={() => verQR(est)} className="px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>📱 QR</button>
                <button onClick={() => editarEstudiante(est)} className="px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>✏️</button>
                <button onClick={() => eliminarEstudiante(est.id)} className="px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}