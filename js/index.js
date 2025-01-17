var camera, scene, renderer, controls, ground, player, playerCenter;

var BULLET_SIZE = 1;
var START_POSITION_Z = -500;
var DETECT_BULLET_DISTANCE = 450;
var bulletList = [];
var collisionPoints = [];

function init() {
  var plane, light, ground;

	scene = new THREE.Scene();

  // Fog( hex, near, far )
  scene.fog = new THREE.Fog( 0xcce0ff, 100, 1000 );

  // add lighting
  scene.add( new THREE.AmbientLight( 0x666666 ) );
  light = new THREE.PointLight( 0xaaddaa, .5 );
  light.position.set( 50, 1200, -500 );
  scene.add( light );

  // sky - background
  var texture	= THREE.ImageUtils.loadTexture("textures/tycho_cyl_glow.png");

  var geoUniverse = new THREE.SphereGeometry(300, 50, 50);

  var material = new THREE.MeshLambertMaterial({
    color : 0xFFFFFF,
    map : texture,
    side: THREE.BackSide
  });

  var universe = new THREE.Mesh( geoUniverse, material );

  scene.add( universe );

  // ground
	var ground = new THREE.GridHelper( 500, 10 );
	ground.color1.setHex( 0x444444 );
	ground.color2.setHex( 0x444444 );
	ground.position.y = 0.1
	scene.add( ground );

  // add center around which player will rotate
  var geometry = new THREE.SphereGeometry(.2, 5, 5);
  var material = new THREE.MeshBasicMaterial({ color: 0xaff00 });
  playerCenter = new THREE.Mesh( geometry, material );

  playerCenter.position.set( 0, 20, 0 );

  ground.add( playerCenter );

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

  var playerPos = new THREE.Mesh( geometry, material );

  // rotate to be parralel with ground
  playerPos.rotation.x = -Math.PI / 2;
  playerPos.position.set(0, 10, 0);

  ground.add( playerPos );

  // add camera
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth /
      window.innerHeight, 1, 1000 );

  camera.position.set( 0, 0, 35 );

  // attach camera to player object
  playerCenter.add( camera );

  // add controls
  controls = new THREE.DeviceOrientationControls( ground );

  // add renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  makeBullets(20);
  startBullets();
  animate();
}

function makeBullets (numToMake) {
  var texture	= THREE.ImageUtils.loadTexture("textures/moon.png");

  var geometry = new THREE.SphereGeometry(BULLET_SIZE, 5, 5);

  var material = new THREE.MeshBasicMaterial({
    color: 0xbbffbb,
    map: texture
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

    // Raycaster( origin, direction, near, far )
    bullet.raycaster = new THREE.Raycaster( bullet.position, direction, 0,
        DETECT_BULLET_DISTANCE );

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
      x: playerCenter.position.x + (Math.random() * 10 - 5),
      y: playerCenter.position.y + (Math.random() * 10 - 5),
      z: 50
    };

    doTween(position, target, bullet, TWEEN.Easing.Circular.Out, 2000);

  }, 1500);
}

function createIntersectionPoint (p) {
  var maxDis = Math.abs(START_POSITION_Z);

  // normalize distance to be between 0 and 1
  var collisionSize = (maxDis - p.distance) / maxDis;

  // collision point size 0 -> 2
  collisionSize *= BULLET_SIZE;

  var geometry = new THREE.SphereGeometry(collisionSize, 5, 5);

  // determine how much green should be in color
  // the closer the bullet is to person the less green
  // max p.distance = 500
  var green = Math.floor(p.distance / 2);

  // prepend 0 to green hex if needed
  if (green.toString(16).length < 2) {
    green = "0" + green.toString(16);
  }

  var color = parseInt("0xff" + green.toString(16) + "00", 16);

  var material = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
    wireframeLinewidth: 2
  });

  var point = new THREE.Mesh( geometry, material );

  point.position.set(p.point.x, p.point.y, p.point.z);

  collisionPoints.push(point);

  scene.add( point );
}

function checkForCollisions () {
  var intersection;

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

      // bullet is still far enough away to dodge
      if (intersection[0].distance > 2) {
        createIntersectionPoint(intersection[0]);

      // player was hit - reduce green or increase transparency
      } else if (player.material.color.g > 0.1) {
        player.material.color.g /= 1.2;

        // need to remove asteroid / reset position
        scene.remove(bulletList[i]);

      // player has been hit to many times - game over
      } else {
        playerCenter.remove( player );
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
