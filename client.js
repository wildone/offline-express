/**
 * Appcache Loader
 *
 * To make the app work offline load a page
 * with an manifest in its HTML tag in an iframe.
 * Also set a cookie so that offline-express
 * knows to hijack / replacing it with a
 * html, css & js bootstrap.
 *
 * @author Matt Andrews <code@mattandre.ws>
 * @copyright The Financial Times
 */
/*jslint browser:true, node:true*/

'use strict';

/**
 * External deps
 */

var defaults = require('./lib/defaults');
var cookie = defaults.cookie;
var namespace = defaults.namespace;

/**
 * Local vars
 */

var statuses = {
  "-1": 'timeout',
  "0": 'uncached',
  "1": 'idle',
  "2": 'checking',
  "3": 'downloading',
  "4": 'updateready',
  "5": 'obsolete'
};

/**
 * The post message event listener
 *
 * @param  {Event} event Post message event
 * @private
 * @return void
 */

function onMessage(event) {
  if (event.data && event.data.type && event.data.type === 'appcache:logEvent') {
    onEvent.apply(window, event.data.args || []);
    window.removeEventListener("message", onMessage);
  }
}

/**
 * Add an iframe into the body to work around
 * the app cache caching masters issue.
 *
 * @private
 * @return {void}
 */

function loadIFrame() {

  // HACK: Set a cookie so that the application
  // root returns a Javascript bootstrap rather
  // than content.
  var cookieExpires = new Date(new Date().getTime() + 60 * 5 * 1000);
  document.cookie = cookie + "=1;expires=" + cookieExpires.toGMTString();
  var iframe = document.createElement('IFRAME');
  iframe.setAttribute('style', 'width:0px; height:0px; visibility:hidden; position:absolute; border:none');
  iframe.setAttribute('src', '/' + namespace + '/iframe');
  iframe.setAttribute('id', 'appcache');
  document.body.appendChild(iframe);
}

/**
 * Listener for the appcache events
 *
 * @param  {String}  eventCode  The application cache code
 * @param  {boolean} hasChecked Whether or not the app cache has checked
 * @private
 * @return {void}
 */

function onEvent(eventCode, hasChecked) {
  var s = statuses[eventCode], loaderEl, cookieExpires;
  if (hasChecked || s === 'timeout') {
    if (s === 'uncached' || s === 'idle' || s === 'obsolete' || s === 'timeout' || s === 'updateready') {
      loaderEl = document.getElementById('appcache');
      loaderEl.parentNode.removeChild(loaderEl);

      // Remove appcacheUpdate cookie
      cookieExpires = new Date(new Date().getTime() - 60 * 5 * 1000);
      document.cookie = cookie + "=;expires=" + cookieExpires.toGMTString();
    }
  }
}

/**
 * Start the app cache install and update process
 *
 * @public
 * @return {void}
 */

module.exports.populateCache = function(options) {
  window.addEventListener("message", onMessage, false);

  // Start app cache update process
  loadIFrame();
};
