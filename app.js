let bancoPreguntas = {};
let preguntasUsadas = new Set();

let configVersus = { categorias: [], preguntasPorDif: 2, totalJugadores: 2 };
let jugadores = [];
let jugadorActualIdx = 0;
let categoriaActualIdx = 0;
let colaPreguntasVersus = [];

let anguloActual = 0;
let enGiro = false;
let preguntaActualObj = null;

const coloresRuleta = ["#a044ff", "#00e5ff", "#ff007f", "#ffb703", "#10b981", "#8b5cf6", "#ec4899"];

document.addEventListener("DOMContentLoaded", () => {
  fetch("preguntas.json")
    .then(res => res.json())
    .then(data => {
      bancoPreguntas = data;
      cargarCardsCategorias();
      generarCamposJugadores();
    })
    .catch(err => console.error("Error al cargar preguntas.json:", err));
});

function cargarCardsCategorias() {
  const contenedor = document.getElementById("check-categorias");
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
  const checkboxes = document.querySelectorAll("#check-categorias input:checked");
  const catsElegidas = Array.from(checkboxes).map(cb => cb.value);

  if (catsElegidas.length === 0) {
    alert("¡Por favor seleccioná al menos una categoría!");
    return;
  }

  preguntasUsadas.clear();

  configVersus.categorias = catsElegidas;
  configVersus.preguntasPorDif = parseInt(document.getElementById("num-preguntas-dif").value) || 2;
  configVersus.totalJugadores = parseInt(document.getElementById("num-jugadores").value) || 2;

  jugadores = [];
  for (let i = 1; i <= configVersus.totalJugadores; i++) {
    const nombreInput = document.getElementById(`input-jugador-${i}`).value.trim();
    jugadores.push({
      nombre: nombreInput !== "" ? nombreInput : `Jugador ${i}`,
      puntos: 0
    });
  }

  jugadorActualIdx = 0;
  categoriaActualIdx = 0;

  prepararColaCategoriaVersus();
  dibujarRuleta();

  document.getElementById("sec-config-versus").classList.add("hidden");
  document.getElementById("sec-juego").classList.remove("hidden");

  actualizarScoreboardVersus();
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

function prepararColaCategoriaVersus() {
  const catActual = configVersus.categorias[categoriaActualIdx];
  colaPreguntasVersus = [];

  const dificultades = ["muy_facil", "facil", "intermedia", "dificil", "muy_dificil"];
  const puntosPorDif = { muy_facil: 100, facil: 150, intermedia: 200, dificil: 250, muy_dificil: 300 };

  dificultades.forEach(dif => {
    const pool = bancoPreguntas[catActual][dif] || [];
    const disponibles = pool.filter(p => !preguntasUsadas.has(p.id));
    const seleccionadas = disponibles.sort(() => 0.5 - Math.random()).slice(0, configVersus.preguntasPorDif);
    
    seleccionadas.forEach(p => {
      colaPreguntasVersus.push({ ...p, categoria: catActual, dificultadNombre: dif, pts: puntosPorDif[dif] });
    });
  });
}

function girarRuleta() {
  if (enGiro) return;
  enGiro = true;

  const btnGirar = document.getElementById("btn-girar");
  btnGirar.disabled = true;
  document.getElementById("card-pregunta").classList.add("hidden");

  const girosExtra = 5 + Math.floor(Math.random() * 5);
  const anguloExtra = Math.floor(Math.random() * 360);
  anguloActual += girosExtra * 360 + anguloExtra;

  const canvas = document.getElementById("canvas-ruleta");
  canvas.style.transform = `rotate(${anguloActual}deg)`;

  setTimeout(() => {
    obtenerPreguntaVersus();
    enGiro = false;
  }, 3500);
}

function obtenerPreguntaVersus() {
  if (colaPreguntasVersus.length === 0) {
    avanzarCategoriaVersus();
    return;
  }

  preguntaActualObj = colaPreguntasVersus.shift();

  document.getElementById("contenedor-ruleta").classList.add("hidden");
  mostrarPreguntaUI(preguntaActualObj, preguntaActualObj.dificultadNombre.replace('_', ' '));
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
    btn.onclick = () => responder(index === p.c, p.pts);
    gridOps.appendChild(btn);
  });

  document.getElementById("card-pregunta").classList.remove("hidden");
}

function responder(esCorrecta, pts) {
  const jActual = jugadores[jugadorActualIdx];

  if (esCorrecta) {
    jActual.puntos += pts;
    alert(`¡Correcto ${jActual.nombre}! Sumaste +${pts} pts.`);
  } else {
    alert(`Incorrecto, ${jActual.nombre}. No sumas puntos.`);
  }

  jugadorActualIdx = (jugadorActualIdx + 1) % jugadores.length;
  
  document.getElementById("card-pregunta").classList.add("hidden");
  document.getElementById("contenedor-ruleta").classList.remove("hidden");
  document.getElementById("btn-girar").disabled = false;
  
  actualizarScoreboardVersus();
}

function actualizarScoreboardVersus() {
  const jActual = jugadores[jugadorActualIdx];
  const catActual = configVersus.categorias[categoriaActualIdx];
  const restantes = colaPreguntasVersus.length;

  document.getElementById("txt-jugador").innerText = jActual.nombre;
  document.getElementById("txt-puntos").innerText = `${jActual.puntos} pts`;
  document.getElementById("txt-progreso").innerText = `${catActual} (${restantes} rem.)`;
}

function avanzarCategoriaVersus() {
  categoriaActualIdx++;
  if (categoriaActualIdx < configVersus.categorias.length) {
    alert(`📌 Categoria finalizada. Siguiente categoría: ${configVersus.categorias[categoriaActualIdx]}`);
    prepararColaCategoriaVersus();
    actualizarScoreboardVersus();
    
    document.getElementById("card-pregunta").classList.add("hidden");
    document.getElementById("contenedor-ruleta").classList.remove("hidden");
    document.getElementById("btn-girar").disabled = false;
  } else {
    mostrarResultadosVersus();
  }
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
