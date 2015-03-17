var camera, scene, renderer, controls, ground, player;

var BULLET_RADIUS = 1;
var START_POSITION_Z = -500;
var bulletList = [];
var collisionPoints = [];

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

  // add center around which player will rotate
  var geometry = new THREE.SphereGeometry(.2, 5, 5);
  var material = new THREE.MeshBasicMaterial({ color: 0xaff00 });
  var playerCenter = new THREE.Mesh( geometry, material );

  playerCenter.position.set( 0, 20, 0 );

  scene.add( playerCenter );

  // add player obj
  // PlaneGeometry(width, height, widthSegments, heightSegments)
  var geometry = new THREE.PlaneGeometry( 10, 20, 32 );
  var material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide
  });

  player = new THREE.Mesh( geometry, material );
  player.position.set( 0, 0, 5 );
  playerCenter.add( player );

  // add player base
  geometry = new THREE.PlaneGeometry( 10, 10, 32 );
  material = new THREE.MeshBasicMaterial({
    color: 0x9999ff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });

  playerPos = new THREE.Mesh( geometry, material );

  // rotate to be parralel with ground
  playerPos.rotation.x = -Math.PI / 2;
  playerPos.position.set(0, 10, 0);

  scene.add( playerPos );

  // add camera
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth /
      window.innerHeight, 1, 1000 );

  camera.position.set( 0, 0, 30 );

  // attach camera to player object
  player.add( camera );

  // add controls
  controls = new THREE.DeviceOrientationControls( playerCenter );

  // add renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  makeBullets(12);
  startBullets();
  animate();
}

function makeBullets (numToMake) {
  var geometry = new THREE.SphereGeometry(BULLET_RADIUS, 5, 5);

  var material = new THREE.MeshBasicMaterial({
    color: 0xaff00,
    wireframe: true,
    wireframeLinewidth: 2
  });

  var bullet = {};
  var matrix = new THREE.Matrix4();
  var direction = new THREE.Vector3( 0, 0, 1 );

  bullet = new THREE.Mesh( geometry, material );
  bullet.position.z = START_POSITION_Z;
  bullet.position.y = 25;

  matrix.extractRotation( bullet.matrix );
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
      x: bullet.position.x + ((Math.random() * 10) - 5),
      y: bullet.position.y,
      z: 50
    };

    doTween(position, target, bullet, TWEEN.Easing.Circular.Out, 2000);

  }, 500);
}

function createIntersectionPoint (p) {
  var geometry = new THREE.SphereGeometry(0.25, 5, 5);

  // determine how much green should be in color
  // the closer the bullet is to person the less green
  // max p.distance = 500
  var green = Math.floor(p.distance / 2);

  var color = parseInt("0xff" + green.toString(16) + "00", 16);
  // var color = 0xffff00;
  console.log(color);

  var material = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
    wireframeLinewidth: 2
  });

  var point = new THREE.Mesh( geometry, material );

  point.position.set(p.point.x, p.point.y, p.point.z);

  collisionPoints.push(point);

  scene.add( point );
  console.log(point);
}

function checkForCollisions () {
  var intersection;

  console.log(collisionPoints.length);

  // remove all collision points
  for (var i = 0; i < collisionPoints.length; i++) {
    scene.remove(collisionPoints[i]);
  }

  // empty points array -- might be more efficient way
  collisionPoints = [];

  for (var i = 0; i < bulletList.length; i++) {
    // check for collision
    intersection = bulletList[i].raycaster.intersectObject(player);

    if (intersection.length) {

      if (intersection[0].distance > 10) {
        createIntersectionPoint(intersection[0]);

      } else {
        // player was hit
      }
    }
  }
}

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

  tween.onUpdate(function() {
    obj.position.x = position.x;
    obj.position.y = position.y;
    obj.position.z = position.z;
  });

  tween.easing(easing);

  tween.start();
}

function animate() {

  checkForCollisions();

  requestAnimationFrame( animate );

  controls.update();

  TWEEN.update();

  renderer.render( scene, camera );

}
init();
