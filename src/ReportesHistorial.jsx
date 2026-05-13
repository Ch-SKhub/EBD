import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs, query, orderBy, limit, where, deleteDoc, doc } from "firebase/firestore";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function ReportesHistorial() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState("todos");
  const [filtroEstudiante, setFiltroEstudiante] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [nuevoMotivo, setNuevoMotivo] = useState("");

  useEffect(() => {
    cargarHistorial();
    cargarEstudiantes();
  }, []);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "historial_puntos"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const lista = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      setHistorial(lista);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstudiantes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "estudiantes"));
      const lista = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, nombre: doc.data().nombre });
      });
      setEstudiantes(lista);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const editarMotivo = async (id, nuevoMotivo) => {
    try {
      const historialRef = doc(db, "historial_puntos", id);
      await updateDoc(historialRef, { motivo: nuevoMotivo });
      await cargarHistorial();
      setEditandoId(null);
      setNuevoMotivo("");
    } catch (error) {
      console.error("Error al editar:", error);
    }
  };

  const eliminarRegistro = async (id) => {
    if (confirm("¿Eliminar este registro?")) {
      try {
        await deleteDoc(doc(db, "historial_puntos", id));
        await cargarHistorial();
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const filtrarHistorial = () => {
    let filtrado = [...historial];
    
    if (filtroFecha !== "todos") {
      const ahora = new Date();
      const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      if (filtroFecha === "hoy") {
        filtrado = filtrado.filter(h => new Date(h.fecha?.toDate()).setHours(0,0,0,0) === hoy.getTime());
      } else if (filtroFecha === "semana") {
        const semanaAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtrado = filtrado.filter(h => h.fecha?.toDate() > semanaAtras);
      } else if (filtroFecha === "mes") {
        const mesAtras = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtrado = filtrado.filter(h => h.fecha?.toDate() > mesAtras);
      }
    }
    
    if (filtroEstudiante) {
      filtrado = filtrado.filter(h => h.estudiante_id === filtroEstudiante);
    }
    
    return filtrado;
  };

  const datosGrafico = () => {
    const datos = {};
    filtrarHistorial().forEach(h => {
      const fecha = h.fecha?.toDate().toLocaleDateString();
      if (!datos[fecha]) datos[fecha] = { fecha, suma: 0, resta: 0 };
      if (h.cambio > 0) datos[fecha].suma += h.cambio;
      else datos[fecha].resta += Math.abs(h.cambio);
    });
    return Object.values(datos).sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
  };

  const datosCategorias = () => {
    const categorias = {};
    filtrarHistorial().forEach(h => {
      if (h.categoria) {
        categorias[h.categoria] = (categorias[h.categoria] || 0) + (h.cambio > 0 ? h.cambio : 0);
      }
    });
    return Object.entries(categorias).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ["#4FA095", "#153462", "#BAD1C2", "#F6F6C9"];

  const totalSumas = filtrarHistorial().filter(h => h.cambio > 0).reduce((s, h) => s + h.cambio, 0);
  const totalRestas = filtrarHistorial().filter(h => h.cambio < 0).reduce((s, h) => s + Math.abs(h.cambio), 0);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4" style={{ color: "#153462" }}>📊 Reportes e Historial</h2>

      {/* Filtros */}
      <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#F6F6C9" }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium" style={{ color: "#153462" }}>Período</label>
            <select className="w-full p-2 border rounded-lg mt-1" style={{ borderColor: "#BAD1C2" }} value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="hoy">Hoy</option>
              <option value="semana">Última semana</option>
              <option value="mes">Último mes</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: "#153462" }}>Estudiante</label>
            <select className="w-full p-2 border rounded-lg mt-1" style={{ borderColor: "#BAD1C2" }} value={filtroEstudiante} onChange={(e) => setFiltroEstudiante(e.target.value)}>
              <option value="">Todos</option>
              {estudiantes.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>
          <div className="text-2xl font-bold">+{totalSumas}</div>
          <div className="text-sm">Puntos sumados</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "#153462", color: "#F6F6C9" }}>
          <div className="text-2xl font-bold">-{totalRestas}</div>
          <div className="text-sm">Puntos restados</div>
        </div>
      </div>

      {/* Gráfico de líneas */}
      {datosGrafico().length > 0 && (
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#F6F6C9" }}>
          <h3 className="font-semibold mb-3" style={{ color: "#153462" }}>📈 Evolución de puntos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={datosGrafico()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="suma" stroke="#4FA095" name="Puntos sumados" />
              <Line type="monotone" dataKey="resta" stroke="#153462" name="Puntos restados" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de categorías */}
      {datosCategorias().length > 0 && (
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#F6F6C9" }}>
          <h3 className="font-semibold mb-3" style={{ color: "#153462" }}>🥧 Puntos por categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={datosCategorias()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {datosCategorias().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabla de historial */}
      <div className="rounded-xl p-4" style={{ backgroundColor: "#F6F6C9" }}>
        <h3 className="font-semibold mb-3" style={{ color: "#153462" }}>📋 Historial de movimientos</h3>
        
        {loading ? (
          <div className="text-center py-4" style={{ color: "#4FA095" }}>Cargando...</div>
        ) : filtrarHistorial().length === 0 ? (
          <div className="text-center py-4" style={{ color: "#4FA095" }}>No hay registros</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtrarHistorial().map((h) => (
              <div key={h.id} className="p-3 rounded-lg border" style={{ borderColor: "#BAD1C2" }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${h.cambio > 0 ? "text-green-600" : "text-red-600"}`}>
                        {h.cambio > 0 ? `+${h.cambio}` : `${h.cambio}`}
                      </span>
                      <span className="font-semibold" style={{ color: "#153462" }}>{h.estudiante_nombre}</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#4FA095" }}>
                      {h.categoria && `📌 ${h.categoria} • `}
                      {editandoId === h.id ? (
                        <input type="text" className="inline p-1 border rounded" value={nuevoMotivo} onChange={(e) => setNuevoMotivo(e.target.value)} style={{ borderColor: "#BAD1C2" }} />
                      ) : (
                        <span>📝 {h.motivo}</span>
                      )}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#BAD1C2" }}>
                      👤 {h.usuario} • 📅 {h.fecha?.toDate().toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {editandoId === h.id ? (
                      <>
                        <button onClick={() => editarMotivo(h.id, nuevoMotivo)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>💾</button>
                        <button onClick={() => setEditandoId(null)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>❌</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditandoId(h.id); setNuevoMotivo(h.motivo); }} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>✏️</button>
                        <button onClick={() => eliminarRegistro(h.id)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}