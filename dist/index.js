"use strict";

var _fbcache = require("./fbcache");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

Array.prototype.findOneBy = function (column, value) {
  for (var i = 0; i < this.length; i++) {
    var object = this[i];

    if (column in object && object[column] === value) {
      return object;
    }
  }

  return null;
};

function FBCache() {
  var _this = this;

  this.dbms = undefined, this.route = undefined, this.id = undefined, this.database = function () {
    _this.dbms = _fbcache.service.REAL_TIME;
    return _this;
  }, this.ref = function (route) {
    if (_this.dbms === _fbcache.service.REAL_TIME) {
      _this.route = route;
      return _this;
    }

    throw new Error("You cannot call this method without first declaring Real Time Database as DBMS");
  }, this.once = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var levels, baseRoute, resp;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(_this.dbms === _fbcache.service.REAL_TIME && _this.route)) {
              _context.next = 26;
              break;
            }

            levels = _this.route.split('/');
            baseRoute = levels[0];
            levels.splice(0, 1);
            resp = null;

            if (levels.length) {
              _context.next = 11;
              break;
            }

            _context.next = 8;
            return _fbcache.controller.get(_this.dbms, _this.route);

          case 8:
            return _context.abrupt("return", _context.sent);

          case 11:
            if (!levels.length) {
              _context.next = 21;
              break;
            }

            if (!_fbcache.controller.routeInConfig(_this.dbms, baseRoute)) {
              _context.next = 16;
              break;
            }

            return _context.abrupt("break", 21);

          case 16:
            baseRoute += "/";
            baseRoute += levels[0];
            levels.splice(0, 1);

          case 19:
            _context.next = 11;
            break;

          case 21:
            _context.next = 23;
            return _fbcache.controller.get(_this.dbms, baseRoute);

          case 23:
            resp = _context.sent;

            if (levels.length) {
              while (levels.length && resp.info) {
                resp.info = resp.info[levels[0]];
                levels.splice(0, 1);
              }
            }

            return _context.abrupt("return", resp);

          case 26:
            throw new Error("You cannot call this method without reference a child in Real Time Database");

          case 27:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  })), this.child = function (id) {
    if (_this.dbms === _fbcache.service.REAL_TIME) {
      if (_this.route) _this.id = id;else _this.route = id;
      return _this;
    }

    throw new Error("You cannot call this method without first declaring Real Time Database as DBMS");
  }, this.set = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(data) {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!(_this.dbms && _this.route && _this.id && (data || data === {}))) {
                _context2.next = 6;
                break;
              }

              _context2.next = 3;
              return _fbcache.controller.insert(_this.dbms, _this.route, data, _this.id);

            case 3:
              return _context2.abrupt("return", _context2.sent);

            case 6:
              if (_this.dbms) {
                _context2.next = 10;
                break;
              }

              throw new Error("You cannot call this method without first declaring a DBMS");

            case 10:
              if (_this.route) {
                _context2.next = 14;
                break;
              }

              throw new Error("route or collection not indicated");

            case 14:
              if (_this.id) {
                _context2.next = 18;
                break;
              }

              throw new Error("child or doc not indicated");

            case 18:
              throw new Error("data can't be null or undefined");

            case 19:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    return function (_x) {
      return _ref2.apply(this, arguments);
    };
  }(), this.push = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(data) {
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (!(_this.dbms === _fbcache.service.REAL_TIME && _this.route)) {
                _context3.next = 4;
                break;
              }

              _context3.next = 3;
              return _fbcache.controller.insert(_this.dbms, _this.route, data);

            case 3:
              return _context3.abrupt("return", _context3.sent);

            case 4:
              throw new Error("You cannot call this method without first declaring Firestore as DBMS or a collection");

            case 5:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));

    return function (_x2) {
      return _ref3.apply(this, arguments);
    };
  }(), this.update = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(data) {
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (!(_this.dbms && _this.route && _this.id)) {
                _context4.next = 4;
                break;
              }

              _context4.next = 3;
              return _fbcache.controller.update(_this.dbms, _this.route, data, _this.id);

            case 3:
              return _context4.abrupt("return", _context4.sent);

            case 4:
              throw new Error("You cannot call this method without first declaring a DBMS or reference a route for update");

            case 5:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4);
    }));

    return function (_x3) {
      return _ref4.apply(this, arguments);
    };
  }(), this.remove = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            if (!(_this.dbms === _fbcache.service.REAL_TIME && _this.route && _this.id)) {
              _context5.next = 4;
              break;
            }

            _context5.next = 3;
            return _fbcache.controller["delete"](_this.dbms, _this.route, _this.id);

          case 3:
            return _context5.abrupt("return", _context5.sent);

          case 4:
            throw new Error("You cannot call this method without first declaring Real Time Database as DBMS, a collection and a document");

          case 5:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  })), this.firestore = function () {
    _this.dbms = _fbcache.service.FIRESTORE;
    return _this;
  }, this.collection = function (route) {
    if (_this.dbms === _fbcache.service.FIRESTORE) {
      _this.route = route;
      return _this;
    }

    throw new Error("You cannot call this method without first declaring Firestore as DBMS");
  }, this.get = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
    var levels, baseRoute, resp, id;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            if (!(_this.dbms === _fbcache.service.FIRESTORE && _this.route)) {
              _context6.next = 17;
              break;
            }

            levels = _this.route.split('/');
            baseRoute = levels[0];
            levels.splice(0, 1);
            resp = null;
            id = null;

            if (levels.length) {
              _context6.next = 12;
              break;
            }

            _context6.next = 9;
            return _fbcache.controller.get(_this.dbms, _this.route);

          case 9:
            return _context6.abrupt("return", _context6.sent);

          case 12:
            _context6.next = 14;
            return _fbcache.controller.get(_this.dbms, baseRoute);

          case 14:
            resp = _context6.sent;

            if (levels.length && resp.info) {
              id = levels[0];
              levels.splice(0, 1);
              resp.info = resp.info.findOneBy("id", id);
              if (resp.info) resp.info = resp.info.data;

              while (levels.length && resp.info) {
                resp.info = resp.info[levels[0]];
                levels.splice(0, 1);
              }
            }

            return _context6.abrupt("return", resp);

          case 17:
            throw new Error("You cannot call this method without first declaring Firestore as DBMS or a collection");

          case 18:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  })), this.doc = function (id) {
    if (_this.dbms === _fbcache.service.FIRESTORE && _this.route) {
      _this.id = id;
      return _this;
    }

    throw new Error("You cannot call this method without first declaring Firestore as DBMS or a collection");
  }, this.add = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(data) {
      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              if (!(_this.dbms === _fbcache.service.FIRESTORE && _this.route)) {
                _context7.next = 4;
                break;
              }

              _context7.next = 3;
              return _fbcache.controller.insert(_this.dbms, _this.route, data);

            case 3:
              return _context7.abrupt("return", _context7.sent);

            case 4:
              throw new Error("You cannot call this method without first declaring Firestore as DBMS or a collection");

            case 5:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7);
    }));

    return function (_x4) {
      return _ref7.apply(this, arguments);
    };
  }(), this["delete"] = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            if (!(_this.dbms === _fbcache.service.FIRESTORE && _this.route && _this.id)) {
              _context8.next = 4;
              break;
            }

            _context8.next = 3;
            return _fbcache.controller["delete"](_this.dbms, _this.route, _this.id);

          case 3:
            return _context8.abrupt("return", _context8.sent);

          case 4:
            throw new Error("You cannot call this method without first declaring Firestore as DBMS, a collection and a document");

          case 5:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));
}

function initFBCache(_x5, _x6, _x7, _x8) {
  return _initFBCache.apply(this, arguments);
}

function _initFBCache() {
  _initFBCache = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(config, url, credentialType, credential) {
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.next = 2;
            return _fbcache.controller.init(config, url, credentialType, credential);

          case 2:
            return _context9.abrupt("return", _context9.sent);

          case 3:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9);
  }));
  return _initFBCache.apply(this, arguments);
}

module.exports = {
  FBCache: FBCache,
  initFBCache: initFBCache
};