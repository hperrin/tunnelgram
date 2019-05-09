import Conversation from '../Entities/Tunnelgram/Conversation';

// Offline Cache

const CACHE_STATIC = 'tunnelgram-static-v2';
const CACHE_CONTENT = 'tunnelgram-content-v2'

// Open new caches.
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_STATIC).then(cache => {
        return Promise.all([
          cache.add('/').catch(() => {
            // Ignore errors.
          }),
          cache.add('/dist/main.js').catch(() => {
            // Ignore errors.
          }),
          cache.add('/dist/main.css').catch(() => {
            // Ignore errors.
          }),
          cache.add('/dist/showdown.js').catch(() => {
            // Ignore errors.
          })
        ]);
      }),
      caches.open(CACHE_CONTENT)
    ])
    .then(() => self.skipWaiting(), () => self.skipWaiting())
  );
});

// Remove old caches.
self.addEventListener('activate', event => {
  var cacheKeeplist = [CACHE_STATIC, CACHE_CONTENT];

  event.waitUntil(
    caches.keys().then(keyList => Promise.all(keyList.map(key => {
      if (cacheKeeplist.indexOf(key) === -1) {
        return caches.delete(key);
      }
    })))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  function fetchAndAddToCache (cacheType, cache, request) {
    return fetch(request).then(response => {
      console.log('['+cacheType+' Cache] add item to offline: '+response.url);
      cache.put(request, response.clone());
      return response;
    }, () => {
      // Ignore errors.
    });
  }

  if (event.request.url.startsWith('https://tunnelgram.com/rest.php')
      || event.request.url.startsWith('http://localhost:8080/rest.php')
      || event.request.url.startsWith('https://tunnelgram.com/dist/')
      || event.request.url.startsWith('http://localhost:8080/dist/')) {
    // Check in the cache second, return response.
    // If not in the cache, return error page.
    event.respondWith(caches.open(CACHE_CONTENT).then(cache => {
      return fetchAndAddToCache('Content', cache, event.request).catch(error => {
        console.log('[Content Cache] Network request Failed. Serving content from cache: ' + error);
        return cache.match(event.request).then(matching => {
          const report = (!matching || matching.status == 404) ? Promise.reject('no-match') : matching;
          return report;
        });
      });
    }));
  } else {
    // Check in the cache first, return response.
    // If not in the cache, return error page.
    event.respondWith(caches.open(CACHE_STATIC).then(cache => {
      return cache.match(event.request).then(matching => {
        if (!matching) {
          console.log('[Static Cache] Not found in cache. Requesting from network: ' + event.request.url);
          return fetchAndAddToCache('Static', cache, event.request);
        }
        console.log('[Static Cache] Serving request from cache: ' + event.request.url);
        const report = matching.status == 404 ? Promise.reject('no-match') : matching;
        return report;
      });
    }));
  }
});


// Web push notifications

// Portions Copyright 2016 Peter Beverloo. All rights reserved.
// Use of those portions of this source code is governed by the MIT license.

// Distributes a message to all window clients controlled by the current Service Worker.
function sendMessageToAllClients(command, message) {
  clients.matchAll({type: 'window'}).then(windowClients => {
    windowClients.forEach(windowClient => {
      windowClient.postMessage({command: command, message: message || ''});
    });
  });
}

self.addEventListener('message', event => {
  switch (event.data.command) {
    case 'subscribe':
      const subscriptionOptions = event.data.subscriptionOptions;
      if (subscriptionOptions.hasOwnProperty('applicationServerKey')) {
        subscriptionOptions.applicationServerKey = new Uint8Array(subscriptionOptions.applicationServerKey);
      }

      registration.pushManager.subscribe(subscriptionOptions).then(subscription => {
        sendMessageToAllClients('subscribe-success');
      }).catch(error => {
        sendMessageToAllClients('subscribe-failure', '' + error);
      });

      break;

    case 'unsubscribe':
      registration.pushManager.getSubscription().then(subscription => {
        if (subscription) {
          return subscription.unsubscribe();
        }
      }).then(() => {
        sendMessageToAllClients('unsubscribe-success');
      }).catch(error => {
        sendMessageToAllClients('unsubscribe-failure', '' + error);
      });
  }
});

self.addEventListener('push', event => {
  console.log('Push Event: ', event);

  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  const promiseChain = isClientFocused().then(clientIsFocused => {
    if (clientIsFocused) {
      // No need to show a notification.
      return;
    }
    return getEndpoint().then(endpoint => fetch('./user/pull.php', {
      body: 'endpoint=' + encodeURIComponent(endpoint),
      cache: 'no-cache',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      method: 'POST'
    })).then(response => response.json()).then(payload => {
      let promises = payload.data.map(entry => {
        const showNameProp = entry.conversation.data.acFull.length > 2
          ? 'nameFirst'
          : 'name';
        const title = entry.conversation.data.acFull.length === 1
          ? 'Just You'
          : (
              entry.new
                ? 'New '+Conversation.MODE_SHORT_NAME[entry.conversation.data.mode].toLowerCase()+' with '
                : (entry.conversation.data.name == null
                    ? ''
                    : Conversation.MODE_SHORT_NAME[entry.conversation.data.mode]+' with '
                  )
            ) + (
              entry.conversation.data.acFull
                .filter(user => user[1] !== payload.currentUserGuid)
                .map(user => payload.users[user[1]].data[showNameProp])
                .join(', ')
            );

        let users = [];
        entry.messages.map(message => {
          if (users.indexOf(message.data.user[1]) === -1) {
            users.push(message.data.user[1]);
          }
        });
        users = users.map(guid => payload.users[guid].data.name);

        // Build a message for the notification.
        let message;
        if (entry.messages.length === 0) {
          if (entry.new) {
            message = payload.users[entry.conversation.data.user[1]].data.name + ' started a '+Conversation.MODE_SHORT_NAME[entry.conversation.data.mode].toLowerCase()+'.';
          } else {
            message = 'The '+Conversation.MODE_SHORT_NAME[entry.conversation.data.mode].toLowerCase()+' was updated.';
          }
        } else {
          if (entry.messages.length === 1) {
            if (entry.messages[0].data.informational) {
              message = 'Update from ';
            } else if (entry.messages[0].data.images.length) {
              message = 'Photo from ';
            } else if (entry.messages[0].data.video !== null) {
              message = 'Video from ';
            } else {
              message = 'Message from ';
            }
          } else {
            message = entry.messages.length + ' messages from ';
          }

          message += users.join(', ') + '.';
        }

        return sendNotification(title, message, entry.conversation.guid, entry.conversation.mdate * 1000);
      });
      return Promise.all(promises);
    });
  });
  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', event => {
  const clickedNotification = event.notification;
  clickedNotification.close();

  event.waitUntil(openConversation(parseFloat(clickedNotification.tag)));
});


// Utility functions

function getEndpoint () {
  return self.registration.pushManager.getSubscription().then(subscription => {
    if (subscription) {
      return subscription.endpoint;
    }

    throw new Error('User not subscribed');
  });
}

function isClientFocused () {
  return clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(windowClients => {
    let clientIsFocused = false;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.focused) {
        clientIsFocused = true;
        break;
      }
    }

    return clientIsFocused;
  });
}

function sendNotification (title, body, guid, timestamp) {
  return self.registration.showNotification(title, {
    body,
    badge: '/images/badge-72x72.png?v=9BPPr7gv28',
    icon: '/images/android-chrome-192x192.png?v=9BPPr7gv28',
    renotify: true,
    tag: '' + guid,
    timestamp,
    vibrate: [120, 240, 120, 240, 360]
  });
};

function openConversation (conversationId) {
  const urlToOpen = new URL('/#/c/'+conversationId, self.location.origin).href;

  return clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(windowClients => {
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === urlToOpen) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return clients.openWindow(urlToOpen);
    }
  });
};
