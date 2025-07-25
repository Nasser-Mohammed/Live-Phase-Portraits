// Generalized ODE phase space simulation and bifurcation explorer

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

let ctx2d;
let renderer3d;
let scene3d, camera3d, cube3d;

let ctx;
const dt = 0.01;
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



class oneDimensionalSystems{
  constructor(){
    this.choice = "logistic";
    this.state = {x:0};
    this.timeRes = width/20000; //temporal resolution
    this.spaceRes = height/6000;
    this.timeSteps = Math.floor(width/20000);
    this.numOfIC = Math.floor(6000/height);
    this.history = [];
    this.options = new Map([
      ["logistic", (P) => this.logistic(P)]
    ]);
  }

  drawPhaseSpace(){
    //create a canvas with natural curves
    //the animation will then place some streams of fluids to run on these curves
    let index = 0;
    for (let initialCondition = -height/2; initialCondition < height/2; initialCondition += spaceRes){
      this.history.push([initialCondition])
      let secIdx = 1;
      for (let delT = 0; delT < this.timeRes; delT += dt){
        let newX = this.eulerStep(this.history[index][secIdx-1]);
        this.history[index].push(newX);
      }
    }
  }

  logistic(P){
    //P' = rP(1-P/K);
    const K = 1000;
    const r = 1.5;

    return r*P*(1-P/K)
  }

  eulerStep(x){
    const fn = this.options.get(this.choice);
    const dx = fn(x);
    //this.state.x = this.state.x + dx*dt;
    //this.history.push(this.state.x);
    console.log("new state: ", this.state.x);
    return x + dx*dt;
  }
}

class twoDimensionalSystems{
  constructor(){
    this.choice = "lotka";
    this.options = new Map([
      ["lotka", (t) => this.lotka(t)]
    ]);
  }

  lotka(t){
    console.log("pog champ");
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
  ctx2d.beginPath();
  ctx2d.lineWidth = 3;
  ctx2d.strokeStyle = "red";
  ctx2d.moveTo(0, dimensionSystem.history[0] + 400);
  for(let i = 0; i < dimensionSystem.history.length; i++){
    let t = 0;
    ctx2d.beginPath();
    for(let j = 0; j < dimensionSystem.history[i].length; j++){
      ctx2d.lineTo(t, dimensionSystem.history[i][j]);
      t += dt;
    }
    ctx2d.stroke();
  }
  ctx2d.stroke();
}

function draw3dSystem(){

}


function animate() {
  animationId = requestAnimationFrame(animate);

  if (dimension === 3) {
    // 3D render with Three.js
    cube3d.rotation.x += 0.01;
    cube3d.rotation.y += 0.01;
    cube3d.position.z -= 0.01;
    renderer3d.render(scene3d, camera3d);
    draw3dSystem();
  } else {
    // 2D render with canvas
    ctx2d.fillStyle = "black";
    ctx2d.fillRect(0, 0, ctx2d.canvas.width, ctx2d.canvas.height);

    dimensionSystem.drawPhaseSpace();
    // Call your 1D or 2D system draw functions here
    draw2dSystem();
  }
}




document.addEventListener("DOMContentLoaded", () => {
  const canvas2d = document.getElementById("canvas2d");
  const canvas3d = document.getElementById("canvas3d");

  // Contexts
  ctx2d = canvas2d.getContext("2d");
  height = canvas2d.height;
  width = canvas2d.width;
  midHeight = Math.floor(height/2);
  midWidth = Math.floor(width/2);
  ctx2d.fillStyle = "black";
  ctx2d.fillRect(0, 0, width, height);

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
    }
  });

  animate();
});

