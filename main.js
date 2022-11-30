/*

    Scroll indicator:
    indicate how much the user has scrolled as they view the web page

*/

window.onscroll = () => {
    var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var scrolled = (winScroll / height) * 100;
    document.getElementById("myBar").style.width = scrolled + "%";
}


/*

    Scrolling elements:
    this makes the elements scroll when they are viewed

*/


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

    train ( data, epochs ) {
        const BATCH_SIZE = 128;
        const TRAIN_DATA_SIZE = 5500;
        const TEST_DATA_SIZE = 1000;
        
        const [trainXs, trainYs] = tf.tidy(() => {
            const d = data.nextTrainBatch(TRAIN_DATA_SIZE);
            return [
                d.xs.reshape([TRAIN_DATA_SIZE, 28, 28, 1]),
                d.labels
            ];
        });

        const [testXs, testYs] = tf.tidy(() => {
            const d = data.nextTestBatch(TEST_DATA_SIZE);
            return [
                d.xs.reshape([TEST_DATA_SIZE, 28, 28, 1]),
                d.labels
            ];
        });

        this.model.fit( trainXs, trainYs, {
            batchSize : BATCH_SIZE,
            validationData : [testXs, testYs],
            epochs : epochs,
            shuffle : true,
            callbacks : {
                onEpochEnd : ( epoch, logs ) => {
                    console.log("finished epoch " + epoch);
                }
            }
        });

    }
    
}

/*

    making the 3D animation

*/


