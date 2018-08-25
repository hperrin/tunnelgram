/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
class CordovaApp {
  initialize () {
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
  }

  // deviceready Event Handler
  //
  // Bind any cordova events here. Common events are:
  // 'pause', 'resume', etc.
  onDeviceReady () {
    this.initOneSignal();
    this.initDeferredStyles();

    const script = document.createElement('script');
    script.src = 'dist/main.js';
    document.getElementsByTagName('head')[0].appendChild(script);
  }

  initOneSignal () {
    // Enable to debug issues.
    // window.plugins.OneSignal.setLogLevel({logLevel: 4, visualLevel: 4});

    const notificationOpenedCallback = jsonData => {
      console.log('notificationOpenedCallback: ' + JSON.stringify(jsonData));
    };

    window.plugins.OneSignal
      .startInit('113ebc97-79d7-4f63-9f20-045913af0a49')
      .handleNotificationOpened(notificationOpenedCallback)
      .endInit();
  }

  initDeferredStyles () {
    function include(href) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.type = 'text/css';
      var prev = document.getElementsByTagName('link')[0];
      prev.parentNode.insertBefore(link, prev);
    }
    // PForm
    include('dist/node_modules/pform/css/pform.css');
    include('dist/node_modules/pform/css/pform-bootstrap.css');
    // Markdown GitHub Style CSS
    include('dist/node_modules/github-markdown-css/github-markdown.css');
    // Font Awesome
    include('dist/node_modules/@fortawesome/fontawesome/styles.css');
    // PhotoSwipe
    include('dist/node_modules/photoswipe/dist/photoswipe.css');
    include('dist/node_modules/photoswipe/dist/default-skin/default-skin.css');
  }
}

// Nymph Config
NymphOptions = {
  restURL: 'https://tunnelgram.com/rest.php',
  pubsubURL: 'wss://pubsub.tunnelgram.com',
  rateLimit: 100
};

inCordova = true;

const app = new CordovaApp();
app.initialize();
