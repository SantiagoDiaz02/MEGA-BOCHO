let bancoPreguntas = {};
let preguntasUsadas = new Set();

let configVersus = { categorias: [], dificultades: [], preguntasPorDif: 2, totalJugadores: 2 };
let jugadores = [];
let jugadorActualIdx = 0;
let categoriaRondaActual = null;

// Progreso de dificultad independiente por categoría (índice sobre el array filtrado de dificultades)
let progresoDificultadCategoria = {};

let anguloActual = 0;
let enGiro = false;

const todasLasDificultades = ["muy_facil", "facil", "intermedia", "dificil", "muy_dificil"];
const puntosPorDif = { muy_facil: 100, facil: 150, intermedia: 200, dificil: 250, muy_dificil: 300 };
const coloresRuleta = ["#a044ff", "#00e5ff", "#ff007f", "#ffb703", "#10b981", "#8b5cf6", "#ec4899"];

document.addEventListener("DOMContentLoaded", () => {
  fetch("preguntas.json")
    .then(res => res.json())
    .then(data => {
      bancoPreguntas = data;
      cargarCardsCategorias();
      cargarCardsDificultades();
      generarCamposJugadores();
    })
    .catch(err => console.error("Error al cargar preguntas.json:", err));
});

function cargarCardsCategorias() {
  const contenedor = document.getElementById("check-categorias");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  Object.keys(bancoPreguntas).forEach(cat => {
    const card = document.createElement("div");
    card.className = "category-card selected";
    card.innerHTML = `
      <input type="checkbox" value="${cat}" checked>
      <span>${cat}</span>
    `;

    card.addEventListener("click", () => {
      const cb = card.querySelector("input");
      cb.checked = !cb.checked;
      card.classList.toggle("selected", cb.checked);
    });

    contenedor.appendChild(card);
  });
}

function cargarCardsDificultades() {
  const contenedor = document.getElementById("check-dificultades");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  todasLasDificultades.forEach(dif => {
    const card = document.createElement("div");
    card.className = "difficulty-card selected";
    card.innerHTML = `
      <input type="checkbox" value="${dif}" checked>
      <span>${dif.replace('_', ' ').toUpperCase()}</span>
    `;

    card.addEventListener("click", () => {
      const cb = card.querySelector("input");
      cb.checked = !cb.checked;
      card.classList.toggle("selected", cb.checked);
    });

    contenedor.appendChild(card);
  });
}

function modificarNumero(idInput, cambio, min, max, actualizarJugadores = false) {
  const input = document.getElementById(idInput);
  let valor = parseInt(input.value) || min;
  valor += cambio;

  if (valor >= min && valor <= max) {
    input.value = valor;
    if (actualizarJugadores) generarCamposJugadores();
  }
}

function generarCamposJugadores() {
  const num = parseInt(document.getElementById("num-jugadores").value) || 2;
  const contenedor = document.getElementById("contenedor-jugadores");
  contenedor.innerHTML = "";

  for (let i = 1; i <= num; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.id = `input-jugador-${i}`;
    input.placeholder = `Jugador ${i}`;
    input.value = `Jugador ${i}`;
    contenedor.appendChild(input);
  }
}

function iniciarModoVersus() {
  const cbCats = document.querySelectorAll("#check-categorias input:checked");
  const catsElegidas = Array.from(cbCats).map(cb => cb.value);

  const cbDifs = document.querySelectorAll("#check-dificultades input:checked");
  const difsElegidas = Array.from(cbDifs).map(cb => cb.value);

  if (catsElegidas.length === 0) {
    alert("Seleccioná al menos una categoría");
    return;
  }

  if (difsElegidas.length === 0) {
    alert("Seleccioná al menos un nivel de dificultad");
    return;
  }

  preguntasUsadas.clear();

  configVersus.categorias = catsElegidas;
  // Mantener el orden relativo estándar (muy_facil -> muy_dificil) para las dificultades elegidas
  configVersus.dificultades = todasLasDificultades.filter(d => difsElegidas.includes(d));
  configVersus.totalJugadores = parseInt(document.getElementById("num-jugadores").value) || 2;

  // Inicializar cada categoría en la primera dificultad elegida (índice 0)
  progresoDificultadCategoria = {};
  catsElegidas.forEach(cat => {
    progresoDificultadCategoria[cat] = 0;
  });

  jugadores = [];
  for (let i = 1; i <= configVersus.totalJugadores; i++) {
    const nombreInput = document.getElementById(`input-jugador-${i}`).value.trim();
    jugadores.push({
      nombre: nombreInput !== "" ? nombreInput : `Jugador ${i}`,
      puntos: 0
    });
  }

  jugadorActualIdx = 0;
  categoriaRondaActual = null;

  dibujarRuleta();

  document.getElementById("sec-config-versus").classList.add("hidden");
  document.getElementById("sec-juego").classList.remove("hidden");

  actualizarScoreboardVersus("¡Girá para la tanda!");
}

