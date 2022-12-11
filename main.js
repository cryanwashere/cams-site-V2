import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';

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

    async load () {
        this.model = await tf.loadLayersModel("model/my-model.json");
        console.log("loaded model");
    }

    inference( xs ) {
        const newModel = tf.model({inputs: this.model.inputs, outputs: [this.model.layers[0].output, this.model.layers[2].output, this.model.layers[5].output]});
        const batch = xs.reshape([1,28,28,1]);
        return newModel.predict(batch);
    }

    async train ( data, epochs ) {
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

        await this.model.fit( trainXs, trainYs, {
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


        tensor = tensor.transpose();   
        for (let i=0;i<this.shape[2];i++) {  // iterate through each channel of the tensor

            var meshSlice = tf.gather( tensor, i ).transpose();
            const min = meshSlice.min();
            const max = meshSlice.max();
            meshSlice = meshSlice.sub(min).div(max.sub(min)); // normalize between [0,1]
            meshSlice = meshSlice.squeeze();
            const meshArray = meshSlice.dataSync();
            
            
            if (shape[0] == 10) {
                console.log("hi");

                for (let m=0;m<10;m++) {
                    var pixelValue = meshArray[m];

                    if (pixelValue > 0.1) {
                        const pixelGeometry = new THREE.BoxGeometry( 1, 1, 1 );
                        const material = new THREE.MeshBasicMaterial({
                            transparent : true,
                            opacity : pixelValue
                        });
                        const mesh = new THREE.Mesh( pixelGeometry, material );
                        mesh.position.x = m;
                        mesh.position.y = 1; // matrix 'y' indexes move downwards
                        mesh.position.z = 0;

                        this.meshArray.push(mesh);
                    }
                }

            } else {

                for (let m=0;m<shape[0];m++) {
                    for (let n=0;n<shape[1];n++) {
                        
                        
                        
                        const index = (m*shape[0]) + n;
                        var pixelValue = meshArray[index];

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

        this.centerZ = 0;
    }

    addTensor( array ) {
        const tensorMeshArray = new MeshArray( array );
        
        // we need to assure that the tensor is positioned properly relative to 
        // the last tensor.
        if (this.tensorMeshList.length != 0) {
            const lastTensorMesh = this.tensorMeshList[this.tensorMeshList.length - 1]

            //move it out of the way so that it can be viewed
            const offset = lastTensorMesh.position.z + lastTensorMesh.shape[2] + (lastTensorMesh.shape[0]/2) + 5;
            tensorMeshArray.transformZ( offset );
            this.centerZ =  offset;

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
            if (this.tensorMeshList[i].shape[1] > height) {
                height = this.tensorMeshList[i].shape[1];
            }
        }
        return height;
    }
    centerPosition() {
        const centerX = this.getWidth() / 2;
        const centerY = this.getHeight() / 2;
        const centerZ = this.getLength() / 2;

        this.transformX( -centerX );
        this.transformY( -centerY );
        this.transformZ( -centerZ );
        
    }
    getLength() {
        return this.tensorMeshList[this.tensorMeshList.length - 1].position.z;
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





import { MnistData } from "./data.js";
async function loadData() {    
    const data = new MnistData();
    await data.load();
    console.log("loaded data");
    
    const model = new Model();
    await model.load();
    
    const inputImageTensor = data.nextTestBatch(1).xs.reshape([28,28,1]);
    


    // it is not an actual tensorflow model class
    //await model.train( data, 10 );
    //await model.model.save('downloads://my-model');


    const networkMesh = new TensorStackMesh();
    networkMesh.addTensor( inputImageTensor );
    const output = model.inference( inputImageTensor );
    networkMesh.addTensor( output[0].reshape([24,24,8]) );
    networkMesh.addTensor( output[1].reshape([8,8,16]) );

    networkMesh.addTensor( output[2].reshape([10,1,1]) );
    console.log( output[2].dataSync() );
    networkMesh.centerPosition();
    //networkMesh.transformX( -networkMesh.getWidth() / 2 );
    ///networkMesh.transformZ( -networkMesh.getLength() / 2 );
    

    networkMesh.addOutlineMesh( v1.scene );
    networkMesh.addLayerConnections();
    networkMesh.addToScene( v1.scene );
    v1.renderer.render( v1.scene, v1.camera );
    console.log("rendered neural network")

}
document.addEventListener('DOMContentLoaded', loadData);


class PDBData {
    /*
    
        This class takes in a pdb file in the form of a string
        it parses the file, and allows other objects to 
        interface with the protein data
    
    */

    constructor( PDBString ) {
        this.parse( PDBString );
    }
    parse( string ) {
        const lines = string.split('\n');

        const atoms = [];
        var chains = new Map();

        lines.forEach((line) => {
            

            if (line.substring(0,6) === "ATOM  ") {   // find the atoms in the file
                const atomRecord = {
                    serial: parseInt(line.substring(6,11)),
                    name: line.substring(12,16).trim(),
                    resName: line.substring(17,20).trim(),
                    chainID: line.substring(21,22).trim(),
                    resSeq: parseInt(line.substring(22,26)),
                    iCode: line.substring(26,27).trim(),
                    x: parseFloat(line.substring(30,38)),
                    y: parseFloat(line.substring(38,46)),
                    z: parseFloat(line.substring(46,54)),
                    occupancy: parseFloat(line.substring(54, 60)),
                    tempFactor: parseFloat(line.substring(60, 66)),
                    element: line.substring(76,78).trim(),
                    charge: line.substring(78,80).trim()
                };

                // check if the chain has already been documented, and if
                // it has not, then add it to the chain map
                if (!chains.get(atomRecord.chainID)) {
                    chains.set( atomRecord.chainID, {
                        chainID : atomRecord.chainID
                    });
                } 
                
                atoms.push( atomRecord );
            } 
        });

        // for each of the chains, add all of the atoms that 
        // are in the chain
        chains.forEach((chain) => {
            chain.atoms = atoms.filter((atom) => 
                atom.chainID === chain.chainID
            );
        });

        // for each of the chains, group all of the atoms into
        // residues
        chains.forEach((chain) => {
            const residues = new Map();
            chain.atoms.forEach((atom) => {
                if (!residues.get(atom.resSeq)) {
                    residues.set( atom.resSeq, {
                        resSeq : atom.resSeq
                    } );
                }
            });
            residues.forEach((residue) => {
                residue.atoms = atoms.filter((atom) =>
                    atom.resSeq === residue.resSeq && atom.chainID === chain.chainID
                );
            })
            chain.residues = residues;
        });

        console.log("Loaded PDB file:");
        console.log("chains: "+chains.size);
        console.log("atoms:  "+atoms.length);

       
        
        chains = Array.from(chains.values());
        chains.forEach((chain) => {
            chain.residues = Array.from(chain.residues.values());
        });
        console.log(chains);

        this.chains = chains;
        this.atoms  = atoms;

        this.findCenter();

    }
    findCenter() {

        this.center = {
            x : 0,
            y : 0,
            z : 0
        };
        
        
        this.numAtoms = this.atoms.length;

        this.atoms.forEach((atom) => {
            this.center.x += atom.x;
            this.center.y += atom.y;
            this.center.z += atom.z;
        });

        this.center.x /= this.numAtoms;
        this.center.y /= this.numAtoms;
        this.center.z /= this.numAtoms;

    }
}

/*

    These classes form meshes to represent the protein data

*/

class ProteinResidueMesh {
    constructor( residue ) {

        this.position = {
            x : 0,
            y : 0,
            z : 0
        }

        var numAtoms = 0;
        residue.atoms.forEach((atom) => {
            numAtoms += 1;

            this.position.x += atom.x;
            this.position.y += atom.y;
            this.position.z += atom.z;

        });
        
        this.position.x /= numAtoms;
        this.position.y /= numAtoms;
        this.position.z /= numAtoms;

    }
}

class ProteinChainMesh {
    constructor ( chain ) {
        this.residueMeshArray = [];
        chain.residues.forEach((residue) => {
            const residueMesh = new ProteinResidueMesh( residue );
            this.residueMeshArray.push( residueMesh );
        });

        this.lines = [];
    }
    makeLine( position1, position2, color ) {
        const points = [
            new THREE.Vector3( position1.x, position1.y, position1.z),
            new THREE.Vector3( position2.x, position2.y, position2.z)
        ];
      
        const material = new THREE.LineBasicMaterial( {color : color} );
        const geometry = new THREE.BufferGeometry().setFromPoints( points );
        const line = new THREE.Line( geometry, material );
        return line; 
    }
    makeResidueLines( color ) {
        var lastResiduePosition = this.residueMeshArray[0].position;
        for (let i=1; i<this.residueMeshArray.length; i++) {
            const thisResiduePosition = this.residueMeshArray[i].position;
            const line = this.makeLine(
                lastResiduePosition,
                thisResiduePosition,
                color
            );
            lastResiduePosition = thisResiduePosition;
            this.lines.push( line );
            //console.log("making residue line");
        }
    }
    addToScene( scene ) {
        this.lines.forEach((line) => {
            //console.log("adding residue line to scene");
            scene.add( line );
        });
    }
    transformX ( bias ) {
        this.lines.forEach((line) => {
            line.position.x += bias;
        });
    }
    transformY ( bias ) {
        this.lines.forEach((line) => {
            line.position.y += bias;
        });
    }
    transformZ ( bias ) {
        this.lines.forEach((line) => {
            line.position.z += bias;
        });
    }
}

class ProteinMesh {
    constructor ( pdb ) {

        this.pdb = pdb;
        const chains = pdb.chains;

        const colors = [
            0xffea5e,
            0xf75eff,
            0x69ff5e,
            0xff975e,
            0x7c5eff,
            0xff5e71,
            0xd15eff,
            0x5eb9ff,
            0xff5e6e,
            0xc1ff5e,
            0x111b66,
            0x651166,
        ];

        this.chainMeshArray = [];
        // the pdb is an array of amino acid chains
        for (let i=0; i<chains.length; i++) {
            const chainMesh = new ProteinChainMesh( chains[i] );
            chainMesh.makeResidueLines( this.generateColor() );
            this.chainMeshArray.push( chainMesh );
        }

        this.center();
    }
    generateColor() {
        var randomColor = Math.floor(Math.random()*16777215).toString(16);
        randomColor = "#" + randomColor;
        return randomColor;
    }
    center () {
        const center = this.pdb.center;
        this.chainMeshArray.forEach((chainMesh) => {
            chainMesh.transformX( -center.x );
            chainMesh.transformY( -center.y );
            chainMesh.transformZ( -center.z );
        });
    }
    addToScene( scene ) {
        this.chainMeshArray.forEach((chainMesh) => {
            chainMesh.addToScene( scene );
        });
    }
}

async function main() {

    /*
    
        load the data for the protein that we are going to view

    */

    //const pdbURL = 'pdb/simple_7uo9.pdb';
    const pdbURL = 'pdb/atp_synthase_5fil.pdb';
    const pdbResponse = await fetch(pdbURL);
    const pdbString = await pdbResponse.text();    
    const pdb = new PDBData( pdbString );
    console.log( "loaded and parsed pdb file" );

    //console.log( pdb );
    const proteinMesh = new ProteinMesh( pdb );
    proteinMesh.addToScene( v2.scene );
    v2.renderer.render( v2.scene, v2.camera );
    console.log("rendered protein mesh");
    
}
async function addProtein2() {

    /*
    
        load the data for the protein that we are going to view

    */

    //const pdbURL = 'pdb/simple_7uo9.pdb';
    const pdbURL = 'pdb/wildtype_structure_prediction_af2.pdb';
    const pdbResponse = await fetch(pdbURL);
    const pdbString = await pdbResponse.text();    
    const pdb = new PDBData( pdbString );
    console.log( "loaded and parsed pdb file" );

    //console.log( pdb );
    const proteinMesh = new ProteinMesh( pdb );
    proteinMesh.addToScene( v3.scene );
    v3.renderer.render( v3.scene, v3.camera );
    console.log("rendered protein mesh");
    
}

document.addEventListener('DOMContentLoaded', addProtein2 );
document.addEventListener('DOMContentLoaded', main );

/*

    This manages all of the THREE.js viewers, and should not 
    effect the content very much

*/
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}


function makeViewer( id, div, nn ) {
    var scene = new THREE.Scene();
    const canvas = document.getElementById(id);
    const camera = new THREE.PerspectiveCamera( 75, canvas.clientWidth/canvas.clientHeight, 0.1, 1000 );
    const renderer = new THREE.WebGLRenderer( {
        canvas : document.querySelector('#'+id)
    } );
    renderer.setSize( canvas.clientWidth, canvas.clientHeight );
    document.getElementById(div).appendChild( renderer.domElement );

    const controls = new OrbitControls( camera, renderer.domElement );
    //const gridHelper = new THREE.GridHelper(200,50);
    //scene.add( gridHelper );

    if (nn) {
        controls.autoRotate=true;

        camera.position.x = -32;
        camera.position.y =  43;
        camera.position.z =  26;
        camera.rotation.x = -1.2715;
        camera.rotation.y = -0.7488;
        camera.rotation.z = -1.1453;
    } else {
        

        controls.autoRotate=true;
        const s = 2;
        camera.position.x = -32 * s;
        camera.position.y =  43 * s;
        camera.position.z =  26 * s;
        camera.rotation.x = -1.2715;
        camera.rotation.y = -0.7488;
        camera.rotation.z = -1.1453;
    }
    

    return {
        controls : controls,
        camera   : camera,
        renderer : renderer,
        scene    : scene,
    }
}

const v1 = makeViewer( "bg1", "viewer-1", true  );
const v2 = makeViewer( "bg2", "viewer-2", false );
const v3 = makeViewer( "bg3", "viewer-3", false );



//import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';

//render everything for the first time



function animate() {
    requestAnimationFrame( animate );

    if (
        isInViewport(v1.renderer.domElement)
    ) {
        console.log("viewing nn")
        v1.renderer.render( v1.scene, v1.camera );
        v1.controls.update();
    }

    if (
        isInViewport(v2.renderer.domElement)
    ) {
        console.log("viewing protein");
        v2.renderer.render( v2.scene, v2.camera );
        v2.controls.update();
    }

    if (
        isInViewport(v3.renderer.domElement)
    ) {
        console.log("viewing protein 2");
        v3.renderer.render( v3.scene, v3.camera );
        v3.controls.update();
    }

    
    
}
animate();


