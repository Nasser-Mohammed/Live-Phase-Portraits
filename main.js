// Generalized ODE phase space simulation and bifurcation explorer

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

let ctx2d;
let renderer3d;
let scene3d, camera3d, cube3d;
let phaseCanvas = document.createElement("canvas");
let phaseCtx;
const dt = 0.001;
let frameCount = 0;
let simulationTime = 0;
let animationId = null;
let dimension = 1;
let oneD_system;
let twoD_system;
let threeD_system;
let dimensionSystem;
let height;
let width;
let midHeight;
let midWidth;

let dimensionMap = new Map()

let cachedBackground;

let fluidDrops = [];



class oneDimensionalSystems{
  constructor(){
    this.choice = "ySin";
    this.state = {x:0};
    this.timeRes = 1; //temporal resolution
    this.spaceRes = 30; //height/6000;
    this.timeSteps = Math.floor(width/this.timeRes);
    this.numOfIC = Math.floor(height/this.spaceRes);
    this.history = [];
    this.lastX = 0;
    this.inTimeOrPhase;
    this.options = new Map([
      ["logistic", (P) => this.logistic(P)],
      ["ySin", (y, t) => this.ySin(y,t)]
    ]);
  }

  drawPhaseSpace() {
    if (this.choice === "logistic"){
      //logistic is only for iniital conditions above 0
      //also we should mark K on the left somewhere
      phaseCtx.clearRect(0, 0, phaseCtx.canvas.width, phaseCtx.canvas.height);
      phaseCtx.fillStyle = "black";
      phaseCtx.fillRect(0, 0, phaseCtx.canvas.width, phaseCtx.canvas.height);
      phaseCtx.lineWidth = 5;
      phaseCtx.strokeStyle = "blue";
      phaseCtx.beginPath()
      phaseCtx.moveTo(0, height - 700 - 5);
      phaseCtx.lineTo(width, height - 700 - 5);
      phaseCtx.stroke()
      phaseCtx.beginPath();
      phaseCtx.moveTo(0, height - 5);
      phaseCtx.lineTo(width, height - 5);
      phaseCtx.stroke();
      phaseCtx.lineWidth = 1;
      phaseCtx.strokeStyle = "red";

      for (let y0 = 0; y0 < height; y0 += this.spaceRes) {
        let x = y0;
        phaseCtx.beginPath();
        phaseCtx.moveTo(0, height - x - 5);

        for (let step = 1; step < this.timeSteps; step++) {
          x = this.eulerStep(x);
          const t = step * dt*285; // scale time for visibility
          phaseCtx.lineTo(t, height - x - 5);
        }
        phaseCtx.stroke();
      }

      ctx2d.drawImage(phaseCanvas, 0, 0);
    }
    else if (this.choice === "ySin") {
      phaseCtx.clearRect(0, 0, phaseCtx.canvas.width, phaseCtx.canvas.height);
      phaseCtx.fillStyle = "black";
      phaseCtx.fillRect(0, 0, phaseCtx.canvas.width, phaseCtx.canvas.height);

      const scaleT = 1000; // scale time for canvas width
      const scaleY = 5;  // scale y-displacement

      phaseCtx.lineWidth = 1;
      phaseCtx.strokeStyle = "red";

      for (let y0 = -height/20; y0 < height/20; y0 += this.spaceRes / 4) {
        let y = y0;
        phaseCtx.beginPath();
        phaseCtx.moveTo(0, height / 2 - y * scaleY);

        for (let step = 1; step < this.timeSteps; step++) {
          y = this.eulerStep(y, step * dt);

          // Cap y to avoid runaway divergence
          if (!isFinite(y) || Math.abs(y) > 1e5) break;

          const t = step * dt * scaleT;
          const canvasY = height / 2 - y * scaleY;

          phaseCtx.lineTo(t, canvasY);
        }
        phaseCtx.stroke();
      }

      ctx2d.drawImage(phaseCanvas, 0, 0);
    }

}



  logistic(P){
    //P' = rP(1-P/K);
    const K = 700;
    const r = 1.1;

    return r*P*(1-P/K)
  }

  ySin(y, t){

    return y*Math.sin(t);
  }

