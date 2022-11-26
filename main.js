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


function makeInputMesh( array ) {
    /* 
    
        Take in a 2D array of pixel values, normalized between [0,1],
        and make a 3D mesh of the array
    
    */

    var meshArray = [];

    for (let i=0;i<28;i++) {
        for (let j=0;j<28;j++) {
            const pixelGeometry = new THREE.BoxGeometry( 1, 1, 1 );

            const colorValue = Math.floor(Math.random() * 255);

            const material = new THREE.MeshBasicMaterial( {color : "rgb("+colorValue+", "+colorValue+", "+colorValue+")"} );
            const mesh = new THREE.Mesh( pixelGeometry, material );

            mesh.position.x = i;
            mesh.position.y = j;

            scene.add( mesh );
            meshArray.push( mesh );
        }
    }

    return meshArray;

}

const inputArray = Array( 28*28 ).fill().map(() => Math.random());
let meshArray = makeInputMesh( inputArray );


camera.position.z = 40;


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