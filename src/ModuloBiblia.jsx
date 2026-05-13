import { useState, useEffect } from "react";

// Lista completa de libros de la Biblia en español
const librosBiblia = [
  "Génesis", "Éxodo", "Levítico", "Números", "Deuteronomio",
  "Josué", "Jueces", "Rut", "1 Samuel", "2 Samuel",
  "1 Reyes", "2 Reyes", "1 Crónicas", "2 Crónicas", "Esdras",
  "Nehemías", "Ester", "Job", "Salmos", "Proverbios",
  "Eclesiastés", "Cantares", "Isaías", "Jeremías", "Lamentaciones",
  "Ezequiel", "Daniel", "Oseas", "Joel", "Amós",
  "Abdías", "Jonás", "Miqueas", "Nahúm", "Habacuc",
  "Sofonías", "Hageo", "Zacarías", "Malaquías",
  "Mateo", "Marcos", "Lucas", "Juan", "Hechos",
  "Romanos", "1 Corintios", "2 Corintios", "Gálatas", "Efesios",
  "Filipenses", "Colosenses", "1 Tesalonicenses", "2 Tesalonicenses",
  "1 Timoteo", "2 Timoteo", "Tito", "Filemón", "Hebreos",
  "Santiago", "1 Pedro", "2 Pedro", "1 Juan", "2 Juan",
  "3 Juan", "Judas", "Apocalipsis"
];

// Mapeo correcto para la API (formato inglés)
const mapeoAPI = {
  "Génesis": "gen", "Éxodo": "exo", "Levítico": "lev", "Números": "num", "Deuteronomio": "deu",
  "Josué": "jos", "Jueces": "jdg", "Rut": "rut", "1 Samuel": "1sa", "2 Samuel": "2sa",
  "1 Reyes": "1ki", "2 Reyes": "2ki", "1 Crónicas": "1ch", "2 Crónicas": "2ch",
  "Esdras": "ezr", "Nehemías": "neh", "Ester": "est", "Job": "job", "Salmos": "psa",
  "Proverbios": "pro", "Eclesiastés": "ecc", "Cantares": "sng", "Isaías": "isa",
  "Jeremías": "jer", "Lamentaciones": "lam", "Ezequiel": "ezk", "Daniel": "dan",
  "Oseas": "hos", "Joel": "joe", "Amós": "amo", "Abdías": "oba", "Jonás": "jon",
  "Miqueas": "mic", "Nahúm": "nam", "Habacuc": "hab", "Sofonías": "zep",
  "Hageo": "hag", "Zacarías": "zec", "Malaquías": "mal",
  "Mateo": "mat", "Marcos": "mar", "Lucas": "luk", "Juan": "joh", "Hechos": "act",
  "Romanos": "rom", "1 Corintios": "1co", "2 Corintios": "2co", "Gálatas": "gal",
  "Efesios": "eph", "Filipenses": "php", "Colosenses": "col", "1 Tesalonicenses": "1th",
  "2 Tesalonicenses": "2th", "1 Timoteo": "1ti", "2 Timoteo": "2ti", "Tito": "tit",
  "Filemón": "phm", "Hebreos": "heb", "Santiago": "jas", "1 Pedro": "1pe", "2 Pedro": "2pe",
  "1 Juan": "1jn", "2 Juan": "2jn", "3 Juan": "3jn", "Judas": "jud", "Apocalipsis": "rev"
};

