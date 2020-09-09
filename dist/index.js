"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _nodeCache = _interopRequireDefault(require("node-cache"));

var admin = _interopRequireWildcard(require("firebase-admin"));

var _uuid = require("uuid");

var _moment = _interopRequireDefault(require("moment"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

//-------------------------------------------INIT CONSTANTS-----------------------------------------------
var myCache = new _nodeCache["default"]();
var formatMoment = "YYYY-MM-DD hh:mm:ss a";
var rtdb = null;
var firestore = null;
var routes = {}; //-------------------------------------------INIT CONSTANTS-----------------------------------------------
//--------------------------------------------ENUM SERVICE------------------------------------------------

var service = {
  FIRESTORE: 'Firestore',
  REAL_TIME: 'Real Time Database'
}; //--------------------------------------------ENUM SERVICE------------------------------------------------
// -----------------------------------------ARRAY PROTOTYPE-----------------------------------------------

Array.prototype.findOneBy = function (column, value) {
  for (var i = 0; i < this.length; i++) {
    var object = this[i];

    if (column in object && object[column] === value) {
      return object;
    }
  }

  return null;
}; // -----------------------------------------ARRAY PROTOTYPE-----------------------------------------------
//---------------------------------------------FUNCTIONS--------------------------------------------------

/**
 * Function to establish connection with a firebase project
 *
 * @param   {string}  url             Firebase project URL
 * @param   {string}  credentialType  Indicates if the credential is a token or a route to a credential file, can be null if you want to connect with the default credential
 * @param   {string}  credential      Token OAuth or route to the credentials file, can be null if you want to connect with the default credential
 *
 * @return  {void}
 */


function firebaseConection(url, credentialType, credential) {
  if (credential && !credentialType) throw new Error("credential can't be defined without credentialType");

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
      throw new Error("".concat(credentialType, " is not a valid value for credentialType"));
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
    route.id = (0, _uuid.v4)();
    if (route.start) route.start = (0, _moment["default"])(route.start, formatMoment);else route.start = (0, _moment["default"])();
    if (route.read_only === undefined) if (read_only === undefined) route.read_only = true;else route.read_only = read_only;
    arrayRoutes.push(route);
  });
  return arrayRoutes;
}

; //---------------------------------------------FUNCTIONS--------------------------------------------------
//--------------------------------------------FBCACHE METHODS---------------------------------------------

var FBCache = {};
/**
 * Inicialize FBCache
 *
 * @param   {Object}            config          Config object with the routes for the cache and the configuration data for the library
 * @param   {string}            url             Firebase project URL
 * @param   {string}            credentialType  Indicates the type of the credential to connect to the Firebase Project
 * @param   {string || Object}  credential      Credential to connect to the Firebase Project
 *
 * @return  {void}                              
 */

FBCache.init = function (config, url, credentialType, credential) {
  if (!url) throw new Error("url is undefined");
  firebaseConection(url, credentialType, credential);
  rtdb = admin.database();
  firestore = admin.firestore();
  if (config.read_only || config.read_only === undefined) routes.read_only = true;else routes.read_only = false;
  if (config.realtime) routes.realtime = getRoutes(config.realtime);
  if (config.firestore) routes.firestore = getRoutes(config.firestore);
  if (config.max_size) routes.max_size = config.max_size;
};

FBCache.get = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(dbms, route) {
    var cacheRoute, infoCache, infoDB, collection;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            cacheRoute = null;
            infoCache = null;
            infoDB = [];
            _context.t0 = dbms;
            _context.next = _context.t0 === service.REAL_TIME ? 6 : _context.t0 === service.FIRESTORE ? 26 : 47;
            break;

          case 6:
            if (routes.realtime) cacheRoute = routes.realtime.findOneBy('name', route);

            if (!cacheRoute) {
              _context.next = 20;
              break;
            }

            infoCache = myCache.get(cacheRoute.id);

            if (!infoCache) {
              _context.next = 13;
              break;
            }

            return _context.abrupt("return", {
              data: infoCache,
              cache: true
            });

          case 13:
            _context.next = 15;
            return rtdb.ref(route).once('value', function (snapshot) {
              return snapshot.val();
            });

          case 15:
            infoDB = _context.sent;
            myCache.set(cacheRoute.id, infoDB, 60);
            return _context.abrupt("return", {
              data: infoDB,
              cache: false,
              startCache: true
            });

          case 18:
            _context.next = 24;
            break;

          case 20:
            _context.next = 22;
            return rtdb.ref(route).once('value', function (snapshot) {
              return snapshot.val();
            });

          case 22:
            infoDB = _context.sent;
            return _context.abrupt("return", {
              data: infoDB,
              cache: false,
              startCache: false
            });

          case 24:
            ;
            return _context.abrupt("break", 48);

          case 26:
            collection = null;
            if (routes.firestore) cacheRoute = routes.firestore.findOneBy('name', route);

            if (!cacheRoute) {
              _context.next = 41;
              break;
            }

            infoCache = myCache.get(cacheRoute.id);

            if (!infoCache) {
              _context.next = 34;
              break;
            }

            return _context.abrupt("return", {
              data: infoCache,
              cache: true
            });

          case 34:
            collection = firestore.collection(route);
            _context.next = 37;
            return collection.get().then(function (snapshot) {
              snapshot.forEach(function (doc) {
                infoDB.push({
                  id: doc.id,
                  data: doc.data()
                });
              });
            });

          case 37:
            myCache.set(cacheRoute.id, infoDB, 60);
            return _context.abrupt("return", {
              data: infoDB,
              cache: false,
              startCache: true
            });

          case 39:
            _context.next = 45;
            break;

          case 41:
            collection = firestore.collection(route);
            _context.next = 44;
            return collection.get().then(function (snapshot) {
              snapshot.forEach(function (doc) {
                infoDB.push({
                  id: doc.id,
                  data: doc.data()
                });
              });
            });

          case 44:
            return _context.abrupt("return", {
              data: infoDB,
              cache: false,
              startCache: false
            });

          case 45:
            ;
            return _context.abrupt("break", 48);

          case 47:
            throw new Error("dbms value invalid");

          case 48:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}(); //--------------------------------------------FBCACHE METHODS---------------------------------------------
//------------------------------------------------EXPORTS-------------------------------------------------


module.exports = {
  FBCache: FBCache,
  service: service
}; //------------------------------------------------EXPORTS-------------------------------------------------