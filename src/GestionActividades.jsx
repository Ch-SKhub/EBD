import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from "firebase/firestore";

export default function GestionActividades({ userData, soloLectura = false }) {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [mensaje, setMensaje] = useState("");

  // Formulario
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [tema, setTema] = useState("");
  const [versiculo, setVersiculo] = useState("");
  const [maestros, setMaestros] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const esAdminOLider = userData?.rol === "admin" || userData?.rol === "lider";
  const puedeEditar = esAdminOLider && !soloLectura;

  useEffect(() => {
    cargarActividades();
  }, []);

  const cargarActividades = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "actividades"), orderBy("fecha", "asc"));
      const querySnapshot = await getDocs(q);
      const lista = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      setActividades(lista);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const guardarActividad = async (e) => {
    e.preventDefault();
    if (!titulo || !fecha || !tema) {
      setMensaje("❌ Completa los campos obligatorios");
      return;
    }

    try {
      if (editandoId) {
        const actividadRef = doc(db, "actividades", editandoId);
        await updateDoc(actividadRef, { titulo, fecha, tema, versiculo, maestros, descripcion });
        setMensaje("✅ Actividad actualizada");
      } else {
        await addDoc(collection(db, "actividades"), {
          titulo, fecha, tema, versiculo, maestros, descripcion,
          creado_por: userData?.nombre_usuario || "admin",
          creado_en: new Date()
        });
        setMensaje("✅ Actividad creada");
      }
      limpiarFormulario();
      await cargarActividades();
      setTimeout(() => setMensaje(""), 2000);
    } catch (error) {
      setMensaje("❌ Error al guardar");
    }
  };

  const limpiarFormulario = () => {
    setTitulo(""); setFecha(""); setTema(""); setVersiculo(""); setMaestros(""); setDescripcion("");
    setEditandoId(null); setMostrarFormulario(false);
  };

  const editarActividad = (act) => {
    setTitulo(act.titulo);
    setFecha(act.fecha);
    setTema(act.tema);
    setVersiculo(act.versiculo || "");
    setMaestros(act.maestros || "");
    setDescripcion(act.descripcion || "");
    setEditandoId(act.id);
    setMostrarFormulario(true);
  };

  const eliminarActividad = async (id) => {
    if (confirm("¿Eliminar esta actividad?")) {
      try {
        await deleteDoc(doc(db, "actividades", id));
        await cargarActividades();
        setMensaje("✅ Actividad eliminada");
        setTimeout(() => setMensaje(""), 2000);
      } catch (error) {
        setMensaje("❌ Error al eliminar");
      }
    }
  };

  const formatearFecha = (fechaStr) => {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fechaStr).toLocaleDateString('es-ES', opciones);
  };

  const esFechaFutura = (fechaStr) => {
    return new Date(fechaStr) >= new Date();
  };

  const actividadesProximas = actividades.filter(a => esFechaFutura(a.fecha)).sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
  const actividadesPasadas = actividades.filter(a => !esFechaFutura(a.fecha)).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold" style={{ color: "#153462" }}>📅 Planificación de Clases</h2>
        {puedeEditar && (
          <button onClick={() => setMostrarFormulario(true)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>+ Nueva Actividad</button>
        )}
      </div>

      {mensaje && (
        <div className="mb-4 p-3 rounded-lg text-center" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>{mensaje}</div>
      )}

      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-md" style={{ backgroundColor: "#F6F6C9" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#153462" }}>{editandoId ? "✏️ Editar Actividad" : "➕ Nueva Actividad"}</h3>
            <form onSubmit={guardarActividad}>
              <input type="text" placeholder="Título *" className="w-full p-2 border rounded-lg mb-3" style={{ borderColor: "#BAD1C2" }} value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
              <input type="date" className="w-full p-2 border rounded-lg mb-3" style={{ borderColor: "#BAD1C2" }} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
              <input type="text" placeholder="Tema *" className="w-full p-2 border rounded-lg mb-3" style={{ borderColor: "#BAD1C2" }} value={tema} onChange={(e) => setTema(e.target.value)} required />
              <input type="text" placeholder="Versículo (ej: Juan 3:16)" className="w-full p-2 border rounded-lg mb-3" style={{ borderColor: "#BAD1C2" }} value={versiculo} onChange={(e) => setVersiculo(e.target.value)} />
              <input type="text" placeholder="Maestros (separados por coma)" className="w-full p-2 border rounded-lg mb-3" style={{ borderColor: "#BAD1C2" }} value={maestros} onChange={(e) => setMaestros(e.target.value)} />
              <textarea placeholder="Descripción / Actividades" rows="3" className="w-full p-2 border rounded-lg mb-4" style={{ borderColor: "#BAD1C2" }} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 rounded-lg font-semibold" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>Guardar</button>
                <button type="button" onClick={limpiarFormulario} className="flex-1 py-2 rounded-lg font-semibold" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-semibold mb-3" style={{ color: "#153462" }}>📌 Próximas Actividades</h3>
        {loading ? <div className="text-center py-4">Cargando...</div> : actividadesProximas.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ backgroundColor: "#F6F6C9", color: "#4FA095" }}>No hay actividades programadas</div>
        ) : (
          <div className="space-y-3">
            {actividadesProximas.map((act) => (
              <div key={act.id} className="rounded-xl p-4 cursor-pointer" style={{ backgroundColor: "#F6F6C9", border: "1px solid #BAD1C2" }} onClick={() => setActividadSeleccionada(act)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">📖</span>
                      <h3 className="font-semibold" style={{ color: "#153462" }}>{act.titulo}</h3>
                    </div>
                    <p className="text-sm" style={{ color: "#4FA095" }}>📅 {formatearFecha(act.fecha)}</p>
                    <p className="text-sm mt-1" style={{ color: "#4a4a4a" }}>{act.tema}</p>
                  </div>
                  {puedeEditar && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => editarActividad(act)} className="px-2 py-1 rounded-lg text-sm" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>✏️</button>
                      <button onClick={() => eliminarActividad(act.id)} className="px-2 py-1 rounded-lg text-sm" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {actividadesPasadas.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3" style={{ color: "#153462" }}>📜 Actividades Anteriores</h3>
          <div className="space-y-2">
            {actividadesPasadas.map((act) => (
              <div key={act.id} className="rounded-xl p-3 cursor-pointer opacity-70" style={{ backgroundColor: "#F6F6C9", border: "1px solid #BAD1C2" }} onClick={() => setActividadSeleccionada(act)}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm" style={{ color: "#153462" }}>{act.titulo}</h4>
                    <p className="text-xs" style={{ color: "#4FA095" }}>{formatearFecha(act.fecha)}</p>
                  </div>
                  {puedeEditar && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => editarActividad(act)} className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>✏️</button>
                      <button onClick={() => eliminarActividad(act.id)} className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {actividadSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 w-full max-w-md" style={{ backgroundColor: "#F6F6C9" }}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold" style={{ color: "#153462" }}>{actividadSeleccionada.titulo}</h3>
              <button onClick={() => setActividadSeleccionada(null)} className="text-2xl" style={{ color: "#4FA095" }}>✕</button>
            </div>
            <div className="space-y-3">
              <div><span className="font-semibold" style={{ color: "#153462" }}>📅 Fecha:</span> <span style={{ color: "#4a4a4a" }}>{formatearFecha(actividadSeleccionada.fecha)}</span></div>
              <div><span className="font-semibold" style={{ color: "#153462" }}>📖 Tema:</span> <span style={{ color: "#4a4a4a" }}>{actividadSeleccionada.tema}</span></div>
              {actividadSeleccionada.versiculo && <div><span className="font-semibold" style={{ color: "#153462" }}>✝️ Versículo:</span> <span style={{ color: "#4a4a4a" }}>{actividadSeleccionada.versiculo}</span></div>}
              {actividadSeleccionada.maestros && <div><span className="font-semibold" style={{ color: "#153462" }}>👨‍🏫 Maestros:</span> <span style={{ color: "#4a4a4a" }}>{actividadSeleccionada.maestros}</span></div>}
              {actividadSeleccionada.descripcion && <div><span className="font-semibold" style={{ color: "#153462" }}>📝 Descripción:</span> <p className="mt-1" style={{ color: "#4a4a4a" }}>{actividadSeleccionada.descripcion}</p></div>}
            </div>
            <button onClick={() => setActividadSeleccionada(null)} className="w-full mt-6 py-2 rounded-lg font-semibold" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}