function makeLine( position1, position2 ) {
    const points = [
        new THREE.Vector3( position1.x, position1.y, position1.z),
        new THREE.Vector3( position2.x, position2.y, position2.z)
    ];

    const material = new THREE.LineBasicMaterial();
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( geometry, material );
    return line; 
}

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
    ];
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

        //console.log(shape);
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

                    if (pixelValue > 0.1) {
                        const pixelGeometry = new THREE.BoxGeometry( 1, 1, 1 );
                        const material = new THREE.MeshBasicMaterial({
                            transparent : true,
                            opacity : pixelValue
                        });
                        const mesh = new THREE.Mesh( pixelGeometry, material );
                        mesh.position.x = n;
                        mesh.position.y = shape[1]-m; // matrix 'y' indexes move downwards
                        mesh.position.z = i;

                        this.meshArray.push(mesh);
                    }
                }
            }
        }

    }

    addOutlineMesh( scene ) {
        const lineMesh = makeLineBoxMesh( this.shape, 
            [this.position.x - 0.5, this.position.y + 0.5, this.position.z - 0.5] );
        scene.add( lineMesh );
    }

    report() {
        return this.meshArray.length;
    }
    addToScene( scene ) {
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
    /*
    
        This holds and manages a list of tensor mesh arrays,
        
        it can be used for displaying the activations of a neural network, or
        for showing several images
    
    */
    constructor() {
        this.tensorMeshList = [];
        this.lineList = [];
    }

    addTensor( array ) {
        const tensorMeshArray = new MeshArray( array );
        
        // we need to assure that the tensor is positioned properly relative to 
        // the last tensor.
        if (this.tensorMeshList.length != 0) {
            const lastTensorMesh = this.tensorMeshList[this.tensorMeshList.length - 1]

            //move it out of the way so that it can be viewed
            tensorMeshArray.transformZ( lastTensorMesh.position.z + lastTensorMesh.shape[2] + (lastTensorMesh.shape[0]/2) + 5 );

            //move it behind the center of the last tensor

            //transform along the X axis
            if (tensorMeshArray.shape[0] > lastTensorMesh.shape[0]) {
                const dX = parseInt(tensorMeshArray.shape[0] / 2) - parseInt(lastTensorMesh.shape[0] / 2);
                //tensorMeshArray.transformX( dX );
            } else {
                const dX = parseInt(tensorMeshArray.shape[0] / 2) + parseInt(lastTensorMesh.shape[0] / 2) - tensorMeshArray.shape[0];
                tensorMeshArray.transformX( dX );
            }
            tensorMeshArray.transformX( lastTensorMesh.position.x );
            
            //transform along the Y axis
            if (tensorMeshArray.shape[1] > lastTensorMesh.shape[1]) {
                const dY = parseInt(tensorMeshArray.shape[1] / 2) - parseInt(lastTensorMesh.shape[1] / 2);
                tensorMeshArray.transformY( dY );
            } else {
                const dY = parseInt(tensorMeshArray.shape[1] / 2) + parseInt(lastTensorMesh.shape[1] / 2) - tensorMeshArray.shape[1];
                tensorMeshArray.transformY( dY );
            }
            tensorMeshArray.transformY( lastTensorMesh.position.y );

        } 

        this.tensorMeshList.push( tensorMeshArray );
    }

    addLayerConnections() {
        for (let i=1;i<this.tensorMeshList.length;i++) {
            const lastTensorMesh = this.tensorMeshList[i - 1];
            const tensorMesh = this.tensorMeshList[i];
            
            const l1 = this.makeConnectionLine( lastTensorMesh, tensorMesh,
                {
                    x : 0,
                    y : 0,
                    z : 0
                },
                {
                    x : 0,
                    y : 0,
                    z : 0
                }
            );
            const l2 = this.makeConnectionLine( lastTensorMesh, tensorMesh,
                {
                    x : 0,
                    y : lastTensorMesh.shape[1],
                    z : 0
                },
                {
                    x : 0,
                    y : tensorMesh.shape[1],
                    z : 0
                }
            );
            const l3 = this.makeConnectionLine( lastTensorMesh, tensorMesh,
                {
                    x : lastTensorMesh.shape[0],
                    y : 0,
                    z : 0
                },
                {
                    x : tensorMesh.shape[0],
                    y : 0,
                    z : 0
                }
            );
            const l4 = this.makeConnectionLine( lastTensorMesh, tensorMesh,
                {
                    x : lastTensorMesh.shape[0],
                    y : lastTensorMesh.shape[1],
                    z : 0
                },
                {
                    x : tensorMesh.shape[0],
                    y : tensorMesh.shape[1],
                    z : 0
                }
            );
            this.lineList.push( l1 );
            this.lineList.push( l2 );
            this.lineList.push( l3 );
            this.lineList.push( l4 );
        }
    }
    makeConnectionLine( lastTensorMesh, tensorMesh, transformA, transformB ) {
        return makeLine(
            {
                x : lastTensorMesh.position.x - 0.5 + transformA.x,
                y : lastTensorMesh.position.y + 0.5 + transformA.y,
                z : lastTensorMesh.position.z + lastTensorMesh.shape[2] - 0.5 + transformA.z
            },
            {
                x : tensorMesh.position.x - 0.5 + transformB.x,
                y : tensorMesh.position.y + 0.5 + transformB.y,
                z : tensorMesh.position.z - 0.5 + transformB.z
            }
        );
    }

    addOutlineMesh( scene ) {
        this.tensorMeshList.forEach((tensorMesh) => {
            tensorMesh.addOutlineMesh( scene );
        });
    }
    addToScene( scene ) {
        this.tensorMeshList.forEach((tensorMesh) => {
            tensorMesh.addToScene( scene );
        })
        this.lineList.forEach((line) => {
            scene.add( line );
        });
    }
    transformX( bias ) {
        this.tensorMeshList.forEach((tensorMesh) => {
            tensorMesh.transformX( bias );
        })
    } 
    transformY( bias ) {
        this.tensorMeshList.forEach((tensorMesh) => {
            tensorMesh.transformY( bias );
        })
    } 
    transformZ( bias ) {
        this.tensorMeshList.forEach((tensorMesh) => {
            tensorMesh.transformZ( bias );
        })
    } 
    getWidth() {
        var width = 0;
        for (let i=0;i<this.tensorMeshList.length;i++) {
            if (this.tensorMeshList[i].shape[0] > width) {
                width = this.tensorMeshList[i].shape[0];
            }
        }
        return width;
    }
    getHeight() {
        var height = 0;
        for (let i=0;i<this.tensorMeshList.length;i++) {
            if (this.tensorMeshList[i].shape[1] > width) {
                width = this.tensorMeshList[i].shape[1];
            }
        }
        return height;
    }
    getLength() {
        var sum = 0;
        for (let i=0;i<this.tensorMeshList.length;i++) {
            sum += this.tensorMeshList[i].shape[2];
        }
        return sum;
    }
    report() {
        // return the total number of cubes that are rendered
        var sum = 0;
        for (let i=0;i<this.tensorMeshList.length;i++) {
            sum += this.tensorMeshList[i].report();
        }
        return sum;
    }
}


