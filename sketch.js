let imgColor, imgForma;
let resultados = [], cantCapas = 5;
let currentTonoFactor = 1.0, targetTonoFactor = 1.0;
let mic, fft, volumenSuavizado = 0;
let umbralRuido = 0.005, umbralCalido = 0.05;
let desplazamientoMaximo = 100;

let colorHuePorCapa = new Array(cantCapas).fill(0);

let partesCara = [
  { nombre: 'nariz', x: 270, y: 150, w: 100, h: 475, img: null },
  { nombre: 'boca', x: 200, y: 675, w: 250, h: 100, img: null },
  { nombre: 'ojo', x: 490, y: 255, w: 50, h: 75, img: null },
  { nombre: 'boca2', x: 192, y: 645, w: 270, h: 60, img: null },
  { nombre: 'cara4', x: 0, y: 0, w: 605, h: 240, img: null },
];

let posicionesOriginales = [];
let reconocimiento;

function preload() {
  imgColor = loadImage('data/foto1.jpg');
  imgForma = loadImage('data/mascara.png');
  for (let i = 0; i < partesCara.length; i++) {
    partesCara[i].img = loadImage('data/cara' + i + '.png');
  }
}

function setup() {
  imgForma.resize(imgColor.width, imgColor.height);
  createCanvas(imgColor.width / 2, imgColor.height / 2);
  imgColor.resize(width, height);
  imgForma.resize(width, height);

  imgColor.loadPixels();
  imgForma.loadPixels();
  for (let r = 0; r < cantCapas; r++) {
    resultados[r] = createImage(width, height);
    resultados[r].loadPixels();
  }

  // Acumuladores para el color promedio por capa
  let sumaR = Array(cantCapas).fill(0);
  let sumaG = Array(cantCapas).fill(0);
  let sumaB = Array(cantCapas).fill(0);
  let cuentaPixeles = Array(cantCapas).fill(0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let index = (x + y * width) * 4;

      let r = imgColor.pixels[index];
      let g = imgColor.pixels[index + 1];
      let b = imgColor.pixels[index + 2];

      let br = imgForma.pixels[index];
      let bg = imgForma.pixels[index + 1];
      let bb = imgForma.pixels[index + 2];

      let brillo = (br + bg + bb) / 3.0;
      let diferencia = abs(255 - brillo);
      let umbral = 0;

      if (abs(250 - brillo) < diferencia) {
        diferencia = abs(250 - brillo);
        umbral = 1;
      }
      if (abs(240 - brillo) < diferencia) {
        diferencia = abs(240 - brillo);
        umbral = 2;
      }
      if (abs(127 - brillo) < diferencia) {
        diferencia = abs(127 - brillo);
        umbral = 3;
      }
      if (abs(0 - brillo) < diferencia) {
        diferencia = abs(0 - brillo);
        umbral = 4;
      }

      let brilloReal = (r + g + b) / 3.0;
      resultados[umbral].pixels[index] = brilloReal;
      resultados[umbral].pixels[index + 1] = brilloReal;
      resultados[umbral].pixels[index + 2] = brilloReal;
      resultados[umbral].pixels[index + 3] = 255;

      // Acumular colores por capa
      sumaR[umbral] += r;
      sumaG[umbral] += g;
      sumaB[umbral] += b;
      cuentaPixeles[umbral]++;
    }
  }

  for (let r = 0; r < cantCapas; r++) {
    resultados[r].updatePixels();

    // Calcular color promedio por capa
    if (cuentaPixeles[r] > 0) {
      let avgR = sumaR[r] / cuentaPixeles[r];
      let avgG = sumaG[r] / cuentaPixeles[r];
      let avgB = sumaB[r] / cuentaPixeles[r];
      let col = color(avgR, avgG, avgB);
      colorHuePorCapa[r] = hue(col);
    } else {
      colorHuePorCapa[r] = 0; // Default
    }
  }

  posicionesOriginales = partesCara.map(p => ({ x: p.x, y: p.y }));

  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);

  iniciarReconocimiento();
}

