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

function updateStartRoute(id, deadLine) {
  routes.realtime.forEach(function (route) {
    if (route.id === id) {
      route.start = deadLine;
      return true;
    }
  });
  routes.firestore.forEach(function (route) {
    if (route.id === id) {
      route.start = deadLine;
      return true;
    }
  });
  return false;
}

function setTTL(id, time, type, start) {
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
  updateStartRoute(id, deadLine);
  seconds = _moment["default"].duration(deadLine.diff(now)).as('seconds');
  return Math.round(seconds);
}

;

function setCache(cacheRoute, info) {
  if (writeCache()) {
    if (cacheRoute.refresh) myCache.set(cacheRoute.id, info, setTTL(cacheRoute.id, cacheRoute.refresh, "refresh"));else myCache.set(cacheRoute.id, info, setTTL(cacheRoute.id, cacheRoute.period, "period", cacheRoute.start));
    return true;
  } else return false;
}

;

function getNewData(dbms, oldData, insertData, id) {
  var newData = oldData;
  var update = true;

  switch (dbms) {
    case service.REAL_TIME:
      newData[id] = insertData;
      return newData;
      break;

    case service.FIRESTORE:
      newData.forEach(function (doc) {
        if (doc.id === id) {
          doc.data = insertData;
          update = false;
        }
      });
      if (update) newData.push({
        id: id,
        data: insertData
      });
      return newData;
      break;
  }
}

function getUpdateData(dbms, oldData, updateData, id) {
  var newData = oldData;
  var child = null;
  var doc = null;

  switch (dbms) {
    case service.REAL_TIME:
      child = oldData[id];

      if (child) {
        Object.keys(updateData).map(function (key) {
          if (updateData[key]) child[key] = updateData[key];
        });
        newData[id] = child;
      }

      return newData;
      break;

    case service.FIRESTORE:
      doc = oldData.findOneBy("id", id).data;

      if (doc) {
        Object.keys(updateData).map(function (key) {
          if (updateData[key]) doc[key] = updateData[key];
        });

        for (var i = 0; i < newData.length; i++) {
          if (newData[i].id === id) {
            newData[i].data = doc;
            break;
          }
        }
      }

      return newData;
      break;
  }
}

function getDeleteData(dbms, oldData, id) {
  var newData = oldData;

  switch (dbms) {
    case service.REAL_TIME:
      delete newData[id];
      return newData;
      break;

    case service.FIRESTORE:
      for (var i = 0; i < newData.length; i++) {
        if (newData[i].id === id) {
          newData.splice(i, 1);
          break;
        }
      }

      return newData;
      break;
  }
}

function getActualTTL(deadLine) {
  var now = (0, _moment["default"])();

  var seconds = _moment["default"].duration(deadLine.diff(now)).as('seconds');

  return Math.round(seconds);
}

function insertCache(cacheRoute, dbms, insertData, id) {
  if (writeCache()) {
    var oldData = myCache.get(cacheRoute.id);

    if (oldData) {
      var newData = getNewData(dbms, oldData, insertData, id);
      myCache.set(cacheRoute.id, newData, getActualTTL(cacheRoute.start));
      return true;
    } else return false;
  } else return false;
}

function updateCacheInfo(cacheRoute, dbms, updateData, id) {
  if (writeCache()) {
    var oldData = myCache.get(cacheRoute.id);

    if (oldData) {
      var newData = getUpdateData(dbms, oldData, updateData, id);
      myCache.set(cacheRoute.id, newData, getActualTTL(cacheRoute.start));
      return true;
    } else return false;
  } else return false;
}

function deleteCache(cacheRoute, dbms, id) {
  if (writeCache()) {
    var oldData = myCache.get(cacheRoute.id);

    if (oldData) {
      var newData = getDeleteData(dbms, oldData, id);
      myCache.set(cacheRoute.id, newData, getActualTTL(cacheRoute.start));
      return true;
    } else return false;
  } else return false;
} //---------------------------------------------FUNCTIONS--------------------------------------------------
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
              info: infoCache,
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
              info: infoDB,
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
              info: infoDB,
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
              info: infoCache,
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
              info: infoDB,
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
              info: infoDB,
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
    var cacheRoute, generateID, updateCache, routeInCache;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (route) {
              _context2.next = 2;
              break;
            }

            throw new Error("route can't be null or undefined");

          case 2:
            if (!(!data || Object.entries(data).length === 0 || data === [])) {
              _context2.next = 4;
              break;
            }

            throw new Error("data can't be null or undefined");

          case 4:
            cacheRoute = null;
            generateID = null;
            updateCache = false;
            routeInCache = false;
            _context2.t0 = dbms;
            _context2.next = _context2.t0 === service.REAL_TIME ? 11 : _context2.t0 === service.FIRESTORE ? 25 : 39;
            break;

          case 11:
            if (routes.realtime) cacheRoute = routes.realtime.findOneBy('name', route);

            if (!(cacheRoute && cacheRoute.read_only || !cacheRoute && routes.read_only)) {
              _context2.next = 14;
              break;
            }

            throw new Error("the path was specified as read-only");

          case 14:
            if (!id) {
              _context2.next = 19;
              break;
            }

            _context2.next = 17;
            return rtdb.ref(route).child(id).set(data);

          case 17:
            _context2.next = 22;
            break;

          case 19:
            _context2.next = 21;
            return rtdb.ref().child(route).push(data);

          case 21:
            generateID = _context2.sent;

          case 22:
            if (cacheRoute) {
              routeInCache = true;
              updateCache = insertCache(cacheRoute, service.REAL_TIME, data, id ? id : generateID.key);
            }

            return _context2.abrupt("return", {
              routeInConfig: routeInCache,
              updateCache: updateCache
            });

          case 25:
            if (routes.firestore) cacheRoute = routes.firestore.findOneBy('name', route);

            if (!(cacheRoute && cacheRoute.read_only || !cacheRoute && routes.read_only)) {
              _context2.next = 28;
              break;
            }

            throw new Error("the path was specified as read-only");

          case 28:
            if (!id) {
              _context2.next = 33;
              break;
            }

            _context2.next = 31;
            return firestore.collection(route).doc(id).set(data);

          case 31:
            _context2.next = 36;
            break;

          case 33:
            _context2.next = 35;
            return firestore.collection(route).add(data);

          case 35:
            generateID = _context2.sent;

          case 36:
            if (cacheRoute) {
              routeInCache = true;
              updateCache = insertCache(cacheRoute, service.FIRESTORE, data, id ? id : generateID.id);
            }

            return _context2.abrupt("return", {
              routeInConfig: routeInCache,
              updateCache: updateCache
            });

          case 39:
            throw new Error("dbms value invalid");

          case 40:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function (_x3, _x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  };
}();