/* 

    load the data for the neural network

*/

function makeNeuralNetworkMesh( model, inputImageTensor ) {
    const networkMesh = new TensorStackMesh();
    networkMesh.addTensor( inputImageTensor );
    const output = model.inference( inputImageTensor );
    networkMesh.addTensor( output[0].reshape([24,24,8]) );
    networkMesh.addTensor( output[1].reshape([8,8,16]) );
    networkMesh.addTensor( output[2].reshape([10,1,1]) );
    networkMesh.transformX( -networkMesh.getWidth() / 2 );
    networkMesh.transformZ( -networkMesh.getLength() / 2 );
    networkMesh.addOutlineMesh();
    networkMesh.addLayerConnections();
}


import { MnistData } from "./data.js";
async function loadData() {    
    const data = new MnistData();
    await data.load();
    console.log("loaded data");
    
    const model = new Model();
    const inputImageTensor = data.nextTestBatch(1).xs.reshape([28,28,1]);
    const networkMesh = new TensorStackMesh();
    networkMesh.addTensor( inputImageTensor );
    const output = model.inference( inputImageTensor );
    networkMesh.addTensor( output[0].reshape([24,24,8]) );
    networkMesh.addTensor( output[1].reshape([8,8,16]) );
    networkMesh.addTensor( output[2].reshape([10,1,1]) );
    networkMesh.transformX( -networkMesh.getWidth() / 2 );
    networkMesh.transformZ( -networkMesh.getLength() / 2 );
    networkMesh.addOutlineMesh( scene );
    networkMesh.addLayerConnections();
    networkMesh.addToScene( scene );
    console.log("added "+networkMesh.report()+" cubes to the scene");
    

    let sceneList = [];
    model.train( data, 10 );

    //const networkViewer = new NeuralNetworkViewer( data );
    //networkViewer.display();
}
document.addEventListener('DOMContentLoaded', loadData);


/*

    Neural network viewer animation rendering

*/

var scene = new THREE.Scene();
const canvas = document.getElementById("bg1");
const camera = new THREE.PerspectiveCamera( 75, canvas.clientWidth/canvas.clientHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer( {
    canvas : document.querySelector('#bg1')
} );

//renderer.setSize( window.innerWidth, window.innerHeight);
//renderer.setSize( document.body.clientWidth, document.body.clientHeight );
renderer.setSize( canvas.clientWidth, canvas.clientHeight );
//console.log( document.body.clientWidth, document.body.clientHeight );
//document.body.appendChild(renderer.domElement);
document.getElementById("viewer-1").appendChild( renderer.domElement );

/*

    main animation loop

*/

//const gridHelper = new THREE.GridHelper(200,50);
//scene.add( gridHelper );

import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';
const controls = new OrbitControls( camera, renderer.domElement );
controls.autoRotate=true;

camera.position.x = -32;
camera.position.y =  43;
camera.position.z =  26;
camera.rotation.x = -1.2715;
camera.rotation.y = -0.7488;
camera.rotation.z = -1.1453;
function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );

    controls.update();
}
animate();

