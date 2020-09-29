import { controller, service } from "./fbcache";

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
            return await controller.get(this.dbms, this.route);
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
    },

    this.set = async (data) => {
        if(this.dbms && this.route && this.id && data){
            return await controller.insert(this.dbms, this.route, data, this.id);
        }
    },

    this.push = async (data) => {
        if(this.dbms === service.REAL_TIME && this.route){
            return await controller.insert(this.dbms, this.route, data);
        }
    },

    this.update = async (data) => {
        if(this.dbms && this.route && this.id)
            return await controller.update(this.dbms, this.route, data, this.id);
    },

    this.remove = async () => {
        if(this.dbms === service.REAL_TIME && this.route && this.id){
            return await controller.delete(this.dbms, this.route, this.id);
        }
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
        if(this.dbms === service.FIRESTORE && this.route)
            return await controller.get(this.dbms, this.route);
    },

    this.doc = (id) => {
        if(this.dbms === service.FIRESTORE && this.route){
            this.id = id;
            return this
        }
    },

    this.add = async (data) => {
        if(this.dbms === service.FIRESTORE && this.route)
            return await controller.insert(this.dbms, this.route, data);
    },

    this.delete = async () => {
        if(this.dbms === service.FIRESTORE && this.route && this.id)
            return await controller.delete(this.dbms, this.route, this.id);
    }
}

async function initFBCache(config, url, credentialType, credential){
    return await controller.init(config, url, credentialType, credential)
}

module.exports = {
    FBCache,
    initFBCache
}