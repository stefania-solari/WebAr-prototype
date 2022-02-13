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

//import './lib/webar-desktop.min';

import App from './app/App';

let canvas = document.getElementById('arapp');
let canvas2 = document.getElementById('arapp2');
let canvas3 = document.getElementById('arapp3');

new App({
  canvas: canvas,
  width: canvas.width,
  height: canvas.height,
});

new App({
  canvas: canvas2,
  width: canvas2.width,
  height: canvas2.height,
});

console.log(canvas2.height);

new App({
  canvas: canvas3,
  width: canvas3.width,
  height: canvas3.height,
});