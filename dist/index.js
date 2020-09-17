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

function setMaxSize(max_size) {
  var baseMaxSize = max_size.split(' ');
  var quantity = baseMaxSize[0];
  var unit = baseMaxSize[1];

  switch (unit) {
    case "B":
      return quantity * 1;

    case "kB":
      return quantity * 1024;

    case "MB":
      return quantity * 1048576;

    default:
      throw new Error("max_size unit invalid");
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

;

function writeCache() {
  if (routes.max_size) {
    var stats = myCache.getStats();
    if (stats.vsize >= routes.max_size) return false;else return true;
  } else return true;
}

function getDeadLinePeriod(now, lastCheckPoint, quantity, unit) {
  var newCheckPoint = lastCheckPoint.clone();

  while (newCheckPoint <= now) {
    newCheckPoint.add(quantity, unit);
  }

  return newCheckPoint;
}

function setTTL(time, type, start) {
  var baseTimeTTL = time.split(' ');
  var quantity = baseTimeTTL[0];
  var unit = baseTimeTTL[1];
  var now = (0, _moment["default"])();
  var deadLine = null;
  var seconds = null;

  switch (type) {
    case "refresh":
      deadLine = (0, _moment["default"])().add(quantity, unit);
      break;

    case "period":
      deadLine = getDeadLinePeriod(now, start, quantity, unit);
      break;
  }

  ;
  seconds = _moment["default"].duration(deadLine.diff(now)).as('seconds');
  return Math.round(seconds);
}

;

function setCache(cacheRoute, info) {
  if (writeCache()) {
    if (cacheRoute.refresh) myCache.set(cacheRoute.id, info, setTTL(cacheRoute.refresh, "refresh"));else myCache.set(cacheRoute.id, info, setTTL(cacheRoute.period, "period", cacheRoute.start));
    return true;
  } else return false;
}

; //---------------------------------------------FUNCTIONS--------------------------------------------------
//--------------------------------------------FBCACHE METHODS---------------------------------------------

var FBCache = {};
/**
 * Inicialize FBCache
 *
 * @param   {object}            config          Config object with the routes for the cache and the configuration data for the library
 * @param   {string}            url             Firebase project URL
 * @param   {string}            credentialType  Indicates the type of the credential to connect to the Firebase Project
 * @param   {string || object}  credential      Credential to connect to the Firebase Project
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
  if (config.max_size) routes.max_size = setMaxSize(config.max_size);
};
/**
 * Method to make a query to Real Time Database or Firestore, if the path is specified to make a cache, it is about consulting the cache, in case the information is expired or the path is not specified, it will be done a query to Firebase
 *
 * @param   {string}  dbms   Indicates if you want to make a query to Real Time Database or Firestore
 * @param   {string}  route  Route to be consulted
 *
 * @return  {object}         Query result, along with indicators on whether or not the cache was queried, or refreshed
 */


FBCache.get = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(dbms, route) {
    var cacheRoute, infoCache, infoDB, updateCache, collection;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            cacheRoute = null;
            infoCache = null;
            infoDB = [];
            updateCache = false;
            _context.t0 = dbms;
            _context.next = _context.t0 === service.REAL_TIME ? 7 : _context.t0 === service.FIRESTORE ? 24 : 45;
            break;

          case 7:
            if (routes.realtime) cacheRoute = routes.realtime.findOneBy('name', route);

            if (!cacheRoute) {
              _context.next = 19;
              break;
            }

            infoCache = myCache.get(cacheRoute.id);

            if (!infoCache) {
              _context.next = 14;
              break;
            }

            return _context.abrupt("return", {
              data: infoCache,
              cache: true
            });

          case 14:
            _context.next = 16;
            return rtdb.ref(route).once('value', function (snapshot) {
              infoDB = snapshot.val();
              updateCache = setCache(cacheRoute, snapshot.val());
            });

          case 16:
            return _context.abrupt("return", {
              data: infoDB,
              cache: false,
              startCache: updateCache
            });

          case 17:
            _context.next = 22;
            break;

          case 19:
            _context.next = 21;
            return rtdb.ref(route).once('value', function (snapshot) {
              infoDB = snapshot.val();
            });

          case 21:
            return _context.abrupt("return", {
              data: infoDB,
              cache: false,
              startCache: false
            });

          case 22:
            ;
            return _context.abrupt("break", 46);

          case 24:
            collection = null;
            if (routes.firestore) cacheRoute = routes.firestore.findOneBy('name', route);

            if (!cacheRoute) {
              _context.next = 39;
              break;
            }

            infoCache = myCache.get(cacheRoute.id);

            if (!infoCache) {
              _context.next = 32;
              break;
            }

            return _context.abrupt("return", {
              data: infoCache,
              cache: true
            });

          case 32:
            collection = firestore.collection(route);
            _context.next = 35;
            return collection.get().then(function (snapshot) {
              snapshot.forEach(function (doc) {
                infoDB.push({
                  id: doc.id,
                  data: doc.data()
                });
              });
            });

          case 35:
            updateCache = setCache(cacheRoute, infoDB);
            return _context.abrupt("return", {
              data: infoDB,
              cache: false,
              startCache: updateCache
            });

          case 37:
            _context.next = 43;
            break;

          case 39:
            collection = firestore.collection(route);
            _context.next = 42;
            return collection.get().then(function (snapshot) {
              snapshot.forEach(function (doc) {
                infoDB.push({
                  id: doc.id,
                  data: doc.data()
                });
              });
            });

          case 42:
            return _context.abrupt("return", {
              data: infoDB,
              cache: false,
              startCache: false
            });

          case 43:
            ;
            return _context.abrupt("break", 46);

          case 45:
            throw new Error("dbms value invalid");

          case 46:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

FBCache.insert = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(dbms, route, data, id) {
    var cacheRoute, childRef, child, collection, generateID;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            cacheRoute = null;
            childRef = null;
            child = null;
            collection = null;
            generateID = null;
            _context2.t0 = dbms;
            _context2.next = _context2.t0 === service.REAL_TIME ? 8 : _context2.t0 === service.FIRESTORE ? 23 : 35;
            break;

          case 8:
            if (routes.realtime) cacheRoute = routes.realtime.findOneBy('name', route);

            if (!(cacheRoute && cacheRoute.read_only || !cacheRoute && routes.read_only)) {
              _context2.next = 11;
              break;
            }

            throw new Error("the path was specified as read-only");

          case 11:
            if (!id) {
              _context2.next = 18;
              break;
            }

            childRef = rtdb.ref(route);
            child = childRef.child(id);
            _context2.next = 16;
            return child.set(data);

          case 16:
            _context2.next = 22;
            break;

          case 18:
            childRef = rtdb.ref();
            child = childRef.child(route);
            _context2.next = 22;
            return child.push(data);

          case 22:
            return _context2.abrupt("break", 36);

          case 23:
            if (routes.firestore) cacheRoute = routes.firestore.findOneBy('name', route);

            if (!(cacheRoute && cacheRoute.read_only || !cacheRoute && routes.read_only)) {
              _context2.next = 26;
              break;
            }

            throw new Error("the path was specified as read-only");

          case 26:
            collection = firestore.collection(route);

            if (!id) {
              _context2.next = 32;
              break;
            }

            _context2.next = 30;
            return collection.doc(id).set(data);

          case 30:
            _context2.next = 34;
            break;

          case 32:
            _context2.next = 34;
            return collection.add(data);

          case 34:
            return _context2.abrupt("break", 36);

          case 35:
            throw new Error("dbms value invalid");

          case 36:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function (_x3, _x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  };
}(); //--------------------------------------------FBCACHE METHODS---------------------------------------------
//------------------------------------------------EXPORTS-------------------------------------------------


module.exports = {
  FBCache: FBCache,
  service: service
}; //------------------------------------------------EXPORTS-------------------------------------------------