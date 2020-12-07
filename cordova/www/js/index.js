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
    this.initOneSignal();
  }

  // deviceready Event Handler
  //
  // Bind any cordova events here. Common events are:
  // 'pause', 'resume', etc.
  onDeviceReady () {
    window.plugins.webviewcolor.change('#031926');

    this.initDeferredStyles();
    this.initKeyboardHandling();

    const scripts = [
      'dist/vendors~main.js',
      'dist/vendors~node-emoji.js',
      'dist/vendors~photoswipe-ui-default.js',
      'dist/vendors~photoswipe.js',
      'dist/vendors~showdown-xss-filter.js',
      'dist/vendors~showdown.js',
      'dist/main.js',
    ];

    for (let script of scripts) {
      const el = document.createElement('script');
      el.src = script;
      document.getElementsByTagName('head')[0].appendChild(el);
    }

    // this.fixWindowSize();
  }

  initOneSignal () {
    // Enable to debug issues.
    window.plugins.OneSignal.setLogLevel({logLevel: 6, visualLevel: 4});

    window.plugins.OneSignal.startInit('113ebc97-79d7-4f63-9f20-045913af0a49');

    window.plugins.OneSignal.setRequiresUserPrivacyConsent(true);

    let resolve;
    window.appPushPlayerIdPromise = new Promise(res => resolve = res);

    const notificationReceivedCallback = jsonData => {
      console.log('notificationReceivedCallback: ', jsonData);
    };
    const notificationOpenedCallback = openedResult => {
      window.router.navigate('/c/'+openedResult.notification.payload.additionalData.conversationGuid);
    };

    // Set your iOS Settings
    var iosSettings = {};
    iosSettings["kOSSettingsKeyAutoPrompt"] = false;
    iosSettings["kOSSettingsKeyInAppLaunchURL"] = false;

    const checkState = () => {
      window.plugins.OneSignal.getPermissionSubscriptionState(status => {
        if (status.subscriptionStatus.subscribed && status.subscriptionStatus.userId) {
          // get player ID
          resolve(status.subscriptionStatus.userId);
        }
      });
    };
    checkState();
    window.plugins.OneSignal.addPermissionObserver(state => {
      checkState();
    });
    window.plugins.OneSignal.addSubscriptionObserver(state => {
      if (state.to.subscribed && state.to.userId) {
        // get player ID
        resolve(state.to.userId);
      }
    });

    window.plugins.OneSignal
      .handleNotificationReceived(notificationReceivedCallback)
      .handleNotificationOpened(notificationOpenedCallback)
      .iOSSettings(iosSettings)
      .inFocusDisplaying(window.plugins.OneSignal.OSInFocusDisplayOption.None) // Change to '.InAppAlert' for testing.
      .endInit();
  }

  initKeyboardHandling () {
    Keyboard.shrinkView(true);
    Keyboard.hideFormAccessoryBar(true);
    // window.addEventListener('keyboardHeightWillChange', this.fixWindowSize.bind(this));
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

  fixWindowSize(event) {
    document.body.style.paddingBottom = event ? event.keyboardHeight+'px' : '0';
    document.body.scrollTop = 0;

    // Fire a resize event.
    let resize = new UIEvent('resize');
    window.dispatchEvent(resize);
  }
}

// Nymph Config
NymphOptions = {
  restURL: 'https://tunnelgram.com/rest.php',
  pubsubURL: 'wss://pubsub.tunnelgram.com'
};

inCordova = true;

const app = new CordovaApp();
app.initialize();
