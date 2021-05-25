/*

List of Script created by HTMLGAMEKURD

-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-

*/
let counter = 0, ms = 0, imageContainer, stats;

const main = () => {
  const canvas = document.getElementById('c');
  imageContainer = document.querySelector('.image-container');
  const {PI, sin, cos} = Math;

  const w = window.innerWidth;
  const h = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
  renderer.setSize(w,h);
  renderer.setPixelRatio(window.devicePixelRatio);

  stats = new Stats();

  const fov = 60;
  const aspect = w/h;
  const near = 1;
  const far = 50000;

  const camera = new THREE.PerspectiveCamera(fov,aspect,near,far);
  camera.position.set(0, 0, 30);

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.update();
  controls.enablePan = false;
  controls.minDistance = 15;
  controls.maxDistance = 350;
  controls.enableDamping = true;

  const scene = new THREE.Scene();

  const updateProgress = () => {
    setTimeout(() => {
      imageContainer.children[counter].style.cssText = `opacity: 1; transition: 1s`;
      counter++;
    }, ms += 200);
  };

  const sceneBackground = new THREE.TextureLoader().load('https://dl.dropbox.com/s/vzomkozv7ppv17q/Space.jpg', updateProgress);
  sceneBackground.encoding = THREE.sRGBEncoding;
  sceneBackground.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = sceneBackground;

  const addMesh = (geo, mat, rX = 0, rY = 0, rZ = 0, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geo,mat);
    mesh.rotation.set(rX, rY, rZ);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  };

  const earthTex = new THREE.TextureLoader().load('https://dl.dropbox.com/s/m0kwjhwce5b77j7/Earth.jpg', updateProgress);
  const sunTex = new THREE.TextureLoader().load('https://dl.dropbox.com/s/5bgn6x2nv3bvitn/Sun.jpg', updateProgress);
  const earthRadius = 6371;
  const moonTex = new THREE.TextureLoader().load('https://dl.dropbox.com/s/a3egh8uy0pg6uq2/Moon.jpg', updateProgress);
  const cloudsTex = new THREE.TextureLoader().load('https://dl.dropbox.com/s/w8v39sh3o9pg6fd/Clouds.jpg', updateProgress);

  earthTex.anisotropy = moonTex.anisotropy = cloudsTex.anisotropy = 16;

  const earth = addMesh(new THREE.SphereBufferGeometry(earthRadius/1000, 32, 32), new THREE.MeshPhongMaterial({
    map: earthTex,
    color: 0xAEAEAE,
    shininess: 0,
    reflectivity: 0,
    bumpMap: earthTex,
    bumpScale: .3,
  }));

  const clouds = addMesh(new THREE.SphereBufferGeometry(earthRadius/990, 32, 32), new THREE.MeshLambertMaterial({
    map: cloudsTex,
    transparent: true,
    opacity: 0.5,
  }));

  const moon = addMesh(new THREE.SphereBufferGeometry(earthRadius/3.668/1000, 32, 32), new THREE.MeshPhongMaterial({
    map: moonTex,
    color: 0xF2F2F2,
    shininess: 0,
    reflectivity: 0,
    bumpMap: moonTex,
    bumpScale: .12,
  }));

  const sun = addMesh(new THREE.SphereBufferGeometry(earthRadius*109/1000, 32, 32), new THREE.MeshPhongMaterial({
    map: sunTex,
    emissive: 0xffc972,
    emissiveIntensity: 1.4,
    emissiveMap: sunTex,
  }));

  sun.position.set(-350, 0, -49000);

  const light = new THREE.PointLight(0xFFFFFF, 1.6);
  light.position.set(-350, 0, -48000);
  scene.add(light);

  scene.add(new THREE.AmbientLight(0xFFFFFF, 0.1));

  const onWindowResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize( w, h );
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  window.addEventListener('resize', onWindowResize);

  let needIncrease = false;

  const changeSunEmissiveIntensity = () => {
    needIncrease ? sun.material.emissiveIntensity += 0.004 :
    sun.material.emissiveIntensity <= 1.4 && sun.material.emissiveIntensity > 0.6 && !needIncrease ?
    sun.material.emissiveIntensity -= 0.004 : sun.material.emissiveIntensity < 0.6 ? needIncrease = true : null;

    if (sun.material.emissiveIntensity > 1.4) {
      needIncrease = false;
      sun.material.emissiveIntensity -= 0.004;
    }

    requestAnimationFrame(changeSunEmissiveIntensity);
  };

  let needLightIntensityIncrease = false;

  const changeLightIntensity = () => {
    needLightIntensityIncrease ? light.intensity += 0.003 :
    light.intensity <= 1.6 && light.intensity > 1 && !needLightIntensityIncrease ?
    light.intensity -= 0.003 : light.intensity < 1 ? needLightIntensityIncrease = true : null;

    if (light.intensity > 1.6) {
      needLightIntensityIncrease = false;
      light.intensity -= 0.003;
    }

    requestAnimationFrame(changeLightIntensity);
  };

  changeSunEmissiveIntensity();
  changeLightIntensity();

  const render = () => {
    renderer.render(scene, camera);
    stats.update();
    controls.update();
    animate();
    requestAnimationFrame(render);
  };

  const rotateEarth = () => {
    earth.rotation.x += 0.00003;
    earth.rotation.y += 0.00005;
    earth.rotation.z += 0.00004;
  };

  const animateClouds = () => {
    clouds.rotation.x += 0.00004;
    clouds.rotation.y += 0.00013;
    clouds.rotation.z += 0.00008;
  };

  const animateMoon = () => {
    const time = Date.now();

    moon.position.x = (cos( time * 0.000004 + 15 ) * 185);
    moon.position.y = (sin( time * 0.000004 + 15 ) * 185);
    moon.position.z = (sin( time * 0.000004 + 15 ) * 185);

    moon.rotation.x += 0.00008;
    moon.rotation.y += 0.00023;
    moon.rotation.z += 0.00015;
  };

  const onIncorrectRendererSize = () => {
    const incorrectSize = canvas.width !== window.innerWidth || canvas.height !== window.innerHeight;
    if (incorrectSize) onWindowResize();
  };

  setTimeout(onIncorrectRendererSize, 200);

  const animate = () => {
    rotateEarth();
    animateClouds();
    animateMoon();
  };

  render();
};

window.onload = setTimeout( () => {
  setTimeout(main, 250);
  const timer = setInterval( () => {
    if (counter === 5) {
      clearInterval(timer);
      setTimeout(() => {
        imageContainer.children[counter].style.cssText = `opacity: 1; transition: 1s`;
      }, ms + 250);

      setTimeout(() => {
        imageContainer.parentNode.parentNode.style.cssText = `opacity: 0; transition: .5s`;
      }, ms + 1450);

      setTimeout(() => {
        stats = new Stats();
        document.body.append(stats.dom);
        imageContainer.parentNode.parentNode.style.display = 'none';
      } , ms + 1850);
    }
  } , 250);
} , 150);