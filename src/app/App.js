/*
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import TWEEN from '@tweenjs/tween.js';
import isMobile from 'is-mobile-with-ipad';

import DRACOLoader from '../../third_party/draco/DRACOLoader';
import OBJLoader from '../../third_party/objProva/OBJLoader';

import OrbitControls from '../../third_party/three.js/OrbitControls';

import AppBase from './AppBase';

import HUD from '../hud/HUD';

import GroundGrid from '../gfx/GroundGrid';
import Background from '../gfx/Background';
import Reticle from '../gfx/Reticle';
import Shadow from '../gfx/Shadow';

import ARControls from '../ar/ARControls';
import AREffects from '../ar/AREffects';

let RENDERORDER = {
  BACKGROUND: 1,
  GROUNDGRID: 2,
  MODELSHADOW: 3,
  MODEL: 4,
  HUD: 5,
};

var keep = true;


var modelAnimated = new THREE.Object3D();
var modelTest = new THREE.Object3D();
var arrow1 = new THREE.Object3D();
var arrow2 = new THREE.Object3D();
var arrow3 = new THREE.Object3D();

var samsungSpline = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1.5, -0.8),
  new THREE.Vector3(0, 0.2, 0),]);

var arrowSpline = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1, -0.6),
  new THREE.Vector3(0, 0.4, 0),]);



//tube
var meshTube;
var tubeAnimated = new THREE.Object3D();

var tubeNoAnim = new THREE.Object3D();


var tubeBlue = new THREE.Object3D();


//looping
var clock = new THREE.Clock;



var nMax, nEnd = 0, nStep = 90;


var counter = 0;
var tangent;
var tangent2;
var axis = new THREE.Vector3(0, 0, 0);
var axis2 = new THREE.Vector3(0, 0, 0);
var up = new THREE.Vector3(0, 1, 0);
var t = 0.0;




export default class App extends AppBase {
  constructor(props) {
    super(props);
  }

  setup = props => {

    this.setupProperties(props);
    this.setupCanvas(props);
    this.setupS3DCamera();
    this.setupS3DScene();
    this.setupS3DControls();

    this.setupGroundGrid();
    this.setupBackground();
    this.setupHUD();
    this.setupEvents();
	
	this.setupModelGroupObj();  //oggetto completo 

	
    if (this.canvas.id == 'arapp') {

        this.loadMaterial(); //dex
        var sets8 = this.loadMaterialAnimated; //s8
        setTimeout(function () { sets8(); }, 1000);
        var setArrow = this.setUpArrow; //arrow
        setTimeout(function () { setArrow(); }, 3000);
      this.setupFloorLogo1();

      this.setupModelTween();

    }
    else if (this.canvas.id == 'arapp2') {

      this.loadMaterialComputer(); //pc

   
      var setTube = this.setupTube; //tube
      setTimeout(function () { setTube(); }, 4000);
  
      this.loadMaterialHdmi();
      this.loadMaterial(); //dex


      var setScreen = this.setupScreen; //tube
      setTimeout(function () { setScreen(); }, 6000);

      this.setupFloorLogo();


      var sets82 = this.loadMaterialAnimated; //s8
      setTimeout(function () { sets82(); }, 1000);

      this.setupModelTween();
    }

    else if (this.canvas.id == 'arapp3') {
      this.loadMaterialComputer(); //pc
      this.loadMaterialMouse(); // tastiera e mouse

      this.loadMaterialHdmi();
 
      var setTube2 = this.setupTube2; //tube
      setTimeout(function () { setTube2(); }, 2000);

      var setBlue2 = this.setupBluet2; //bluetoot
      setTimeout(function () { setBlue2(); }, 2000);


      this.loadMaterialBluetooth();

      this.loadMaterial(); //dex
      var sets83 = this.loadMaterialAnimated; //s8
      setTimeout(function () { sets83(); }, 1000);


      var setScreen = this.setupScreen; //tube
      setTimeout(function () { setScreen(); }, 6000);
      this.setupFloorLogo();

      this.setupModelTween();
    }
    
	
	
  };

  parseURL = () => {
    let params = this.getUrlParams();
    if (params.armode == true) {
      this.enableAR();
    } else if (params.fsmode == true) {
      this.enableFullscreen();
    }
  };

  getUrlParams = () => {
    let queryString = {};
    let query = decodeURIComponent(
      decodeURIComponent(window.location.search.substring(1))
    );
    query = query.split('+').join(' ');
    let vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
      let pair = vars[i].split('=');
      if (typeof queryString[pair[0]] === 'undefined') {
        queryString[pair[0]] = decodeURIComponent(pair[1]);
      } else if (typeof queryString[pair[0]] === 'string') {
        let arr = [queryString[pair[0]], decodeURIComponent(pair[1])];
        queryString[pair[0]] = arr;
      } else {
        queryString[pair[0]].push(decodeURIComponent(pair[1]));
      }
    }
    return queryString;
  };

  setupProperties = props => {
    this.debug = false;
    this.placedModel = false;
    this.duration = 400;
    this.mouse = new THREE.Vector2();
    this.mouseDown = false;

    if (this.vrDisplay && this.arView.marcher) {
      this.arView.marcher.visible = false;
      this.arView.controls.enabled = false;
    }
  };
  
  setupHUD = () => {
    this.HUD = new HUD({
      canvas: this.canvas,
      renderer: this.renderer,
      vrDisplay: this.vrDisplay,
      duration: this.duration,
      debug: this.debug,
    });

    this.HUD.renderOrder = RENDERORDER.HUD;
    this.container = document.getElementById('app');

    this.HUD.addEventListener('fullscreen', this.enableFullscreen);
    this.HUD.addEventListener('ar', this.enableAR);
    this.HUD.addEventListener('close', () => {
      if (this.IsAR()) {
        this.disableAR();
      } else if (this.IsFullscreen()) {
        this.disableFullscreen();
      }
    });
    this.HUD.addEventListener('debug', this.toggleDebug);

    this.addEventListener('enableAR', this.HUD.enterAR);
    this.addEventListener('disableAR', this.HUD.exitAR);
    this.addEventListener('enableFullscreen', this.HUD.enterFS);
    this.addEventListener('disableFullscreen', this.HUD.exitFS);

    this.addEventListener('down', this.HUD.down);
    this.addEventListener('up', this.HUD.up);

    this.addEventListener('modelPlaced', this.HUD.modelPlaced);
    this.addEventListener('modelDragged', this.HUD.modelDragged);
    this.addEventListener('modelRotated', this.HUD.modelRotated);

    this.addEventListener('proximityWarning', this.HUD.proximityWarning);
    this.addEventListener('proximityNormal', this.HUD.proximityNormal);

    this.HUD.hideButtons(0);
    this.HUD.resize();
  };


  setupS3DCamera = () => {
    let size = this.renderer.getDrawingBufferSize();
    this.S3DCamera = new THREE.PerspectiveCamera(
      45,
      size.width / size.height,
      0.1,
      1000
    );
    this.S3DCameraLastPosition = new THREE.Vector3();
  };

  updateS3DCamera = () => {
    let size = this.renderer.getDrawingBufferSize();
    this.S3DCamera.aspect = size.width / size.height;
    this.S3DCamera.updateProjectionMatrix();
  };

  setupS3DScene = () => {
    this.S3DScene = new THREE.Scene();
    this.S3DScene.rotateY(Math.PI / 4.0);
  };

  setupS3DControls = () => {
    this.S3DControls = new OrbitControls(this.S3DCamera, this.canvas);
    this.S3DControls.enableDamping = true;
    let speed = 0.5 / this.renderer.getPixelRatio();
    this.S3DControls.zoomSpeed = speed;
    this.S3DControls.rotateSpeed = speed;
    this.S3DControls.minPolarAngle = Math.PI / 5.0; // radians
    this.S3DControls.maxPolarAngle = 1.75 * (Math.PI / 3.0); // radians
    this.S3DControls.minAzimuthAngle = -Math.PI; // radians
    this.S3DControls.maxAzimuthAngle = Math.PI; // radians
    this.S3DControls.minDistance = 1.0;
    this.S3DControls.maxDistance = 4;
    this.S3DControls.enablePan = false;
    this.resetS3DCamera();
  };

  resetS3DCamera = () => {
    this.S3DCamera.position.set(0, 2.304552414782168, 2.382298471034347);
    this.S3DControls.target.set(0.0, 1.0, 0.0);
    this.S3DCamera.updateMatrixWorld(true);
  };

  setupCanvas = props => {
    this.canvas = props.canvas;
    let rect = this.canvas.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height);
    this.canvasProps = {
      parent: this.canvas.parentElement,
      width: this.canvas.width,
      height: this.canvas.height,
      aspect: this.canvas.width / this.canvas.height,
    };

  };


  enterFS = () => {
    this.HUD.setSpacing(this.HUD.getSpacing() * 2.0);
    this.setFullscreen(true);


    this.scrollX = window.scrollX;
    this.scrollY = window.scrollY;

    // Then scroll the page the top of thw window.
    window.scroll(0, 0);

    // Remove the page content.
    // We have to do this or it will be cover the camera feed in AR mode on
    // WebARonARKit.On WebARonARCore, it would be sufficient to cover the
    // content using a higher z-index on this.canvas.
    document.body.removeChild(this.container);

    // Remove this.canvas from it's original place in the DOM
    // and make it the first child of the body.
    this.canvasProps.parent.removeChild(this.canvas);
    document.body.appendChild(this.canvas);


    // Add fullscreen classes
    document.body.classList.add('fullscreen');
    this.canvas.classList.add('fullscreen');

    this.onWindowResize();
  };

  exitFS = () => {
    this.HUD.setSpacing(this.HUD.getSpacing() * 0.5);
    this.setFullscreen(false);

    // Re-insert the page content
    document.body.appendChild(this.container);

    // Move this.canvas back to it's original place in the DOM
    document.body.removeChild(this.canvas);
    this.canvasProps.parent.appendChild(this.canvas);

    // Remove the fullscreen classes
    document.body.classList.remove('fullscreen');
    this.canvas.classList.remove('fullscreen');

    window.scroll(this.scrollX, this.scrollY);

    this.resetS3DCamera();
    this.onWindowResize();
  };

  enterAR = () => {

   

    if (!this.IsFullscreen()) {
      this.enableFullscreen();     
    }
 

    if (this.arControls == undefined) {
      this.setupARCamera();
      this.setupARControls();
      this.setupAREffects();
    }

    this.tweenOutModel();

    this.modelShadow.material.opacity = 0.5;
    this.modelScene.position.set(10000, 10000, 10000);
    this.groundGrid.fadeOut(0);

    if (this.vrDisplay && this.arView.marcher) {
      this.arView.controls.enabled = true;
      this.arView.marcher.visible = true;
    }

    this.background.fadeOut(this.duration, 0, () => {
      this.S3DScene.remove(this.modelScene);
      this.scene.add(this.reticle);
      this.reticle.fadeIn(this.duration, this.duration);
      if (!this.reticle.getTrackingState()) {
        this.HUD.findingSurface();
      } else {
        this.HUD.foundSurface();
      }
      this.S3DScene.remove(this.groundGrid);
      this.scene.add(this.modelScene);
      this.setAR(true);
    });
    this.S3DControls.enabled = false;
  };

  exitAR = () => {
	  
    this.modelShadow.material.opacity = 0.25;
    this.tweenOutModel();
    this.modelTween.onComplete(() => {
      this.scene.remove(this.modelScene);
      this.resetS3DCamera();
      this.S3DControls.enabled = true;
      this.HUD.dismissToasts(this.duration);

      this.reticle.fadeOut(this.duration, 0, () => {
        this.setAR(false);
        this.background.fadeIn(this.duration, 0, () => {
          if (this.arView.marcher) {
            this.arView.controls.enabled = false;
            this.arView.marcher.visible = false;
          }
          this.arControls.disable();
          this.modelScene.position.set(0, 0, 0);
          this.modelScene.rotation.set(0, 0, 0);
          this.modelScene.updateMatrixWorld(true);

          if (this.IsFullscreen()) {
            this.disableFullscreen();
          }
          this.modelGroupObj.scale.set(0.8, 0.8, 0.8);
          this.HUD.showButtons(this.duration, this.duration);
          this.S3DScene.add(this.groundGrid);
          this.groundGrid.fadeIn(this.duration, 0, () => {
            this.resetS3DCamera();
            this.S3DScene.add(this.modelScene);
            this.tweenInModel();
      
          });

          this.placedModel = false;
        });
        this.modelTween.onComplete(() => {

		    });
      });
    });
  };

  toggleDebug = () => {
    this.debug = !this.debug;
    if (this.debug) {
      this.enterDebug();
    } else {
      this.exitDebug();
    }
  };

  enterDebug = () => {};

  exitDebug = () => { };


  loadMaterialAnimated = () => {
    var textureLoader = new THREE.TextureLoader();
    var texture = textureLoader.load('../public/models/s8/s8_texture.jpg');

    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setTexturePath('../public/models/s8/');
    mtlLoader.setPath('../public/models/s8/');

    mtlLoader.load('s8_verticaleTest.mtl', materials => {
      materials.preload();


      let dracoLoader = new DRACOLoader('../third_party/draco/', {
        type: 'js',
      });

      var material2 = new THREE.MeshBasicMaterial({ name: "textureScritta", color: "white", map: texture, });

      dracoLoader.load('../public/models/s8/s8_verticaleTest.drc', geometry => {
        geometry.computeVertexNormals();
        var models8Animated = new THREE.Mesh(geometry, material2);    

        
        if (this.canvas.id == 'arapp') {
          this.setupModelAnimated(models8Animated);
          
        } else if (this.canvas.id == 'arapp2') {
          this.setupModelB(new THREE.Mesh(geometry, material2));
        } else if (this.canvas.id == 'arapp3') {
          this.setupModelB(new THREE.Mesh(geometry, material2));
        }

        this.setupReticle();
        this.parseURL();
        this.HUD.hideLoadingIndicator();
      });

    });
  }


  loadMaterialBluetooth = () => {
    
    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setTexturePath('../public/models/Computer/');
    mtlLoader.setPath('../public/models/Computer/');

    mtlLoader.load('bt.mtl', materials => {
      materials.preload();


      let dracoLoader = new DRACOLoader('../third_party/draco/', {
        type: 'js',
      });

      var materialBl = new THREE.MeshBasicMaterial({ color: 0x0044ff, transparent: true, opacity: 0.5 });

      dracoLoader.load('../public/models/Computer/bt.drc', geometry => {
        geometry.computeVertexNormals();
        var modelBluetooth = new THREE.Mesh(geometry, materialBl);


        if (this.canvas.id == 'arapp') {
       
        } else if (this.canvas.id == 'arapp2') {
        
        } else if (this.canvas.id == 'arapp3') {
          this.setupModelE(modelBluetooth);
        }

        this.setupReticle();
        this.parseURL();
        this.HUD.hideLoadingIndicator();
      });

    });
  }


  setupScreen = () => {

    var textureLoader = new THREE.TextureLoader();
    var texture2 = textureLoader.load('../public/images/screen.jpg');
    texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
    texture2.repeat.set(1, 1);

    var material2 = new THREE.MeshBasicMaterial({ map: texture2, transparent: true, color: "white"});

    var plane = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1, 0.1, 0.1), material2);

    plane.material.side = THREE.DoubleSide;
    plane.position.y = 0.755;
    plane.position.z = -0.58;
    plane.position.x = 0;

    var screen = new THREE.Object3D();
    screen.add(plane);

    this.modelGroupObj.add(screen);

  }


  setupFloorLogo1 = () => {

    var textureLoader = new THREE.TextureLoader();
    var texture2 = textureLoader.load('../public/images/logo400.png');
    texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
    texture2.repeat.set(1, 1);

    var material2 = new THREE.MeshBasicMaterial({ map: texture2, transparent: true, });

    var plane = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.25, 0.1, 0.1), material2);
    plane.material.side = THREE.DoubleSide;
    plane.position.y = -0.01;
    plane.position.z = 0.5;
    plane.position.x = 0;

    plane.rotation.x = Math.PI / -2;

    var planeLogo = new THREE.Object3D();
    planeLogo.add(plane);

    this.modelGroupObj.add(planeLogo);

  }


  setupFloorLogo = () => {

    var textureLoader = new THREE.TextureLoader();
    var texture2 = textureLoader.load('../public/images/logo400.png');
    texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
    texture2.repeat.set(1, 1);

    var material2 = new THREE.MeshBasicMaterial({ map: texture2, transparent: true, });

    var plane = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.25, 0.1, 0.1), material2);
    plane.material.side = THREE.DoubleSide;
    plane.position.y = -0.01;
    plane.position.z = 0.3;
    plane.position.x = -1;

    plane.rotation.x = Math.PI / -2;

    var planeLogo = new THREE.Object3D();
    planeLogo.add(plane);

    this.modelGroupObj.add(planeLogo);

  }


  setupModelAnimated = models8Animated => {

    this.modelBoundingBoxTest = new THREE.Box3();
    this.modelBoundingBoxTest.setFromObject(models8Animated);
    let objectSize = this.modelBoundingBoxTest.getSize();

    let desiredHeight = 0.7;
    let scale = desiredHeight / objectSize.y;


    models8Animated.rotation.y = Math.PI;
    models8Animated.rotation.z = Math.PI;
    modelAnimated.add(models8Animated);
    models8Animated.renderOrder = RENDERORDER.MODEL;
    modelAnimated.position.y = 0.25;


    let mtx = new THREE.Matrix4().makeScale(scale, scale, scale);
    models8Animated.castShadow = true;
    models8Animated.geometry.applyMatrix(mtx);
    this.modelBoundingBoxTest.setFromObject(models8Animated);
    this.modelGroupObj.add(modelAnimated);

  };


  //-----------------------modello Funzionante s8
  setupModelTest = models8 => {
  

    this.modelBoundingBoxTest = new THREE.Box3();
    this.modelBoundingBoxTest.setFromObject(models8);
    let objectSize = this.modelBoundingBoxTest.getSize();

    let desiredHeight = 0.7;
    let scale = desiredHeight / objectSize.y;

    modelTest.add(models8);
    models8.renderOrder = RENDERORDER.MODEL;
    modelTest.position.y = 0.25;

   
    let mtx = new THREE.Matrix4().makeScale(scale, scale, scale);
    models8.castShadow = true;
    models8.geometry.applyMatrix(mtx);
    this.modelBoundingBoxTest.setFromObject(models8);
    this.modelGroupObj.add(modelTest);


  };



  //---------------------------------animazione Funzionante s8
  setupMoveTest = () => {

    if (keep) {
      if (modelTest.position.y > 0) {
        modelTest.position.y -= .05;
        modelTest.position.z += .01;
        arrow1.position.y -= .01;
        arrow1.position.z -= 0;
        arrow2.position.y -= .01;
        arrow2.position.z -= 0;

      } else {
        keep = false;
      }
    }
    else {
      if (modelTest.position.y < 2) {
        modelTest.position.y += .05;
        modelTest.position.z -= .01;
        arrow1.position.y += .01;
        arrow1.position.z += 0;
        arrow2.position.y += .01;
        arrow2.position.z += 0;
      } else {
        keep = true;
      }
    }
  };



  moveSamsung = () => { 

    if (counter <= 1) {

      modelAnimated.position.copy(samsungSpline.getPointAt(counter));
      tangent = samsungSpline.getTangentAt(counter).normalize();
      axis.crossVectors(up, tangent).normalize();
      var radians = Math.acos(up.dot(tangent));

      modelAnimated.quaternion.setFromAxisAngle(axis, radians);
      counter = (counter >= 1) ? 0 : counter += 0.005;


      arrow3.position.copy(arrowSpline.getPointAt(counter));
      tangent2 = arrowSpline.getTangentAt(counter).normalize();
      axis2.crossVectors(up, tangent2).normalize();
      var radiantArrow = Math.acos(up.dot(tangent2));

      arrow3.quaternion.setFromAxisAngle(axis2, radiantArrow);
      counter = (counter >= 1) ? 0 : counter += 0.005;

    } else {
      counter = 0;
    };
  };



  setupBluet2 = () => {
    var material = new THREE.MeshBasicMaterial({ color: 0x0044ff, transparent: true, opacity: 0.5 });

    var geometry = new THREE.CylinderGeometry(0.02, 0.02, 0.02, 32);
    var cylinder1 = new THREE.Mesh(geometry, material);
    cylinder1.rotation.x = Math.PI / 2;
    cylinder1.position.x = -1;
    cylinder1.position.y = 0.55;
    cylinder1.position.z = 0;
    tubeBlue.add(cylinder1);

    var cylinder2 = new THREE.Mesh(geometry, material);
    cylinder2.rotation.x = Math.PI / 2;
    cylinder2.position.x = -1;
    cylinder2.position.y = 0.65;
    cylinder2.position.z = 0;
    tubeBlue.add(cylinder2);

    var cylinder3 = new THREE.Mesh(geometry, material);
    cylinder3.rotation.x = Math.PI / 2;
    cylinder3.position.x = -1;
    cylinder3.position.y = 0.75;
    cylinder3.position.z = 0;
    tubeBlue.add(cylinder3);

    var cylinder4 = new THREE.Mesh(geometry, material);
    cylinder4.rotation.x = Math.PI / 2;
    cylinder4.position.x = -1;
    cylinder4.position.y = 0.85;
    cylinder4.position.z = 0;
    tubeBlue.add(cylinder4);

    var cylinder5 = new THREE.Mesh(geometry, material);
    cylinder5.rotation.x = Math.PI / 2;
    cylinder5.position.x = -0.9;
    cylinder5.position.y = 0.85;
    cylinder5.position.z = 0;
    tubeBlue.add(cylinder5);


    var cylinder7 = new THREE.Mesh(geometry, material);
    cylinder7.rotation.x = Math.PI / 2;
    cylinder7.position.x = -0.6;
    cylinder7.position.y = 0.85;
    cylinder7.position.z = 0;
    tubeBlue.add(cylinder7);

    var cylinder8 = new THREE.Mesh(geometry, material);
    cylinder8.rotation.x = Math.PI / 2;
    cylinder8.position.x = -0.5;
    cylinder8.position.y = 0.85;
    cylinder8.position.z = 0;
    tubeBlue.add(cylinder8);

    var cylinder9 = new THREE.Mesh(geometry, material);
    cylinder9.rotation.x = Math.PI / 2;
    cylinder9.position.x = -0.4;
    cylinder9.position.y = 0.85;
    cylinder9.position.z = 0;
    tubeBlue.add(cylinder9);

    var cylinder10 = new THREE.Mesh(geometry, material);
    cylinder10.rotation.x = Math.PI / 2;
    cylinder10.position.x = -0.3;
    cylinder10.position.y = 0.85;
    cylinder10.position.z = 0;
    tubeBlue.add(cylinder10);

    var cylinder11 = new THREE.Mesh(geometry, material);
    cylinder11.rotation.x = Math.PI / 2;
    cylinder11.position.x = -0.2;
    cylinder11.position.y = 0.85;
    cylinder11.position.z = 0;
    tubeBlue.add(cylinder11);

    var cylinder12 = new THREE.Mesh(geometry, material);
    cylinder12.rotation.x = Math.PI / 2;
    cylinder12.position.x = -0.1;
    cylinder12.position.y = 0.85;
    cylinder12.position.z = 0;
    tubeBlue.add(cylinder12);

    var cylinder13 = new THREE.Mesh(geometry, material);
    cylinder13.rotation.x = Math.PI / 2;
    cylinder13.position.x = 0;
    cylinder13.position.y = 0.85;
    cylinder13.position.z = 0;
    tubeBlue.add(cylinder13);

  //-----------verticale
    var cylinder14 = new THREE.Mesh(geometry, material);
    cylinder14.rotation.x = Math.PI / 2;
    cylinder14.position.x = 0;
    cylinder14.position.y = 0.75;
    cylinder14.position.z = 0;
    tubeBlue.add(cylinder14);

    var cylinder15 = new THREE.Mesh(geometry, material);
    cylinder15.rotation.x = Math.PI / 2;
    cylinder15.position.x = 0;
    cylinder15.position.y = 0.65;
    cylinder15.position.z = 0;
    tubeBlue.add(cylinder15);

    var cylinder16 = new THREE.Mesh(geometry, material);
    cylinder16.rotation.x = Math.PI / 2;
    cylinder16.position.x = 0;
    cylinder16.position.y = 0.55;
    cylinder16.position.z = 0;
    tubeBlue.add(cylinder16);

    var cylinder17 = new THREE.Mesh(geometry, material);
    cylinder17.rotation.x = Math.PI / 2;
    cylinder17.position.x = 0;
    cylinder17.position.y = 0.45;
    cylinder17.position.z = 0;
    tubeBlue.add(cylinder17);

    var cylinder18 = new THREE.Mesh(geometry, material);
    cylinder18.rotation.x = Math.PI / 2;
    cylinder18.position.x = 0;
    cylinder18.position.y = 0.35;
    cylinder18.position.z = 0;
    tubeBlue.add(cylinder18);

    var cylinder19 = new THREE.Mesh(geometry, material);
    cylinder19.rotation.x = Math.PI / 2;
    cylinder19.position.x = 0;
    cylinder19.position.y = 0.25;
    cylinder19.position.z = 0;
    tubeBlue.add(cylinder19);

    var cylinder19b = new THREE.Mesh(geometry, material);
    cylinder19b.rotation.x = Math.PI / 2;
    cylinder19b.position.x = 0;
    cylinder19b.position.y = 0.15;
    cylinder19b.position.z = 0;
    tubeBlue.add(cylinder19b);

    //---------orizz
    var cylinder20 = new THREE.Mesh(geometry, material);
    cylinder20.rotation.x = Math.PI / 2;
    cylinder20.position.x = 0.1;
    cylinder20.position.y = 0.85;
    cylinder20.position.z = 0;
    tubeBlue.add(cylinder20);

    var cylinder21 = new THREE.Mesh(geometry, material);
    cylinder21.rotation.x = Math.PI / 2;
    cylinder21.position.x = 0.2;
    cylinder21.position.y = 0.85;
    cylinder21.position.z = 0;
    tubeBlue.add(cylinder21);

    var cylinder22 = new THREE.Mesh(geometry, material);
    cylinder22.rotation.x = Math.PI / 2;
    cylinder22.position.x = 0.3;
    cylinder22.position.y = 0.85;
    cylinder22.position.z = 0;
    tubeBlue.add(cylinder22);

    var cylinder23 = new THREE.Mesh(geometry, material);
    cylinder23.rotation.x = Math.PI / 2;
    cylinder23.position.x = 0.4;
    cylinder23.position.y = 0.85;
    cylinder23.position.z = 0;
    tubeBlue.add(cylinder23);

    var cylinder24 = new THREE.Mesh(geometry, material);
    cylinder24.rotation.x = Math.PI / 2;
    cylinder24.position.x = 0.5;
    cylinder24.position.y = 0.85;
    cylinder24.position.z = 0;
    tubeBlue.add(cylinder24);

    var cylinder25 = new THREE.Mesh(geometry, material);
    cylinder25.rotation.x = Math.PI / 2;
    cylinder25.position.x = 0.6;
    cylinder25.position.y = 0.85;
    cylinder25.position.z = 0;
    tubeBlue.add(cylinder25);

    var cylinder26 = new THREE.Mesh(geometry, material);
    cylinder26.rotation.x = Math.PI / 2;
    cylinder26.position.x = 0.7;
    cylinder26.position.y = 0.85;
    cylinder26.position.z = 0;
    tubeBlue.add(cylinder26);

    var cylinder27 = new THREE.Mesh(geometry, material);
    cylinder27.rotation.x = Math.PI / 2;
    cylinder27.position.x = 0.8;
    cylinder27.position.y = 0.85;
    cylinder27.position.z = 0;
    tubeBlue.add(cylinder27);

    var cylinder28 = new THREE.Mesh(geometry, material);
    cylinder28.rotation.x = Math.PI / 2;
    cylinder28.position.x = 0.9;
    cylinder28.position.y = 0.85;
    cylinder28.position.z = 0;
    tubeBlue.add(cylinder28);


    //--------------vertic
    var cylinder30 = new THREE.Mesh(geometry, material);
    cylinder30.rotation.x = Math.PI / 2;
    cylinder30.position.x = 0.9;
    cylinder30.position.y = 0.75;
    cylinder30.position.z = 0;
    tubeBlue.add(cylinder30);

    var cylinder31 = new THREE.Mesh(geometry, material);
    cylinder31.rotation.x = Math.PI / 2;
    cylinder31.position.x = 0.9;
    cylinder31.position.y = 0.65;
    cylinder31.position.z = 0;
    tubeBlue.add(cylinder31);

    var cylinder32 = new THREE.Mesh(geometry, material);
    cylinder32.rotation.x = Math.PI / 2;
    cylinder32.position.x = 0.9;
    cylinder32.position.y = 0.55;
    cylinder32.position.z = 0;
    tubeBlue.add(cylinder32);

    var cylinder33 = new THREE.Mesh(geometry, material);
    cylinder33.rotation.x = Math.PI / 2;
    cylinder33.position.x = 0.9;
    cylinder33.position.y = 0.45;
    cylinder33.position.z = 0;
    tubeBlue.add(cylinder33);

    var cylinder34 = new THREE.Mesh(geometry, material);
    cylinder34.rotation.x = Math.PI / 2;
    cylinder34.position.x = 0.9;
    cylinder34.position.y = 0.35;
    cylinder34.position.z = 0;
    tubeBlue.add(cylinder34);

    var cylinder35 = new THREE.Mesh(geometry, material);
    cylinder35.rotation.x = Math.PI / 2;
    cylinder35.position.x = 0.9;
    cylinder35.position.y = 0.25;
    cylinder35.position.z = 0;
    tubeBlue.add(cylinder35);

    this.modelGroupObj.add(tubeBlue);
  }



  setupBluet = () => {


    var material = new THREE.MeshBasicMaterial({ color: 0x0044ff, transparent: true, opacity: 0.3 });


    var pathM = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1, 0.65, 0),
      new THREE.Vector3(-1, 0.55, 0),
    ]);
    var geometryM = new THREE.TubeGeometry(pathM, 64, 0.01, 12, false);

    var meshM = new THREE.Mesh(geometryM, material);
    tubeBlue.add(meshM);

    var pathL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1, 0.85, 0),
      new THREE.Vector3(-1, 0.75, 0),
    ]);
    var geometryL = new THREE.TubeGeometry(pathL, 64, 0.01, 12, false);

    var meshL = new THREE.Mesh(geometryL, material);
    tubeBlue.add(meshL);


    var pathI = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.95, 1, 0),
      new THREE.Vector3(-1, 1, 0),
      new THREE.Vector3(-1, 0.95, 0),
    ]);
    var geometryI = new THREE.TubeGeometry(pathI, 64, 0.01, 12, false);
    var meshI = new THREE.Mesh(geometryI, material);
    tubeBlue.add(meshI);
    

    var pathH = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.9, 1, 0),
      new THREE.Vector3(-0.8, 1, 0),
    ]);
    var geometryH = new THREE.TubeGeometry(pathH, 64, 0.01, 12, false);

    var meshH = new THREE.Mesh(geometryH, material);
    tubeBlue.add(meshH);


    var pathG = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.7, 1, 0),
      new THREE.Vector3(-0.6, 1, 0),
    ]);
    var geometryG = new THREE.TubeGeometry(pathG, 64, 0.01, 12, false);
  
    var meshG = new THREE.Mesh(geometryG, material);
    tubeBlue.add(meshG);



    var pathE = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.5, 1, 0),
      new THREE.Vector3(-0.4, 1, 0),
    ]);
    var geometryE = new THREE.TubeGeometry(pathE, 64, 0.01, 12, false);
   
    var meshE = new THREE.Mesh(geometryE, material);
    tubeBlue.add(meshE);

    var pathD = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.3, 1, 0),
      new THREE.Vector3(-0.2, 1, 0),
    ]);
    var geometryD = new THREE.TubeGeometry(pathD, 64, 0.01, 12, false);
    
    var meshD = new THREE.Mesh(geometryD, material);
    tubeBlue.add(meshD);

    var pathC = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.1, 1, 0),
      new THREE.Vector3(0, 1, 0),
    ]);
    var geometryC = new THREE.TubeGeometry(pathC, 64, 0.01, 12, false);
    
    var meshC = new THREE.Mesh(geometryC, material);
    tubeBlue.add(meshC);

    
    var pathB = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 1, 0),
      new THREE.Vector3(0.2, 1, 0),
    ]);
    var geometryB = new THREE.TubeGeometry(pathB, 64, 0.01, 12, false);
   
    var meshB = new THREE.Mesh(geometryB, material);
    tubeBlue.add(meshB);

    var pathB1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 0.9, 0),
      new THREE.Vector3(0.1, 0.8, 0),
    ]);
    var geometryB1 = new THREE.TubeGeometry(pathB1, 64, 0.01, 12, false);

    var meshB1 = new THREE.Mesh(geometryB1, material);
    tubeBlue.add(meshB1);

    var pathB2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 0.7, 0),
      new THREE.Vector3(0.1, 0.6, 0),
    ]);
    var geometryB2 = new THREE.TubeGeometry(pathB2, 64, 0.01, 12, false);

    var meshB2 = new THREE.Mesh(geometryB2, material);
    tubeBlue.add(meshB2);

    var pathB3 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 0.5, 0),
      new THREE.Vector3(0.1, 0.4, 0),
    ]);
    var geometryB3 = new THREE.TubeGeometry(pathB3, 64, 0.01, 12, false);

    var meshB3 = new THREE.Mesh(geometryB3, material);
    tubeBlue.add(meshB3);

    var pathB4 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 0.3, 0),
      new THREE.Vector3(0.1, 0.2, 0),
    ]);
    var geometryB4 = new THREE.TubeGeometry(pathB4, 64, 0.01, 12, false);

    var meshB4 = new THREE.Mesh(geometryB4, material);
    tubeBlue.add(meshB4);

    var pathA = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.3, 1, 0),
      new THREE.Vector3(0.4, 1, 0),
    ]);
    var geometryA = new THREE.TubeGeometry(pathA, 64, 0.01, 12, false);
  
    var meshA = new THREE.Mesh(geometryA, material);
    tubeBlue.add(meshA);

    var path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.5, 1, 0),
      new THREE.Vector3(0.6, 1, 0),
    ]);
    var geometry = new THREE.TubeGeometry(path, 64, 0.01, 12, false);
   
    var mesh = new THREE.Mesh(geometry, material);
    tubeBlue.add(mesh);


    var path2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.7, 1, 0),
      new THREE.Vector3(0.8, 1, 0),
    ]);
    var geometry2 = new THREE.TubeGeometry(path2, 64, 0.01, 12, false);
    
    var mesh2 = new THREE.Mesh(geometry2, material);
    
    tubeBlue.add(mesh2);

   
    var path4 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.9, 1, 0),
      new THREE.Vector3(0.9, 0.9, 0),
    ]);
    var geometry4 = new THREE.TubeGeometry(path4, 64, 0.01, 12, false);

    var mesh4 = new THREE.Mesh(geometry4, material);
    tubeBlue.add(mesh4);

    var path5 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.9, 0.8, 0),
      new THREE.Vector3(0.9, 0.7, 0),
    ]);
    var geometry5 = new THREE.TubeGeometry(path5, 64, 0.01, 12, false);

    var mesh5 = new THREE.Mesh(geometry5, material);
    tubeBlue.add(mesh5);

    var path6 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.9, 0.6, 0),
      new THREE.Vector3(0.9, 0.5, 0),
    ]);
    var geometry6 = new THREE.TubeGeometry(path6, 64, 0.01, 12, false);

    var mesh6 = new THREE.Mesh(geometry6, material);
    tubeBlue.add(mesh6);

    var path7 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.9, 0.4, 0),
      new THREE.Vector3(0.9, 0.3, 0),
    ]);
    var geometry7 = new THREE.TubeGeometry(path7, 64, 0.01, 12, false);

    var mesh7 = new THREE.Mesh(geometry7, material);
    tubeBlue.add(mesh7);


    this.modelBoundingBoxBlue = new THREE.Box3();
    this.modelBoundingBoxBlue.setFromObject(tubeBlue);
    let objectSizeBlue = this.modelBoundingBoxBlue.getSize();

    let desiredHeight = 0.1;
    let scale = desiredHeight / objectSizeBlue.y;
    
    this.modelGroupObj.add(tubeBlue);

  };


  setupTube = () => {

    var numPoints = 10;
    var geometry = new THREE.Geometry();


    var tubeSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.58, 0.725, -0.7),
      new THREE.Vector3(-0.58, 0.72, -0.75),
      new THREE.Vector3(-0.58, 0.5, -0.8),
      new THREE.Vector3(-0.8, 0.2, -0.9),
      new THREE.Vector3(-1.1, 0.01, -0.2),
      new THREE.Vector3(-1.06, 0.041, -0.18),
      new THREE.Vector3(-1.06, 0.041, -0.14)
    ]);

    var material = new THREE.MeshBasicMaterial({ color: 0x0044ff });

    var tube = new THREE.TubeGeometry(tubeSpline, 64, 0.005, 12, false);


    var bufferTube = new THREE.BufferGeometry().fromGeometry(tube);

    nMax = bufferTube.attributes.position.count;
    var mesh = new THREE.Mesh(bufferTube, material);
 
    tubeAnimated.add(mesh);
    this.modelGroupObj.add(tubeAnimated);


  }




  setupTube2 = () => { 

    var numPoints = 10;
    var geometry = new THREE.Geometry();


    var tubeSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.58, 0.725, -0.7),
      new THREE.Vector3(-0.58, 0.72, -0.75),
      new THREE.Vector3(-0.58, 0.5, -0.8),
      new THREE.Vector3(-0.8, 0.2, -0.9),
      new THREE.Vector3(-1.1, 0.01, -0.2),
      new THREE.Vector3(-1.06, 0.041, -0.18),
      new THREE.Vector3(-1.06, 0.041, -0.14)
    ]);

    
    var material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    var tube = new THREE.TubeGeometry(tubeSpline, 64, 0.005, 12, false);  
    var mesh = new THREE.Mesh(tube, material);
    tubeNoAnim.add(mesh);
  
    this.modelGroupObj.add(tubeNoAnim);

  }



  setUpArrow = () => {
    var shape = new THREE.Shape([
      [-0.8, -1], [-0.03, 1], [-0.01, 1.017], [0.0, 1.0185],
      [0.01, 1.017], [0.03, 1], [0.8, -1], [0, -0.5]
    ].map(p => new THREE.Vector2(...p)));
    var extrudeSettings = { amount: 0.5, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 1 };

    var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    var material = new THREE.MeshBasicMaterial({ color: 0x0044ff });
    var arrowMesh = new THREE.Mesh(geometry, material);

    this.modelBoundingBoxArrow = new THREE.Box3();
    this.modelBoundingBoxArrow.setFromObject(arrowMesh);
    let objectSizeArrow = this.modelBoundingBoxArrow.getSize();

    let desiredHeight = 0.1;
    let scale = desiredHeight / objectSizeArrow.y;

      arrow3.add(arrowMesh);
      arrow3.rotation.z = Math.PI;
      this.modelGroupObj.add(arrow3);
   
    arrowMesh.renderOrder = RENDERORDER.MODEL;
    

    let mtx = new THREE.Matrix4().makeScale(scale, scale, scale);
    arrowMesh.castShadow = true;
    arrowMesh.geometry.applyMatrix(mtx);
    this.modelBoundingBoxArrow.setFromObject(arrowMesh);

  
  };




  loadMaterial = () => {

      let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('../public/models/DexNero/'); 
    mtlLoader.setTexturePath('../public/models/DexNero/');
    mtlLoader.load('dex_nero.mtl', materials => {
        materials.preload();
      this.loadModel(materials.materials.lambert4SG);

      });    
  };


  loadModel = material => {
    let dracoLoader = new DRACOLoader('../third_party/draco/', {
      type: 'js',
    });

    dracoLoader.load('../public/models/DexNero/dex_nero.drc', geometry => {
      geometry.computeVertexNormals();    

      var meshModelA = new THREE.Mesh(geometry, material);    
    
     
      if (this.canvas.id == 'arapp') {  

          this.setupModelDex(meshModelA);
     

      } else if (this.canvas.id == 'arapp2') {
        this.setupModelA(meshModelA);
      } else if (this.canvas.id == 'arapp3') {
        this.setupModelA(meshModelA);
      }


      this.setupReticle();

      this.parseURL();
      this.HUD.hideLoadingIndicator();

    });
  };



 //--------------------------------monitor-----------------
  loadMaterialComputer = () => {

    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('../public/models/DexNero/');
    mtlLoader.setTexturePath('../public/models/DexNero/');
    mtlLoader.load('dex_nero.mtl', materials => {
      materials.preload();
      this.loadModelPc(materials.materials.lambert4SG);
  
    });
  };


  loadModelPc = material => {
    let dracoLoader = new DRACOLoader('../third_party/draco/', {
      type: 'js',
    });

    dracoLoader.load('../public/models/Computer/monitor.drc', geometry => {
      geometry.computeVertexNormals();
     
      if (this.canvas.id == 'arapp') {

      } else if (this.canvas.id == 'arapp2') {
        this.setupModelC(new THREE.Mesh(geometry, material));
      } else if (this.canvas.id == 'arapp3') {
        this.setupModelC(new THREE.Mesh(geometry, material));
      }
    
      this.setupReticle();

      this.parseURL();
      this.HUD.hideLoadingIndicator();

    });
  };




  //----------------------------------hdmi-----------------
  loadMaterialHdmi = () => {

    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('../public/models/DexNero/');
    mtlLoader.setTexturePath('../public/models/DexNero/');
    mtlLoader.load('dex_nero.mtl', materials => {
      materials.preload();
      this.loadModelHdmi(materials.materials.lambert4SG);

    });
  };


  loadModelHdmi = material => {
    let dracoLoader = new DRACOLoader('../third_party/draco/', {
      type: 'js',
    });

    var material2 = new THREE.MeshBasicMaterial({color: 0x0044ff });

    dracoLoader.load('../public/models/Computer/hdmi.drc', geometry => {


      var meshHdmi = new THREE.Mesh(geometry, material);
      var meshHdmi1 = new THREE.Mesh(geometry, material2);

      var meshHdmi2 = new THREE.Mesh(geometry, material);
      var meshHdmi3 = new THREE.Mesh(geometry, material2);

      if (this.canvas.id == 'arapp') {

      } else if (this.canvas.id == 'arapp2') {
        this.setupModelF(meshHdmi1);
        this.setupModelH(meshHdmi3);
      } else if (this.canvas.id == 'arapp3') {
        this.setupModelG(meshHdmi);
        this.setupModelI(meshHdmi2);
      }

      this.setupReticle();

      this.parseURL();
      this.HUD.hideLoadingIndicator();

    });
  };



  //--------------------------------mouse-----------------
  loadMaterialMouse = () => {

    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('../public/models/DexNero/');
    mtlLoader.setTexturePath('../public/models/DexNero/');
    mtlLoader.load('dex_nero.mtl', materials => {
      materials.preload();
      this.loadModelTastiera(materials.materials.lambert4SG);

    });
  };

  loadModelTastiera = material => {
    let dracoLoader = new DRACOLoader('../third_party/draco/', {
      type: 'js',
    });

    dracoLoader.load('../public/models/Computer/mouse_tastiera.drc', geometry => {
      geometry.computeVertexNormals();

      if (this.canvas.id == 'arapp') {

      } else if (this.canvas.id == 'arapp2') {
        this.setupModelD(new THREE.Mesh(geometry, material));
      } else if (this.canvas.id == 'arapp3') {
        this.setupModelD(new THREE.Mesh(geometry, material));
      }

      this.setupReticle();

      this.parseURL();
      this.HUD.hideLoadingIndicator();

    });
  };



 
  loadMaterial3 = () => {
    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('../public/models/s8/');
    mtlLoader.load('dex_posizionato.mtl', materials => {
      materials.preload();     
      this.loadModel3(materials.materials.dex_posizionato);
    });
  };

  loadModel3 = material => {
    let dracoLoader = new DRACOLoader('../third_party/draco/', {
      type: 'js',
    });

    dracoLoader.load('../public/models/s8/dex_posizionato.drc', geometry => {
      geometry.computeVertexNormals();
     
        this.setupModelA(new THREE.Mesh(geometry, material));

      this.setupReticle();
      this.parseURL();
      this.HUD.hideLoadingIndicator();

    });
  };

  animateModel = () => {  
    this.model.position.x = 1.2;
  };


  
 //-----------------------primo modello per canvas secondo
  setupModelA = meshModelA => {
    this.modelA = new THREE.Object3D();
  
    this.modelBoundingBoxA = new THREE.Box3();
    this.modelBoundingBoxA.setFromObject(meshModelA);
    let objectSize = this.modelBoundingBoxA.getSize();

    let desiredHeight = 0.3;
    let scale = desiredHeight / objectSize.y;
    meshModelA.position.x = -1;
    this.modelA.add(meshModelA);
    meshModelA.renderOrder = RENDERORDER.MODEL;

    let mtx = new THREE.Matrix4().makeScale(scale, scale, scale);

    meshModelA.castShadow = true;
    meshModelA.geometry.applyMatrix(mtx);
    this.modelBoundingBoxA.setFromObject(meshModelA);
    this.modelGroupObj.add(this.modelA);
 
  };



  //-----------------------primo modello per canvas primo
  setupModelDex = meshModelA => {
    this.modelA = new THREE.Object3D();

    this.modelBoundingBoxA = new THREE.Box3();
    this.modelBoundingBoxA.setFromObject(meshModelA);
    let objectSize = this.modelBoundingBoxA.getSize();


    let desiredHeight = 0.7;

  
    let scale = desiredHeight / objectSize.y;

    this.modelA.add(meshModelA);
    meshModelA.renderOrder = RENDERORDER.MODEL;

    let mtx = new THREE.Matrix4().makeScale(scale, scale, scale);
    meshModelA.castShadow = true;
    meshModelA.geometry.applyMatrix(mtx);
    this.modelBoundingBoxA.setFromObject(meshModelA);
    this.modelGroupObj.add(this.modelA);

  };



 //-----------------------secondo modello per canvas
  setupModelB = mesh => {
    this.modelB = new THREE.Object3D();

    this.modelBoundingBoxB = new THREE.Box3();
    this.modelBoundingBoxB.setFromObject(mesh);
    let objectSize = this.modelBoundingBoxB.getSize();

    let desiredHeight = 0.4;
    let scale = desiredHeight / objectSize.y;

    this.modelB.add(mesh);
    mesh.position.y = 0.03;
    mesh.position.x = -1;
    mesh.rotation.x = Math.PI /-6;
    mesh.renderOrder = RENDERORDER.MODEL;


    let mtx = new THREE.Matrix4().makeScale(scale, scale, scale);
    mesh.castShadow = true;
    mesh.geometry.applyMatrix(mtx);


    this.modelBoundingBoxB.setFromObject(mesh);
    this.modelGroupObj.add(this.modelB);

  };

 

  //-----------------------terzo modello per canvas
  setupModelC = mesh => {
    this.modelC = new THREE.Object3D();
 
    this.modelBoundingBoxC = new THREE.Box3();
    this.modelBoundingBoxC.setFromObject(mesh);
    let objectSize = this.modelBoundingBoxC.getSize();

    let desiredHeight = 1.3;
    let scale = desiredHeight / objectSize.y;
    mesh.renderOrder = RENDERORDER.MODEL;
    this.modelC.add(mesh);
    mesh.position.z = -0.6;


    let mtx = new THREE.Matrix4().makeScale(scale, scale, scale);
    mesh.castShadow = true;
    mesh.geometry.applyMatrix(mtx);
    this.modelBoundingBoxC.setFromObject(mesh);
    this.modelGroupObj.add(this.modelC);


  };
  

  //------------------------------quarto modello per canvas
  setupModelD = mesh => {
    this.modelD = new THREE.Object3D();
    
    this.modelBoundingBoxD = new THREE.Box3();
    this.modelBoundingBoxD.setFromObject(mesh);
    let objectSize = this.modelBoundingBoxD.getSize();

    let desiredHeight = 0.08;
    let scale = desiredHeight / objectSize.y;
    mesh.renderOrder = RENDERORDER.MODEL;
    this.modelD.add(mesh);
    mesh.position.z = 0.1;
    mesh.position.x = 0.2;


    let mtx = new THREE.Matrix4().makeScale(scale, scale, scale);
    mesh.castShadow = true;
    mesh.geometry.applyMatrix(mtx);
    this.modelBoundingBoxD.setFromObject(mesh);
    this.modelGroupObj.add(this.modelD);
  };



  //---------------------------quinto modello per canvas
  setupModelE = modelBluetooth => {
    this.modelE = new THREE.Object3D();
    this.modelBoundingBoxD = new THREE.Box3();
    this.modelBoundingBoxD.setFromObject(modelBluetooth);
    let objectSize = this.modelBoundingBoxD.getSize();

    let desiredHeight = 0.15;
    let scale = desiredHeight / objectSize.y;
    modelBluetooth.renderOrder = RENDERORDER.MODEL;
    this.modelE.add(modelBluetooth);



    modelBluetooth.position.x = -0.75;
    modelBluetooth.position.y = 0.8;
    modelBluetooth.position.z = 0;

    let mtx = new THREE.Matrix4().makeScale(scale, scale, scale);
    modelBluetooth.castShadow = true;
    modelBluetooth.geometry.applyMatrix(mtx);
    this.modelBoundingBoxD.setFromObject(modelBluetooth);
    this.modelGroupObj.add(this.modelE);
  };



  setupModelG = meshHdmi => {
    this.modelG = new THREE.Object3D();
    this.modelBoundingBoxD = new THREE.Box3();
    this.modelBoundingBoxD.setFromObject(meshHdmi);
    let objectSize = this.modelBoundingBoxD.getSize();

    let desiredHeight = 0.02;
    let scale = desiredHeight / objectSize.y;
    meshHdmi.renderOrder = RENDERORDER.MODEL;
    this.modelG.add(meshHdmi);

    meshHdmi.position.x = -0.58;
    meshHdmi.position.y = 0.715;
    meshHdmi.position.z = -0.66;


    let mtx = new THREE.Matrix4().makeScale(scale, scale, scale);
    meshHdmi.castShadow = true;
    meshHdmi.geometry.applyMatrix(mtx);
    this.modelBoundingBoxD.setFromObject(meshHdmi);
    this.modelGroupObj.add(this.modelG);
  };




  setupModelI = meshHdmi2 => {
    this.modelI = new THREE.Object3D();
    this.modelBoundingBoxD = new THREE.Box3();
    this.modelBoundingBoxD.setFromObject(meshHdmi2);
    let objectSize = this.modelBoundingBoxD.getSize();

    let desiredHeight = 0.02;
    let scale = desiredHeight / objectSize.y;
    meshHdmi2.renderOrder = RENDERORDER.MODEL;
    this.modelI.add(meshHdmi2);


    new THREE.Vector3(-1.06, 0.05, -0.12)
    meshHdmi2.position.x = -1.06;
    meshHdmi2.position.y = 0.03;
    meshHdmi2.position.z = -0.12;

    let mtx = new THREE.Matrix4().makeScale(scale, scale, scale);
    meshHdmi2.castShadow = true;
    meshHdmi2.geometry.applyMatrix(mtx);
    this.modelBoundingBoxD.setFromObject(meshHdmi2);
    this.modelGroupObj.add(this.modelI);
  };


  setupModelF = meshHdmi1 => {
    this.modelF = new THREE.Object3D();
    this.modelBoundingBoxD = new THREE.Box3();
    this.modelBoundingBoxD.setFromObject(meshHdmi1);
    let objectSize = this.modelBoundingBoxD.getSize();

    let desiredHeight = 0.02;
    let scale = desiredHeight / objectSize.y;
    meshHdmi1.renderOrder = RENDERORDER.MODEL;
    this.modelF.add(meshHdmi1);



    meshHdmi1.position.x = -0.58;
    meshHdmi1.position.y = 0.715;
    meshHdmi1.position.z = -0.66;


    let mtx = new THREE.Matrix4().makeScale(scale, scale, scale);
    meshHdmi1.castShadow = true;
    meshHdmi1.geometry.applyMatrix(mtx);
    this.modelBoundingBoxD.setFromObject(meshHdmi1);
    this.modelGroupObj.add(this.modelF);
  };


  setupModelH = meshHdmi3 => {
    this.modelH = new THREE.Object3D();
    this.modelBoundingBoxD = new THREE.Box3();
    this.modelBoundingBoxD.setFromObject(meshHdmi3);
    let objectSize = this.modelBoundingBoxD.getSize();

    let desiredHeight = 0.02;
    let scale = desiredHeight / objectSize.y;
    meshHdmi3.renderOrder = RENDERORDER.MODEL;
    this.modelH.add(meshHdmi3);


    meshHdmi3.position.x = -1.06;
    meshHdmi3.position.y = 0.03;
    meshHdmi3.position.z = -0.12;


    let mtx = new THREE.Matrix4().makeScale(scale, scale, scale);
    meshHdmi3.castShadow = true;
    meshHdmi3.geometry.applyMatrix(mtx);
    this.modelBoundingBoxD.setFromObject(meshHdmi3);
    this.modelGroupObj.add(this.modelH);
  };



  setupModelGroupObj = () => {
    this.modelGroupObj = new THREE.Object3D();
    this.modelScene = new THREE.Object3D();
    this.modelScene.renderOrder = 0;
    this.modelScene.add(this.modelGroupObj);
    this.modelGroupObj.renderOrder = RENDERORDER.MODEL;

    this.S3DScene.add(this.modelScene);


    this.objGroupBoundingBox = new THREE.Box3();
    this.objGroupBoundingBox.setFromObject(this.modelGroupObj);
    let objGroupSize = this.objGroupBoundingBox.getSize();
    let desiredObjHeight = 0.2;
    let scaleObj = desiredObjHeight / objGroupSize.y;
    this.setupModelShadow();
    this.setupLights();

  };

  

  setupModelTween = () => {
    this.modelScale = { value: 0.0 };
    this.modelTween = new TWEEN.Tween(this.modelScale);
    this.modelTween.easing(TWEEN.Easing.Cubic.InOut);    
    this.modelTween.onUpdate(tween => {

      let scale = this.modelScale.value;
      this.modelGroupObj.scale.set(scale, scale, scale);
    });
    
    this.modelTween.to(
      { value: 1.0 },
      this.duration * 2.0,
      this.duration * 10.0
    );

    this.groundGrid.fadeIn(this.duration, this.duration);
    this.background.fadeIn(this.duration, this.duration);
    
    this.modelTween.onComplete(() => {
    this.HUD.showButtons(this.duration, this.duration);

    });
    
   
    //-----------------------------------------seconda animazione--------------------------------------------
    this.modelTween.start();
  
  };

  tweenOutModel = () => {
    this.modelTween.to({ value: 0.0 }, this.duration, 0).start();
  };

  tweenInModel = () => {
    this.modelTween.to({ value: 1.0 }, this.duration, 0).start();
  };

  //-----------------------------------seconda anim---------------------------------------
  tweenOutModelB = () => {
    this.modelTweenB.to({ value: 0.0 }, this.duration, 0).chain(this.tweenOutModel);
  };

  tweenInModelB = () => {
    this.modelTweenB.to({ value: 1.0 }, this.duration, 0).chain(this.tweenInModel);
  };



  //------------------------------------animSpline------------------------------------------
   samsungAnim =()=> {
     var numPoints = 50;

  var material = new THREE.LineBasicMaterial({
    color: 0xff00f0,
  });

  var geometry = new THREE.Geometry();
  var splinePoints = samsungSpline.getPoints(numPoints);

  for (var i = 0; i < splinePoints.length; i++) {
    geometry.vertices.push(splinePoints[i]);
  }
     this.line = new THREE.Line(geometry, material);


     var splineLine = new THREE.Object3D();

     this.modelGroupObj.add(splineLine);

     
}

  setupModelShadow = () => {
    this.modelShadow = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(5, 5, 2, 2),
      new THREE.ShadowMaterial({
        color: 0x000000,
        opacity: 0.4,
        transparent: true,
      })
    );
    this.modelShadow.geometry.applyMatrix(
      new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(-90))
    );
    this.modelShadow.renderOrder = RENDERORDER.MODELSHADOW;
    this.modelShadow.receiveShadow = true;
    this.modelScene.add(this.modelShadow);
  };

  setupLights = () => {
    let point = new THREE.PointLight(0xffffff, 1, 100);
    point.intensity = 1.5;
    point.position.set(0, 40, -40);
    this.modelScene.add(point);

    let spotLight0 = new THREE.SpotLight(0xffffff);
    spotLight0.intensity = 1.5;
    spotLight0.position.set(-15, 35, 15);
    spotLight0.lookAt(0, 0.5, 0.0);
    spotLight0.castShadow = true;
    let shadowSize = 1024;
    if (!isMobile()) {
      shadowSize *= 4;
    }
    spotLight0.shadow.mapSize.width = shadowSize;
    spotLight0.shadow.mapSize.height = shadowSize;
    spotLight0.shadow.camera.near = this.S3DCamera.near;
    spotLight0.shadow.camera.far = this.S3DCamera.far;
    spotLight0.shadow.camera.fov = this.S3DCamera.fov;
    this.modelScene.add(spotLight0);

    let spotLight1 = new THREE.SpotLight(0xffffff);
    spotLight1.intensity = 1.5;
    spotLight1.position.set(10, 25, 15);
    spotLight1.lookAt(0, 0.5, 0.0);
    this.modelScene.add(spotLight1);

    let spotLight2 = new THREE.SpotLight(0xffffff);
    spotLight2.intensity = 0.25;
    spotLight2.position.set(0, 0, 15);
    spotLight2.lookAt(0, 0.0, 0.0);
    this.modelScene.add(spotLight2);
  };

  setupGroundGrid = () => {
    this.groundGrid = new GroundGrid({
      gridColor: new THREE.Color(0x000000),
      gridAlpha: 0.25,
    });
    this.groundGrid.renderOrder = RENDERORDER.GROUNDGRID;
    this.groundGrid.fadeOut(0);
    this.S3DScene.add(this.groundGrid);
  };

  setupBackground = () => {
    this.background = new Background({
      skyColor: new THREE.Color(0x666666),
      groundColor: new THREE.Color(0xf5f5f5),
      alpha: 1.0,
    });
    this.background.renderOrder = RENDERORDER.BACKGROUND;
    this.background.fadeOut(0);
    this.S3DScene.add(this.background);
  };

  setupEvents = () => {
    this.addEventListener('enableFullscreen', this.enterFS);
    this.addEventListener('disableFullscreen', this.exitFS);
    this.addEventListener('enableAR', this.enterAR);
    this.addEventListener('disableAR', this.exitAR);

    window.addEventListener('resize', this.onWindowResize, false);
    this.canvas.addEventListener('mousedown', this.onMouseDown, false);
    this.canvas.addEventListener('mouseup', this.onMouseUp, false);
  };

  updateMouse = event => {
    this.mouse.set(
      event.clientX / window.innerWidth,
      event.clientY / window.innerHeight
    );
  };

  onMouseDown = event => {
    this.updateMouse(event);
    this.mouseDown = true;
  };

  onMouseUp = event => {
    this.mouseDown = false;
    this.updateMouse(event);
    if (this.IsAR()) {
      let tracked = this.reticle.getTrackingState();
      let position = this.reticle.getPosition();
      if (tracked) {
        if (!this.placedModel) {
          if (this.canvas.id == "arapp") {
            this.modelGroupObj.scale.set(0.2, 0.2, 0.2);
          } else if (this.canvas.id == "arapp2") {
            this.modelGroupObj.scale.set(0.4, 0.4, 0.4);
          } else if (this.canvas.id == "arapp3") {
            this.modelGroupObj.scale.set(0.4, 0.4, 0.4);
          }
         
          this.tweenInModel();
      
          this.modelScene.position.copy(position);
          this.modelScene.updateMatrixWorld(true);
          let x = this.ARCamera.position.x - this.modelScene.position.x;
          let z = this.ARCamera.position.z - this.modelScene.position.z;
          let angle = Math.atan2(x, z);
          this.modelScene.rotation.set(0, angle + Math.PI * 0.25, 0);
          this.modelScene.updateMatrixWorld(true);
          this.placedModel = true;
          this.reticle.fadeOut(this.duration);
          this.arControls.enable();
          this.dispatchEvent({ type: 'modelPlaced', object: this });
          this.dispatchEvent({ type: 'up', object: this });
        }
      }
    }
  };

  setupReticle = () => {
    let modelSize = this.modelBoundingBoxA.getSize();
    this.reticle = new Reticle({
      vrDisplay: this.vrDisplay,
      size: Math.max(modelSize.x, modelSize.z),
      easing: 1.0,
    });
    this.reticle.setAlpha(0.0);

    this.reticle.addEventListener('findingSurface', event => {
      if (this.IsAR()) {
        this.HUD.findingSurface(event);
      }
    });

    this.reticle.addEventListener('foundSurface', event => {
      if (this.IsAR()) {
        this.HUD.foundSurface(event);
      }
    });
  };

  setupARControls = () => {
    this.arControls = new ARControls({
      vrDisplay: this.vrDisplay,
      scene: this.modelScene,
      object: this.modelGroupObj,
      camera: this.ARCamera,
      scene: this.scene,
      canvas: this.canvas,
      debug: this.debug,
    });

    this.arControls.addEventListener('down', () => {
      if (this.IsAR()) {
        if (this.arView.marcher) {
          this.arView.controls.enabled = false;
        }
        this.dispatchEvent({ type: 'down', object: this });
      }
    });

    this.arControls.addEventListener('up', () => {
      if (this.IsAR()) {
        if (this.arView.marcher) {
          this.arView.controls.enabled = true;
        }
        this.dispatchEvent({ type: 'up', object: this });
      }
    });

    this.arControls.addEventListener('proximityWarning', () => {
      if (this.IsAR()) {
        this.dispatchEvent({ type: 'proximityWarning', object: this });
      }
    });

    this.arControls.addEventListener('proximityNormal', () => {
      if (this.IsAR()) {
        this.dispatchEvent({ type: 'proximityNormal', object: this });
      }
    });

    this.arControls.addEventListener('onDownPan', () => {
      if (this.IsAR()) {
        this.dispatchEvent({ type: 'modelDragged', object: this });
      }
    });

    this.arControls.addEventListener('onDownRotate', () => {
      if (this.IsAR()) {
        this.dispatchEvent({ type: 'modelRotated', object: this });
      }
    });
  };

  setupAREffects = () => {
    this.arEffects = new AREffects({
      object: this.modelGroupObj,
      controls: this.arControls,
      scene: this.scene,
      scale: 1.0,
    });
  };

  update = time => {
    if (this.IsAR()) {
      this.reticle.update(0.5, 0.5);
      if (this.arControls) this.arControls.update(time);
    } else {
      this.updateSceneRotation(time);
    }

    this.S3DControls.update();
    TWEEN.update(time);
    if (this.HUD) this.HUD.update(time);
  };

  updateSceneRotation = time => {
    if (this.modelScene && !this.IsFullscreen()) {
      
      if (this.lastScrollY) {
        let angle = (this.lastScrollY - window.scrollY) / 1200.0;
        this.S3DScene.rotateY(angle);
      }
    }

    this.lastScrollY = window.scrollY;
  };

  render = () => {
    if (this.canvas.id == 'arapp') {
      this.moveSamsung();
    }
    if (this.canvas.id == 'arapp3') {
    }
    if (!this.IsAR()) this.renderer.render(this.S3DScene, this.S3DCamera);

    if (this.HUD) this.HUD.render();
  };

  onWindowResize = () => {
    if (this.IsFullscreen()) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.canvasProps.width = this.canvas.width;
      this.canvasProps.height = this.canvas.height;
    } else {
      let parentRect = this.canvas.parentElement.getBoundingClientRect();
      let width = parentRect.width;
      let height = width / this.canvasProps.aspect;
      this.renderer.setSize(width, height);
      this.canvasProps.width = this.canvas.width;
      this.canvasProps.height = this.canvas.height;
    }
    this.onCanvasResize();
  };

  onCanvasResize = () => {
    if (this.HUD) this.HUD.resize();
    this.updateS3DCamera();
  };

  animate 
}
