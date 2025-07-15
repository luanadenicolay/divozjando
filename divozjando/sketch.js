let imgColor, imgForma;
let bloqueado = false;
let resultados = [], cantCapas = 5;
let mic, fft, volumenSuavizado = 0;
let colorSat = 80;
let colorBri = 220;
let colorHueObjetivo = 0;
let colorSatObjetivo = 80;
let colorBriObjetivo = 220;
let efectoShhhActivo = false;
let tiempoShhhInicio = 0;
let duracionShhh = 400;
const umbralRuido = 0.005;
const desplazamientoMaximo = 50;
let hOffsetPartes = 30;       // matiz base para las partes
let bNuevoPartes = 220;       // brillo base para las partes
let ultimoCambioColor = 0;    // para controlar cuándo actualizar
const intervaloCambio = 250;  // ms, cambio cada 1/4 seg aprox

let enModoFotoPorShhh = false;
let textCanvas; 

let colorHueBase = 0;
let currentTonoFactor = 1.0, targetTonoFactor = 1.0;
let warmHues = [], coolHues = [];
let mostrarFoto = true;
let coloresZonas = [];

let partesCara = [
  { nombre: 'nariz', x: 270, y: 150, w: 100, h: 475, img: null, zona: 2 },
  { nombre: 'boca', x: 190, y: 690, w: 250, h: 100, img: null, zona: 1 },
  { nombre: 'ojo', x: 490, y: 255, w: 50, h: 75, img: null, zona: 0 },
  { nombre: 'boca2', x: 185, y: 665, w: 270, h: 60, img: null, zona: 1 },
  { nombre: 'cara4', x: 0, y: 0, w: 605, h: 240, img: null, zona: 2 }
];
let posicionesOriginales = [];

function touchStarted() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
}

function preload() {
  imgColor = loadImage('data/foto1.jpg');
  imgForma = loadImage('data/mascara.png');
  partesCara.forEach((p, i) => p.img = loadImage("data/cara" +(i) + ".png"));
}

function setup() {
  createCanvas(605, 800);
  imgColor.resize(width, height);
  imgForma.resize(width, height);

  mic = new p5.AudioIn();
  mic.start(() => console.log("🎤 Micrófono activo"));
  fft = new p5.FFT();
  fft.setInput(mic);

  posicionesOriginales = partesCara.map(p => ({ x: p.x, y: p.y }));
  warmHues = [20, 30, 40];
  coolHues = [210, 220, 230];

  imgColor.loadPixels();
  imgForma.loadPixels();

  // Inicializar capas vacías
  for (let z = 0; z < cantCapas; z++) {
    resultados[z] = createImage(width, height);
    resultados[z].loadPixels();
  }

  // Clasificar capas por rango de gris 
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let idx = (x + y * width) * 4;

      let r = imgForma.pixels[idx];
      let g = imgForma.pixels[idx + 1];
      let b = imgForma.pixels[idx + 2];
      let gris = round((r + g + b) / 3);

      let capa = 0;
      if (gris >= 221) capa = 4;
      else if (gris >= 161) capa = 3;
      else if (gris >= 91) capa = 2;
      else if (gris >= 31) capa = 1;
      else capa = 0;

      resultados[capa].pixels[idx] = 255;
      resultados[capa].pixels[idx + 1] = 255;
      resultados[capa].pixels[idx + 2] = 255;
      resultados[capa].pixels[idx + 3] = 255;
    }
  }

  for (let z = 0; z < cantCapas; z++) {
    resultados[z].updatePixels();
    coloresZonas[z] = color(0, 0, 255);
  }

//TEXTURA
    texCanvas = createGraphics(width, height);
  texCanvas.noStroke();
  texCanvas.clear();

  // Generar textura de "papel pastel"
  for (let i = 0; i < 10000; i++) {
    let x = random(width);
    let y = random(height);
    let alpha = random(10, 30);
    let size = random(1, 3);
    texCanvas.fill(255, 255, 255, alpha);
    texCanvas.ellipse(x, y, size, size);
  }

}

