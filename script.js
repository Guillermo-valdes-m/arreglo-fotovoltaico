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

camera.position.set(120, 120, 120);

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

// Cargar modelo
const loader = new GLTFLoader();

loader.load(

    "modelo/Arreglo fotovoltaico.glb",

    (gltf) => {

        modelo = gltf.scene;

        scene.add(modelo);

        console.log("Modelo cargado");

        modelo.traverse((obj) => {

            if (obj.isMesh) {

                console.log(obj.name);

                if (obj.name === "OBJETO.002") {

                    obj.material = obj.material.clone();
                    obj.material.emissive = new THREE.Color(0xffffff);
                    obj.material.emissiveIntensity = 0.5;

                }

            }

        });

    }

);

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

    if (nombre === "OBJETO") {

        abrirImagen("img/paneles.png");

    }

    if (nombre === "OBJETO.002") {

        abrirImagen("img/Protecciones.png");

    }

});

// Botones laterales
document.getElementById("btnPaneles").onclick = () => {

    abrirImagen("img/paneles.png");

};

document.getElementById("btnProtecciones").onclick = () => {

    abrirImagen("img/Protecciones.png");

};

// Modal
const modal = document.getElementById("modal");
const imagen = document.getElementById("imagen");

const caption = document.getElementById("modalCaption");
const titulos = {
    "img/paneles.png": "OBJ·01 — Arreglo Fotovoltaico",
    "img/Protecciones.png": "OBJ·02 — Protecciones"
};

function abrirImagen(ruta) {

    imagen.src = ruta;
    caption.textContent = titulos[ruta] || "";

    modal.style.display = "flex";

}

document.getElementById("close").onclick = () => {

    modal.style.display = "none";

};

modal.onclick = (e) => {

    if (e.target === modal) {

        modal.style.display = "none";

    }

};

// Render
function animate() {

    requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene, camera);

}

animate();

// Responsive
window.addEventListener("resize", () => {

    camera.aspect = viewer.clientWidth / viewer.clientHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(viewer.clientWidth, viewer.clientHeight);

});