function draw() {
  background(0);

  // Obtener niveles de sonido
  let volumen = mic.getLevel() * 5;
  volumenSuavizado = lerp(volumenSuavizado, volumen, 0.1);
  let espectro = fft.analyze();

  // Graves y Agudos
  let graves = fft.getEnergy(20, 250);
  let agudos = fft.getEnergy(4000, 8000);

  // Ajuste del tono general
  if (volumenSuavizado > umbralRuido) {
    if (volumenSuavizado > umbralCalido) {
      targetTonoFactor = 1.5;
    } else {
      targetTonoFactor = 1.0;
    }
  } else {
    if (agudos > 180) {
      targetTonoFactor = 0.7;
    }
  }

  currentTonoFactor = lerp(currentTonoFactor, targetTonoFactor, 0.05);

  // Calcular tinte dinámico según espectro
  let pesoGraves = map(graves, 0, 255, 0, 1);
  let pesoAgudos = map(agudos, 0, 255, 0, 1);
  let colorHueBase = lerp(240, 40, pesoAgudos); // 240 = azul, 40 = naranja
  colorHueBase = constrain(colorHueBase, 0, 360);

  // Dibujar capas con mezcla de color base
  push();
  colorMode(HSB);

  let saturacionDinamica = map(volumenSuavizado, 0, 0.3, 50, 255);
  saturacionDinamica = constrain(saturacionDinamica, 50, 255);

  for (let r = 0; r < cantCapas; r++) {
    let mezclaFactor = map(volumenSuavizado, 0, 0.3, 0.0, 1.0);
mezclaFactor = constrain(mezclaFactor, 0.0, 1.0);
let h = lerp(colorHuePorCapa[r], colorHueBase, mezclaFactor);

    tint(h, saturacionDinamica, 255);
    image(resultados[r], 0, 0);
  }
  pop();

  // Dibujar y mover partes de la cara
let colorHueOriginal = colorHuePorCapa.reduce((a, b) => a + b, 0) / cantCapas;


  for (let i = 0; i < partesCara.length; i++) {
    let parte = partesCara[i];
    let centroX = width / 2;
    let centroY = height / 2;
    let dxCentro = centroX - (parte.x + parte.w / 2);
    let dyCentro = centroY - (parte.y + parte.h / 2);
    let distanciaActual = dist(parte.x, parte.y, posicionesOriginales[i].x, posicionesOriginales[i].y);

    if (volumenSuavizado > umbralCalido && distanciaActual < desplazamientoMaximo) {
      parte.x += dxCentro * map(volumenSuavizado, 0, 0.3, 0.01, 0.1);
      parte.y += dyCentro * map(volumenSuavizado, 0, 0.3, 0.01, 0.1);
    } else {
      parte.x = lerp(parte.x, posicionesOriginales[i].x, 0.05);
      parte.y = lerp(parte.y, posicionesOriginales[i].y, 0.05);
    }

    push();
    translate(parte.x, parte.y);
    colorMode(HSB);
    let saturacionDinamica = map(volumenSuavizado, 0, 0.3, 50, 255);
    saturacionDinamica = constrain(saturacionDinamica, 50, 255);
    let mezclaFactor = map(volumenSuavizado, 0, 0.3, 0.0, 1.0);
mezclaFactor = constrain(mezclaFactor, 0.0, 1.0);
let h = lerp(colorHueOriginal, colorHueBase, mezclaFactor);

    tint(h, saturacionDinamica, 255 * currentTonoFactor);

    if (parte.nombre === "boca") {
      let apertura = constrain(map(volumenSuavizado, 0, 0.2, 0, 50), 0, 50);
      image(parte.img, 0, apertura, parte.w, parte.h);
    } else if (parte.nombre === "ojo") {
      let agrandarOjo = map(volumenSuavizado, 0, 0.3, 0, 20);
      image(parte.img, 0, -agrandarOjo, parte.w, parte.h + agrandarOjo);
    } else {
      image(parte.img, 0, 0, parte.w, parte.h);
    }

    pop();
  }
}


function iniciarReconocimiento() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    reconocimiento = new SR();
    reconocimiento.continuous = true;
    reconocimiento.interimResults = false;
    reconocimiento.lang = 'es-AR';

    reconocimiento.onresult = (e) => {
      const resultado = e.results[e.results.length - 1][0].transcript.toLowerCase();
      if (resultado.includes("shh")) {
        targetTonoFactor = 1.0;
      }
    };

    reconocimiento.onerror = (e) => {
      console.warn("Error en reconocimiento de voz:", e.error);
    };

    reconocimiento.onend = () => {
      console.log("Reconocimiento reiniciado");
      reconocimiento.start();
    };

    reconocimiento.start();
  } else {
    console.warn("Este navegador no soporta reconocimiento de voz.");
  }
}
