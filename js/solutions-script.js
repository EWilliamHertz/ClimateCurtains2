import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// DOM elements for the demo
const canvas = document.getElementById('solution-canvas');
const toggleCurtainButton = document.getElementById('toggle-curtain-button');
const toggleThermalButton = document.getElementById('toggle-thermal-button');

let camera, scene, renderer;
let controls; // For mouse interaction
let isCurtainDeployed = false;
let isThermalView = false;
let curtain, wallLeft, wallRight, roof;

// Colors
const normalMaterialColor = 0x888888;
const warmSideColor = 0xff0000;
const coldSideColor = 0x0000ff;

// Scene setup
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Warehouse walls and roof
    const wallMaterial = new THREE.MeshStandardMaterial({ color: normalMaterialColor });
    const wallGeometry = new THREE.BoxGeometry(20, 10, 1);
    wallLeft = new THREE.Mesh(wallGeometry, wallMaterial);
    wallLeft.position.set(-15, 5, 0);
    wallLeft.castShadow = true;
    wallLeft.receiveShadow = true;
    scene.add(wallLeft);
    
    wallRight = new THREE.Mesh(wallGeometry, wallMaterial);
    wallRight.position.set(15, 5, 0);
    wallRight.castShadow = true;
    wallRight.receiveShadow = true;
    scene.add(wallRight);

    const roofGeometry = new THREE.PlaneGeometry(50, 20);
    roof = new THREE.Mesh(roofGeometry, wallMaterial);
    roof.rotation.x = Math.PI / 2;
    roof.position.set(0, 10, 0);
    roof.receiveShadow = true;
    scene.add(roof);

    // Curtain (starts off-screen)
    const curtainGeometry = new THREE.PlaneGeometry(10, 10);
    const curtainMaterial = new THREE.MeshStandardMaterial({ color: 0x4CAF50, side: THREE.DoubleSide });
    curtain = new THREE.Mesh(curtainGeometry, curtainMaterial);
    curtain.position.set(-5, 5, 0.5);
    curtain.castShadow = true;
    curtain.visible = false;
    scene.add(curtain);

    // Controls
    controls = {
        isDragging: false,
        previousMousePosition: { x: 0, y: 0 },
        onMouseDown: (e) => {
            controls.isDragging = true;
            controls.previousMousePosition = { x: e.clientX, y: e.clientY };
        },
        onMouseMove: (e) => {
            if (!controls.isDragging) return;
            const deltaMove = {
                x: e.clientX - controls.previousMousePosition.x,
                y: e.clientY - controls.previousMousePosition.y
            };
            const rotationSpeed = 0.005;
            scene.rotation.y += deltaMove.x * rotationSpeed;
            scene.rotation.x += deltaMove.y * rotationSpeed;
            controls.previousMousePosition = { x: e.clientX, y: e.clientY };
        },
        onMouseUp: () => {
            controls.isDragging = false;
        },
        onWheel: (e) => {
            const zoomSpeed = 0.01;
            camera.position.z += e.deltaY * zoomSpeed;
        }
    };

    canvas.addEventListener('mousedown', controls.onMouseDown, false);
    canvas.addEventListener('mousemove', controls.onMouseMove, false);
    canvas.addEventListener('mouseup', controls.onMouseUp, false);
    canvas.addEventListener('wheel', controls.onWheel, false);

    // Buttons
    toggleCurtainButton.addEventListener('click', () => {
        isCurtainDeployed = !isCurtainDeployed;
        curtain.visible = isCurtainDeployed;
        toggleCurtainButton.textContent = isCurtainDeployed ? 'Retract Curtain' : 'Deploy Curtain';
        if (isThermalView) updateThermalView();
    });

    toggleThermalButton.addEventListener('click', () => {
        isThermalView = !isThermalView;
        toggleThermalButton.textContent = isThermalView ? 'Normal View' : 'Thermal View';
        updateThermalView();
    });

    window.addEventListener('resize', onWindowResize, false);
}

function updateThermalView() {
    if (isThermalView) {
        // Thermal view logic
        if (isCurtainDeployed) {
            // Curtain is deployed, so different sides of the warehouse have different temperatures
            wallLeft.material.color.setHex(warmSideColor);
            wallRight.material.color.setHex(coldSideColor);
            roof.material.color.setHex(0xaaaaaa);
        } else {
            // Curtain is not deployed, heat escapes everywhere
            wallLeft.material.color.setHex(warmSideColor);
            wallRight.material.color.setHex(warmSideColor);
            roof.material.color.setHex(warmSideColor);
        }
        scene.background.setHex(0x333333);
    } else {
        // Normal view
        wallLeft.material.color.setHex(normalMaterialColor);
        wallRight.material.color.setHex(normalMaterialColor);
        roof.material.color.setHex(normalMaterialColor);
        scene.background.setHex(0xf0f0f0);
    }
}

function onWindowResize() {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

window.onload = function() {
    if (canvas) {
        init();
        animate();
    }
}
