import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const viewer = document.getElementById("viewer");

// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1C3A52);

// Cámara
const camera = new THREE.PerspectiveCamera(
    60,
    viewer.clientWidth / viewer.clientHeight,
    0.1,
    1000
);

camera.position.set(3, 3, 3);

// Render
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewer.clientWidth, viewer.clientHeight);
viewer.appendChild(renderer.domElement);

// Controles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 3.5));

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(5, 10, 5);
scene.add(light);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
fillLight.position.set(-5, 4, -5);
scene.add(fillLight);

// Variables
let modelo;
const objetos = {};

// Grupos de mallas (reflejan las colecciones "paneles" y "Tableros" de Blender,
// que no se exportan como agrupadores en el .glb, así que se listan a mano)
const GRUPOS = {
    paneles: ["Panel 1", "Panel 2", "Panel 3", "Panel 4", "Panel 5", "Panel 6"],
    tableros: ["Inversor", "Medidor", "Protecciones CA", "Protecciones CC", "Tablero General"]
};

function grupoDe(nombre) {

    for (const [clave, lista] of Object.entries(GRUPOS)) {

        if (lista.includes(nombre)) return clave;

    }

    return null;

}

// Cargar modelo
const loader = new GLTFLoader();

loader.load(

    "modelo/Instalaciones_2.glb",

    (gltf) => {

        modelo = gltf.scene;

        scene.add(modelo);

        console.log("Modelo cargado");

        btnPaneles.disabled = false;
        btnProtecciones.disabled = false;

        modelo.traverse((obj) => {

            if (obj.isMesh) {

                console.log(obj.name);

                objetos[obj.name] = obj;

                if (grupoDe(obj.name) === "tableros") {

                    obj.material = obj.material.clone();
                    obj.material.emissive = new THREE.Color(0xffffff);
                    obj.material.emissiveIntensity = 0.5;

                }

            }

        });

    }

);

// Enfocar cámara en un objeto por nombre
function enfocarObjeto(nombre) {

    enfocarGrupo([nombre]);

}

// Enfocar cámara para encuadrar un grupo completo de objetos
function enfocarGrupo(nombres) {

    const box = new THREE.Box3();
    let encontrados = 0;

    nombres.forEach((nombre) => {

        const obj = objetos[nombre];

        if (obj) {

            box.expandByObject(obj);
            encontrados++;

        }

    });

    if (encontrados === 0) {

        console.warn(`enfocarGrupo: ninguno de estos objetos existe todavía: ${nombres.join(", ")} (¿el modelo ya terminó de cargar?)`);
        return;

    }

    const centro = box.getCenter(new THREE.Vector3());
    const tamano = box.getSize(new THREE.Vector3());
    const radio = Math.max(tamano.length() * 0.6, 1);

    const direccion = new THREE.Vector3(1, 0.8, 1).normalize();
    const posDestino = centro.clone().add(direccion.multiplyScalar(radio));

    animarCamara(posDestino, centro);

}

// Animación suave de cámara hacia una posición/objetivo
function animarCamara(posDestino, targetDestino) {

    const posInicial = camera.position.clone();
    const targetInicial = controls.target.clone();
    const duracion = 700;
    const inicio = performance.now();

    function paso(ahora) {

        const p = Math.min((ahora - inicio) / duracion, 1);
        const ease = 1 - Math.pow(1 - p, 3);

        camera.position.lerpVectors(posInicial, posDestino, ease);
        controls.target.lerpVectors(targetInicial, targetDestino, ease);
        controls.update();

        if (p < 1) requestAnimationFrame(paso);

    }

    requestAnimationFrame(paso);

}

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Click sobre el modelo
renderer.domElement.addEventListener("click", (event) => {

    mouse.x = (event.offsetX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.offsetY / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(scene.children, true);

    if (hits.length === 0) return;

    const nombre = hits[0].object.name;

    console.log(nombre);

    const clave = grupoDe(nombre);

    if (clave === "paneles") {

        abrirImagen("img/paneles.png");
        enfocarGrupo(GRUPOS.paneles);

    }

    if (clave === "tableros") {

        abrirImagen("img/Protecciones.png");
        enfocarGrupo(GRUPOS.tableros);

    }

});

// Botones laterales
const btnPaneles = document.getElementById("btnPaneles");
const btnProtecciones = document.getElementById("btnProtecciones");

btnPaneles.disabled = true;
btnProtecciones.disabled = true;

btnPaneles.onclick = () => {

    abrirImagen("img/paneles.png");
    enfocarGrupo(GRUPOS.paneles);

};

btnProtecciones.onclick = () => {

    abrirImagen("img/Protecciones.png");
    enfocarGrupo(GRUPOS.tableros);

};

// Panel lateral
const infoPanel = document.getElementById("infoPanel");
const imagen = document.getElementById("imagen");
const caption = document.getElementById("infoPanelCaption");

const titulos = {
    "img/paneles.png": "OBJ·01 — Arreglo Fotovoltaico",
    "img/Protecciones.png": "OBJ·02 — Protecciones"
};

function abrirImagen(ruta) {

    imagen.src = ruta;
    caption.textContent = titulos[ruta] || "";

    infoPanel.classList.add("active");

}

function cerrarPanel() {

    infoPanel.classList.remove("active");

}

document.getElementById("close").onclick = cerrarPanel;

// El alto del visor cambia al abrir/cerrar el panel: reajustar cámara y render
infoPanel.addEventListener("transitionend", (e) => {

    if (e.propertyName === "height") actualizarTamano();

});

// Render
function animate() {

    requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene, camera);

}

animate();

// Responsive
function actualizarTamano() {

    camera.aspect = viewer.clientWidth / viewer.clientHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(viewer.clientWidth, viewer.clientHeight);

}

window.addEventListener("resize", actualizarTamano);
