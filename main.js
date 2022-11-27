const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer( {
    canvas : document.querySelector('#bg')
} );
renderer.setSize( window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


function makeLineBoxMesh( shape, transform ) {
    const material = new THREE.LineBasicMaterial();


    const points = [
        new THREE.Vector3( 0, 0, 0),
        new THREE.Vector3( 0, shape[1], 0),
        new THREE.Vector3( shape[0], shape[1], 0),
        new THREE.Vector3( shape[0], 0, 0),
        new THREE.Vector3( 0, 0, 0),
        new THREE.Vector3( 0, 0, shape[2]),
        new THREE.Vector3( 0, shape[1], shape[2]),
        new THREE.Vector3( 0, shape[1], 0),
        new THREE.Vector3( 0, shape[1], shape[2]),
        new THREE.Vector3( shape[0], shape[1], shape[2]),
        new THREE.Vector3( shape[0], shape[1], 0),
        new THREE.Vector3( shape[0], shape[1], shape[2]),
        new THREE.Vector3( shape[0], 0, shape[2]),
        new THREE.Vector3( shape[0], 0, 0),
        new THREE.Vector3( shape[0], 0, shape[2]),
        new THREE.Vector3( 0, 0, shape[2]),
    ]
    points.forEach((point) => {
        point.x += transform[0];
        point.y += transform[1];
        point.z += transform[2];
    })
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( geometry, material );

    
    return line;
}


class NetworkMesh {
    constructor( tensorMeshArrays ) {}
}



class MeshArray {

    /*
    
        This stores an array of cube meshes, which can represent a tensor
    
    */

    constructor( array, shape ) { 
        /* 
       
        take a 3D tensor, and turn it into a 3D mesh of each value of the tensor

        */

        this.meshArray = [];

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

                    this.meshArray.push(mesh);
                }
            }
        }
    }

    addToScene() {
        this.meshArray.forEach((mesh) => {
            scene.add( mesh );
        })
    }

    transformX( bias ) {
        this.meshArray.forEach((mesh) => {
            mesh.position.x += bias;
        });
    }
    transformY( bias ) {
        this.meshArray.forEach((mesh) => {
            mesh.position.y += bias;
        });
    }
    transformZ( bias ) {
        this.meshArray.forEach((mesh) => {
            mesh.position.z += bias;
        });
    }
}




/* 

    load the data for the neural network

*/



import { MnistData } from "./data.js";
async function loadData() {    
    const data = new MnistData();
    await data.load();


    var inputImage = data.nextTestBatch(1).xs.reshape([28,28]).transpose();
    inputImage = Array.from(inputImage.dataSync());

    let meshArray = new MeshArray( inputImage, [28,28,1] );
    meshArray.addToScene();
    
    const lineMesh = makeLineBoxMesh( [28,28,1], [0,0,0] );
    scene.add( lineMesh );

    const filterMesh = makeLineBoxMesh( [5,5,1], [6,28-6-5,0]);
    scene.add( filterMesh );

    meshArray.transformZ( 0.5 );


}
document.addEventListener('DOMContentLoaded', loadData);




/*

    main animation loop

*/



const gridHelper = new THREE.GridHelper(200,50);
//scene.add( gridHelper );

import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';
const controls = new OrbitControls( camera, renderer.domElement );

camera.position.z = 30;
function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );

    controls.update();
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