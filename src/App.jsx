import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import Login from "./Login";
import GestionEstudiantes from "./GestionEstudiantes";
import EscanearQR from "./EscanearQR";
import AsignarPuntos from "./AsignarPuntos";
import ReportesHistorial from "./ReportesHistorial";
import Mercadito from "./Mercadito";
import PerfilLider from "./PerfilLider";
import GestionUsuarios from "./GestionUsuarios";
import GestionUsuariosLider from "./GestionUsuariosLider";
import ModuloBiblia from "./ModuloBiblia";
import GestionActividades from "./GestionActividades";
import MenuFlotante from "./MenuFlotante";

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [seccionActual, setSeccionActual] = useState("inicio");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDoc = await getDoc(doc(db, "usuarios", firebaseUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            setUserData({ rol: "usuario", nombre_real: "Usuario" });
          }
        } catch (error) {
          setUserData({ rol: "usuario", nombre_real: "Usuario" });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    setMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#4FA095" }}>
        <div style={{ color: "#F6F6C9" }}>Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const username = user.email?.replace("@ebd.local", "") || "usuario";
  const rol = userData?.rol || "usuario";
  const esAdmin = rol === "admin";
  const esLider = rol === "lider";
  const esMaestro = rol === "maestro";

  const cardsAdmin = [
    { id: "estudiantes", icon: "🎓", title: "Estudiantes", desc: "Gestionar niños y sus puntos" },
    { id: "puntos", icon: "⭐", title: "Asignar Puntos", desc: "Dar o quitar puntos" },
    { id: "escanear", icon: "📷", title: "Escanear QR", desc: "Registrar asistencia" },
    { id: "reportes", icon: "📊", title: "Reportes", desc: "Historial y estadísticas" },
    { id: "mercadito", icon: "🛒", title: "Mercadito", desc: "Canje de puntos" },
    { id: "actividades", icon: "📅", title: "Actividades", desc: "Planificar clases" },
    { id: "usuarios", icon: "👥", title: "Usuarios", desc: "Gestionar líderes y maestros" },
    { id: "biblia", icon: "📖", title: "Santa Biblia", desc: "Leer la Palabra de Dios" },
  ];

  const cardsLider = [
    { id: "estudiantes", icon: "🎓", title: "Estudiantes", desc: "Gestionar niños y sus puntos" },
    { id: "puntos", icon: "⭐", title: "Asignar Puntos", desc: "Dar o quitar puntos" },
    { id: "escanear", icon: "📷", title: "Escanear QR", desc: "Registrar asistencia" },
    { id: "reportes", icon: "📊", title: "Reportes", desc: "Historial y estadísticas" },
    { id: "mercadito", icon: "🛒", title: "Mercadito", desc: "Canje de puntos" },
    { id: "actividades", icon: "📅", title: "Actividades", desc: "Planificar clases" },
    { id: "usuarios", icon: "👥", title: "Usuarios", desc: "Ver lista de usuarios" },
    { id: "biblia", icon: "📖", title: "Santa Biblia", desc: "Leer la Palabra de Dios" },
  ];

  const renderSeccion = () => {
    // VISTA ADMIN
    if (esAdmin) {
      switch (seccionActual) {
        case "estudiantes": return <GestionEstudiantes />;
        case "escanear": return <EscanearQR />;
        case "puntos": return <AsignarPuntos />;
        case "reportes": return <ReportesHistorial />;
        case "mercadito": return <Mercadito />;
        case "actividades": return <GestionActividades userData={userData} soloLectura={false} />;
        case "usuarios": return <GestionUsuarios />;
        case "biblia": return <ModuloBiblia />;
        default:
          return (
            <>
              <div className="rounded-xl shadow-md p-5" style={{ backgroundColor: "#F6F6C9" }}>
                <h1 className="text-xl font-bold mb-2" style={{ color: "#153462" }}>¡Bienvenido, {userData?.nombre_real || username}! 👋</h1>
                <p style={{ color: "#4FA095" }}>Panel de Administrador - Gestión completa del sistema.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 mt-4">
                {cardsAdmin.map((card) => (
                  <div key={card.id} onClick={() => setSeccionActual(card.id)} className="rounded-xl p-4 flex items-center space-x-3 cursor-pointer" style={{ backgroundColor: "#F6F6C9", borderLeft: `4px solid #4FA095` }}>
                    <div className="text-3xl">{card.icon}</div><div><h3 className="font-semibold" style={{ color: "#153462" }}>{card.title}</h3><p className="text-xs" style={{ color: "#4FA095" }}>{card.desc}</p></div>
                  </div>
                ))}
              </div>
            </>
          );
      }
    }

    // VISTA LÍDER
    if (esLider) {
      switch (seccionActual) {
        case "estudiantes": return <PerfilLider userData={userData} />;
        case "escanear": return <EscanearQR />;
        case "puntos": return <AsignarPuntos />;
        case "reportes": return <ReportesHistorial />;
        case "mercadito": return <Mercadito />;
        case "actividades": return <GestionActividades userData={userData} soloLectura={false} />;
        case "usuarios": return <GestionUsuariosLider />;
        case "biblia": return <ModuloBiblia />;
        default:
          return (
            <>
              <div className="rounded-xl shadow-md p-5" style={{ backgroundColor: "#F6F6C9" }}>
                <h1 className="text-xl font-bold mb-2" style={{ color: "#153462" }}>¡Bienvenido, {userData?.nombre_real || username}! 👋</h1>
                <p style={{ color: "#4FA095" }}>Panel de Líder - Gestión completa del sistema.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 mt-4">
                {cardsLider.map((card) => (
                  <div key={card.id} onClick={() => setSeccionActual(card.id)} className="rounded-xl p-4 flex items-center space-x-3 cursor-pointer" style={{ backgroundColor: "#F6F6C9", borderLeft: `4px solid #4FA095` }}>
                    <div className="text-3xl">{card.icon}</div><div><h3 className="font-semibold" style={{ color: "#153462" }}>{card.title}</h3><p className="text-xs" style={{ color: "#4FA095" }}>{card.desc}</p></div>
                  </div>
                ))}
              </div>
            </>
          );
      }
    }

    // VISTA MAESTRO
    if (esMaestro) {
      switch (seccionActual) {
        case "escanear": return <EscanearQR />;
        case "puntos": return <AsignarPuntos />;
        case "actividades": return <GestionActividades userData={userData} soloLectura={true} />;
        case "biblia": return <ModuloBiblia />;
        default:
          return (
            <>
              <div className="rounded-xl shadow-md p-5" style={{ backgroundColor: "#F6F6C9" }}>
                <h1 className="text-xl font-bold mb-2" style={{ color: "#153462" }}>¡Bienvenido, {userData?.nombre_real || username}! 👋</h1>
                <p style={{ color: "#4FA095" }}>Panel de Maestro - Asistencia y puntos.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div onClick={() => setSeccionActual("escanear")} className="rounded-xl p-4 flex items-center space-x-3 cursor-pointer" style={{ backgroundColor: "#F6F6C9", borderLeft: `4px solid #4FA095` }}>
                  <div className="text-3xl">📷</div><div><h3 className="font-semibold" style={{ color: "#153462" }}>Escanear QR</h3><p className="text-xs" style={{ color: "#4FA095" }}>Registrar asistencia</p></div>
                </div>
                <div onClick={() => setSeccionActual("puntos")} className="rounded-xl p-4 flex items-center space-x-3 cursor-pointer" style={{ backgroundColor: "#F6F6C9", borderLeft: `4px solid #4FA095` }}>
                  <div className="text-3xl">⭐</div><div><h3 className="font-semibold" style={{ color: "#153462" }}>Asignar Puntos</h3><p className="text-xs" style={{ color: "#4FA095" }}>Dar puntos a estudiantes</p></div>
                </div>
                <div onClick={() => setSeccionActual("actividades")} className="rounded-xl p-4 flex items-center space-x-3 cursor-pointer" style={{ backgroundColor: "#F6F6C9", borderLeft: `4px solid #4FA095` }}>
                  <div className="text-3xl">📅</div><div><h3 className="font-semibold" style={{ color: "#153462" }}>Actividades</h3><p className="text-xs" style={{ color: "#4FA095" }}>Ver planificación de clases</p></div>
                </div>
                <div onClick={() => setSeccionActual("biblia")} className="rounded-xl p-4 flex items-center space-x-3 cursor-pointer" style={{ backgroundColor: "#F6F6C9", borderLeft: `4px solid #4FA095` }}>
                  <div className="text-3xl">📖</div><div><h3 className="font-semibold" style={{ color: "#153462" }}>Santa Biblia</h3><p className="text-xs" style={{ color: "#4FA095" }}>Leer la Palabra de Dios</p></div>
                </div>
              </div>
            </>
          );
      }
    }

    // VISTA PADRE
    return (
      <div className="rounded-xl p-5 text-center" style={{ backgroundColor: "#F6F6C9" }}>
        <div className="text-5xl mb-3">👪</div>
        <h2 className="text-xl font-bold" style={{ color: "#153462" }}>Panel de Padres</h2>
        <p className="mt-2" style={{ color: "#4FA095" }}>Próximamente: Podrás ver el saldo de puntos de tus hijos</p>
        <button onClick={() => setSeccionActual("actividades")} className="mt-4 px-6 py-2 rounded-lg" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>📅 Ver Actividades</button>
        <button onClick={() => setSeccionActual("biblia")} className="mt-2 px-6 py-2 rounded-lg" style={{ backgroundColor: "#BAD1C2", color: "#153462" }}>📖 Leer la Biblia</button>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#BAD1C2" }}>
      <nav className="sticky top-0 z-50 shadow-md" style={{ backgroundColor: "#153462" }}>
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📖</span>
            <span className="font-bold text-lg" style={{ color: "#F6F6C9" }}>Escuela Bíblica</span>
            {esAdmin && <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>Admin</span>}
            {esLider && <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>Líder</span>}
            {esMaestro && <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>Maestro</span>}
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg" style={{ backgroundColor: "#4FA095" }}>
            <svg className="w-6 h-6" style={{ color: "#F6F6C9" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="py-3 px-4" style={{ backgroundColor: "#153462", borderTop: `1px solid #4FA095` }}>
            <div className="mb-3 pb-3 border-b" style={{ borderBottomColor: "#4FA095" }}>
              <p className="font-medium" style={{ color: "#F6F6C9" }}>{userData?.nombre_real || username}</p>
              <p className="text-xs capitalize mt-1" style={{ color: "#BAD1C2" }}>{rol}</p>
            </div>
            <button onClick={handleLogout} className="w-full py-2 rounded-lg text-center text-sm" style={{ backgroundColor: "#4FA095", color: "#F6F6C9" }}>Cerrar Sesión</button>
          </div>
        )}
      </nav>

      <main className="px-4 py-4">
        {renderSeccion()}
      </main>

      <MenuFlotante seccionActual={seccionActual} setSeccionActual={setSeccionActual} rol={rol} />
    </div>
  );
}

export default App;