FBCache.update = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(dbms, route, data, id) {
    var cacheRoute, updateCache, routeInCache;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (route) {
              _context3.next = 2;
              break;
            }

            throw new Error("route can't be null or undefined");

          case 2:
            if (!(!data || Object.entries(data).length === 0 || data === [])) {
              _context3.next = 4;
              break;
            }

            throw new Error("data can't be null or undefined");

          case 4:
            if (id) {
              _context3.next = 6;
              break;
            }

            throw new Error("id can't be null or undefined");

          case 6:
            cacheRoute = null;
            updateCache = false;
            routeInCache = false;
            _context3.t0 = dbms;
            _context3.next = _context3.t0 === service.REAL_TIME ? 12 : _context3.t0 === service.FIRESTORE ? 20 : 27;
            break;

          case 12:
            if (routes.realtime) cacheRoute = routes.realtime.findOneBy('name', route);

            if (!(cacheRoute && cacheRoute.read_only || !cacheRoute && routes.read_only)) {
              _context3.next = 15;
              break;
            }

            throw new Error("the path was specified as read-only");

          case 15:
            _context3.next = 17;
            return rtdb.ref(route).child(id).update(data);

          case 17:
            if (cacheRoute) {
              routeInCache = true;
              updateCache = updateCacheInfo(cacheRoute, service.REAL_TIME, data, id);
            }

            return _context3.abrupt("return", {
              routeInConfig: routeInCache,
              updateCache: updateCache
            });

          case 20:
            if (routes.firestore) cacheRoute = routes.firestore.findOneBy('name', route);

            if (!(cacheRoute && cacheRoute.read_only || !cacheRoute && routes.read_only)) {
              _context3.next = 23;
              break;
            }

            throw new Error("the path was specified as read-only");

          case 23:
            firestore.collection(route).doc(id).update(data);

            if (cacheRoute) {
              routeInCache = true;
              updateCache = updateCacheInfo(cacheRoute, service.FIRESTORE, data, id);
            }

            return _context3.abrupt("return", {
              routeInConfig: routeInCache,
              updateCache: updateCache
            });

          case 27:
            throw new Error("dbms value invalid");

          case 28:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function (_x7, _x8, _x9, _x10) {
    return _ref3.apply(this, arguments);
  };
}();

FBCache["delete"] = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(dbms, route, id) {
    var cacheRoute, updateCache, routeInCache;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (route) {
              _context4.next = 2;
              break;
            }

            throw new Error("route can't be null or undefined");

          case 2:
            if (id) {
              _context4.next = 4;
              break;
            }

            throw new Error("id can't be null or undefined");

          case 4:
            cacheRoute = null;
            updateCache = false;
            routeInCache = false;
            _context4.t0 = dbms;
            _context4.next = _context4.t0 === service.REAL_TIME ? 10 : _context4.t0 === service.FIRESTORE ? 18 : 25;
            break;

          case 10:
            if (routes.realtime) cacheRoute = routes.realtime.findOneBy('name', route);

            if (!(cacheRoute && cacheRoute.read_only || !cacheRoute && routes.read_only)) {
              _context4.next = 13;
              break;
            }

            throw new Error("the path was specified as read-only");

          case 13:
            _context4.next = 15;
            return rtdb.ref(route).child(id).remove();

          case 15:
            if (cacheRoute) {
              routeInCache = true;
              updateCache = deleteCache(cacheRoute, service.REAL_TIME, id);
            }

            return _context4.abrupt("return", {
              routeInConfig: routeInCache,
              updateCache: updateCache
            });

          case 18:
            if (routes.firestore) cacheRoute = routes.firestore.findOneBy('name', route);

            if (!(cacheRoute && cacheRoute.read_only || !cacheRoute && routes.read_only)) {
              _context4.next = 21;
              break;
            }

            throw new Error("the path was specified as read-only");

          case 21:
            firestore.collection(route).doc(id)["delete"]();

            if (cacheRoute) {
              routeInCache = true;
              updateCache = deleteCache(cacheRoute, service.FIRESTORE, id);
            }

            return _context4.abrupt("return", {
              routeInConfig: routeInCache,
              updateCache: updateCache
            });

          case 25:
            throw new Error("dbms value invalid");

          case 26:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function (_x11, _x12, _x13) {
    return _ref4.apply(this, arguments);
  };
}(); //--------------------------------------------FBCACHE METHODS---------------------------------------------
//------------------------------------------------EXPORTS-------------------------------------------------


module.exports = {
  FBCache: FBCache,
  service: service
}; //------------------------------------------------EXPORTS-------------------------------------------------