// Obtener Canvas y Contexto
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const contadorElemento = document.getElementById("contador");

// Gestión de Audio
const musicaFondo = document.getElementById("musicaFondo");
const sonidoColision = document.getElementById("sonidoColision");
const btnAudio = document.getElementById("btnAudio");

let musicaSonando = false;
btnAudio.addEventListener("click", () => {
    if (musicaSonando) {
        musicaFondo.pause();
        musicaSonando = false;
    } else {
        musicaFondo.play().catch(e => console.log("Permiso de audio requerido"));
        musicaSonando = true;
    }
});

// Imagen de Fondo del Canvas
const imagenFondo = new Image();
imagenFondo.src = "assets/fondo-escenario.jpg";

// Rutas de imágenes de los objetos del juego
const rutasObjetos = [
    "assets/fantasma.png",
    "assets/calabaza.png",
    "assets/zombi.png",
    "assets/calavera.png"
];

// Cargar imágenes
const imagenesObjetos = rutasObjetos.map(ruta => {
    const img = new Image();
    img.src = ruta;
    return img;
});

// Variables del Juego
const TOTAL_OBJETOS = 25;
let objetos = [];
let animacionesChoque = [];
let contadorClicks = 0;

// Direcciones permitidas
const DIRECCIONES = ["arriba", "abajo", "diagonal", "circular"];

// Clase Objeto2D
class Objeto2D {
    constructor() {
        this.reset();
    }

    reset() {
        this.radio = 20; // Radio para detección de colisiones redondeadas
        this.ancho = 40;
        this.alto = 40;
        this.x = Math.random() * (canvas.width - this.ancho - 20) + 10;
        this.y = Math.random() * (canvas.height - this.alto - 20) + 10;
        
        // Dirección y Velocidad Aleatoria
        this.direccion = DIRECCIONES[Math.floor(Math.random() * DIRECCIONES.length)];
        this.velocidad = Math.random() * 2.5 + 1.2; // Diferente velocidad por objeto

        // Vector de velocidad
        this.vx = (Math.random() > 0.5 ? 1 : -1) * this.velocidad;
        this.vy = (Math.random() > 0.5 ? 1 : -1) * this.velocidad;

        // Parámetros para movimiento circular
        this.centroX = this.x;
        this.centroY = this.y;
        this.radioGiro = Math.random() * 40 + 20;
        this.angulo = Math.random() * Math.PI * 2;
        this.velocidadAngular = (Math.random() * 0.04 + 0.02) * (Math.random() > 0.5 ? 1 : -1);

        // Imagen Asignada
        this.imagen = imagenesObjetos[Math.floor(Math.random() * imagenesObjetos.length)];

        // Parámetros para Aparecer/Desaparecer (Opacidad aleatoria / Fade)
        this.opacidad = Math.random();
        this.velocidadFade = (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1);
    }

    actualizar() {
        // Manejo de Opacidad (Aparecer / Desaparecer aleatoriamente)
        this.opacidad += this.velocidadFade;
        if (this.opacidad >= 1 || this.opacidad <= 0.1) {
            this.velocidadFade = -this.velocidadFade;
        }

        // Desplazamiento según la dirección asignada
        switch (this.direccion) {
            case "arriba":
                this.y -= this.velocidad;
                if (this.y + this.alto < 0) this.y = canvas.height;
                break;

            case "abajo":
                this.y += this.velocidad;
                if (this.y > canvas.height) this.y = -this.alto;
                break;

            case "diagonal":
                this.x += this.vx;
                this.y += this.vy;

                // Rebote con Bordes del Canvas
                if (this.x <= 0 || this.x + this.ancho >= canvas.width) this.vx *= -1;
                if (this.y <= 0 || this.y + this.alto >= canvas.height) this.vy *= -1;
                break;

            case "circular":
                this.angulo += this.velocidadAngular;
                this.centroX += this.vx * 0.5;
                this.centroY += this.vy * 0.5;

                this.x = this.centroX + Math.cos(this.angulo) * this.radioGiro;
                this.y = this.centroY + Math.sin(this.angulo) * this.radioGiro;

                // Rebote con bordes en movimiento circular
                if (this.centroX <= 50 || this.centroX >= canvas.width - 50) this.vx *= -1;
                if (this.centroY <= 50 || this.centroY >= canvas.height - 50) this.vy *= -1;
                break;
        }
    }

