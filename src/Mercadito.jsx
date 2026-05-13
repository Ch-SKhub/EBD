import { useState, useRef, useEffect } from "react";
import { db, auth } from "./firebase";
import { doc, updateDoc, increment, getDoc, addDoc, collection } from "firebase/firestore";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Mercadito() {
  const [scanning, setScanning] = useState(false);
  const [estudiante, setEstudiante] = useState(null);
  const [puntosAGastar, setPuntosAGastar] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [producto, setProducto] = useState("");
  const [historialCompras, setHistorialCompras] = useState([]);
  const scannerRef = useRef(null);
  const [usuarioActual, setUsuarioActual] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUsuarioActual(user.email?.replace("@escuela.local", "") || "admin");
      }
    });
    return () => unsubscribe();
  }, []);

  const iniciarEscaneo = () => {
    setScanning(true);
    setMensaje("");
    setEstudiante(null);
    setPuntosAGastar("");
    setProducto("");

    setTimeout(() => {
      const element = document.getElementById("qr-reader-mercadito");
      if (!element) {
        setMensaje("Error al iniciar cámara");
        setScanning(false);
        return;
      }

      const scanner = new Html5QrcodeScanner(
        "qr-reader-mercadito",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        async (decodedText) => {
          scanner.clear();
          setScanning(false);

          let estudianteId = decodedText;
          if (decodedText.includes("estudianteId=")) {
            const params = new URLSearchParams(decodedText.split("?")[1]);
            estudianteId = params.get("estudianteId");
          }

          try {
            const estudianteRef = doc(db, "estudiantes", estudianteId);
            const estudianteDoc = await getDoc(estudianteRef);

            if (estudianteDoc.exists()) {
              setEstudiante({
                id: estudianteId,
                ...estudianteDoc.data()
              });
              setMensaje(`✅ ${estudianteDoc.data().nombre} - Puntos disponibles: ${estudianteDoc.data().puntos}`);
            } else {
              setMensaje("❌ Estudiante no encontrado");
            }
          } catch (error) {
            setMensaje("❌ Error al buscar estudiante");
          }
        },
        (error) => {
          console.error("Error:", error);
        }
      );

      scannerRef.current = scanner;
    }, 100);
  };

  const cancelarEscaneo = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
    setEstudiante(null);
    setMensaje("");
  };

  const registrarCompra = async () => {
    if (!estudiante) return;
    
    const puntos = parseInt(puntosAGastar);
    if (isNaN(puntos) || puntos <= 0) {
      setMensaje("❌ Ingresa una cantidad válida de puntos");
      return;
    }
    
    if (puntos > estudiante.puntos) {
      setMensaje(`❌ No tiene suficientes puntos. Tiene ${estudiante.puntos} puntos`);
      return;
    }

    if (!producto.trim()) {
      setMensaje("❌ Describe lo que está comprando");
      return;
    }

    try {
      // Restar puntos
      const estudianteRef = doc(db, "estudiantes", estudiante.id);
      await updateDoc(estudianteRef, {
        puntos: increment(-puntos)
      });

      // Guardar en historial de compras
      await addDoc(collection(db, "historial_compras"), {
        estudiante_id: estudiante.id,
        estudiante_nombre: estudiante.nombre,
        estudiante_apodo: estudiante.apodo || "",
        producto: producto,
        puntos_gastados: puntos,
        puntos_restantes: estudiante.puntos - puntos,
        usuario: usuarioActual,
        fecha: new Date(),
        timestamp: Date.now()
      });

      // Guardar en historial general también
      await addDoc(collection(db, "historial_puntos"), {
        estudiante_id: estudiante.id,
        estudiante_nombre: estudiante.nombre,
        estudiante_apodo: estudiante.apodo || "",
        estudiante_grado: estudiante.grado,
        cambio: -puntos,
        puntos_antes: estudiante.puntos,
        puntos_despues: estudiante.puntos - puntos,
        motivo: `🛒 Compró: ${producto}`,
        categoria: "mercadito",
        operacion: "restar",
        usuario: usuarioActual,
        fecha: new Date(),
        timestamp: Date.now()
      });

      // Registrar en historial local
      const nuevaCompra = {
        producto: producto,
        puntos: puntos,
        fecha: new Date()
      };
      setHistorialCompras([...historialCompras, nuevaCompra]);

      // Actualizar estudiante localmente
      setEstudiante({
        ...estudiante,
        puntos: estudiante.puntos - puntos
      });

      setMensaje(`✅ Compra registrada: -${puntos} puntos. Nuevo saldo: ${estudiante.puntos - puntos}`);
      setPuntosAGastar("");
      setProducto("");

    } catch (error) {
      setMensaje("❌ Error al registrar compra");
    }
  };

  const nuevaCompra = () => {
    setEstudiante(null);
    setPuntosAGastar("");
    setProducto("");
    setHistorialCompras([]);
    setMensaje("");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4" style={{ color: "#153462" }}>🛒 Mercadito - Punto de Canje</h2>

      {/* Paso 1: Escanear QR */}
      {!estudiante && !scanning && (
        <div className="rounded-xl p-4 mb-4 text-center" style={{ backgroundColor: "#F6F6C9" }}>
          <div className="text-6xl mb-3">🛍️</div>
          <p className="mb-4" style={{ color: "#4FA095" }}>
            Escanea el QR del estudiante para comenzar el canje
          </p>
          <button
            onClick={iniciarEscaneo}
            className="w-full py-3 rounded-lg font-semibold"
            style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}
          >
            📷 Escanear QR del Estudiante
          </button>
        </div>
      )}

      {/* Escaneo activo */}
      {scanning && (
        <div className="rounded-xl p-4" style={{ backgroundColor: "#F6F6C9" }}>
          <div id="qr-reader-mercadito" style={{ width: "100%", minHeight: "300px" }}></div>
          <button
            onClick={cancelarEscaneo}
            className="w-full mt-4 py-2 rounded-lg font-semibold"
            style={{ backgroundColor: "#BAD1C2", color: "#153462" }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Información del estudiante y compra */}
      {estudiante && !scanning && (
        <div>
          {/* Tarjeta del estudiante */}
          <div className="rounded-xl p-4 mb-4 text-center" style={{ backgroundColor: "#F6F6C9" }}>
            <div className="text-4xl mb-2">👧</div>
            <h3 className="text-xl font-bold" style={{ color: "#153462" }}>{estudiante.nombre}</h3>
            {estudiante.apodo && (
              <p className="text-sm" style={{ color: "#4FA095" }}>({estudiante.apodo})</p>
            )}
            <p className="text-sm mt-1" style={{ color: "#4FA095" }}>{estudiante.grado}</p>
            
            <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "#BAD1C2" }}>
              <span className="text-sm" style={{ color: "#153462" }}>Puntos disponibles:</span>
              <span className="text-3xl font-bold ml-2" style={{ color: "#153462" }}>{estudiante.puntos}</span>
            </div>
          </div>

          {/* Formulario de compra */}
          <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#F6F6C9" }}>
            <h3 className="font-semibold mb-3" style={{ color: "#153462" }}>Registrar Compra</h3>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>
                ¿Qué está comprando?
              </label>
              <input
                type="text"
                placeholder="Ej: Caramelo, Lápiz, Peluche..."
                className="w-full p-2 border rounded-lg"
                style={{ borderColor: "#BAD1C2" }}
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: "#153462" }}>
                Puntos a gastar
              </label>
              <div className="flex gap-2 flex-wrap mb-2">
                {[1, 2, 3, 5, 10, 20, 50].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPuntosAGastar(p.toString())}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{ backgroundColor: "#BAD1C2", color: "#153462" }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Otro valor..."
                className="w-full p-2 border rounded-lg"
                style={{ borderColor: "#BAD1C2" }}
                value={puntosAGastar}
                onChange={(e) => setPuntosAGastar(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={registrarCompra}
                className="flex-1 py-3 rounded-lg font-semibold"
                style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}
              >
                ✅ Registrar Compra
              </button>
              <button
                onClick={nuevaCompra}
                className="flex-1 py-3 rounded-lg font-semibold"
                style={{ backgroundColor: "#BAD1C2", color: "#153462" }}
              >
                🔄 Nueva Compra
              </button>
            </div>
          </div>

          {/* Mensaje */}
          {mensaje && (
            <div className="p-3 rounded-lg text-center mb-4" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>
              {mensaje}
            </div>
          )}

          {/* Historial de compras de esta sesión */}
          {historialCompras.length > 0 && (
            <div className="rounded-xl p-4" style={{ backgroundColor: "#F6F6C9" }}>
              <h3 className="font-semibold mb-2" style={{ color: "#153462" }}>📋 Compras de esta sesión</h3>
              {historialCompras.map((compra, index) => (
                <div key={index} className="flex justify-between items-center p-2 border-b" style={{ borderColor: "#BAD1C2" }}>
                  <span style={{ color: "#153462" }}>{compra.producto}</span>
                  <span style={{ color: "#4FA095" }}>-{compra.puntos} pts</span>
                </div>
              ))}
              <div className="mt-2 pt-2 text-right font-bold" style={{ color: "#153462" }}>
                Total gastado: {historialCompras.reduce((sum, c) => sum + c.puntos, 0)} puntos
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instrucciones */}
      {!estudiante && !scanning && (
        <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: "#F6F6C9" }}>
          <h3 className="font-semibold mb-2" style={{ color: "#153462" }}>📖 Instrucciones:</h3>
          <ol className="text-sm space-y-1" style={{ color: "#4FA095" }}>
            <li>1. Presiona "Escanear QR del Estudiante"</li>
            <li>2. Escanea el código QR del niño</li>
            <li>3. Confirma sus puntos disponibles</li>
            <li>4. Escribe lo que compró y los puntos a gastar</li>
            <li>5. Presiona "Registrar Compra"</li>
            <li>6. Si quiere comprar más, repite los pasos 4 y 5</li>
          </ol>
        </div>
      )}
    </div>
  );
}