  eulerStep(y, t = -1){
    let dy;
    if(t === -1){
    const fn = this.options.get(this.choice);
    dy = fn(y);
    }
    else{
      const fn = this.options.get(this.choice);
      dy = fn(y,t);
    }
    //this.state.x = this.state.x + dx*dt;
    //this.history.push(this.state.x);
    //console.log("new state: ", this.state.x);
    const delT = 0.01;
    return Math.max(-1e6, Math.min(1e6, y + dy * delT));
  }
}

class twoDimensionalSystems {
  constructor() {
    this.choice = "lotka";
    this.timeSteps = 7500;       // smooth trajectory
    this.spaceRes = 35;         // grid spacing for ICs (pixels)
    this.options = new Map([
      ["lotka", (x, y, t) => this.lotka(x, y, t)]
    ]);
  }

  drawPhaseSpace() {
    phaseCtx.clearRect(0, 0, phaseCtx.canvas.width, phaseCtx.canvas.height);
    phaseCtx.fillStyle = "black";
    phaseCtx.fillRect(0, 0, phaseCtx.canvas.width, phaseCtx.canvas.height);

    const xMin = 0.1, xMax = 8;
    const yMin = 0.1, yMax = 8;
    const cols = 11;  // ⬅️ reduced from 40 or 20
    const rows =11;

    const dx = (xMax - xMin) / cols;
    const dy = (yMax - yMin) / rows;

    const scaleX = width / (xMax - xMin);
    const scaleY = height / (yMax - yMin);

    


    phaseCtx.lineWidth = 1;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let x = xMin + i * dx;
        let y = yMin + j * dy;
        
        const colorHue = ((i * rows + j) / (cols * rows)) * 360;
        phaseCtx.strokeStyle = `hsl(${colorHue}, 100%, 60%)`;
        phaseCtx.strokeStyle = "rgba(220, 220, 220, 0.1)";


        phaseCtx.beginPath();
        phaseCtx.moveTo((x - xMin) * scaleX, height - (y - yMin) * scaleY);

        for (let step = 0; step < this.timeSteps; step++) {
          [x, y] = this.eulerStep(x, y, step * dt);
          if (!isFinite(x) || !isFinite(y)) break;

          const canvasX = (x - xMin) * scaleX;
          const canvasY = height - (y - yMin) * scaleY;
          phaseCtx.lineTo(canvasX, canvasY);
        }

        phaseCtx.stroke();
      }
    }

    ctx2d.drawImage(phaseCanvas, 0, 0);
  }

  lotka(x, y, t) {
    const alpha = 2;
    const beta = 1;
    const gamma = 1;
    const delta = 0.5;
    const dx = alpha * x - beta * x * y;
    const dy = -gamma * y + delta * x * y;
    return [dx, dy];
  }

  eulerStep(x, y, t = -1) {
    const fn = this.options.get(this.choice);
    const [dx, dy] = fn(x, y, t);
    const newX = Math.max(-1e6, Math.min(1e6, x + dx * dt));
    const newY = Math.max(-1e6, Math.min(1e6, y + dy * dt));
    return [newX, newY];
  }
}



class threeDimensionalSystems{
  constructor(){
    this.choice = "lorenz";
    this.options = new Map([
      ["lorenz", (t) => this.lorenz(t)]
    ]);
  }

  lorenz(t){
    console.log("just lorenzed everywhere");
  }

}


//function draws phase plane or 1d system with t
function draw2dSystem(){
  ctx2d.drawImage(phaseCanvas, 0, 0);

}

function draw3dSystem(){

}


let firstFrame = true;

