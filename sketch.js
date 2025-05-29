let imgColor;
let imgForma;
let resultado;

let currentTonoFactor = 1.0;
let targetTonoFactor = 1.0;

let calor = 0.0;         
let calorActual = 0.0;  

let partesCara = [
    {
        nombre: 'nariz',
        img: null,
        x: 530, y: 300, // posición absoluta en el canvas
        w: 200, h: 950,
        seMueve: false
    },
    {
        nombre: 'boca',
        img: null,
        x: 400, y: 1350,
        w: 500, h: 200,
        seMueve: false
    },
    {
        nombre: 'ojo',
        img: null,
        x: 980, y: 510,
        w: 100, h: 150,
        seMueve: false
    }
];
let posicionesOriginales = partesCara.map(parte => ({
    x: parte.x,
    y: parte.y
}));

function preload() {
    imgColor = loadImage('data/foto1.jpg');
    imgForma = loadImage('data/foto2.jpg');

   for (let i=0; i<partesCara.length; i++)[
        partesCara[i].img = loadImage('data/cara'+i+'.png')
    ]

}

function setup() {
    imgForma.resize(imgColor.width, imgColor.height);
    createCanvas(imgColor.width, imgColor.height);

    imgColor.loadPixels();
    imgForma.loadPixels();
    resultado = createImage(imgColor.width, imgColor.height);
    resultado.loadPixels();

    for (let y = 0; y < imgColor.height; y++) {
        for (let x = 0; x < imgColor.width; x++) {
            let index = (x + y * imgColor.width) * 4;

            // Color original
            let r = imgColor.pixels[index];
            let g = imgColor.pixels[index + 1];
            let b = imgColor.pixels[index + 2];

            // Brillo de forma
            let br = imgForma.pixels[index];
            let bg = imgForma.pixels[index + 1];
            let bb = imgForma.pixels[index + 2];
            let brillo = (br + bg + bb) / 3;
            let escala = brillo / 255;

            // Guardamos color base 
            resultado.pixels[index] = r * escala;
            resultado.pixels[index + 1] = g * escala;
            resultado.pixels[index + 2] = b * escala;
            resultado.pixels[index + 3] = 255;
        }
    }

    resultado.updatePixels();
}

function draw() {
    background(0);

    if (keyIsDown(84)) { // 'T' (oscurecer)
        targetTonoFactor = constrain(targetTonoFactor - 0.01, 0.3, 2.0);
    }
    if (keyIsDown(80)) { // 'P' (aclarar)
        targetTonoFactor = constrain(targetTonoFactor + 0.01, 0.3, 2.0);
    }
  
    if (keyIsDown(67)) { // 'C' (calidez)
        calor += 0.05;
    }
    if (keyIsDown(70)) { // 'F' (frialdad)
        calor -= 0.05;
    }

    // Transiciones suaves
    let factor = transicionarTonalidad();
    calorActual = lerp(calorActual, calor, 0.08); // velocidad aumentada

    loadPixels();
    resultado.loadPixels();

    for (let i = 0; i < resultado.pixels.length; i += 4) {
        let r = resultado.pixels[i];
        let g = resultado.pixels[i + 1];
        let b = resultado.pixels[i + 2];

        //  temperatura 
        r = constrain(r + calorActual * 20, 0, 255); // más rojo si es cálido
        b = constrain(b - calorActual * 20, 0, 255); // menos azul si es cálido

        // Aplicamos factor de tono (brillo general)
        r *= factor;
        g *= factor;
        b *= factor;

        pixels[i] = constrain(r, 0, 255);
        pixels[i + 1] = constrain(g, 0, 255);
        pixels[i + 2] = constrain(b, 0, 255);
        pixels[i + 3] = 255;
    }

    updatePixels();

    

for (let i = 0; i < partesCara.length; i++) {
    let parte = partesCara[i];
    let yFinal = parte.y;

    if (parte.nombre === 'boca' && parte.seMueve) {
        yFinal += random(-10, 5); // Titila solo si seMueve está activo
    }

    image(parte.img, parte.x, yFinal, parte.w, parte.h);
}

}

function keyPressed() {
    if (key === 'n' || key === 'N') {
        targetTonoFactor = 1.0;
        calor = 0.0;
        for (let i = 0; i < partesCara.length; i++) {
        partesCara[i].x = posicionesOriginales[i].x;
        partesCara[i].y = posicionesOriginales[i].y;
}
    }

    if (key === 'b' || key === 'B'){
        partesCara[1].seMueve = !partesCara[1].seMueve;
    }

    if (key === 'o' || key === 'O') {
    partesCara[2].x -= 10; // Mueve el ojo hacia la derecha
    }

    if (key === 'l' || key === 'L'){
        partesCara[0].y +=5;
    }
}

function transicionarTonalidad() {
    currentTonoFactor = lerp(currentTonoFactor, targetTonoFactor, 0.05);
    return currentTonoFactor;
}