export default function ModuloBiblia() {
  const [libroSeleccionado, setLibroSeleccionado] = useState("");
  const [capitulo, setCapitulo] = useState(1);
  const [versiculos, setVersiculos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [modo, setModo] = useState("libro");
  const [libroBusqueda, setLibroBusqueda] = useState("");
  const [capituloBusqueda, setCapituloBusqueda] = useState("");
  const [versiculoBusqueda, setVersiculoBusqueda] = useState("");
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);

  useEffect(() => {
    if (libroSeleccionado && capitulo) {
      cargarCapitulo();
    }
  }, [libroSeleccionado, capitulo]);

  const cargarCapitulo = async () => {
    setCargando(true);
    setError("");
    const libroCode = mapeoAPI[libroSeleccionado];
    if (!libroCode) {
      setError("Libro no disponible");
      setCargando(false);
      return;
    }
    
    try {
      // Usar API alternativa de bíblia
      const response = await fetch(
        `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/rv1960/books/${libroCode}/${capitulo}.json`
      );
      if (!response.ok) throw new Error("Error al cargar");
      const data = await response.json();
      
      // Convertir datos al formato esperado
      const versos = data.verses.map((v, idx) => ({
        verse: idx + 1,
        text: v
      }));
      setVersiculos(versos);
    } catch (err) {
      setError("Error al cargar el capítulo. Intenta de nuevo.");
      setVersiculos([]);
    } finally {
      setCargando(false);
    }
  };

  const buscarVersiculo = async () => {
    if (!libroBusqueda) {
      setError("Selecciona un libro");
      return;
    }
    
    const libroCode = mapeoAPI[libroBusqueda];
    if (!libroCode) {
      setError("Libro no disponible");
      return;
    }
    
    setCargando(true);
    setError("");
    
    try {
      let url = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/rv1960/books/${libroCode}/`;
      if (capituloBusqueda) {
        url += `${capituloBusqueda}.json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("No encontrado");
        const data = await response.json();
        
        if (versiculoBusqueda) {
          const versoIndex = parseInt(versiculoBusqueda) - 1;
          if (data.verses[versoIndex]) {
            setResultadoBusqueda({
              reference: `${libroBusqueda} ${capituloBusqueda}:${versiculoBusqueda}`,
              verses: [{ verse: versiculoBusqueda, text: data.verses[versoIndex] }]
            });
          } else {
            setError("Versículo no encontrado");
          }
        } else {
          const versos = data.verses.map((v, idx) => ({
            verse: idx + 1,
            text: v
          }));
          setResultadoBusqueda({
            reference: `${libroBusqueda} ${capituloBusqueda}`,
            verses: versos
          });
        }
      } else {
        setError("Ingresa un capítulo");
      }
    } catch (err) {
      setError("No se encontró el versículo");
      setResultadoBusqueda(null);
    } finally {
      setCargando(false);
    }
  };

  const cambiarLibro = (libro) => {
    setLibroSeleccionado(libro);
    setCapitulo(1);
  };

  const cambiarCapitulo = (incremento) => {
    const nuevoCapitulo = capitulo + incremento;
    if (nuevoCapitulo >= 1 && nuevoCapitulo <= 150) {
      setCapitulo(nuevoCapitulo);
    }
  };

  return (
    <div>
      <div style={{ backgroundColor: "#F6F6C9", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid #BAD1C2" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "600", color: "#153462", marginBottom: "8px" }}>📖 Santa Biblia</h1>
        <p style={{ color: "#4FA095", fontSize: "14px" }}>Reina Valera 1960 - Palabra de Dios</p>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setModo("libro")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            fontWeight: "600",
            cursor: "pointer",
            backgroundColor: modo === "libro" ? "#4FA095" : "#F6F6C9",
            color: modo === "libro" ? "#F6F6C9" : "#153462",
            border: "1px solid #BAD1C2"
          }}
        >
          📖 Leer por Capítulo
        </button>
        <button
          onClick={() => setModo("busqueda")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            fontWeight: "600",
            cursor: "pointer",
            backgroundColor: modo === "busqueda" ? "#4FA095" : "#F6F6C9",
            color: modo === "busqueda" ? "#F6F6C9" : "#153462",
            border: "1px solid #BAD1C2"
          }}
        >
          🔍 Buscar Versículo
        </button>
      </div>

      {modo === "libro" && (
        <>
          <div style={{ backgroundColor: "#F6F6C9", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid #BAD1C2" }}>
            <label style={{ display: "block", color: "#153462", fontWeight: "500", marginBottom: "10px" }}>Seleccionar Libro</label>
            <select
              value={libroSeleccionado}
              onChange={(e) => cambiarLibro(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #BAD1C2",
                backgroundColor: "#ffffff",
                fontSize: "14px",
                outline: "none"
              }}
            >
              <option value="">-- Selecciona un libro --</option>
              {librosBiblia.map((libro) => (
                <option key={libro} value={libro}>{libro}</option>
              ))}
            </select>
          </div>

          {libroSeleccionado && (
            <div style={{ backgroundColor: "#F6F6C9", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid #BAD1C2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  onClick={() => cambiarCapitulo(-1)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#4FA095",
                    color: "#F6F6C9",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  ◀ {capitulo - 1 > 0 ? `Cap ${capitulo - 1}` : ""}
                </button>
                <span style={{ fontSize: "18px", fontWeight: "bold", color: "#153462" }}>Capítulo {capitulo}</span>
                <button
                  onClick={() => cambiarCapitulo(1)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#4FA095",
                    color: "#F6F6C9",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  {`Cap ${capitulo + 1} ▶`}
                </button>
              </div>
            </div>
          )}

          {libroSeleccionado && (
            <div style={{ backgroundColor: "#F6F6C9", borderRadius: "20px", padding: "20px", border: "1px solid #BAD1C2" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#153462", marginBottom: "16px", textAlign: "center" }}>
                {libroSeleccionado} {capitulo}
              </h2>
              {cargando ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#4FA095" }}>Cargando...</div>
              ) : error ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#c44c3c" }}>{error}</div>
              ) : versiculos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#4FA095" }}>Selecciona un libro y capítulo</div>
              ) : (
                <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                  {versiculos.map((verso, idx) => (
                    <div key={idx} style={{ marginBottom: "16px", padding: "8px", borderLeft: "3px solid #4FA095" }}>
                      <span style={{ fontWeight: "bold", color: "#4FA095", marginRight: "10px" }}>{verso.verse}.</span>
                      <span style={{ color: "#4a4a4a", lineHeight: "1.6" }}>{verso.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {modo === "busqueda" && (
        <>
          <div style={{ backgroundColor: "#F6F6C9", borderRadius: "20px", padding: "20px", marginBottom: "20px", border: "1px solid #BAD1C2" }}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#153462", fontWeight: "500", marginBottom: "8px" }}>Libro</label>
              <select
                value={libroBusqueda}
                onChange={(e) => setLibroBusqueda(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #BAD1C2",
                  backgroundColor: "#ffffff",
                  fontSize: "14px",
                  outline: "none"
                }}
              >
                <option value="">-- Selecciona un libro --</option>
                {librosBiblia.map((libro) => (
                  <option key={libro} value={libro}>{libro}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", color: "#153462", fontWeight: "500", marginBottom: "8px" }}>Capítulo</label>
                <input
                  type="number"
                  placeholder="Ej: 1"
                  value={capituloBusqueda}
                  onChange={(e) => setCapituloBusqueda(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #BAD1C2",
                    backgroundColor: "#ffffff",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#153462", fontWeight: "500", marginBottom: "8px" }}>Versículo (opcional)</label>
                <input
                  type="number"
                  placeholder="Ej: 16"
                  value={versiculoBusqueda}
                  onChange={(e) => setVersiculoBusqueda(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #BAD1C2",
                    backgroundColor: "#ffffff",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <button
              onClick={buscarVersiculo}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "#4FA095",
                color: "#F6F6C9",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "15px"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#153462"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#4FA095"}
            >
              🔍 Buscar
            </button>
          </div>

          {cargando && <div style={{ textAlign: "center", padding: "40px", color: "#4FA095" }}>Buscando...</div>}
          {error && !cargando && (
            <div style={{ backgroundColor: "#F6F6C9", borderRadius: "20px", padding: "20px", textAlign: "center", color: "#c44c3c", border: "1px solid #BAD1C2" }}>
              {error}
            </div>
          )}
          {resultadoBusqueda && !cargando && (
            <div style={{ backgroundColor: "#F6F6C9", borderRadius: "20px", padding: "20px", border: "1px solid #BAD1C2" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#153462", marginBottom: "16px", textAlign: "center" }}>
                {resultadoBusqueda.reference}
              </h2>
              {resultadoBusqueda.verses.map((verso, idx) => (
                <div key={idx} style={{ marginBottom: "16px", padding: "8px", borderLeft: "3px solid #4FA095" }}>
                  <span style={{ fontWeight: "bold", color: "#4FA095", marginRight: "10px" }}>{verso.verse}.</span>
                  <span style={{ color: "#4a4a4a", lineHeight: "1.6" }}>{verso.text}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}