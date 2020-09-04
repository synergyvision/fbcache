"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FBCache = exports.service = void 0;

var _nodeCache = _interopRequireDefault(require("node-cache"));

var admin = _interopRequireWildcard(require("firebase-admin"));

var _uuid = require("uuid");

var _moment = _interopRequireDefault(require("moment"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var myCache = new _nodeCache["default"]();
var formatMoment = "YYYY-MM-DD hh:mm:ss a";
var rtdb = null;
var firestore = null;
var routes = {};
var service = {
  FIRESTORE: 'Firestore',
  REAL_TIME: 'Real Time Database'
};

exports.service = service;

/**
 * Function to establish connection with a firebase project
 *
 * @param   {string}  url             Firebase project URL
 * @param   {string}  credential      Token OAuth or route to the credentials file, can be null if you want to connect with the default credential
 * @param   {string}  credentialType  Indicates if the credential is a token or a route to a credential file, can be null if you want to connect with the default credential
 *
 * @return  {void}
 */
function firebaseConection(url, credential, credentialType) {
  if (credential && !credentialType) throw new Error("credential_type is undefined");

  switch (credentialType) {
    case "file":
      admin.initializeApp({
        credential: admin.credential.cert(credential),
        databaseURL: url
      });
      break;

    case "token":
      admin.initializeApp({
        credential: admin.credential.refreshToken(credential),
        databaseURL: url
      });
      break;

    case undefined:
      admin.initializeApp();
      break;

    default:
      throw new Error("".concat(credentialType, " is not a valid value for credential_tipe"));
  }
}
/**
 * Function to get from the config object the routes to Real Time Database or Firestore for the cache and checks if is all ok with the values in the config object 
 *
 * @param   {Array}      routes      Routes in the config object to Real Time Database or Firestore
 * @param   {boolean}    read_only   general configuration read_only
 *
 * @return  {Array}              The routes with the configuration 
 */
function getRoutes(routes, read_only) {
  var arrayRoutes = [];
  routes.forEach(function (route) {
    if (!route.name) throw new Error("A route defined to Firebase don't have name");
    if (route.refresh && route.period) throw new Error("Refresh and period can't be defined in the same time in the same route");
    if (!route.period && route.start) throw new Error("start can't be defined without period");
    route.id = uuid.v4();
    if (route.start) route.start = (0, _moment["default"])(route.start, formatMoment);else route.start = (0, _moment["default"])();
    if (route.read_only === undefined) if (read_only === undefined) route.read_only = true;else route.read_only = read_only;
    arrayRoutes.push(route);
  });
  return arrayRoutes;
}

var FBCache = {};

exports.FBCache = FBCache;

/**
 * Inicialize FBCache
 *
 * @param   {Object}  config  Config object with the url to the project, credential, routes for the cache and the configuration data for the library
 *
 * @return  {void}
 */
FBCache.init = function (config) {
  if (!config.url) throw new Error("url is undefined");
  firebaseConection(config.url, config.credential, config.credential_type);
  rtdb = admin.database();
  firestore = admin.firestore();
  if (config.read_only || config.read_only === undefined) routes.read_only = true;else routes.read_only = false;
  if (config.realtime) routes.realtime = getRoutes(config.realtime);
  if (config.firestore) routes.firestore = getRoutes(config.firestore);
  if (config.max_size) routes.max_size = config.max_size;
};

function qwerty () {
  
}