(function bootGrafana() {
  'use strict';

  System.import('app/app').then(function(app) {
    app.init();
  }).catch(function(err) {
    console.log('Loading app module failed: ', err);
  });
})();

// Listen to url changes if in an iframe and send them to the parent window (e.g. inspector app)
// This is used to allow copy-pasting of Inspector URLs that reflect the child window state
(function() {
  'use strict';

  // If this window is within an iframe
  if(window.parent !== window){

    // Override the window.history object's pushState function
    (function(history) {

      var host = window.location.protocol+"//"+window.location.host;
      var pushState = history.pushState;
      history.pushState = function(state, title, url) {
        // Check if the url is fully-qualified and if so, remove the host
        if(url.substring(0,4)==='http'){
          url = url.substring(host.length);
        }

        // Send the url to the parent frame
        window.parent.postMessage({
          metrics_url: url
        }, '*');

        // Call the original pushState function
        return pushState.apply(history, arguments);
      };
    })(window.history);
  }
})();
