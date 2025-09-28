// This file needs to be in the public directory
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker with your project's config
const firebaseConfig = {
  apiKey: "AIzaSyDePhIQo26UglpRWYeYgLBU05TZzyMC3Ig",
  authDomain: "studio-112659148-adafd.firebaseapp.com",
  projectId: "studio-112659148-adafd",
  storageBucket: "studio-112659148-adafd.appspot.com",
  messagingSenderId: "70521988102",
  appId: "1:70521988102:web:c2cd5633465ec71c1f0f87"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
