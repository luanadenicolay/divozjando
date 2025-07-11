let imgColor, imgForma;
let resultados = [], cantCapas = 5;
let currentTonoFactor = 1.0, targetTonoFactor = 1.0;
let mic, fft, volumenSuavizado = 0;
let umbralRuido = 0.015;
let umbralFrioCaliente = 2000;
let desplazamientoMaximo = 100;
let colorHueBaseMem = 0;
let colorHueBase = 0;
let colorHuePorCapa = new Array(cantCapas).fill(0);


let partesCara = [
  { nombre: 'nariz', x: 270, y: 150, w: 100, h: 475, img: null, capa: 1 },
  { nombre: 'boca', x: 200, y: 675, w: 250, h: 100, img: null, capa: 2  },
  { nombre: 'ojo', x: 490, y: 255, w: 50, h: 75, img: null  },
  { nombre: 'boca2', x: 192, y: 645, w: 270, h: 60, img: null, capa: 2  },
  { nombre: 'cara4', x: 0, y: 0, w: 605, h: 240, img: null,  capa: 0  },
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
 
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);


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
      resultados[umbral].pixels[index] = r;
      resultados[umbral].pixels[index + 1] = g;
      resultados[umbral].pixels[index + 2] = b;
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


  iniciarReconocimiento();
}

function draw() {
   if (!mic) return; 
  background(0);

  let volumen = mic.getLevel() * 2;
  volumenSuavizado = lerp(volumenSuavizado, volumen, 0.1);

if (volumenSuavizado > umbralRuido) {
  targetTonoFactor = 1.0;
  } else {
  targetTonoFactor = 0.7; // o 0.0 si querés que desaparezca
}

currentTonoFactor = lerp(currentTonoFactor, targetTonoFactor, 0.05);

 fft.analyze();
if(volumenSuavizado > umbralRuido){
let coloresFrioss = [200, 210, 220, 230]; // azules y violetas
let coloresCalidos = [0, 20, 40, 350];    // rojos y naranjas

if (fft.getCentroid() > umbralFrioCaliente) {
  console.log("fríos");
  colorHueBaseMem = random(coloresFrioss);
} else {
  console.log("cálidos");
  colorHueBaseMem = random(coloresCalidos);
}

}

colorHueBase = lerp(colorHueBase, colorHueBaseMem , 0.1);
colorHueBase = constrain(colorHueBase, 0, 360);


  // Mostrar capas
  push();
  colorMode(HSB);

  let saturacionDinamica = map(volumenSuavizado, 0, 0.3, 80, 255);
saturacionDinamica = constrain(saturacionDinamica, 50, 255);

  for (let r = 0; r < cantCapas; r++) {
  let mezclaFactor = map(volumenSuavizado, 0, 0.3, 0.0, 1.0);
  mezclaFactor = constrain(mezclaFactor, 0.0, 1.0);
  let h = (colorHuePorCapa[r] + colorHueBase) % 360;

  let saturacionSuave = 30; // 🎨 Saturación baja para estilo pastel
  let brilloSuave = 220;    // 🎨 No completamente blanco

  tint(h, saturacionSuave, brilloSuave);
  image(resultados[r], 0, 0);
}

  pop();

  // Mostrar partes de la cara con color persistente
  let colorHueOriginal = colorHuePorCapa.reduce((a, b) => a + b, 0) / cantCapas;

  for (let i = 0; i < partesCara.length; i++) {
    let parte = partesCara[i];
    let centroX = width / 2;
    let centroY = height / 2;
    let dxCentro = centroX - (parte.x + parte.w / 2);
    let dyCentro = centroY - (parte.y + parte.h / 2);
    let distanciaActual = dist(parte.x, parte.y, posicionesOriginales[i].x, posicionesOriginales[i].y);
    
    if ( distanciaActual < desplazamientoMaximo) {
      parte.x += dxCentro * map(volumenSuavizado, 0, 0.3, 0.01, 0.1);
      parte.y += dyCentro * map(volumenSuavizado, 0, 0.3, 0.01, 0.1);
    } else {
      parte.x = lerp(parte.x, posicionesOriginales[i].x, 0.05);
      parte.y = lerp(parte.y, posicionesOriginales[i].y, 0.05);
    }

    if (volumenSuavizado > umbralRuido && distanciaActual < desplazamientoMaximo) {
  let factorMovimiento = map(volumenSuavizado, umbralRuido, 0.3, 0.01, 0.1);
  parte.x += dxCentro * factorMovimiento;
  parte.y += dyCentro * factorMovimiento;
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
let capa = parte.capa;
let h = (colorHuePorCapa[capa] + colorHueBase) % 360;
let saturacionSuave = 30;
let brilloSuave = 220 * currentTonoFactor;

tint(h, saturacionSuave, brilloSuave);



    if (parte.nombre === "boca") {
     let apertura = volumenSuavizado > umbralRuido
  ? constrain(map(volumenSuavizado, umbralRuido, 0.2, 0, 50), 0, 50)
  : 0;
      image(parte.img, 0, apertura, parte.w, parte.h);
    } else if (parte.nombre === "ojo") {
      let agrandarOjo = volumenSuavizado > umbralRuido
  ? map(volumenSuavizado, umbralRuido, 0.3, 0, 20)
  : 0;
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