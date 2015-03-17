// create scene
// add plane
// add bullets to dodge
var camera, scene, renderer, controls, ground;

var player, cameracontrols;

var raycaster;

function init() {
  var plane, light, groundTexture, groundMaterial;

	scene = new THREE.Scene();

  // Fog( hex, near, far )
  scene.fog = new THREE.Fog( 0xcce0ff, 100, 1000 );

  // add lighting
  scene.add( new THREE.AmbientLight( 0x666666 ) );

  light = new THREE.PointLight( 0xaaddaa, .5 );
  light.position.set( 50, 1200, -500 );
  scene.add( light );

  // add ground
  groundTexture = THREE.ImageUtils.loadTexture( "textures/Moon.png" );
  groundTexture.anisotropy = 16;

  groundMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: 0x111111,
    map: groundTexture
  });

	ground = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1000, 1000 ),
      groundMaterial );

	ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add( ground );

  // add playerBox
  // PlaneGeometry(width, height, widthSegments, heightSegments)
  var geometry = new THREE.PlaneGeometry( 10, 20, 32 );
  var material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide
  });

  player = new THREE.Mesh( geometry, material );
  player.position.set(0, 20, 0);
  scene.add( player );

  var geometry = new THREE.PlaneGeometry( 10, 10, 32 );
  var material = new THREE.MeshBasicMaterial({
    color: 0x9999ff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });

  playerPos = new THREE.Mesh( geometry, material );

  playerPos.rotation.x = -Math.PI / 2;
  playerPos.position.set(0, 10, 0);

  scene.add( playerPos );


  // add camera
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth /
      window.innerHeight, 1, 1000 );

  camera.position.set( 0, 0, 30 );

  player.add( camera );

  controls = new THREE.DeviceOrientationControls( player );

  // add renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  makeBullets(12);
  startBullets();
  animate();
}
var BULLET_RADIUS = 1;
var START_POSITION_Z = -500;
var bulletList = [];

function makeBullets (numToMake) {
  var geometry = new THREE.SphereGeometry(BULLET_RADIUS, 5, 5);

  var bullet = {};

  var material = new THREE.MeshBasicMaterial({
    color: 0xaff00,
    wireframe: true,
    wireframeLinewidth: 2
  });

  bullet = new THREE.Mesh( geometry, material );
  bullet.position.z = START_POSITION_Z;
  bullet.position.y = 25;

  var matrix = new THREE.Matrix4();
  matrix.extractRotation( bullet.matrix );

  var direction = new THREE.Vector3( 0, 0, 1 );
  direction = matrix.multiplyVector3( direction );

  for (var i = 0; i < numToMake; i++) {
    bullet = new THREE.Mesh( geometry, material );
    bullet.position.z = START_POSITION_Z;
    bullet.position.y = 25;

    bullet.raycaster = new THREE.Raycaster(bullet.position, direction);

    scene.add( bullet );
    bulletList[i] = bullet;
  }
}

function startBullets () {
  var bulletIndex = 0;

  setInterval(function() {
    bullet = bulletList[bulletIndex];

    if (bulletIndex < bulletList.length) {
      bulletIndex++;

    } else {
      bulletIndex = 0;
    }

    position = {
      x: bullet.position.x,
      y: bullet.position.y,
      z: bullet.position.z
    };

    target = {
      x: bullet.position.x,
      y: bullet.position.y,
      z: 50
    };

    doTween(position, target, bullet, TWEEN.Easing.Circular.Out, 1000);

  }, 500);
}

var points = [];

function createIntersectionPoint (p, color) {
  console.log(point);
  var geometry = new THREE.SphereGeometry(0.25, 5, 5);

  var material = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
    wireframeLinewidth: 2
  });

  var point = new THREE.Mesh( geometry, material );

  point.position.set(p.x, p.y, p.z);

  points.push(point);

  scene.add( point );
}
var COLOR_RED = 0xff3300;
var COLOR_ORANGE = 0xff8888;

function doTween (position, target, obj, easing, time) {
  var startPosition = {
    x: position.x,
    y: position.y,
    z: position.z
  }
  var tween = new TWEEN.Tween(position)
      .to(target, time)
      .onComplete(function() {

        // if bullet and not at start position z
        if (obj.type === "Mesh" && obj.position.z !== START_POSITION_Z) {
          obj.position.z = START_POSITION_Z;
        }
      });

  var intersection;

  tween.onUpdate(function() {
    // remove all collision points
    for (var i = 0; i < points.length; i++) {
      scene.remove(points[i]);
    }
    // empty points array -- might need to check for more efficient way
    points = [];

    // check for collision
    intersection = obj.raycaster.intersectObject(player);

    if (intersection.length) {

      if (intersection[0].distance > 10) {
        createIntersectionPoint(intersection[0].point, COLOR_RED);

      } else {
        createIntersectionPoint(intersection[0].point, COLOR_ORANGE);
      }
    }

    obj.position.x = position.x;
    obj.position.y = position.y;
    obj.position.z = position.z;
  });

  tween.easing(easing);

  tween.start();
}

function animate() {

  requestAnimationFrame( animate );

  controls.update();

  TWEEN.update();

  renderer.render( scene, camera );

}
init();