function dibujarRuleta() {
  const canvas = document.getElementById("canvas-ruleta");
  const ctx = canvas.getContext("2d");
  const cant = configVersus.categorias.length;
  const anguloPaso = (2 * Math.PI) / cant;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  configVersus.categorias.forEach((cat, i) => {
    const anguloInicio = i * anguloPaso;
    const anguloFin = anguloInicio + anguloPaso;

    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 150, anguloInicio, anguloFin);
    ctx.fillStyle = coloresRuleta[i % coloresRuleta.length];
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#25076b";
    ctx.stroke();

    ctx.save();
    ctx.translate(150, 150);
    ctx.rotate(anguloInicio + anguloPaso / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Montserrat";
    ctx.fillText(cat, 130, 5);
    ctx.restore();
  });
}

function girarRuleta() {
  if (enGiro) return;
  enGiro = true;

  const btnGirar = document.getElementById("btn-girar");
  btnGirar.disabled = true;
  document.getElementById("card-pregunta").classList.add("hidden");

  const girosExtra = 5 + Math.floor(Math.random() * 5);
  const anguloGrados = Math.floor(Math.random() * 360);
  anguloActual += girosExtra * 360 + anguloGrados;

  const canvas = document.getElementById("canvas-ruleta");
  canvas.style.transform = `rotate(${anguloActual}deg)`;

  setTimeout(() => {
    const cantCategorias = configVersus.categorias.length;
    const gradosPorSector = 360 / cantCategorias;

    let anguloEfectivo = (anguloActual + 90) % 360;
    let anguloNormalizado = (360 - anguloEfectivo) % 360;

    const indiceGanador = Math.floor(anguloNormalizado / gradosPorSector);

    categoriaRondaActual = configVersus.categorias[indiceGanador];

    obtenerPreguntaYMostrar();
    enGiro = false;
  }, 3500);
}

function obtenerPreguntaYMostrar() {
  let idxDif = progresoDificultadCategoria[categoriaRondaActual];
  const difsSeleccionadas = configVersus.dificultades;

  if (idxDif >= difsSeleccionadas.length) {
    verificarQuedanPreguntasOFinalizar();
    return;
  }

  let difActual = difsSeleccionadas[idxDif];
  let pool = (bancoPreguntas[categoriaRondaActual] && bancoPreguntas[categoriaRondaActual][difActual]) || [];
  let disponibles = pool.filter(p => !preguntasUsadas.has(p.id));

  // Buscar en los siguientes niveles tildados si no quedan en el actual
  while (disponibles.length === 0 && idxDif < difsSeleccionadas.length - 1) {
    idxDif++;
    progresoDificultadCategoria[categoriaRondaActual] = idxDif;
    difActual = difsSeleccionadas[idxDif];
    pool = (bancoPreguntas[categoriaRondaActual] && bancoPreguntas[categoriaRondaActual][difActual]) || [];
    disponibles = pool.filter(p => !preguntasUsadas.has(p.id));
  }

  if (disponibles.length > 0) {
    const elegida = disponibles[Math.floor(Math.random() * disponibles.length)];
    const preguntaSeleccionada = {
      ...elegida,
      categoria: categoriaRondaActual,
      dificultadNombre: difActual,
      pts: puntosPorDif[difActual]
    };

    document.getElementById("contenedor-ruleta").classList.add("hidden");
    mostrarPreguntaUI(preguntaSeleccionada, difActual.replace('_', ' '));
  } else {
    verificarQuedanPreguntasOFinalizar();
  }
}

