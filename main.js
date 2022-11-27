/*

    initialize the model

*/

function getModel() {
    const model = tf.sequential();

    const IMAGE_WIDTH = 28;
    const IMAGE_HEIGHT = 28;
    const IMAGE_CHANNELS = 1; 
    
    // In the first layer of our convolutional neural network we have 
    // to specify the input shape. Then we specify some parameters for 
    // the convolution operation that takes place in this layer.
    model.add(tf.layers.conv2d({
      inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
      kernelSize: 5,
      filters: 8,
      strides: 1,
      activation: 'relu',
      kernelInitializer: 'varianceScaling'
    }));
  
    // The MaxPooling layer acts as a sort of downsampling using max values
    // in a region instead of averaging.  
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));
    
    // Repeat another conv2d + maxPooling stack. 
    // Note that we have more filters in the convolution.
    model.add(tf.layers.conv2d({
      kernelSize: 5,
      filters: 16,
      strides: 1,
      activation: 'relu',
      kernelInitializer: 'varianceScaling'
    }));
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));
    
    // Now we flatten the output from the 2D filters into a 1D vector to prepare
    // it for input into our last layer. This is common practice when feeding
    // higher dimensional data to a final classification output layer.
    model.add(tf.layers.flatten());
  
    // Our last layer is a dense layer which has 10 output units, one for each
    // output class (i.e. 0, 1, 2, 3, 4, 5, 6, 7, 8, 9).
    const NUM_OUTPUT_CLASSES = 10;
    model.add(tf.layers.dense({
      units: NUM_OUTPUT_CLASSES,
      kernelInitializer: 'varianceScaling',
      activation: 'softmax'
    }));
  
    
    // Choose an optimizer, loss function and accuracy metric,
    // then compile and return the model
    const optimizer = tf.train.adam();
    model.compile({
      optimizer: optimizer,
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });
  
    return model;
}
function inferenceModel( model, batch ) {
    const newModel = tf.model({inputs: model.inputs, outputs: [model.layers[0].output, model.layers[2].output, model.layers[5].output]});
    var batch = data.nextTestBatch(1);
    const label = batch.labels; //this may be used later
    batch = batch.xs.reshape([1,28,28,1]);
    return [newModel.predict(batch), batch];
}

class Model {
    constructor() {
        this.model = getModel();
    }

    inference( xs ) {
        const newModel = tf.model({inputs: this.model.inputs, outputs: [this.model.layers[0].output, this.model.layers[2].output, this.model.layers[5].output]});
        const batch = xs.reshape([1,28,28,1]);
        return newModel.predict(batch);
    }
    
}

/*

    making the 3D animation

*/

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

/*

    Classes for displaying tensors in 3D

*/


class MeshArray {

    /*
    
        This stores an array of cube meshes, which can represent a tensor
    
    */

    constructor( tensor ) { 
        /* 
       
        take a 3D tensor, and turn it into a 3D mesh of each value of the tensor

        */

        this.meshArray = [];
        this.position = {
            x : 0,
            y : 0,
            z : 0
        };
        this.shape = tensor.shape;
        const shape = tensor.shape;

        console.log(shape);
        tensor = tensor.transpose();   
        for (let i=0;i<this.shape[2];i++) {  // iterate through each channel of the tensor

            var meshSlice = tf.gather( tensor, i ).transpose();
            const min = meshSlice.min();
            const max = meshSlice.max();
            meshSlice = meshSlice.sub(min).div(max.sub(min)); // normalize between [0,1]
            meshSlice = meshSlice.squeeze();
            const meshArray = meshSlice.dataSync();
            for (let m=0;m<shape[0];m++) {
                for (let n=0;n<shape[1];n++) {
                    const pixelValue = meshArray[(m*shape[0]) + n];

                    if (pixelValue > 0.01) {
                        const pixelGeometry = new THREE.BoxGeometry( 1, 1, 1 );
                        const material = new THREE.MeshBasicMaterial({
                            transparent : true,
                            opacity : pixelValue
                        });
                        const mesh = new THREE.Mesh( pixelGeometry, material );
                        mesh.position.x = n;
                        mesh.position.y = shape[0]-m; // matrix 'y' indexes move downwards
                        mesh.position.z = i;

                        this.meshArray.push(mesh);
                    }
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
        this.position.x += bias;
        this.meshArray.forEach((mesh) => {
            mesh.position.x += bias;
        });
    }
    transformY( bias ) {
        this.position.y += bias;
        this.meshArray.forEach((mesh) => {
            mesh.position.y += bias;
        });
    }
    transformZ( bias ) {
        this.position.z += bias;
        this.meshArray.forEach((mesh) => {
            mesh.position.z += bias;
        });
    }
}




class TensorStackMesh {
    constructor() {
        this.tensorMeshList = [];
    }

    addTensor( array ) {
        const tensorMeshArray = new MeshArray( array );
        
        var lastZValue;
        if (this.tensorMeshList.length != 0) {
            lastZValue = this.tensorMeshList[this.tensorMeshList.length - 1].position.z;
            tensorMeshArray.transformZ(lastZValue + 10);
        } else {
            lastZValue = 0;
        }
        this.tensorMeshList.push( tensorMeshArray );
    }

    addWireGrid( index ) {
        const lineMesh = makeLineBoxMesh( [28,28,1], [0,0,
            this.tensorMeshList[index].position.z - 0.5
        ] );
        scene.add( lineMesh );
    }

    addToScene() {
        this.tensorMeshList.forEach((tensorMesh) => {
            tensorMesh.addToScene();
        })
    }

}

/* 

    load the data for the neural network

*/



import { MnistData } from "./data.js";
async function loadData() {    
    const data = new MnistData();
    await data.load();

    const model = new Model();


    const inputImageTensor = data.nextTestBatch(1).xs.reshape([28,28,1]);

    //let meshArray = new MeshArray( inputImage, [28,28,1] );
    //meshArray.addToScene();
    
    //const lineMesh = makeLineBoxMesh( [28,28,1], [0,0,20.5] );
    //scene.add( lineMesh );

    //const filterMesh = makeLineBoxMesh( [5,5,1], [6,28-6-5,0]);
    //scene.add( filterMesh );

    //meshArray.transformZ( 0.5 );

    const networkMesh = new TensorStackMesh();
    networkMesh.addTensor( inputImageTensor );

    

    const output = model.inference( inputImageTensor );

    networkMesh.addTensor( output[0].reshape([24,24,8]) );
    networkMesh.addTensor( output[1].reshape([8,8,16]) );
    networkMesh.addTensor( output[2].reshape([1,10,1]) );

     
    networkMesh.addToScene();
    //networkMesh.addWireGrid( 0 );
}
document.addEventListener('DOMContentLoaded', loadData);




/*

    main animation loop

*/



const gridHelper = new THREE.GridHelper(200,50);
scene.add( gridHelper );

import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';
const controls = new OrbitControls( camera, renderer.domElement );
//controls.autoRotate=true;

camera.position.z = 60;
camera.position.y = 20;
function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );

    controls.update();
}
animate();



/*

    This manages the scene while the user is scrolling

*/
function updateCamera( ev ) {
    console.log(window.scrollY);
    camera.position.z += window.scrollY / 500;
}
//window.addEventListener( "scroll", updateCamera ); 




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