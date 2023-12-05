import WindowManager from './WindowManager.js'


const t = THREE;
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let cubes = [];
let sceneOffsetTarget = {x: 0, y: 0};
let sceneOffset = {x: 0, y: 0};

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;


// get time in seconds since beginning of the day (so that all windows use the same time)
function getTime ()
{
	return (new Date().getTime() - today) / 1000.0;
}



if (new URLSearchParams(window.location.search).get("clear"))
{
	localStorage.clear();
}
else
{	
	// this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
	document.addEventListener("visibilitychange", () => 
	{
		if (document.visibilityState != 'hidden' && !initialized)
		{
			init();
		}
	});


	window.onload = () => {
		if (document.visibilityState != 'hidden')
		{
			init();
		}
	};
	
	function init ()
	{
		initialized = true;

		// add a short timeout because window.offsetX reports wrong values before a short period 
		setTimeout(() => {
			setupScene();
			// createParticleSystem();
			setupWindowManager();
			resize();
			updateWindowShape(false);
			render();
			window.addEventListener('resize', resize);
		}, 500)	
	}
	

	function setupScene ()
	{
		camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);
		
		camera.position.z = 2.5;
		near = camera.position.z - .5;
		far = camera.position.z + 0.5;

		scene = new t.Scene();
		scene.background = new t.Color(0.0);
		
		scene.add( camera );


		var starGeometry = new THREE.Geometry();
		for (let i = 0; i < 5000; i++) {
			var star = new THREE.Vector3();
			star.x = Math.random() * 5000 - 2000;
			star.y = Math.random() * 5000 - 2000;
			star.z = Math.random() * 5000 - 2000;
			starGeometry.vertices.push(star);
			var color = new THREE.Color();
			if (Math.random() < 0.5) {
				color.setHSL(0.16, 0.5, Math.random() * 0.5 + 0.25);
			} else {
				color.setHSL(0.0, 0.0, Math.random() * 0.5 + 0.5);
			}
			starGeometry.colors.push(color);
		}
		
		var starMaterial = new THREE.PointsMaterial({
			size: 2,
			vertexColors: THREE.VertexColors
		});
		
		var starField = new THREE.Points(starGeometry, starMaterial);
		scene.add(starField);
	
		renderer = new t.WebGLRenderer({antialias: true, depthBuffer: true});
		renderer.setPixelRatio(pixR);
		
		world = new t.Object3D();
		scene.add(world);
	
		renderer.domElement.setAttribute("id", "scene");
		document.body.appendChild( renderer.domElement );

		// Lights
		var light = new THREE.AmbientLight( 0x404040 ); // soft white light
		scene.add( light );

		var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
		directionalLight.position.set( 0, -1, -1 );
		scene.add( directionalLight );
		
	}

	
	function setupWindowManager ()
	{
		windowManager = new WindowManager();
		windowManager.setWinShapeChangeCallback(updateWindowShape);
		windowManager.setWinChangeCallback(windowsUpdated);

		// here you can add your custom metadata to each windows instance
		let metaData = {foo: "bar"};

		// this will init the windowmanager and add this window to the centralised pool of windows
		windowManager.init(metaData);

		// call update windows initially (it will later be called by the win change callback)
		windowsUpdated();
	}

	
	function windowsUpdated ()
	{
		updateNumberOfCubes();
	}

	
	function updateNumberOfCubes ()
	{
		let wins = windowManager.getWindows();

		cubes.forEach((c) => {
			world.remove(c);
		})

		cubes = [];

		for (let i = 0; i < wins.length; i++)
		{
			let win = wins[i];

			let c;
			if (i == 0) {
				c = new t.Color('hsl(30, 100%, 40%)');
			} else if (i == 1) {
				c = new t.Color('hsl(350, 60%, 65%)');
			} else {
				let idBasedHueValue = (win.id % 10) / 10;
				let hue;
				if(idBasedHueValue < 0.5) {
					hue = 240 - (idBasedHueValue * 2 * 60);
				} else {
					hue = 360 - ((idBasedHueValue - 0.5) * 2 * 60);
				}
				c = new t.Color(`hsl(${hue}, 50%, 70%)`);
			}

			let s = 200 + i * 50;
			let radius = s / 2;

			let sphere = createComplexSphere(radius, c);
			sphere.position.x = win.shape.x + (win.shape.w * .5);
			sphere.position.y = win.shape.y + (win.shape.h * .5);
	
			world.add(sphere);
			cubes.push(sphere);

		}
	}

	
	function createComplexSphere(radius, color) {
		let outerSize = radius;
		let outerColor = color;
	
		let complexSphere = new THREE.Group();
	
			
		let sphereWireframeOuter = new THREE.Mesh(
			new THREE.OctahedronGeometry(outerSize,6),
			new THREE.MeshLambertMaterial({
				color: color,
				wireframe: true,
			})
		);
		complexSphere.add(sphereWireframeOuter);
	
		// main color inner dots
		let particlesOuter = createParticles(outerSize/.7, outerColor,10000);
		complexSphere.add(particlesOuter);
		
		// second color inner dots
		let particlesOuter2 = createParticles(outerSize/5, outerColor,1500);
		complexSphere.add(particlesOuter2);
		
		// second color second inner dots
		let particlesOuter3 = createParticles(outerSize/0.85, outerColor);
		complexSphere.add(particlesOuter3);
		
		// second color outer dots
		let particlesOuter4 = createSecondParticles(outerSize,outerColor,20000)
		complexSphere.add(particlesOuter4);

		// main color outer dots
		let particlesOuter5 = createSecondParticles(outerSize,outerColor,10000)
		complexSphere.add(particlesOuter5);

		return complexSphere;
	
	}
	
	function createParticles(size, color,n=6000) {
		let geometry = new THREE.Geometry();
		for (let i = 0; i < n; i+=3) {
			let x = -1 + Math.random() * 2;
			let y = -1 + Math.random() * 2;
			let z = -1 + Math.random() * 2;
			let d = 1 / Math.sqrt(x * x + y * y + z * z);
			x *= d * (size+.8 * d/1.5);
			y *= d * (size+.8 * d/1.5);
			z *= d * (size+.8 * d/1.5);
			geometry.vertices.push(new THREE.Vector3(x, y, z));
		}
		let material = new THREE.PointsMaterial({
			size: 1.6,
			color: color,
			transparent: true
		});
		return new THREE.Points(geometry, material);
	}

	function createSecondParticles(size, color,n=5000) {
		let geometry = new THREE.Geometry();
		for (let i = 0; i < n; i+=6) {
			let x = -1 + Math.random() * 2;
			let y = -1 + Math.random() * 2;
			let z = -1 + Math.random() * 2;
			let d = 1 / Math.sqrt(x * x + y * y + z * z);
			x *= (d + (size/0.8 + d/.5)) * 1.3;
			y *= (d + (size/0.8 + d/.5)) * 1.3;
			z *= (d + (size/0.8 + d/.5)) * 1.3;
			geometry.vertices.push(new THREE.Vector3(x, y, z));
		}
		let material = new THREE.PointsMaterial({
			size: 1.4,
			color: color,
			transparent: true
		});
		return new THREE.Points(geometry, material);
	}
	
	

	function updateWindowShape (easing = true)
	{
		// storing the actual offset in a proxy that we update against in the render function
		sceneOffsetTarget = {x: -window.screenX, y: -window.screenY};
		if (!easing) sceneOffset = sceneOffsetTarget;
	}


	function render ()
	{
		let t = getTime();

		windowManager.update();

		// calculate the new position based on the delta between current offset and new offset times a falloff value (to create the nice smoothing effect)
		let falloff = .05;
		sceneOffset.x = sceneOffset.x + ((sceneOffsetTarget.x - sceneOffset.x) * falloff);
		sceneOffset.y = sceneOffset.y + ((sceneOffsetTarget.y - sceneOffset.y) * falloff);

		// set the world position to the offset
		world.position.x = sceneOffset.x;
		world.position.y = sceneOffset.y;

		let wins = windowManager.getWindows();

		// loop through all our cubes and update their positions based on current window positions
		for (let i = 0; i < cubes.length; i++)
		{
			let complexSphere = cubes[i]; 
			let win = wins[i];
			let _t = t; 

			let posTarget = {x: win.shape.x + (win.shape.w * .5), y: win.shape.y + (win.shape.h * .5)}
			
			complexSphere.position.x = complexSphere.position.x + (posTarget.x - complexSphere.position.x) * falloff;
        	complexSphere.position.y = complexSphere.position.y + (posTarget.y - complexSphere.position.y) * falloff;

        
			complexSphere.rotation.x = _t * 1.1; 
			complexSphere.rotation.y = _t * 1.1;
			updateComplexSphere(complexSphere, t,i);
		};

		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}

	
	function updateComplexSphere(complexSphere, elapsedTime, index) {
		let sphereWireframeOuter = complexSphere.children[0];
		let particlesOuter = complexSphere.children[1];
		let particlesOuter5 = complexSphere.children[5];
	
	  
		sphereWireframeOuter.rotation.x += 0.001;
		sphereWireframeOuter.rotation.z += 0.001;
	
		particlesOuter.rotation.y += 0.0005;
		
		index += 2
		let r = index * .31;


		sphereWireframeOuter.material.color.setHSL(r,1, 0.5);
		particlesOuter.material.color.setHSL(r,1.0, 0.5);	
		particlesOuter5.material.color.setHSL(r,1.0, 0.5);	
	}
	
	
	// resize the renderer to fit the window size
	function resize ()
	{
		let width = window.innerWidth;
		let height = window.innerHeight
		
		camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
		camera.updateProjectionMatrix();
		renderer.setSize( width, height );
	}
}