function verificarQuedanPreguntasOFinalizar() {
  let quedanPreguntasTotales = false;
  const difsSeleccionadas = configVersus.dificultades;

  for (let cat of configVersus.categorias) {
    let idx = progresoDificultadCategoria[cat];
    while (idx < difsSeleccionadas.length) {
      let dif = difsSeleccionadas[idx];
      let pool = (bancoPreguntas[cat] && bancoPreguntas[cat][dif]) || [];
      if (pool.some(p => !preguntasUsadas.has(p.id))) {
        quedanPreguntasTotales = true;
        break;
      }
      idx++;
    }
    if (quedanPreguntasTotales) break;
  }

  if (quedanPreguntasTotales) {
    actualizarScoreboardVersus(`¡${categoriaRondaActual} completada! Volvé a girar.`);
    document.getElementById("btn-girar").disabled = false;
  } else {
    mostrarResultadosVersus();
  }
}

function mostrarPreguntaUI(p, nombreDificultad) {
  preguntasUsadas.add(p.id);

  document.getElementById("badge-categoria").innerText = p.categoria;
  document.getElementById("badge-dificultad").innerText = `${nombreDificultad.toUpperCase()} - ${p.pts} pts`;
  document.getElementById("txt-pregunta").innerText = p.q;

  const gridOps = document.getElementById("grid-opciones");
  gridOps.innerHTML = "";

  p.ops.forEach((op, index) => {
    const btn = document.createElement("button");
    btn.className = "btn-opcion";
    btn.innerText = op;
    btn.onclick = () => responder(index, p.c, p.pts);
    gridOps.appendChild(btn);
  });

  document.getElementById("card-pregunta").classList.remove("hidden");
  actualizarScoreboardVersus(`Tanda: ${categoriaRondaActual}`);
}

function responder(idxSeleccionado, idxCorrecto, pts) {
  const botones = document.querySelectorAll(".btn-opcion");
  botones.forEach(btn => btn.disabled = true);

  const esCorrecta = idxSeleccionado === idxCorrecto;
  const jActual = jugadores[jugadorActualIdx];

  if (esCorrecta) {
    jActual.puntos += pts;
  }

  botones.forEach((btn, index) => {
    if (index === idxCorrecto) {
      btn.classList.add("correcta");
    } else if (index === idxSeleccionado && !esCorrecta) {
      btn.classList.add("incorrecta");
    } else {
      btn.classList.add("atenuada");
    }
  });

  setTimeout(() => {
    jugadorActualIdx++;

    if (jugadorActualIdx >= jugadores.length) {
      jugadorActualIdx = 0;

      // Avanzar al siguiente nivel tildado en la configuración
      progresoDificultadCategoria[categoriaRondaActual]++;

      categoriaRondaActual = null;

      document.getElementById("card-pregunta").classList.add("hidden");
      document.getElementById("contenedor-ruleta").classList.remove("hidden");
      document.getElementById("btn-girar").disabled = false;

      actualizarScoreboardVersus("¡Nueva tanda! Girá la ruleta");
    } else {
      obtenerPreguntaYMostrar();
    }
  }, 2000);
}

function actualizarScoreboardVersus(estadoTexto = "") {
  const jActual = jugadores[jugadorActualIdx];

  document.getElementById("txt-jugador").innerText = jActual.nombre;
  document.getElementById("txt-puntos").innerText = `${jActual.puntos} pts`;
  document.getElementById("txt-progreso").innerText = estadoTexto || "En juego";
}

function mostrarResultadosVersus() {
  let mensaje = "🏆 ¡PARTIDA FINALIZADA! 🏆\n\nResultados:\n";
  const ranking = [...jugadores].sort((a, b) => b.puntos - a.puntos);
  ranking.forEach((j, index) => {
    mensaje += `${index + 1}. ${j.nombre}: ${j.puntos} pts\n`;
  });
  alert(mensaje);
  location.reload();
}
