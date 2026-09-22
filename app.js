/* ============================================
   🌻 JARDÍN MÁGICO - ESTILO TIKTOK
   Experiencia 3D Inmersiva con Controles
   ============================================ */

const CONFIG = {
    flowerCount: 20, // 20 flores/ramos con mensaje esparcidas por todo el espacio
    flowerCountMobile: 10,
    bgFlowerCount: 150, // Muchas más flores de adorno tipo "universo"
    bgFlowerCountMobile: 80,
    heartParticleCount: 3000, // Más puntos para que el corazón se vea más gordito
    heartParticleCountMobile: 1500,
    galaxyParticleCount: 40000,
    galaxyParticleCountMobile: 15000,
    starCount: 8000, // Miles de estrellas extra
    starCountMobile: 3000
};

const MESSAGES = [
    { title: "Un detalle para ti 🌻", text: "Quería regalarte este pequeño detalle de flores amarillas, Juany, para sacarte una sonrisa y desearte un día genial." },
    { title: "Buena vibra ✨", text: "Tu alegría y tu forma de ser siempre transmiten buena energía. ¡Que nunca se apague esa chispa!" },
    { title: "Gran amistad 🌼", text: "Aprecio mucho compartir buenos momentos, risas y anécdotas contigo, Juany. ¡Gracias por tu linda amistad!" },
    { title: "Muchos éxitos 🍀", text: "Te deseo siempre lo mejor en cada meta que te propongas. Que sigan viniendo cosas muy buenas para ti." },
    { title: "Sonrisas y alegría 🌷", text: "Que hoy y siempre tengas mil motivos para sonreír y pasarla bien. ¡Un abrazo con mucho cariño!" },
    { title: "Siempre genial 🌸", text: "Es muy lindo contar con amigas tan sinceras, auténticas y divertidas. Gracias por ser siempre tú misma, Juany." },
    { title: "Flores amarillas ☀️", text: "Dicen que las flores amarillas llenan el día de luz y optimismo... así que aquí tienes un jardín entero para ti." },
    { title: "Con mucho aprecio 🌻", text: "Para una gran amiga: gracias por la confianza, las risas y la buena compañía de siempre. ¡Que tengas un día increíble!" }
];

const FLOATING_TEXTS = [
    "Para Juany 🌻", "Buena vibra ✨", "Gran amiga 🌻", "Eres genial 🌻",
    "Sonríe siempre 💛", "Con cariño 🌻", "Mucha luz ☀️", "Un detalle especial 🌻",
    "Alegría ✨", "Se te aprecia 💛", "Muchos éxitos 🍀", "Para ti 🌻"
];

const FLOWER_IMAGES = [
    'assets/images/bouquet.jpg',
    'assets/images/single.jpg',
    'assets/images/cluster.jpg'
];

let scene, camera, renderer, clock, controls;
let raycaster, pointerNDC;
let mouseTarget = { x: 0, y: 0 };
let isZoomingIn = false;
let isZoomingOut = false;
let cameraTargetPos = new THREE.Vector3(0, 15, 50);
let cameraTargetPosOut = new THREE.Vector3(0, 26, 100); // Destino final más alejado

let flowers = [], flowerMeshes = [];
let solitaryRoseGroup, solitaryRoseMesh, solitaryTextSprite, solitaryParticles;
let galaxyParticles, galaxyData = [];
let starParticles;
let floatingTextElements = [];

let isMobile = false, isCardOpen = false;
let loadedTextures = [];

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initApp() {
    try {
        isMobile = (window.innerWidth <= 768) || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        let btn = document.getElementById('enter-btn');
        if (btn) {
            btn.addEventListener('click', startExperience);
        } else {
            alert('Error: Botón enter-btn no encontrado en HTML');
        }

        // Intentar reproducir música automáticamente en la interfaz principal
        let audio = document.getElementById('bg-audio');
        if (audio) {
            let playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("El navegador bloqueó el autoplay. Se reproducirá al hacer el primer clic.");
                    let unlockAudio = () => {
                        audio.play().catch(e => console.log("Aún bloqueado:", e));
                        document.removeEventListener('click', unlockAudio);
                        document.removeEventListener('touchstart', unlockAudio);
                    };
                    document.addEventListener('click', unlockAudio);
                    document.addEventListener('touchstart', unlockAudio);
                });
            }
        }
    } catch (e) {
        alert('Error en initApp: ' + e.message);
    }
}

