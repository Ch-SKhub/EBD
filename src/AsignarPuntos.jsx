import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, getDocs, doc, updateDoc, increment, addDoc, query, where, orderBy, limit } from "firebase/firestore";

export default function AsignarPuntos() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [puntos, setPuntos] = useState(1);
  const [motivo, setMotivo] = useState("");
  const [motivoPersonalizado, setMotivoPersonalizado] = useState("");
  const [categoria, setCategoria] = useState("clase");
  const [mensaje, setMensaje] = useState("");
  const [buscador, setBuscador] = useState("");
  const [operacion, setOperacion] = useState("sumar");
  const [usuarioActual, setUsuarioActual] = useState(null);

  // Obtener usuario actual
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUsuarioActual(user.email?.replace("@escuela.local", "") || "admin");
      }
    });
    return () => unsubscribe();
  }, []);

  // Cargar estudiantes
  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "estudiantes"));
      const lista = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setEstudiantes(lista);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const guardarHistorial = async (estudiante, cambio, puntosAntes, puntosDespues, motivoFinal) => {
    try {
      await addDoc(collection(db, "historial_puntos"), {
        estudiante_id: estudiante.id,
        estudiante_nombre: estudiante.nombre,
        estudiante_apodo: estudiante.apodo || "",
        estudiante_grado: estudiante.grado,
        cambio: cambio,
        puntos_antes: puntosAntes,
        puntos_despues: puntosDespues,
        motivo: motivoFinal,
        categoria: categoria,
        operacion: operacion,
        usuario: usuarioActual,
        fecha: new Date(),
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error al guardar historial:", error);
    }
  };

  const asignarPuntos = async () => {
    if (!estudianteSeleccionado) {
      setMensaje("❌ Selecciona un estudiante");
      return;
    }

    if (puntos <= 0) {
      setMensaje("❌ Los puntos deben ser mayores a 0");
      return;
    }

    const motivoFinal = motivoPersonalizado || motivo || (operacion === "sumar" ? "Sin motivo" : "Sin justificación");

    if (operacion === "restar" && estudianteSeleccionado.puntos < puntos) {
      setMensaje(`❌ No se pueden restar ${puntos} puntos. El estudiante solo tiene ${estudianteSeleccionado.puntos} puntos`);
      return;
    }

    try {
      const puntosAntes = estudianteSeleccionado.puntos;
      const puntosCambio = operacion === "sumar" ? puntos : -puntos;
      const puntosDespues = puntosAntes + puntosCambio;
      
      const estudianteRef = doc(db, "estudiantes", estudianteSeleccionado.id);
      await updateDoc(estudianteRef, {
        puntos: increment(puntosCambio)
      });

      // Guardar en historial
      await guardarHistorial(estudianteSeleccionado, puntosCambio, puntosAntes, puntosDespues, motivoFinal);

      const nuevosEstudiantes = estudiantes.map(est => 
        est.id === estudianteSeleccionado.id 
          ? { ...est, puntos: puntosDespues }
          : est
      );
      setEstudiantes(nuevosEstudiantes);

      const emoji = operacion === "sumar" ? "✅ +" : "⚠️ -";
      setMensaje(`${emoji}${puntos} puntos (${categoria}) - ${motivoFinal}`);
      
      setTimeout(() => {
        setMensaje("");
        setEstudianteSeleccionado(null);
        setMotivo("");
        setMotivoPersonalizado("");
        setPuntos(1);
        setOperacion("sumar");
        setCategoria("clase");
      }, 2000);
    } catch (error) {
      setMensaje("❌ Error al procesar los puntos");
    }
  };

  const estudiantesFiltrados = estudiantes.filter(est => 
    est.nombre.toLowerCase().includes(buscador.toLowerCase()) ||
    (est.apodo && est.apodo.toLowerCase().includes(buscador.toLowerCase()))
  );

  // Motivos predefinidos por categoría
  const motivosPorCategoria = {
    clase: ["📖 Versículo", "🎯 Participación", "📝 Tarea completada", "✨ Atención en clase", "🙏 Oración"],
    actividad: ["🏃 Juego bíblico", "🎨 Manualidad", "🎤 Exposición", "🤝 Trabajo en equipo", "🎭 Teatro bíblico"],
    comportamiento: ["👍 Buen comportamiento", "😊 Respeto", "🤲 Ayudó a compañero", "🧹 Orden y limpieza", "⏰ Puntualidad"],
    evento: ["🌟 Domingo especial", "🎄 Actividad navideña", "🌸 Día de la madre", "👨 Día del padre", "📖 Semana bíblica"]
  };

  const motivosResta = ["😠 Mal comportamiento", "📝 No hizo tarea", "⏰ Llegó tarde", "📱 Uso de celular", "⚠️ Advertencia", "🗣️ Interrupción"];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4" style={{ color: "#153462" }}>⭐ Gestionar Puntos</h2>

      {mensaje && (
        <div className="mb-4 p-3 rounded-lg text-center" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>
          {mensaje}
        </div>
      )}

      {/* Selección de estudiante */}
      <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#F6F6C9" }}>
        <h3 className="font-semibold mb-3" style={{ color: "#153462" }}>1. Seleccionar Estudiante</h3>
        
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o apodo..."
          className="w-full p-2 border rounded-lg mb-3"
          style={{ borderColor: "#BAD1C2" }}
          value={buscador}
          onChange={(e) => setBuscador(e.target.value)}
        />

        {loading ? (
          <div className="text-center py-4" style={{ color: "#4FA095" }}>Cargando...</div>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            {estudiantesFiltrados.map((est) => (
              <div
                key={est.id}
                onClick={() => setEstudianteSeleccionado(est)}
                className={`p-3 rounded-lg mb-2 cursor-pointer ${estudianteSeleccionado?.id === est.id ? "border-2" : "border"}`}
                style={{
                  backgroundColor: estudianteSeleccionado?.id === est.id ? "#BAD1C2" : "white",
                  borderColor: "#4FA095"
                }}
              >
                <div className="flex justify-between">
                  <div>
                    <span className="font-semibold" style={{ color: "#153462" }}>{est.nombre}</span>
                    {est.apodo && <span className="text-sm ml-2" style={{ color: "#4FA095" }}>({est.apodo})</span>}
                    <p className="text-xs" style={{ color: "#4FA095" }}>{est.grado}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color: "#4FA095" }}>{est.puntos} pts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuración de puntos */}
      {estudianteSeleccionado && (
        <div className="rounded-xl p-4" style={{ backgroundColor: "#F6F6C9" }}>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setOperacion("sumar")} className={`flex-1 py-2 rounded-lg font-semibold ${operacion === "sumar" ? "ring-2" : ""}`} style={{ backgroundColor: operacion === "sumar" ? "#4FA095" : "#BAD1C2", color: operacion === "sumar" ? "#F6F6C9" : "#153462" }}>➕ Sumar Puntos</button>
            <button onClick={() => setOperacion("restar")} className={`flex-1 py-2 rounded-lg font-semibold ${operacion === "restar" ? "ring-2" : ""}`} style={{ backgroundColor: operacion === "restar" ? "#4FA095" : "#BAD1C2", color: operacion === "restar" ? "#F6F6C9" : "#153462" }}>➖ Restar Puntos</button>
          </div>

          {operacion === "sumar" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>Categoría</label>
                <select className="w-full p-2 border rounded-lg" style={{ borderColor: "#BAD1C2" }} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <option value="clase">📚 Clase</option>
                  <option value="actividad">🎨 Actividad</option>
                  <option value="comportamiento">👍 Comportamiento</option>
                  <option value="evento">🎉 Evento</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>Motivo</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {motivosPorCategoria[categoria].map((m) => (
                    <button key={m} onClick={() => { setMotivo(m); setMotivoPersonalizado(""); }} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: motivo === m ? "#4FA095" : "#BAD1C2", color: motivo === m ? "#F6F6C9" : "#153462" }}>{m}</button>
                  ))}
                </div>
                <input type="text" placeholder="Motivo personalizado..." className="w-full p-2 border rounded-lg" style={{ borderColor: "#BAD1C2" }} value={motivoPersonalizado} onChange={(e) => { setMotivoPersonalizado(e.target.value); setMotivo(""); }} />
              </div>
            </>
          )}

          {operacion === "restar" && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>Motivo de la resta</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {motivosResta.map((m) => (
                  <button key={m} onClick={() => { setMotivo(m); setMotivoPersonalizado(""); }} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: motivo === m ? "#4FA095" : "#BAD1C2", color: motivo === m ? "#F6F6C9" : "#153462" }}>{m}</button>
                ))}
              </div>
              <input type="text" placeholder="Motivo personalizado..." className="w-full p-2 border rounded-lg" style={{ borderColor: "#BAD1C2" }} value={motivoPersonalizado} onChange={(e) => { setMotivoPersonalizado(e.target.value); setMotivo(""); }} />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>Cantidad de puntos</label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 5, 10].map((v) => (
                <button key={v} onClick={() => setPuntos(v)} className={`px-4 py-2 rounded-lg ${puntos === v ? "ring-2" : ""}`} style={{ backgroundColor: puntos === v ? "#4FA095" : "#BAD1C2", color: puntos === v ? "#F6F6C9" : "#153462" }}>{operacion === "sumar" ? "+" : "-"}{v}</button>
              ))}
              <input type="number" className="w-20 p-2 border rounded-lg text-center" style={{ borderColor: "#BAD1C2" }} value={puntos} onChange={(e) => setPuntos(parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg mb-4 text-center">
            <span style={{ color: "#153462" }}>{estudianteSeleccionado.nombre} tiene:</span>
            <span className="text-2xl font-bold ml-2" style={{ color: "#4FA095" }}>{estudianteSeleccionado.puntos} puntos</span>
            <p className="text-xs mt-1" style={{ color: "#4FA095" }}>Quedará en: {operacion === "sumar" ? estudianteSeleccionado.puntos + puntos : estudianteSeleccionado.puntos - puntos} puntos</p>
          </div>

          <div className="flex gap-2">
            <button onClick={asignarPuntos} className="flex-1 py-3 rounded-lg font-semibold" style={{ backgroundColor: operacion === "sumar" ? "#4FA095" : "#153462", color: "#F6F6C9" }}>{operacion === "sumar" ? `⭐ Sumar ${puntos}` : `⚠️ Restar ${puntos}`}</button>
            <button onClick={() => setEstudianteSeleccionado(null)} className="flex-1 py-3 rounded-lg font-semibold" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}