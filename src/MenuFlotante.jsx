import { useState } from "react";

export default function MenuFlotante({ seccionActual, setSeccionActual, rol }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const opciones = {
    admin: [
      { id: "inicio", icono: "🏠", nombre: "Inicio" },
      { id: "estudiantes", icono: "🎓", nombre: "Estudiantes" },
      { id: "puntos", icono: "⭐", nombre: "Puntos" },
      { id: "escanear", icono: "📷", nombre: "Escanear" },
      { id: "reportes", icono: "📊", nombre: "Reportes" },
      { id: "mercadito", icono: "🛒", nombre: "Mercadito" },
      { id: "actividades", icono: "📅", nombre: "Actividades" },
      { id: "usuarios", icono: "👥", nombre: "Usuarios" },
      { id: "biblia", icono: "📖", nombre: "Biblia" }
    ],
    lider: [
      { id: "estudiantes", icono: "🎓", nombre: "Estudiantes" },
      { id: "puntos", icono: "⭐", nombre: "Puntos" },
      { id: "escanear", icono: "📷", nombre: "Escanear" },
      { id: "reportes", icono: "📊", nombre: "Reportes" },
      { id: "mercadito", icono: "🛒", nombre: "Mercadito" },
      { id: "actividades", icono: "📅", nombre: "Actividades" },
      { id: "usuarios", icono: "👥", nombre: "Usuarios" },
      { id: "biblia", icono: "📖", nombre: "Biblia" }
    ],
    maestro: [
      { id: "escanear", icono: "📷", nombre: "Escanear" },
      { id: "puntos", icono: "⭐", nombre: "Puntos" },
      { id: "actividades", icono: "📅", nombre: "Actividades" },
      { id: "biblia", icono: "📖", nombre: "Biblia" }
    ],
    padre: [
      { id: "actividades", icono: "📅", nombre: "Actividades" },
      { id: "biblia", icono: "📖", nombre: "Biblia" }
    ]
  };

  const opcionesRol = opciones[rol] || opciones.padre;

  const toggleMenu = () => setMenuAbierto(!menuAbierto);
  const seleccionarOpcion = (id) => { setSeccionActual(id); setMenuAbierto(false); };

  return (
    <>
      <button onClick={toggleMenu} style={{ position: "fixed", bottom: "20px", right: "20px", width: "56px", height: "56px", borderRadius: "28px", backgroundColor: "#4FA095", color: "#F6F6C9", border: "none", fontSize: "24px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000 }}>
        {menuAbierto ? "✕" : "☰"}
      </button>

      {menuAbierto && (
        <div style={{ position: "fixed", bottom: "85px", right: "20px", zIndex: 999 }}>
          {opcionesRol.map((opcion, index) => (
            <button key={opcion.id} onClick={() => seleccionarOpcion(opcion.id)} style={{ display: "flex", alignItems: "center", gap: "12px", width: "160px", padding: "12px 16px", marginBottom: "8px", backgroundColor: "#ffffff", border: "1px solid #BAD1C2", borderRadius: "30px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", animation: `fadeInUp 0.2s ease-out ${index * 0.03}s both` }}>
              <span style={{ fontSize: "20px" }}>{opcion.icono}</span>
              <span style={{ fontSize: "14px", fontWeight: "500", color: "#153462" }}>{opcion.nombre}</span>
              {seccionActual === opcion.id && <span style={{ marginLeft: "auto", color: "#4FA095" }}>✓</span>}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}