const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer( {
    canvas : document.querySelector('#bg')
} );
renderer.setSize( window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function makeSphereMarker() {
    const geometry = new THREE.SphereGeometry( 15, 32, 16 );
    const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    const sphere = new THREE.Mesh( geometry, material );
    return sphere;
}

function makeNetworkLayerMesh( width, height, channels) {
    const geometry = new THREE.BoxGeometry( width, height, channels );
    const material = new THREE.MeshBasicMaterial(  );
    const mesh = new THREE.Mesh( geometry, material );
    return mesh;
}


class MeshArray {
    constructor( meshArray ) { 
        this.meshArray = meshArray;

        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;
    }

    addToScene() {
        this.meshArray.forEach((mesh) => {
            scene.add( mesh );
        })
    }

    setRotationX( rotationX ) {
        this.rotationX = rotationX;
        this.meshArray.forEach((mesh) => {
            mesh.rotation.x = rotationX;
        })
    }
}



function makeTensorMesh( array, shape ) {
    /* 
       
        take a 3D tensor, and turn it into a 3D mesh of each value of the tensor

    */

    var meshArray = [];


    for (let i=0;i<shape[0];i++) {
        for (let j=0;j<shape[1];j++) {
            for(let k=0;k<shape[2];k++) {
                const pixelValue = array[k*shape[0]*shape[1] + i*shape[0] + j]; // I think that should work

                const pixelGeometry = new THREE.BoxGeometry( 1, 1, 1 );
                const material = new THREE.MeshBasicMaterial({
                    transparent : true,
                    opacity : pixelValue
                });
                const mesh = new THREE.Mesh( pixelGeometry, material );

                mesh.position.x = i;
                mesh.position.y = j;
                mesh.position.z = k;

                meshArray.push(mesh);
            }
        }
    }

    return new MeshArray( meshArray );

}



/* 

    load the data for the neural network

*/

/*

import { MnistData } from "./data.js";
async function loadData() {    
    const data = new MnistData();
    await data.load();

    var inputImage = data.nextTestBatch(1).xs;
    inputImage = Array.from(inputImage.dataSync());

    let meshArray = makeTensorMesh( inputImage, [28,28,1] );
    meshArray.addToScene();

    meshArray.setRotationX(1);


}
document.addEventListener('DOMContentLoaded', loadData);
*/



/*

    main animation loop

*/

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const controls = new 

camera.position.z = 5;
function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
animate();




/*

    Scrolling elements:
    this makes the elements scroll when they are viewed

*/

/*
const observer = new IntersectionObserver((entries) => {
    
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        } else {
            entry.target.classList.remove('show');
        }

    });
})
const hiddenElements = document.querySelectorAll('.hidden');

hiddenElements.forEach((el) => observer.observe(el));
*/