function startExperience() {
    try {
        let audio = document.getElementById('bg-audio');
        if (audio && audio.paused) {
            audio.play().catch(e => console.log("Audio play on enter:", e));
        }
        document.getElementById('intro').classList.add('hidden');
        loadTextures(() => {
            initThreeJS();
            setupAudio();
            setTimeout(() => {
                document.getElementById('canvas-wrap').classList.add('show');
                document.getElementById('btn-music').classList.add('show');
            }, 400);

            // Arrancar el motor de zoom más rápido
            setTimeout(() => {
                isZoomingIn = true;
            }, 800);
        });
    } catch (e) {
        alert('Error en startExperience: ' + e.message);
    }
}

function loadTextures(callback) {
    let loader = new THREE.TextureLoader();
    let loaded = 0;

    FLOWER_IMAGES.forEach((src, idx) => {
        loader.load(src,
            (tex) => {
                try {
                    loadedTextures[idx] = processTexture(tex);
                } catch (e) {
                    loadedTextures[idx] = tex;
                }
                checkDone();
            },
            undefined,
            () => {
                loadedTextures[idx] = createFallbackTexture();
                checkDone();
            }
        );
    });

    function checkDone() {
        loaded++;
        if (loaded === FLOWER_IMAGES.length) callback();
    }
}

function processTexture(texture) {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let img = texture.image;

    canvas.width = 512;
    canvas.height = 512;
    ctx.drawImage(img, 0, 0, 512, 512);

    let imgData = ctx.getImageData(0, 0, 512, 512);
    let data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        let brightness = (r + g + b) / 3;

        if (brightness < 20) {
            data[i + 3] = 0;
        } else if (brightness < 45) {
            data[i + 3] = Math.floor((brightness - 20) * (255 / 25));
        }
    }

    ctx.putImageData(imgData, 0, 0);
    let newTex = new THREE.CanvasTexture(canvas);
    newTex.needsUpdate = true;
    return newTex;
}

function createFallbackTexture() {
    let canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = '#F5C518';
    ctx.beginPath();
    ctx.arc(64, 64, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3D2700';
    ctx.beginPath();
    ctx.arc(64, 64, 20, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
}

function initThreeJS() {
    clock = new THREE.Clock();

    scene = new THREE.Scene();
    // Niebla más suave (0.003) para poder ver la galaxia desde muy lejos
    scene.fog = new THREE.FogExp2(0x000000, 0.003);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 3000);
    // Empezar la cámara desde el espacio profundo, visible como un punto lejano
    camera.position.set(0, 150, 600);

    renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('canvas-wrap').appendChild(renderer.domElement);

    // Controles para que el usuario pueda rotar libremente
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 1000;
    controls.target.set(0, 9.5, 0); // Mirar hacia el centro (donde está la rosa solitaria)
    controls.enabled = false; // Bloquear controles de usuario hasta que termine la intro

    raycaster = new THREE.Raycaster();
    pointerNDC = new THREE.Vector2(-999, -999);

    createLightsAndAurora();
    createStars();
    createGalaxy();
    createSolitaryRose();
    createBackgroundFlowers(); // Añadido
    createFlowers();

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointerMove);

    // Detección táctil y de clic instantánea y optimizada para Android y móviles
    renderer.domElement.addEventListener('touchstart', onFlowerTouchStart, { passive: false, capture: true });
    renderer.domElement.addEventListener('pointerdown', onFlowerPointerDown, { capture: true });

    document.getElementById('btn-close').addEventListener('click', closeCard);

    // Cerrar también tocando fuera de la tarjeta (fondo oscuro)
    let cardOverlay = document.getElementById('card-overlay');
    if (cardOverlay) {
        cardOverlay.addEventListener('click', (e) => {
            if (e.target.id === 'card-overlay') closeCard();
        });
    }

    animate();
}

