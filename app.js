// Base de preguntas (Pool de 15 por categoría con 5 dificultades: 100 a 300 pts)
const categorias = ["Historia", "Ciencia", "Entretenimiento"];

const preguntas = {
  "Historia": [
    { nivel: 1, pts: 100, q: "¿En qué año llegó Colón a América?", ops: ["1492", "1500", "1488"], c: 0 },
    { nivel: 2, pts: 150, q: "¿Quién fue el primer presidente de EE.UU.?", ops: ["Lincoln", "Washington", "Jefferson"], c: 1 },
    { nivel: 3, pts: 200, q: "¿En qué año cayó el Muro de Berlín?", ops: ["1989", "1991", "1975"], c: 0 },
    { nivel: 4, pts: 250, q: "¿Qué imperio construyó Machu Picchu?", ops: ["Azteca", "Maya", "Inca"], c: 2 },
    { nivel: 5, pts: 300, q: "¿Duración de la Guerra de los Cien Años?", ops: ["100 años", "116 años", "99 años"], c: 1 }
  ],
  "Ciencia": [
    { nivel: 1, pts: 100, q: "¿Símbolo químico del Agua?", ops: ["H2O", "O2", "CO2"], c: 0 },
    { nivel: 2, pts: 150, q: "¿Planeta más cercano al Sol?", ops: ["Venus", "Mercurio", "Marte"], c: 1 },
    { nivel: 3, pts: 200, q: "¿Gas más abundante en la atmósfera?", ops: ["Oxígeno", "Nitrógeno", "Hidrógeno"], c: 1 },
    { nivel: 4, pts: 250, q: "¿Velocidad aproximada de la luz?", ops: ["300.000 km/s", "150.000 km/s", "1.000.000 km/s"], c: 0 },
    { nivel: 5, pts: 300, q: "¿Unidad de medida de la fuerza?", ops: ["Joule", "Pascal", "Newton"], c: 2 }
  ],
  "Entretenimiento": [
    { nivel: 1, pts: 100, q: "¿Nombre del fontanero de Nintendo?", ops: ["Luigi", "Mario", "Sonic"], c: 1 },
    { nivel: 2, pts: 150, q: "¿Compañía creadora de Mickey Mouse?", ops: ["Pixar", "Disney", "DreamWorks"], c: 1 },
    { nivel: 3, pts: 200, q: "¿Superhéroe conocido como el Caballero de la Noche?", ops: ["Superman", "Batman", "Spider-Man"], c: 1 },
    { nivel: 4, pts: 250, q: "¿Banda británica creadora de 'Bohemian Rhapsody'?", ops: ["Queen", "The Beatles", "Pink Floyd"], c: 0 },
    { nivel: 5, pts: 300, q: "¿Premio más importante del cine?", ops: ["Grammy", "Oscar", "Emmy"], c: 1 }
  ]
};

// Control de Estado del Juego
let puntos = 0;
let preguntasEnTurno = 0;
let jugadorActual = 1;
let anguloRuleta = 0;

function girarRuleta() {
  document.getElementById("btn-girar").disabled = true;
  document.getElementById("card-pregunta").classList.add("hidden");

  // Giro visual aleatorio
  const vueltas = 5 + Math.floor(Math.random() * 5);
  const gradosExtra = Math.floor(Math.random() * 360);
  anguloRuleta += (vueltas * 360) + gradosExtra;

  const ruletaEl = document.getElementById("ruleta");
  ruletaEl.style.transform = `rotate(${anguloRuleta}deg)`;

  // Elegir categoría aleatoria
  const catElegida = categorias[Math.floor(Math.random() * categorias.length)];

  setTimeout(() => {
    ruletaEl.innerText = catElegida;
    mostrarPregunta(catElegida);
  }, 3000);
}

function mostrarPregunta(categoria) {
  // Elegir una pregunta aleatoria de la categoría
  const lista = preguntas[categoria];
  const p = lista[Math.floor(Math.random() * lista.length)];

  document.getElementById("txt-categoria").innerText = categoria;
  document.getElementById("txt-dificultad").innerText = `${p.pts} pts (Nivel ${p.nivel})`;
  document.getElementById("txt-pregunta").innerText = p.q;

  const contenedorOps = document.getElementById("opciones");
  contenedorOps.innerHTML = "";

  p.ops.forEach((op, index) => {
    const btn = document.createElement("button");
    btn.className = "btn-opcion";
    btn.innerText = op;
    btn.onclick = () => responder(index === p.c, p.pts);
    contenedorOps.appendChild(btn);
  });

  document.getElementById("card-pregunta").classList.remove("hidden");
}

function responder(esCorrecta, pts) {
  if (esCorrecta) {
    puntos += pts;
    alert(`¡Correcto! Sumas ${pts} puntos.`);
  } else {
    alert("Incorrecto.");
  }

  preguntasEnTurno++;
  
  // Cambia de jugador cada 3 preguntas
  if (preguntasEnTurno >= 3) {
    preguntasEnTurno = 0;
    jugadorActual = jugadorActual === 1 ? 2 : 1;
    alert(`¡Fin del turno! Le toca al Jugador ${jugadorActual}`);
  }

  // Actualizar tablero
  document.getElementById("p-puntos").innerHTML = `Puntos: <strong>${puntos}</strong>`;
  document.getElementById("p-jugador").innerHTML = `Jugador actual: <strong>Jugador ${jugadorActual}</strong>`;
  document.getElementById("p-turno").innerHTML = `Pregunta del turno: <strong>${preguntasEnTurno + 1} / 3</strong>`;

  document.getElementById("card-pregunta").classList.add("hidden");
  document.getElementById("btn-girar").disabled = false;
}