function animate() {
  animationId = requestAnimationFrame(animate);

  // Optional: skip every other frame for performance
  if (frameCount++ % 1 !== 0) return;

  if (dimension === 3) {
    cube3d.rotation.x += 0.01;
    cube3d.rotation.y += 0.01;
    renderer3d.render(scene3d, camera3d);
    return;
  }

  // On first frame, restore static phase portrait
  if (firstFrame) {
    ctx2d.putImageData(cachedBackground, 0, 0);
    firstFrame = false;
  } else {
    // Fade trails only (doesn't erase background)
    ctx2d.putImageData(cachedBackground, 0, 0); // restore the static phase portrait
    ctx2d.fillStyle = "rgba(0, 0, 0, 0.08)";     // fade only trails
    ctx2d.fillRect(0, 0, width, height);

  }

  for (const drop of fluidDrops) {
    const [newX, newY] = twoD_system.eulerStep(drop.x, drop.y);
    drop.x = newX;
    drop.y = newY;

    const canvasX = ((newX - 0.1) / (8 - 0.1)) * width;
    const canvasY = height - ((newY - 0.1) / (8 - 0.1)) * height;

    drop.trail.push([canvasX, canvasY]);
    if (drop.trail.length > 600) drop.trail.shift();

    ctx2d.beginPath();
    ctx2d.moveTo(...drop.trail[0]);
    for (let i = 1; i < drop.trail.length; i++) {
      ctx2d.lineTo(...drop.trail[i]);
    }

    ctx2d.strokeStyle = drop.color;
    ctx2d.lineWidth = 5;
    ctx2d.globalAlpha = 1.0;
    ctx2d.stroke();
  }

  ctx2d.globalAlpha = 1.0; // reset alpha
}












document.addEventListener("DOMContentLoaded", () => {
  const canvas2d = document.getElementById("canvas2d");
  const canvas3d = document.getElementById("canvas3d");

  // Contexts
  ctx2d = canvas2d.getContext("2d", { willReadFrequently: true });
  height = canvas2d.height;
  width = canvas2d.width;
  midHeight = Math.floor(height/2);
  midWidth = Math.floor(width/2);
  ctx2d.fillStyle = "black";
  ctx2d.fillRect(0, 0, width, height);
  phaseCanvas.height = height;
  phaseCanvas.width = width;
  phaseCtx = phaseCanvas.getContext("2d");

  // Initialize 3D scene
  scene3d = new THREE.Scene();
                                      /*fov*/ /*aspect ratio*/ //how close to clip and how far to clip
  camera3d = new THREE.PerspectiveCamera(75 , width / height, 0.1, 1000);
  camera3d.position.z = 5;

  renderer3d = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
  renderer3d.setSize(width, height);

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshNormalMaterial();
  cube3d = new THREE.Mesh(geometry, material);
  scene3d.add(cube3d);

  // Set initial visibility
  canvas2d.style.display = "block";
  canvas3d.style.display = "none";

  // System classes
  oneD_system = new oneDimensionalSystems();
  twoD_system = new twoDimensionalSystems();
  threeD_system = new threeDimensionalSystems();
  dimensionMap.set(1, oneD_system);
  dimensionMap.set(2, twoD_system);
  dimensionMap.set(3, threeD_system);
  dimensionSystem = dimensionMap.get(dimension);

  // Dropdown handler
  const dimensionSelect = document.getElementById("dimension-select");
  dimensionSelect.addEventListener("change", (e) => {
    dimension = parseInt(e.target.value);
    dimensionSystem = dimensionMap.get(dimension);
    console.log("changed to dimension", dimension);

    if (dimension === 3) {
      canvas2d.style.display = "none";
      canvas3d.style.display = "block";
    } else {
      canvas2d.style.display = "block";
      canvas3d.style.display = "none";
      dimensionSystem.drawPhaseSpace();
      cachedBackground = ctx2d.getImageData(0, 0, width, height);
      firstFrame = true;

    }
  });

  canvas2d.addEventListener("click", (e) => {
      if (dimension !== 2) return;

      const rect = canvas2d.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      const xMin = 0.1, xMax = 8;
      const yMin = 0.1, yMax = 8;

      const x = xMin + (canvasX / width) * (xMax - xMin);
      const y = yMax - (canvasY / height) * (yMax - yMin); // flip y

      const colorHue = Math.floor(Math.random() * 360);
      const color = `hsl(${colorHue}, 100%, 70%)`;

      fluidDrops.push({ x, y, color, trail: [] });


      if (!animationId) animate();
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
    // Clear all particles
      fluidDrops = [];

      // Clear canvas
      ctx2d.clearRect(0, 0, width, height);
      ctx2d.fillStyle = "black";
      ctx2d.fillRect(0, 0, width, height);

      // Redraw background field
      dimensionSystem.drawPhaseSpace();
      cachedBackground = ctx2d.getImageData(0, 0, width, height);
      firstFrame = true;
    });



  dimensionSystem.drawPhaseSpace();

  //animate();
});