function draw() {
  background(240);

  let vol = mic.getLevel() * 2;
  volumenSuavizado = lerp(volumenSuavizado, vol, 0.1);
  targetTonoFactor = vol > umbralRuido ? 1.0 : 0.7;
  currentTonoFactor = lerp(currentTonoFactor, targetTonoFactor, 0.05);

  let difHue = abs(colorHueBase - colorHueObjetivo);
  if (difHue > 180) {
    if (colorHueBase < colorHueObjetivo) colorHueBase += 360;
    else colorHueObjetivo += 360;
  }

  colorHueBase = lerp(colorHueBase, colorHueObjetivo, 0.03) % 360;
  colorSat = lerp(colorSat, colorSatObjetivo, 0.03);
  colorBri = lerp(colorBri, colorBriObjetivo, 0.03);

  fft.analyze();
  let grave = fft.getEnergy(5, 300);
  let agudo = fft.getEnergy(2000, 5000);
  let shhh = fft.getEnergy(5000, 9000);

  if (shhh > 100 && !efectoShhhActivo && !enModoFotoPorShhh) {
    efectoShhhActivo = true;
    tiempoShhhInicio = millis();
    enModoFotoPorShhh = true;
    mostrarFoto = true;

    colorHueObjetivo = 0;
    colorSatObjetivo = random(40, 65);
    colorBriObjetivo = random(170, 230);
    colorHueBase = 0;
    colorSat = 80;
    colorBri = 220;

    if (millis() - ultimoCambioColor > intervaloCambio) {
  if (volumenSuavizado > umbralRuido) {
    hOffsetPartes = 30 + random(-10, 10);
    bNuevoPartes = constrain(220 + random([-40, 40]), 100, 255);
  } else {
    hOffsetPartes = 30;
    bNuevoPartes = 220;
  }
  ultimoCambioColor = millis();
}

    for (let i = 0; i < partesCara.length; i++) {
      partesCara[i].x = posicionesOriginales[i].x;
      partesCara[i].y = posicionesOriginales[i].y;
    }
  }

  if (enModoFotoPorShhh && vol > umbralRuido * 2) {
    enModoFotoPorShhh = false;
    efectoShhhActivo = false;
    mostrarFoto = false;
  }

  if (!enModoFotoPorShhh) {
    if (vol > umbralRuido && mostrarFoto) mostrarFoto = false;

    if (!bloqueado && vol > umbralRuido) {
     colorMode(HSB, 360, 100, 255);

      for (let i = 0; i < coloresZonas.length; i++) {
        if (!bloqueado && vol > umbralRuido) {
  let coloresCalidos = ['#c03c1d', '#f4b854', '#cc834b', '#de9c4f', '#fcf281'];
let coloresFrios = ['#4c53ad', '#94799d', '#144b70', '#57757e', '#5689ba'];

for (let i = 0; i < coloresZonas.length; i++) {
  let paleta = agudo * 1.1 > grave ? coloresCalidos : coloresFrios;
  let colHex = random(paleta);
  let c = color(colHex);

  let h = hue(c) + random(-5, 5);  // variación leve de matiz
  let s = saturation(c);
  let b = brightness(c);

  coloresZonas[i] = color(h % 360, s, b);
}
}

      }
      mostrarFoto = false;
    }

    if (bloqueado && vol > umbralRuido) bloqueado = false;
  }

  if (mostrarFoto || enModoFotoPorShhh) {
    image(imgColor, 0, 0, width, height);
  } else {
    push();
    colorMode(HSB);
    tint(colorHueBase, colorSat, colorBri, 180);
    let temblorActivo = efectoShhhActivo && millis() - tiempoShhhInicio < duracionShhh;

    push();
    colorMode(HSB);
    for (let i = 0; i < resultados.length; i++) {
      let dx = temblorActivo ? random(-3, 3) : 0;
      let dy = temblorActivo ? random(-3, 3) : 0;
      let col = coloresZonas[i];
      let h = hue(col);
      let s = saturation(col);
      let b = brightness(col);

      blendMode(MULTIPLY);
      tint(h, s, b, 255);
      image(resultados[i], dx, dy);
      blendMode(BLEND);
    }
    pop();

    if (!temblorActivo && efectoShhhActivo) efectoShhhActivo = false;
    pop();
  }

  for (let i = 0; i < partesCara.length; i++) {
    let p = partesCara[i];
    let cx = width / 2, cy = height / 2;
    let dx = cx - (p.x + p.w / 2), dy = cy - (p.y + p.h / 2);

    if (vol > umbralRuido) {
      let f = map(volumenSuavizado, umbralRuido, 0.3, 0.005, 0.015);
      let stepX = dx * f, stepY = dy * f;
      if (dist(p.x + stepX, p.y + stepY, posicionesOriginales[i].x, posicionesOriginales[i].y) < desplazamientoMaximo) {
        p.x += stepX; p.y += stepY;
      }
    } else {
      p.x = lerp(p.x, posicionesOriginales[i].x, 0.1);
      p.y = lerp(p.y, posicionesOriginales[i].y, 0.1);
    }

    push();
    dx = dy = 0;
    if (efectoShhhActivo && millis() - tiempoShhhInicio < duracionShhh) {
      dx = random(-4, 4);
      dy = random(-4, 4);
    }
    translate(p.x + dx, p.y + dy);
    colorMode(HSB);
    let zonaIndex = p.zona || 0;
    let col = coloresZonas[zonaIndex];
    if (!mostrarFoto) {
  let hBase = hue(col);
  let sBase = saturation(col);
  let bBase = brightness(col);

  let hNuevo = (hBase + hOffsetPartes) % 360;
let bNuevo = bNuevoPartes;
tint(hNuevo, sBase, bNuevo, 200);
} else {
  tint(0, 0, 150);
}

    if (p.nombre === 'boca') {
      let a = vol > umbralRuido ? constrain(map(volumenSuavizado, umbralRuido, 0.2, 0, 50), 0, 50) : 0;
      image(p.img, 0, a, p.w, p.h);
    } else if (p.nombre === 'ojo') {
      let g = vol > umbralRuido ? map(volumenSuavizado, umbralRuido, 0.3, 0, 20) : 0;
      image(p.img, 0, -g, p.w, p.h + g);
    } else {
      image(p.img, 0, 0, p.w, p.h);
    }
    pop();
  }

  //TEXTURA
  blendMode(OVERLAY); 
  image(texCanvas, 0, 0);
  blendMode(BLEND); 

  let luz = createGraphics(width, height);
luz.noStroke();
luz.drawingContext.shadowBlur = 200;
luz.drawingContext.shadowColor = color(0, 0, 255, 10);
luz.fill(255, 10);
luz.ellipse(width / 2, height / 2, width * 1.2, height * 1.2);

blendMode(ADD);
image(luz, 0, 0);
blendMode(BLEND);

}

function rgbToHue(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, h = 0;
  if (d) {
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return h * 360;
}
