// Non-intrusive service worker registration for Lexora PWA
if ('serviceWorker' in navigator) {
  // register after load to avoid slowing initial parse
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      // registration succeeded
      // keep console-only messages to avoid UI changes
      console.log('ServiceWorker registered:', reg.scope);
    }).catch(err => {
      console.log('ServiceWorker registration failed:', err);
    });
  });
}