    dibujar() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.opacidad));
        
        if (this.imagen.complete && this.imagen.naturalWidth !== 0) {
            ctx.drawImage(this.imagen, this.x, this.y, this.ancho, this.alto);
        } else {
            // Placeholder en caso de que aún no cargue la imagen
            ctx.fillStyle = "#ff7518";
            ctx.beginPath();
            ctx.arc(this.x + this.radio, this.y + this.radio, this.radio, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// Clase para Efecto/Animación Breve de Colisión (Explosión/Destello)
class AnimacionChoque {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radio = 5;
        this.radioMax = 30;
        this.opacidad = 1;
        this.duracion = 15; // Cuadros que dura la animación
    }

    actualizar() {
        this.radio += 1.5;
        this.opacidad -= 1 / this.duracion;
    }

    dibujar() {
        if (this.opacidad <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.opacidad);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.strokeStyle = "#ff3300";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffff00";
        ctx.fill();
        ctx.restore();
    }
}

// Inicializar los 25 Objetos
function inicializarObjetos() {
    objetos = [];
    for (let i = 0; i < TOTAL_OBJETOS; i++) {
        objetos.push(new Objeto2D());
    }
}

// Detección y Manejo de Colisiones entre Objetos
function detectarColisiones() {
    for (let i = 0; i < objetos.length; i++) {
        for (let j = i + 1; j < objetos.length; j++) {
            let obj1 = objetos[i];
            let obj2 = objetos[j];

            // Distancia entre centros
            let centroX1 = obj1.x + obj1.ancho / 2;
            let centroY1 = obj1.y + obj1.alto / 2;
            let centroX2 = obj2.x + obj2.ancho / 2;
            let centroY2 = obj2.y + obj2.alto / 2;

            let dx = centroX2 - centroX1;
            let dy = centroY2 - centroY1;
            let distancia = Math.sqrt(dx * dx + dy * dy);
            let minDistancia = obj1.radio + obj2.radio;

            // Detectar choque
            if (distancia < minDistancia) {
                // Invertir velocidades (Rebote)
                obj1.vx *= -1;
                obj1.vy *= -1;
                obj2.vx *= -1;
                obj2.vy *= -1;

                // Crear animación breve de choches/choque
                let choqueX = (centroX1 + centroX2) / 2;
                let choqueY = (centroY1 + centroY2) / 2;
                animacionesChoque.push(new AnimacionChoque(choqueX, choqueY));

                // Reproducir sonido si está disponible (sin saturar)
                if (sonidoColision && sonidoColision.paused && musicaSonando) {
                    sonidoColision.currentTime = 0;
                    sonidoColision.play().catch(() => {});
                }
            }
        }
    }
}

// Eliminación/Reaparición al hacer Clic sobre los objetos
canvas.addEventListener("click", (evento) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = evento.clientX - rect.left;
    const mouseY = evento.clientY - rect.top;

    for (let i = 0; i < objetos.length; i++) {
        let obj = objetos[i];
        
        // Comprobar si el clic fue dentro del área del objeto
        if (
            mouseX >= obj.x &&
            mouseX <= obj.x + obj.ancho &&
            mouseY >= obj.y &&
            mouseY <= obj.y + obj.alto
        ) {
            // Incrementar Contador
            contadorClicks++;
            contadorElemento.textContent = contadorClicks;

            // Reaparecer aleatoriamente en otra zona (se resetea el objeto para mantener siempre 25)
            obj.reset();
            break; // Elimina/reubica solo uno por clic
        }
    }
});

// Bucle Principal de Animación
function bucleJuego() {
    // Dibujar Fondo del Escenario
    if (imagenFondo.complete && imagenFondo.naturalWidth !== 0) {
        ctx.drawImage(imagenFondo, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Actualizar y Dibujar Objetos
    objetos.forEach(obj => {
        obj.actualizar();
        obj.dibujar();
    });

    // Procesar Colisiones
    detectarColisiones();

    // Actualizar y Dibujar Animaciones de Choque
    for (let i = animacionesChoque.length - 1; i >= 0; i--) {
        let anim = animacionesChoque[i];
        anim.actualizar();
        anim.dibujar();
        if (anim.opacidad <= 0) {
            animacionesChoque.splice(i, 1);
        }
    }

    requestAnimationFrame(bucleJuego);
}

// Iniciar Juego
inicializarObjetos();
requestAnimationFrame(bucleJuego);