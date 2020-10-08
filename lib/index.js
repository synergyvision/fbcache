import { controller, service } from "./fbcache";

Array.prototype.findOneBy = function (column, value) {
    for (let i = 0; i < this.length; i++) {
        let object = this[i];
        if (column in object && object[column] === value) {
            return object;
        }
    }
    return null;
}

function FBCache() {
    this.dbms = undefined,
    this.route = undefined,
    this.id = undefined,

    this.database = () => {
        this.dbms = service.REAL_TIME;
        return this;
    },

    this.ref = (route) => {
        if(this.dbms === service.REAL_TIME){
            this.route = route;
            return this;
        }
        throw new Error("You cannot call this method without first declaring Real Time Database as DBMS")
    },

    this.once = async () => {
        if(this.dbms === service.REAL_TIME && this.route){
            let levels = this.route.split('/');
            let baseRoute = levels[0];
            levels.splice(0,1);
            let resp = null;
            if(!levels.length)
                return await controller.get(this.dbms, this.route);
            else{
                while(levels.length){
                    if(controller.routeInConfig(this.dbms, baseRoute))
                        break;
                    else{
                        baseRoute += "/";
                        baseRoute += levels[0];
                        levels.splice(0,1);
                    }
                }
                resp = await controller.get(this.dbms, baseRoute);
                if(levels.length){
                    while(levels.length && resp.info){
                        resp.info = resp.info[levels[0]];
                        levels.splice(0,1);
                    }
                }
                return resp;
            }
        }
        throw new Error("You cannot call this method without reference a child in Real Time Database");
    },

    this.child = (id) => {
        if(this.dbms === service.REAL_TIME){
            if(this.route)
                this.id = id;
            else
                this.route = id;
            return this;
        }
        throw new Error("You cannot call this method without first declaring Real Time Database as DBMS")
    },

    this.set = async (data) => {
        if(this.dbms && this.route && this.id && (data || data === {})){
            return await controller.insert(this.dbms, this.route, data, this.id);
        }
        else if(!this.dbms)
            throw new Error("You cannot call this method without first declaring a DBMS");
        else if(!this.route)
            throw new Error("route or collection not indicated")
        else if(!this.id)
            throw new Error("child or doc not indicated");
        else
            throw new Error("data can't be null or undefined")
    },

    this.push = async (data) => {
        if(this.dbms === service.REAL_TIME && this.route){
            return await controller.insert(this.dbms, this.route, data);
        }
        throw new Error("You cannot call this method without first declaring Firestore as DBMS or a collection")
    },

    this.update = async (data) => {
        if(this.dbms && this.route && this.id)
            return await controller.update(this.dbms, this.route, data, this.id);
        throw new Error("You cannot call this method without first declaring a DBMS or reference a route for update")
    },

    this.remove = async () => {
        if(this.dbms === service.REAL_TIME && this.route && this.id){
            return await controller.delete(this.dbms, this.route, this.id);
        }
        throw new Error("You cannot call this method without first declaring Real Time Database as DBMS, a collection and a document")
    },

    this.firestore = () => {
        this.dbms = service.FIRESTORE;
        return this;
    },

    this.collection = (route) => {
        if(this.dbms === service.FIRESTORE){
            this.route = route;
            return this;
        }
        throw new Error("You cannot call this method without first declaring Firestore as DBMS")
    },

    this.get = async () => {
        if(this.dbms === service.FIRESTORE && this.route){
            let levels = this.route.split('/');
            let baseRoute = levels[0];
            levels.splice(0,1);
            let resp = null;
            let id = null;
            if(!levels.length)
                return await controller.get(this.dbms, this.route);
            else{
                resp = await controller.get(this.dbms, baseRoute);
                if(levels.length && resp.info){
                    id = levels[0]
                    levels.splice(0,1);
                    resp.info = resp.info.findOneBy("id",id);
                    if(resp.info)
                        resp.info = resp.info.data;
                    while(levels.length && resp.info){
                        resp.info = resp.info[levels[0]];
                        levels.splice(0,1);
                    }
                }
                return resp;
            }
        }
        throw new Error("You cannot call this method without first declaring Firestore as DBMS or a collection")
    },

    this.doc = (id) => {
        if(this.dbms === service.FIRESTORE && this.route){
            this.id = id;
            return this
        }
        throw new Error("You cannot call this method without first declaring Firestore as DBMS or a collection")
    },

    this.add = async (data) => {
        if(this.dbms === service.FIRESTORE && this.route)
            return await controller.insert(this.dbms, this.route, data);
        throw new Error("You cannot call this method without first declaring Firestore as DBMS or a collection")
    },

    this.delete = async () => {
        if(this.dbms === service.FIRESTORE && this.route && this.id)
            return await controller.delete(this.dbms, this.route, this.id);
        throw new Error("You cannot call this method without first declaring Firestore as DBMS, a collection and a document")
    }
}

async function initFBCache(config, url, credentialType, credential){
    return await controller.init(config, url, credentialType, credential)
}

module.exports = {
    FBCache,
    initFBCache
}