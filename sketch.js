let imgColor;
let imgForma;
let resultados=[];

let currentTonoFactor = 1.0;
let targetTonoFactor = 1.0;

let calor = 0.0;         
let calorActual = 0.0;  

    let cantCapas = 5
let partesCara = [
    {
        nombre: 'nariz',
        img: null,
        x: 265, y: 150,
        w: 100, h: 475,
        seMueve: false
    },
    {
        nombre: 'boca',
        img: null,
        x: 200, y: 675,
        w: 250, h: 100,
        seMueve: false
    },
    {
        nombre: 'ojo',
        img: null,
        x: 490, y: 255,
        w: 50, h: 75,
        seMueve: false
    },
    {
        nombre: 'boca2',
        img: null,
        x: 192, y:645,
        w: 270, h:60,
        seMueve: false
    }
];
let posicionesOriginales = partesCara.map(parte => ({
    x: parte.x,
    y: parte.y
}));

function preload() {
    imgColor = loadImage('data/foto1.jpg');
    imgForma = loadImage('data/mascara.png');

    for (let i = 0; i < partesCara.length; i++) {
        partesCara[i].img = loadImage('data/cara' + i + '.png');
    }
}

function setup() {
    imgForma.resize(imgColor.width, imgColor.height);
    
    // aca redimensione al 50% :)
    createCanvas(imgColor.width/2, imgColor.height/2);

    imgColor.resize(width, height);
    imgForma.resize(width, height);

    imgColor.loadPixels();
    imgForma.loadPixels();
    for(let r=0;r<cantCapas;r++){
        resultados[r] = createImage(width, height);
        resultados[r].loadPixels();
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let index = (x + y * width) * 4;

            let r = imgColor.pixels[index];
            let g = imgColor.pixels[index + 1];
            let b = imgColor.pixels[index + 2];

            let br = imgForma.pixels[index];
            let bg = imgForma.pixels[index + 1];
            let bb = imgForma.pixels[index + 2];
            let brillo = (br + bg + bb) / 3;
            let escala = brillo / 255;
            //umbral 1 240
            //umbral 1 250
            //umbral 2 127
            //umbral 3 255
            let diferencia = abs(255-brillo);
            let umbral = 0;
            if(abs(250-brillo)<diferencia){
                diferencia = abs(250-brillo);
                umbral = 1;
            }
            if(abs(240-brillo)<diferencia){
                diferencia = abs(240-brillo);
                umbral = 2;
            }
            if(abs(127-brillo)<diferencia){
                diferencia = abs(127-brillo);
                umbral = 3;
            }
            if(abs(0-brillo)<diferencia){
                diferencia = abs(0-brillo);
                umbral = 4;
            }

            let brilloReal = (r+g+b)/3.0
            resultados[umbral].pixels[index] = brilloReal;
            resultados[umbral].pixels[index + 1] = brilloReal;
            resultados[umbral].pixels[index + 2] = brilloReal;
            resultados[umbral].pixels[index + 3] = 255;
        }
    }

    for(let r=0;r<cantCapas;r++){
     
        resultados[r].updatePixels();
    }

}

function draw() {
    background(0);

    if (keyIsDown(67)) { // c calidez y brillo   // agudo
        calor += 0.05;
        targetTonoFactor = constrain(targetTonoFactor + 0.01, 0.3, 2.0);
    }
    if (keyIsDown(70)) { // f frialdad y opacidad  // grave
        calor -= 0.05;
        targetTonoFactor = constrain(targetTonoFactor - 0.01, 0.3, 2.0);
    }

    let factor = transicionarTonalidad();
    calorActual = lerp(calorActual, calor, 0.08);

    /*let temp = resultado.get();
    temp.loadPixels();

    for (let i = 0; i < temp.pixels.length; i += 4) {
        let r = temp.pixels[i];
        let g = temp.pixels[i + 1];
        let b = temp.pixels[i + 2];

        r = constrain(r + calorActual * 20, 0, 255);
        b = constrain(b - calorActual * 20, 0, 255);

        r *= factor;
        g *= factor;
        b *= factor;

        temp.pixels[i] = constrain(r, 0, 255);
        temp.pixels[i + 1] = constrain(g, 0, 255);
        temp.pixels[i + 2] = constrain(b, 0, 255);
        temp.pixels[i + 3] = 255;
    }

    temp.updatePixels();
    image(temp, 0, 0); */

    push();
    
    colorMode(HSB);
    for(let r=0;r<cantCapas;r++){
        let h = (frameCount+r*50) % 360; // Cambia el tono con el tiempo
        tint(h, 255, 255);
        image(resultados[r], 0, 0); 
    }
    pop()

    for (let i = 0; i < partesCara.length; i++) {
        let parte = partesCara[i];
        let yFinal = parte.y;

        if (parte.nombre === 'boca' && parte.seMueve) {
            yFinal += random(-5, 2.5);
        }
        if (parte.nombre === 'boca2' && parte.seMueve) {
            yFinal += random(-5, 2.5);
        }

        image(parte.img, parte.x, yFinal, parte.w, parte.h);
    }
}


function keyPressed() {
    if (key === 'n' || key === 'N') {
        targetTonoFactor = 1.0;
        calor = 0.0;

        let boca = partesCara.find(p => p.nombre === 'boca');
        let boca2 = partesCara.find(p => p.nombre === 'boca2');

        if (boca && boca2) {
            let nuevoEstado = !boca.seMueve; // Alterna entre true y false
             

            // Solo si lo estamos activando (temblequeo ON), restauramos posición
            if (nuevoEstado) {
                for (let i = 0; i < partesCara.length; i++) {
                    partesCara[i].x = posicionesOriginales[i].x;
                    partesCara[i].y = posicionesOriginales[i].y;
                }
            }

            boca.seMueve = nuevoEstado;
            boca2.seMueve = nuevoEstado;
        }
    }

    if (key === 'o' || key === 'O') {
        partesCara.find(p => p.nombre === 'ojo').x -= 5;
    }

    if (key === 'l' || key === 'L') {
        partesCara.find(p => p.nombre === 'nariz').y += 2.5;
    }

    if (key === 'k' || key === 'K') {   // según aplitud de sonido
        let boca = partesCara.find(p => p.nombre === 'boca');
        let boca2 = partesCara.find(p => p.nombre === 'boca2');

        let indexBoca = partesCara.indexOf(boca);
        let indexBoca2 = partesCara.indexOf(boca2);

        let bocaYOriginal = posicionesOriginales[indexBoca].y;
        let boca2YOriginal = posicionesOriginales[indexBoca2].y;

        if (boca.y < bocaYOriginal + 20 && boca2.y > boca2YOriginal - 20) {
            boca.y += 2;
            boca2.y -= 2;
        }
    }
}

function transicionarTonalidad() {
    currentTonoFactor = lerp(currentTonoFactor, targetTonoFactor, 0.05);
    return currentTonoFactor;
}