function createLightsAndAurora() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    let centerLight = new THREE.PointLight(0xFFD700, 2.5, 80);
    centerLight.position.set(0, 5, 0);
    scene.add(centerLight);

    // Aurora Amarilla en el fondo (Resplandor central)
    let canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    let ctx = canvas.getContext('2d');
    let grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 220, 0, 0.5)');
    grad.addColorStop(0.4, 'rgba(200, 150, 0, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    let auroraTex = new THREE.CanvasTexture(canvas);
    let auroraMat = new THREE.SpriteMaterial({
        map: auroraTex,
        color: 0xFFD700,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    let aurora = new THREE.Sprite(auroraMat);
    aurora.scale.set(100, 100, 1);
    aurora.position.set(0, 5, -10); // Detrás del corazón
    scene.add(aurora);
}

function createStars() {
    let count = isMobile ? CONFIG.starCountMobile : CONFIG.starCount;
    let geo = new THREE.BufferGeometry();
    let pos = new Float32Array(count * 3);
    let colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        // Distribuir en una esfera gigante alrededor del escenario (no adentró de la galaxia)
        let r = 40 + Math.random() * 160;
        let theta = 2 * Math.PI * Math.random();
        let phi = Math.acos(2 * Math.random() - 1);

        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.cos(phi);
        pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

        // Mezcla perfecta de amarillo y blanco
        let color = new THREE.Color();
        if (Math.random() > 0.5) {
            color.setHex(0xFFFFFF); // Blanco puro
        } else {
            color.lerpColors(new THREE.Color(0xFFD700), new THREE.Color(0xFFFFFF), Math.random() * 0.5); // Amarillos claros
        }
        colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Crear un brillo suave circular para que no sean simples cuadrados
    let canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 16;
    let ctx = canvas.getContext('2d');
    let grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(8, 8, 8, 0, Math.PI * 2); ctx.fill();
    let tex = new THREE.CanvasTexture(canvas);

    let mat = new THREE.PointsMaterial({
        size: 0.6 + Math.random() * 0.4,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        map: tex,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    starParticles = new THREE.Points(geo, mat);
    scene.add(starParticles);
}

function createGalaxy() {
    let count = isMobile ? CONFIG.galaxyParticleCountMobile : CONFIG.galaxyParticleCount;
    let geo = new THREE.BufferGeometry();
    let pos = new Float32Array(count * 3);
    let colors = new Float32Array(count * 3);

    let colorCenter = new THREE.Color(0xFFFFFF); // Blanco puro
    let colorMid = new THREE.Color(0xFFD700);    // Dorado brillante
    let colorEdge = new THREE.Color(0xD9A441);   // Dorado oscuro

    // 1. VÓRTICE HECHO DE PARTÍCULAS (5 brazos espirales)
    for (let i = 0; i < count; i++) {
        // Añadimos un radio mínimo de 2.0 para evitar que miles de partículas se amontonen en el punto 0,0 y quemen el centro
        let r = 2.0 + Math.pow(Math.random(), 1.8) * 33;

        let isArm = Math.random() < 0.8;

        let branchAngle = (i % 5) * ((Math.PI * 2) / 5);
        let spinAngle = r * 0.16;

        let rx, rz, randX = 0, randZ = 0;
        if (isArm) {
            // Brazos AÚN más anchos en el centro (8.5) 
            let scatter = Math.max(0.5, 8.5 - (r / 5.0));

            randX = (Math.random() - 0.5) * scatter;
            randZ = (Math.random() - 0.5) * scatter;
            // Randomness contenido estrictamente en el grosor del brazo
            rx = Math.cos(branchAngle + spinAngle) * r + randX;
            rz = Math.sin(branchAngle + spinAngle) * r + randZ;
        } else {
            // Polvo de estrellas esparcido alrededor
            let angle = Math.random() * Math.PI * 2;
            rx = Math.cos(angle) * r;
            rz = Math.sin(angle) * r;

            // Calculamos el randX/Z artificial para que no falle
            randX = rx - Math.cos(angle) * r;
            randZ = rz - Math.sin(angle) * r;
            branchAngle = angle;
            spinAngle = 0;
        }

        // Muy plano en Y, formando el disco
        let ry = (Math.random() - 0.5) * Math.max(0.1, 1.0 - r * 0.03);

        pos[i * 3] = rx;
        pos[i * 3 + 1] = ry;
        pos[i * 3 + 2] = rz;

        let actualDist = Math.sqrt(rx * rx + ry * ry + rz * rz);
        let mixedColor = new THREE.Color();

        // Muchísimos más puntos blancos concentrados específicamente en las líneas (brazos) de la galaxia
        let whiteChance = isArm ? 0.50 : 0.20;
        if (Math.random() < whiteChance) {
            mixedColor.setHex(0xFFFFFF); // Blanco absoluto
        } else {
            if (actualDist < 5.0) {
                // Hacemos el centro un dorado mucho más profundo para contrarrestar la suma de luces
                mixedColor.lerpColors(new THREE.Color(0xB8860B), colorMid, 0.5);
            } else if (actualDist < 15) {
                mixedColor.lerpColors(colorMid, colorEdge, (actualDist - 5.0) / 10.0);
            } else {
                mixedColor.lerpColors(colorMid, colorEdge, 1.0);
            }
        }

        colors[i * 3] = mixedColor.r; colors[i * 3 + 1] = mixedColor.g; colors[i * 3 + 2] = mixedColor.b;

        galaxyData.push({
            angle: branchAngle + spinAngle,
            radius: r,
            speed: 0.005 + (0.01 / Math.max(1, r * 0.2)),
            rx: randX,
            rz: randZ,
            ry: ry
        });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    let canvasParticle = document.createElement('canvas');
    canvasParticle.width = 16; canvasParticle.height = 16;
    let ctxP = canvasParticle.getContext('2d');
    let gradP = ctxP.createRadialGradient(8, 8, 0, 8, 8, 8);
    // Usar blanco puro para la textura, el color dorado lo dará el vertexColor
    gradP.addColorStop(0, 'rgba(255,255,255,1)');
    gradP.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradP.addColorStop(1, 'rgba(0,0,0,0)');
    ctxP.fillStyle = gradP; ctxP.fillRect(0, 0, 16, 16);
    let texP = new THREE.CanvasTexture(canvasParticle);

    let matParticle = new THREE.PointsMaterial({
        size: 0.9, // Puntos más grandes
        vertexColors: true, blending: THREE.AdditiveBlending,
        transparent: true, depthWrite: false, map: texP
    });

    galaxyParticles = new THREE.Points(geo, matParticle);
    scene.add(galaxyParticles);

    // --- AURORAS AMARILLAS EN LA GALAXIA ---
    let auroraCanvas = document.createElement('canvas');
    auroraCanvas.width = 512; auroraCanvas.height = 512;
    let auroraCtx = auroraCanvas.getContext('2d');
    let auroraGrad = auroraCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
    auroraGrad.addColorStop(0, 'rgba(255, 215, 0, 0.4)'); // Aurora amarilla tenue
    auroraGrad.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
    auroraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    auroraCtx.fillStyle = auroraGrad; auroraCtx.fillRect(0, 0, 512, 512);

    let auroraTex = new THREE.CanvasTexture(auroraCanvas);
    let auroraMat = new THREE.MeshBasicMaterial({
        map: auroraTex, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide
    });

    // Distribuir 4 auroras masivas por la galaxia
    for (let a = 0; a < 4; a++) {
        let auroraMesh = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), auroraMat);
        auroraMesh.rotation.x = -Math.PI / 2;
        let angle = (a / 4) * Math.PI * 2 + Math.PI / 4;
        let dist = 15;
        auroraMesh.position.set(Math.cos(angle) * dist, -1, Math.sin(angle) * dist);
        scene.add(auroraMesh);
    }

    // Eliminado completamente el coreMesh base para quitar ese exceso de brillo blanco estático en el fondo
}

function createSolitaryRose() {
    let group = new THREE.Group();
    group.position.set(0, 9.5, 0);

    // Halo luminoso dorado detrás de la rosa solitaria
    let glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256; glowCanvas.height = 256;
    let glowCtx = glowCanvas.getContext('2d');
    let glowGrad = glowCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    glowGrad.addColorStop(0, 'rgba(255, 225, 60, 0.7)');
    glowGrad.addColorStop(0.35, 'rgba(255, 190, 0, 0.3)');
    glowGrad.addColorStop(0.7, 'rgba(255, 160, 0, 0.08)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    glowCtx.fillStyle = glowGrad; glowCtx.fillRect(0, 0, 256, 256);

    let glowTex = new THREE.CanvasTexture(glowCanvas);
    let glowMat = new THREE.MeshBasicMaterial({
        map: glowTex, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide
    });
    let glowMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), glowMat);
    glowMesh.position.z = -0.15;
    group.add(glowMesh);

    // Malla principal de la Rosa Solitaria (usando la textura single.jpg)
    let roseMat = new THREE.MeshBasicMaterial({
        map: loadedTextures[1],
        transparent: true,
        side: THREE.DoubleSide,
        alphaTest: 0.05,
        depthWrite: false
    });
    let roseMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), roseMat);
    group.add(roseMesh);

    // Luz cálida centrada en la rosa
    let roseLight = new THREE.PointLight(0xFFD700, 3.0, 50);
    roseLight.position.set(0, 0, 1.5);
    group.add(roseLight);

    // Polvo de estrellas doradas orbitando la rosa
    let pCount = isMobile ? 120 : 260;
    let pGeo = new THREE.BufferGeometry();
    let pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
        let ang = Math.random() * Math.PI * 2;
        let dist = 4.2 + Math.random() * 4.2;
        pPos[i * 3] = Math.cos(ang) * dist;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
        pPos[i * 3 + 2] = Math.sin(ang) * dist;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    let pMat = new THREE.PointsMaterial({
        size: 0.7,
        color: 0xFFF2A0,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    let roseParticles = new THREE.Points(pGeo, pMat);
    group.add(roseParticles);

    // Texto 3D flotante: "Amistad 🌻"
    let canvasText = document.createElement('canvas');
    canvasText.width = 1024;
    canvasText.height = 256;
    let ctxText = canvasText.getContext('2d');
    ctxText.fillStyle = "rgba(0,0,0,0)";
    ctxText.fillRect(0, 0, 1024, 256);
    ctxText.font = "bold 130px 'Dancing Script', Arial, sans-serif";
    ctxText.textAlign = "center";
    ctxText.textBaseline = "middle";
    ctxText.fillStyle = "#FFFFFF";
    ctxText.shadowColor = "#FFD700";
    ctxText.shadowBlur = 24;
    ctxText.fillText("Amistad 🌻", 512, 128);

    let texText = new THREE.CanvasTexture(canvasText);
    texText.needsUpdate = true;
    let matText = new THREE.SpriteMaterial({
        map: texText, transparent: true, depthWrite: false
    });
    let textSprite = new THREE.Sprite(matText);
    textSprite.scale.set(16, 4, 1);
    textSprite.position.set(0, 6.8, 0); // Flotando encima de la rosa
    group.add(textSprite);

    // Interacción al tocar la rosa solitaria
    roseMesh.userData = {
        idx: 999,
        scale: 10,
        targetScale: 10
    };
    flowerMeshes.push(roseMesh);

    solitaryRoseGroup = group;
    solitaryRoseMesh = roseMesh;
    solitaryTextSprite = textSprite;
    solitaryParticles = roseParticles;
    scene.add(group);
}

function createBackgroundFlowers() {
    let count = isMobile ? CONFIG.bgFlowerCountMobile : CONFIG.bgFlowerCount;

    for (let i = 0; i < count; i++) {
        let texIdx = 1; // Usar EXCLUSIVAMENTE 'single.jpg' (flores solas, no ramos)
        let mat = new THREE.MeshBasicMaterial({
            map: loadedTextures[texIdx],
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.05,
            depthWrite: false
        });

        // Achicadas en comparación a los ramos, pero lo suficientemente grandes para verse a lo lejos
        let size = 0.8 + Math.random() * 0.7;
        let geo = new THREE.PlaneGeometry(size, size);
        let mesh = new THREE.Mesh(geo, mat);

        // Esparcir estritamente FUERA de la galaxia, pero sin alejarlas tanto que la niebla las borre
        let u = Math.random(), v = Math.random();
        let theta = 2 * Math.PI * u;
        let phi = Math.acos(2 * v - 1);

        let r = 45 + Math.random() * 30; // De 45 a 75 de distancia (dejando un margen claro con la galaxia)
        let px = r * Math.sin(phi) * Math.cos(theta);
        let pz = r * Math.sin(phi) * Math.sin(theta);
        let py = r * Math.cos(phi) * 0.8; // Universo levemente achatado

        mesh.position.set(px, py, pz);

        mesh.userData = {
            idx: -2, // -2 para que NUNCA coincida con hoveredIdx = -1 y evitar falsos crecimientos
            scale: size,
            targetScale: size
        };

        flowers.push(mesh); // Solo para que miren a la cámara
        scene.add(mesh);
    }
}

function createFlowers() {
    let count = isMobile ? CONFIG.flowerCountMobile : CONFIG.flowerCount;

    for (let i = 0; i < count; i++) {
        // EXCLUSIVAMENTE Ramos (índices 0 y 2), nada de flores solitarias aquí
        let texIdx = Math.random() > 0.5 ? 0 : 2;
        let mat = new THREE.MeshBasicMaterial({
            map: loadedTextures[texIdx],
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.05,
            depthWrite: false
        });

        // Achicadas un poquito para que estén perfectas
        let size = 1.5 + Math.random() * 1.5;
        let geo = new THREE.PlaneGeometry(size, size);
        let mesh = new THREE.Mesh(geo, mat);

        let hasLabel = true; // Todos los ramos entregan mensaje, así que todos llevan etiqueta

        // TODAS las flores (con o sin etiqueta) orbitan dispersas alrededor del corazón
        // y por encima de la galaxia.
        let r = 18 + Math.random() * 17; // Radio más amplio para que estén MUCHO más separadas (18 a 35)
        let angle = (i / count) * Math.PI * 2 + (Math.random() * 0.5); // Distribución circular
        let px = r * Math.cos(angle);
        let pz = r * Math.sin(angle);
        let py = 6 + Math.random() * 8; // Altura: desde arriba de la galaxia hasta el corazón

        mesh.position.set(px, py, pz);

        mesh.userData = {
            idx: i,
            scale: size,
            targetScale: size
        };

        // Textos flotantes como Sprites 3D hijos de la flor
        if (hasLabel) {
            let canvasText = document.createElement('canvas');
            canvasText.width = 1024;
            canvasText.height = 256;
            let ctxText = canvasText.getContext('2d');
            ctxText.fillStyle = "rgba(0,0,0,0)";
            ctxText.fillRect(0, 0, 1024, 256);

            let textStr = FLOATING_TEXTS[i % FLOATING_TEXTS.length];
            let fontSize = 85;
            ctxText.font = `bold ${fontSize}px 'Dancing Script', Arial, sans-serif`;
            let textWidth = ctxText.measureText(textStr).width;

            // Asegurar que el texto y sus sombras/adornos quepan completos sin ningún recorte
            while (textWidth > 860 && fontSize > 40) {
                fontSize -= 4;
                ctxText.font = `bold ${fontSize}px 'Dancing Script', Arial, sans-serif`;
                textWidth = ctxText.measureText(textStr).width;
            }

            ctxText.textAlign = "center";
            ctxText.textBaseline = "middle";
            ctxText.fillStyle = "#FFFFFF";
            ctxText.shadowColor = "#FFD700";
            ctxText.shadowBlur = 15;
            ctxText.fillText(textStr, 512, 128);

            let texText = new THREE.CanvasTexture(canvasText);
            texText.needsUpdate = true;
            let matText = new THREE.SpriteMaterial({
                map: texText, transparent: true, depthWrite: false
            });
            let textSprite = new THREE.Sprite(matText);

            // Tamaño legible con proporción 4:1
            textSprite.scale.set(4.2, 1.05, 1);

            // Posición dinámica: siempre por encima del borde superior de la flor
            // La flor mide 'size' de alto, por lo que su borde superior en coords locales es size/2.
            textSprite.position.set(0, (size / 2) + 0.6, 0);

            mesh.add(textSprite);
        }

        scene.add(mesh);
        flowers.push(mesh);
        flowerMeshes.push(mesh);
    }
}



function onResize() {
    isMobile = (window.innerWidth <= 768) || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function getEventCoordinates(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    if (e.clientX !== undefined && e.clientY !== undefined) {
        return { x: e.clientX, y: e.clientY };
    }
    return null;
}

function updatePointerNDC(clientX, clientY) {
    if (!renderer || !renderer.domElement) return;
    let rect = renderer.domElement.getBoundingClientRect();
    pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    mouseTarget.x = pointerNDC.x;
    mouseTarget.y = pointerNDC.y;
}

function onPointerMove(e) {
    let coords = getEventCoordinates(e);
    if (!coords) return;
    updatePointerNDC(coords.x, coords.y);
}

function findFlowerAtCoordinates(clientX, clientY) {
    if (!renderer || !renderer.domElement || !camera) return null;
    let rect = renderer.domElement.getBoundingClientRect();
    let ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    let ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

    // 1. Raycast directo (con recursive=true para detectar la flor o su texto 3D hijo)
    let tempRay = new THREE.Raycaster();
    tempRay.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    let hits = tempRay.intersectObjects(flowerMeshes, true);

    if (hits.length > 0) {
        for (let i = 0; i < hits.length; i++) {
            let obj = hits[i].object;
            if (obj.userData && obj.userData.idx !== undefined && obj.userData.idx >= 0) {
                return obj.userData.idx;
            }
            if (obj.parent && obj.parent.userData && obj.parent.userData.idx !== undefined && obj.parent.userData.idx >= 0) {
                return obj.parent.userData.idx;
            }
        }
    }

    // 2. Detección por proximidad táctil en pantalla (Crucial para dedos en Android)
    // El área de contacto de un dedo es mayor que un píxel de mouse (~55px)
    let touchThreshold = isMobile ? 55 : 30; // Radio generoso en píxeles de pantalla
    let closestIdx = null;
    let closestDist = Infinity;
    let tempV = new THREE.Vector3();

    for (let i = 0; i < flowerMeshes.length; i++) {
        let fMesh = flowerMeshes[i];
        fMesh.getWorldPosition(tempV);
        tempV.project(camera);

        // Solo considerar flores que estén frente a la cámara (z entre 0 y 1)
        if (tempV.z > 0 && tempV.z < 1) {
            let screenX = (tempV.x * 0.5 + 0.5) * rect.width + rect.left;
            let screenY = (-tempV.y * 0.5 + 0.5) * rect.height + rect.top;
            let dist = Math.hypot(clientX - screenX, clientY - screenY);

            if (dist < touchThreshold && dist < closestDist) {
                closestDist = dist;
                closestIdx = fMesh.userData.idx;
            }
        }
    }

    return closestIdx;
}

let lastInteractionTime = 0;

function handleFlowerPress(e) {
    if (isCardOpen) return;
    let now = Date.now();
    if (now - lastInteractionTime < 350) return; // Evitar dobles disparos en touch

    let coords = getEventCoordinates(e);
    if (!coords) return;

    updatePointerNDC(coords.x, coords.y);

    let idx = findFlowerAtCoordinates(coords.x, coords.y);
    if (idx !== null && idx >= 0) {
        lastInteractionTime = now;
        openCard(idx);

        // Detener propagación para que OrbitControls no mueva la cámara al presionar la flor
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e.stopPropagation) e.stopPropagation();
        if (e.cancelable && e.preventDefault) e.preventDefault();
    }
}

function onFlowerTouchStart(e) {
    // Disparo inmediato al presionar la flor con el dedo en móviles Android
    handleFlowerPress(e);
}

function onFlowerPointerDown(e) {
    // Para mouse de escritorio o stylus
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
        handleFlowerPress(e);
    }
}

function openCard(idx) {
    isCardOpen = true;
    if (controls) controls.enabled = false; // Pausar rotación mientras la carta está abierta
    let msg;
    if (idx === 999) {
        msg = {
            title: "Amistad sincera 🌻",
            text: "Una rosa solitaria en medio del universo como detalle especial para celebrar una amistad bonita, alegre y sincera. ¡Gracias por tu gran amistad, Juany!"
        };
    } else {
        msg = MESSAGES[idx % MESSAGES.length];
    }
    document.getElementById('card-title').textContent = msg.title;
    document.getElementById('card-msg').textContent = msg.text;
    document.getElementById('card-overlay').classList.add('show');
}

function closeCard() {
    isCardOpen = false;
    document.getElementById('card-overlay').classList.remove('show');
    if (controls && !isZoomingIn && !isZoomingOut) {
        controls.enabled = true;
    }
}

function setupAudio() {
    let btn = document.getElementById('btn-music');
    let audio = document.getElementById('bg-audio');

    btn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            btn.textContent = '🔊';
        } else {
            audio.pause();
            btn.textContent = '🔇';
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    let t = clock.getElapsedTime();

    if (isZoomingIn) {
        // Velocidad aumentada para un viaje de zoom más rápido y dinámico (0.026)
        camera.position.lerp(cameraTargetPos, 0.026);
        if (camera.position.distanceTo(cameraTargetPos) < 1.5) {
            isZoomingIn = false;
            isZoomingOut = true; // Inicia el alejamiento sutil final
        }
    } else if (isZoomingOut) {
        // Alejamiento suave pero más ágil para encuadrar la galaxia (0.015)
        camera.position.lerp(cameraTargetPosOut, 0.015);
        if (camera.position.distanceTo(cameraTargetPosOut) < 0.8) {
            isZoomingOut = false;
            controls.enabled = true; // Habilitar controles al terminar toda la cinemática
        }
    }

    controls.update(); // OrbitControls toma el control de la cámara

    // Animate Stars
    if (starParticles) starParticles.rotation.y = t * 0.01;

    // La galaxia ahora es estática por petición del usuario (ahorra muchísimo rendimiento)

    // Animar Rosa Solitaria central y texto "Amistad 🌻"
    if (solitaryRoseGroup) {
        solitaryRoseGroup.lookAt(camera.position); // Mira suavemente hacia la cámara
        let floatY = 9.5 + Math.sin(t * 1.5) * 0.45;
        solitaryRoseGroup.position.y = floatY;

        if (solitaryParticles) {
            solitaryParticles.rotation.y = t * 0.25;
            solitaryParticles.rotation.z = t * 0.12;
        }

        if (solitaryTextSprite) {
            let pulse = 1 + Math.sin(t * 2.2) * 0.04;
            solitaryTextSprite.scale.set(16 * pulse, 4 * pulse, 1);
        }
    }

    // Flowers (Hover y Billboard)
    raycaster.setFromCamera(pointerNDC, camera);
    let hits = raycaster.intersectObjects(flowerMeshes, true);
    let hoveredIdx = -1;
    if (hits.length > 0) {
        let obj = hits[0].object;
        if (obj.userData && obj.userData.idx !== undefined && obj.userData.idx >= 0) {
            hoveredIdx = obj.userData.idx;
        } else if (obj.parent && obj.parent.userData && obj.parent.userData.idx !== undefined && obj.parent.userData.idx >= 0) {
            hoveredIdx = obj.parent.userData.idx;
        }
    }

    flowers.forEach(f => {
        let d = f.userData;

        f.lookAt(camera.position); // Billboard estático

        d.targetScale = (d.idx === hoveredIdx && !isCardOpen) ? d.scale * 1.3 : d.scale;
        let s = f.scale.x + (d.targetScale - f.scale.x) * 0.1;
        f.scale.set(s, s, s);
    });

    renderer.render(scene, camera);
}
