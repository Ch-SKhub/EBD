import { useState, useRef, useEffect } from "react";
import { db } from "./firebase";
import { doc, updateDoc, increment, getDoc, addDoc, collection } from "firebase/firestore";
import { Html5Qrcode } from "html5-qrcode";

export default function EscanearQR() {
  const [scanning, setScanning] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [puntos, setPuntos] = useState(3);
  const [estudianteActual, setEstudianteActual] = useState(null);
  const [camaraIniciada, setCamaraIniciada] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [exitoMensaje, setExitoMensaje] = useState("");
  const html5QrCodeRef = useRef(null);
  const [usuarioActual, setUsuarioActual] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("usuario");
    setUsuarioActual(user || "maestro");
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const iniciarEscaneo = async () => {
    setScanning(true);
    setMensaje("");
    setEstudianteActual(null);
    setCamaraIniciada(false);

    await new Promise(resolve => setTimeout(resolve, 500));

    const element = document.getElementById("qr-reader");
    if (!element) {
      setMensaje("Error: No se pudo iniciar la cámara");
      setScanning(false);
      return;
    }

    element.innerHTML = "";

    const html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = html5QrCode;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    const cameraId = { facingMode: "environment" };

    try {
      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          procesarQR(decodedText);
        },
        (errorMessage) => {
          console.log("Error de escaneo:", errorMessage);
        }
      );
      setCamaraIniciada(true);
      setMensaje("📷 Cámara activada. Apunta al código QR.");
    } catch (err) {
      console.error("Error al iniciar cámara:", err);
      setMensaje("❌ Error al acceder a la cámara. Verifica los permisos.");
      setScanning(false);
    }
  };

  const procesarQR = async (decodedText) => {
    if (!html5QrCodeRef.current) return;

    try {
      await html5QrCodeRef.current.stop();
      html5QrCodeRef.current = null;
      setCamaraIniciada(false);
      setScanning(false);

      let estudianteId = decodedText;
      if (decodedText.includes("estudianteId=")) {
        const params = new URLSearchParams(decodedText.split("?")[1]);
        estudianteId = params.get("estudianteId");
      }

      const estudianteRef = doc(db, "estudiantes", estudianteId);
      const estudianteDoc = await getDoc(estudianteRef);

      if (estudianteDoc.exists()) {
        setEstudianteActual({
          id: estudianteId,
          ...estudianteDoc.data()
        });
        setMensaje(`✅ Estudiante encontrado: ${estudianteDoc.data().nombre}`);
      } else {
        setMensaje("❌ Estudiante no encontrado");
      }
    } catch (error) {
      console.error("Error al procesar QR:", error);
      setMensaje("❌ Error al procesar el código QR");
      setScanning(false);
    }
  };

  const detenerEscaneo = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (error) {
        console.error("Error al detener cámara:", error);
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
    setCamaraIniciada(false);
  };

  const registrarAsistencia = async () => {
    if (!estudianteActual) return;

    try {
      const estudianteRef = doc(db, "estudiantes", estudianteActual.id);
      await updateDoc(estudianteRef, {
        puntos: increment(puntos),
        ultima_asistencia: new Date()
      });

      await addDoc(collection(db, "historial_puntos"), {
        estudiante_id: estudianteActual.id,
        estudiante_nombre: estudianteActual.nombre,
        estudiante_apodo: estudianteActual.apodo || "",
        estudiante_grado: estudianteActual.grado,
        cambio: puntos,
        puntos_antes: estudianteActual.puntos,
        puntos_despues: estudianteActual.puntos + puntos,
        motivo: "📷 Asistencia por QR",
        categoria: "asistencia",
        operacion: "sumar",
        usuario: usuarioActual || "maestro",
        fecha: new Date(),
        timestamp: Date.now()
      });

      // Mostrar mensaje de éxito
      setExitoMensaje(`🎉 +${puntos} puntos para ${estudianteActual.nombre}!`);
      setMostrarExito(true);

      // Limpiar después de 2 segundos
      setTimeout(() => {
        setMostrarExito(false);
        // Limpiar estudiante actual y mensaje
        setEstudianteActual(null);
        setMensaje("");
      }, 2000);
      
    } catch (error) {
      console.error("Error al registrar:", error);
      setExitoMensaje("❌ Error al registrar asistencia");
      setMostrarExito(true);
      setTimeout(() => setMostrarExito(false), 2000);
    }
  };

  const cancelarEscaneo = () => {
    detenerEscaneo();
    setEstudianteActual(null);
    setMensaje("");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4" style={{ color: "#153462" }}>📷 Escanear QR</h2>

      {/* Modal de éxito */}
      {mostrarExito && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 text-center max-w-sm" style={{ backgroundColor: "#F6F6C9" }}>
            <div className="text-5xl mb-3">✅</div>
            <p className="text-lg font-semibold" style={{ color: "#153462" }}>{exitoMensaje}</p>
          </div>
        </div>
      )}

      {/* Configuración de puntos */}
      {!scanning && !estudianteActual && (
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#F6F6C9" }}>
          <label className="block text-sm font-medium mb-2" style={{ color: "#153462" }}>
            Puntos por asistencia:
          </label>
          <select
            className="w-full p-2 border rounded-lg mb-4"
            style={{ borderColor: "#BAD1C2" }}
            value={puntos}
            onChange={(e) => setPuntos(parseInt(e.target.value))}
          >
            <option value="1">1 punto</option>
            <option value="2">2 puntos</option>
            <option value="3">3 puntos</option>
            <option value="5">5 puntos</option>
          </select>

          <button
            onClick={iniciarEscaneo}
            className="w-full py-3 rounded-lg font-semibold text-lg"
            style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}
          >
            📷 Iniciar Cámara
          </button>
        </div>
      )}

      {/* Área de escaneo */}
      {scanning && (
        <div className="rounded-xl p-4" style={{ backgroundColor: "#F6F6C9" }}>
          <div id="qr-reader" style={{ width: "100%", minHeight: "300px" }}></div>
          <p className="text-center text-sm mt-2" style={{ color: "#4FA095" }}>
            {camaraIniciada ? "🔍 Buscando código QR..." : "⏳ Iniciando cámara..."}
          </p>
          <button
            onClick={cancelarEscaneo}
            className="w-full mt-4 py-2 rounded-lg font-semibold"
            style={{ backgroundColor: "#BAD1C2", color: "#153462" }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Resultado del escaneo */}
      {estudianteActual && !scanning && (
        <div className="rounded-xl p-5 text-center" style={{ backgroundColor: "#F6F6C9" }}>
          <div className="text-5xl mb-3">👧</div>
          <h3 className="text-xl font-bold mb-1" style={{ color: "#153462" }}>
            {estudianteActual.nombre}
          </h3>
          {estudianteActual.apodo && (
            <p className="text-sm mb-1" style={{ color: "#4FA095" }}>
              ({estudianteActual.apodo})
            </p>
          )}
          <p className="text-sm mb-2" style={{ color: "#4FA095" }}>
            {estudianteActual.grado} • Puntos actuales: {estudianteActual.puntos}
          </p>

          <div className="text-3xl font-bold my-3" style={{ color: "#4FA095" }}>
            +{puntos} puntos
          </div>
          <p className="text-sm mb-3" style={{ color: "#153462" }}>
            Después del registro: {estudianteActual.puntos + puntos} puntos
          </p>

          <div className="flex gap-2">
            <button
              onClick={registrarAsistencia}
              className="flex-1 py-3 rounded-lg font-semibold"
              style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}
            >
              ✅ Registrar
            </button>
            <button
              onClick={cancelarEscaneo}
              className="flex-1 py-3 rounded-lg font-semibold"
              style={{ backgroundColor: "#BAD1C2", color: "#153462" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Mensaje de estado */}
      {mensaje && !estudianteActual && !mostrarExito && (
        <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>
          {mensaje}
        </div>
      )}

      {/* Instrucciones */}
      {!scanning && !estudianteActual && !mostrarExito && (
        <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: "#F6F6C9" }}>
          <h3 className="font-semibold mb-2" style={{ color: "#153462" }}>📖 Instrucciones:</h3>
          <ol className="text-sm space-y-1" style={{ color: "#4FA095" }}>
            <li>1. Presiona "Iniciar Cámara"</li>
            <li>2. Permite el acceso a la cámara cuando Chrome lo pida</li>
            <li>3. Apunta el teléfono al código QR del estudiante</li>
            <li>4. Espera a que se detecte automáticamente</li>
            <li>5. Confirma los puntos y presiona "Registrar"</li>
          </ol>
          <div className="mt-3 text-xs" style={{ color: "#BAD1C2" }}>
            💡 Los QR se generan en "Estudiantes" → botón "QR"
          </div>
        </div>
      )}
    </div>
  );
}