document.onkeydown = function (e) {
    console.log(camera.position);
    console.log(camera.rotation);
}


/*

    This manages the scene while the user is scrolling

*/
/*
function updateCamera( ev ) {
    //console.log(window.scrollY);
    camera.position.z = 54 + window.scrollY / 50;
}
window.addEventListener( "scroll", updateCamera ); 
*/

/*

    3D background for the webpage 

*/

function addBackground() {
    const backgroundScene = new THREE.Scene();

    const backgroundCamera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    const backgroundRenderer = new THREE.WebGLRenderer({
        canvas : document.querySelector('#bg2')
    });
    backgroundRenderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( backgroundRenderer.domElement );

    function makeStarMesh() {
        const geometry = new THREE.SphereGeometry( 1, 8, 4 );
        const material = new THREE.MeshBasicMaterial();
        const sphere = new THREE.Mesh( geometry, material );
        return sphere;
    }
    function addStar() {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;

        const star = makeStarMesh();
        star.position.x = x;
        star.position.y = y;
        star.position.z = z;

        backgroundScene.add( star );
    }

    // make a bunch of randomly generated stars
    for (let i=0;i<100;i++) {
        addStar();
    }

    const gridHelper = new THREE.GridHelper(200,50);
    backgroundScene.add( gridHelper );
    const backgroundControls = new OrbitControls( camera, renderer.domElement );
    function animateBackground() {
        requestAnimationFrame( animateBackground );
        backgroundRenderer.render( backgroundScene, backgroundCamera );
        backgroundControls.update();
    }
    animateBackground();
    console.log("Background added");
}





// only import this here if the NeuralNetworkViewer class being used
// and thus it is not being used elsewhere
//
//import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';
class NeuralNetworkViewer {
    constructor ( data ) {
        /*
        
            This does all the stuff for the 3D neural network viewer,
            This does not really work with multiple neural networks 
            because of the div element


            Update: this thing is useless
        
        */

        //here works out the 3D rendering stuff
        this.scene = new THREE.Scene();
        const canvas = document.getElementById("bg1");
        this.camera = new THREE.PerspectiveCamera( 75, canvas.clientWidth/canvas.clientHeight, 0.1, 1000 );
        this.renderer = new THREE.WebGLRenderer( {
            canvas : document.querySelector('#bg1')
        } );
        this.renderer.setSize( canvas.clientWidth, canvas.clientHeight );
        document.getElementById("viewer-1").appendChild( this.renderer.domElement );

        //make the tensor mesh
        this.networkMesh = new TensorStackMesh();

        //the model 
        this.model = new Model();

        // this will be the display image that should be viewed every epoch
        this.inputImageTensor = data.nextTestBatch(1).xs.reshape([28,28,1]);

        // this is just for development
        const gridHelper = new THREE.GridHelper(200,50);
        this.scene.add( gridHelper );

        // this is for orbiting around the object
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );

        this.animate();


    }

    animate() {
        requestAnimationFrame( this.animate );
        this.renderer.render( this.scene, this.camera );
    
        this.controls.update();
    }

    display () {
        this.networkMesh.addTensor( this.inputImageTensor );

        const output = this.model.inference( this.inputImageTensor );

        this.networkMesh.addTensor( output[0].reshape([24,24,8]) );
        this.networkMesh.addTensor( output[1].reshape([8,8,16]) );
        this.networkMesh.addTensor( output[2].reshape([10,1,1]) );
        this.networkMesh.transformX( -this.networkMesh.getWidth() / 2 );
        this.networkMesh.transformZ( -this.networkMesh.getLength() / 2 );
        this.networkMesh.addOutlineMesh();
        this.networkMesh.addLayerConnections();
        
        this.networkMesh.addToScene();

    }


}