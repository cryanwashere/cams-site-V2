
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
document.onkeydown = function (e) {
    console.log(camera.position);
    console.log(camera.rotation);
}

/*
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
*/

/*

    main animation loop

*/

//const gridHelper = new THREE.GridHelper(200,50);
//scene.add( gridHelper );

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
}