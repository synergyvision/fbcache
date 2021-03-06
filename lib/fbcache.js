import NodeCache from "node-cache";
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import moment from "moment";

//-------------------------------------------INIT CONSTANTS-----------------------------------------------

const myCache = new NodeCache();
const formatMoment = "YYYY-MM-DD hh:mm:ss a";
let rtdb = null;
let firestore = null;
let routes = {};

//-------------------------------------------INIT CONSTANTS-----------------------------------------------

//--------------------------------------------ENUM SERVICE------------------------------------------------

const service = {
    FIRESTORE : 'Firestore',
    REAL_TIME : 'Real Time Database'
};

//--------------------------------------------ENUM SERVICE------------------------------------------------

// -----------------------------------------ARRAY PROTOTYPE-----------------------------------------------

Array.prototype.findOneBy = function (column, value) {
    for (let i = 0; i < this.length; i++) {
        let object = this[i];
        if (column in object && object[column] === value) {
            return object;
        }
    }
    return null;
}

// -----------------------------------------ARRAY PROTOTYPE-----------------------------------------------

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
function firebaseConection (url, credentialType, credential) {
    if(credential && !credentialType)
        throw new Error("credential can't be defined without credentialType");

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
            throw new Error(`${credentialType} is not a valid value for credentialType`);
    }
}

function setMaxSize(max_size){
    
    try {
        const baseMaxSize = max_size.split(' ');

        if(baseMaxSize.length !== 2)
            throw new Error("max_size format invalid");

        if(!(baseMaxSize[0] == parseInt(baseMaxSize[0],10)))
            throw new Error("max_size format invalid");

        const quantity = baseMaxSize[0];
        const unit = baseMaxSize[1];

        switch (unit) {
            case "B":
                return quantity * 1;

            case "kB":
                return quantity * 1024;

            case "MB":
                return quantity * 1048576;
        
            default:
                throw new Error("max_size format invalid");
        }
    } catch (error) {
        throw new Error("max_size format invalid");
    }
}

function verifyRefreshFormat(refresh){
    const units = ['s','m','h','d','w','M'];
    try {
        const baseRefresh = refresh.split(' ');

        if(baseRefresh.length !== 2)
            return false;

        if(!(baseRefresh[0] == parseInt(baseRefresh[0],10)))
            return false;
        
        for (let i = 0; i < units.length; i++) {
            if(units[i] === baseRefresh[1])
                return true
        }
    } catch (error) {
        return false;
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
function getRoutes(routes, read_only){
    let arrayRoutes = [];
    routes.forEach(route => {
        if (!route.name)
            throw new Error("A route defined to Firebase don't have name");

        try {
            route.name.split("ewm")
        } catch (error) {
            throw new Error("Invalid route");
        }
        
        if (route.refresh && route.period)
            throw new Error("Refresh and period can't be defined in the same time in the same route");

        if (!route.refresh && !route.period)
            throw new Error("A route can't be defined without refresh or period");

        if ((!route.period && route.start))
            throw new Error("start can't be defined without period");

        route.id = uuidv4();

        if(route.refresh && !verifyRefreshFormat(route.refresh))
            throw new Error("Refresh format invalid");
        else if (route.period && !verifyRefreshFormat(route.period))
            throw new Error("Period format invalid");

        if(route.start)
            route.start = moment(route.start,formatMoment);
        else
            route.start = moment();

        if(!route.start.isValid())
            throw new Error("Date format invalid");

        if(route.read_only === true || route.read_only === false || route.read_only === undefined){
            if(route.read_only === undefined)
                if(read_only === undefined)
                    route.read_only = true;
                else
                    route.read_only = read_only;
        }
        else
            throw new Error("Invalid read_only value")

        arrayRoutes.push(route);

    });

    return arrayRoutes;
};

function writeCache(){
    if(routes.max_size){
        const stats = myCache.getStats();
        if(stats.vsize >= routes.max_size)
            return false;
        else
            return true;
    }
    else
        return true;
}

function getDeadLinePeriod(now, lastCheckPoint, quantity, unit){
    let newCheckPoint = lastCheckPoint.clone();
    
    while(newCheckPoint <= now)
        newCheckPoint.add(quantity, unit);

    return newCheckPoint;
}

function updateStartRoute(id, deadLine){
    routes.realtime.forEach(route => {
        if(route.id === id){
            route.start = deadLine;
            return true;
        }
    });
    routes.firestore.forEach(route => {
        if(route.id === id){
            route.start = deadLine;
            return true;
        }
    });

    return false;
}

function setTTL(id, time, type, start){
    const baseTimeTTL = time.split(' ');
    const quantity = baseTimeTTL[0];
    const unit = baseTimeTTL[1];
    const now = moment();
    let deadLine = null;
    let seconds = null;

    switch (type) {
        case "refresh":
            deadLine = moment().add(quantity, unit);
        break;
    
        case "period":
            deadLine = getDeadLinePeriod(now, start, quantity, unit);
        break;
    };
    updateStartRoute(id,deadLine);
    seconds = moment.duration(deadLine.diff(now)).as('seconds');
    return Math.round(seconds);
};

function setCache(cacheRoute, info){
    if(writeCache()){
        if(cacheRoute.refresh)
            myCache.set(cacheRoute.id, info, setTTL(cacheRoute.id, cacheRoute.refresh, "refresh"));
        else
            myCache.set(cacheRoute.id, info, setTTL(cacheRoute.id, cacheRoute.period, "period", cacheRoute.start));
        return true;
    }
    else
        return false;
};

function getNewData(dbms, oldData, insertData, id){
    let newData = oldData;
    let update = true;
    switch (dbms) {
        case service.REAL_TIME:
            newData[id] = insertData;
            return newData
    
        case service.FIRESTORE:
            newData.forEach(doc => {
                if(doc.id === id){
                    doc.data = insertData;
                    update = false
                }
            });
            if(update)
                newData.push({ id: id, data: insertData });
            return newData;

    }
}

function getUpdateData(dbms, oldData, updateData, id){
    let newData = oldData;
    let child = null;
    let doc = null;
    switch (dbms) {
        case service.REAL_TIME:
            child = oldData[id];
            if(child){
                Object.keys(updateData).map( key => {
                    if(updateData[key])
                        child[key] = updateData[key];
                });
                newData[id] = child;
            }
            return newData;
    
        case service.FIRESTORE:
            doc = oldData.findOneBy("id",id).data;
            if(doc){
                Object.keys(updateData).map( key => {
                    if(updateData[key])
                        doc[key] = updateData[key];
                });
                for(let i = 0; i < newData.length; i++){
                    if(newData[i].id === id){
                        newData[i].data = doc;
                        break
                    }
                }
            }
            return newData;
    }
}

function getDeleteData(dbms, oldData, id){
    let newData = oldData;
    switch (dbms) {
        case service.REAL_TIME:
            delete newData[id];
            return newData;
    
        case service.FIRESTORE:
            for(let i = 0; i < newData.length; i++){
                if(newData[i].id === id){
                    newData.splice(i, 1);
                    break
                }
            }
            return newData;
    }
}

function getActualTTL(deadLine){
    const now = moment();
    const seconds = moment.duration(deadLine.diff(now)).as('seconds');
    return Math.round(seconds);
}

function insertCache(cacheRoute, dbms, insertData, id){
    if(writeCache()){
        const oldData = myCache.get(cacheRoute.id);
        if(oldData){
            const newData = getNewData(dbms, oldData, insertData, id);
            myCache.set(cacheRoute.id, newData, getActualTTL(cacheRoute.start));
            return true;
        }
        else
            return false;
    }
    else
        return false;
}

function updateCacheInfo(cacheRoute, dbms, updateData, id){
    if(writeCache()){
        const oldData = myCache.get(cacheRoute.id);
        if(oldData){
            const newData = getUpdateData(dbms, oldData, updateData, id);
            myCache.set(cacheRoute.id, newData, getActualTTL(cacheRoute.start));
            return true;
        }
        else
            return false;
    }
    else
        return false;
}

function deleteCache(cacheRoute, dbms, id){
    if(writeCache()){
        const oldData = myCache.get(cacheRoute.id);
        if(oldData){
            const newData = getDeleteData(dbms, oldData, id);
            myCache.set(cacheRoute.id, newData, getActualTTL(cacheRoute.start));
            return true;
        }
        else
            return false;
    }
    else
        return false;
}

//---------------------------------------------FUNCTIONS--------------------------------------------------

//--------------------------------------------controller METHODS---------------------------------------------

const controller = {};

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
controller.init = async (config, url, credentialType, credential) => {
    let response = { success: false }
    if(!url)
        throw new Error("url is undefined");
    if(!config)
        throw new Error("config can't be null or undefined")

    if(config.read_only === true|| config.read_only === undefined)
        routes.read_only = true;
    else if(config.read_only === false)
        routes.read_only = false;
    else
        throw new Error("Invalid read_only value")

    if(config.realtime)
        routes.realtime = getRoutes(config.realtime);

    if(config.firestore)
        routes.firestore = getRoutes(config.firestore);

    if(config.max_size)
        routes.max_size = setMaxSize(config.max_size);

    firebaseConection(url, credentialType, credential);

    rtdb = admin.database();
    firestore = admin.firestore();

    response.success = true
    return response;
};

/**
 * Method to make a query to Real Time Database or Firestore, if the path is specified to make a cache, it is about consulting the cache, in case the information is expired or the path is not specified, it will be done a query to Firebase
 *
 * @param   {string}  dbms   Indicates if you want to make a query to Real Time Database or Firestore
 * @param   {string}  route  Route to be consulted
 *
 * @return  {object}         Query result, along with indicators on whether or not the cache was queried, or refreshed
 */
controller.get = async (dbms, route) => {
    let cacheRoute = null;
    let infoCache = null;
    let infoDB = [];
    let updateCache = false;
    switch (dbms) {
        case service.REAL_TIME:
            if(routes.realtime)
                cacheRoute = routes.realtime.findOneBy('name',route);
            if(cacheRoute){
                infoCache = myCache.get(cacheRoute.id);
                if(infoCache)
                    return { info: infoCache, cache: true };
                else{
                    await rtdb.ref(route).once('value', (snapshot) => {
                        infoDB = snapshot.val();
                        if(infoDB)
                            updateCache = setCache(cacheRoute, snapshot.val());
                    });
                    return { info: infoDB, cache: false, startCache: updateCache };
                }
            }
            else{
                await rtdb.ref(route).once('value', (snapshot) => {
                    infoDB = snapshot.val();
                });
                return { info: infoDB, cache: false, startCache: false };
            };
        
        case service.FIRESTORE:
            let collection = null;
            if(routes.firestore)
                cacheRoute = routes.firestore.findOneBy('name',route);
            if(cacheRoute){
                infoCache = myCache.get(cacheRoute.id);
                if(infoCache)
                    return { info: infoCache, cache: true };
                else{
                    collection = firestore.collection(route);
                    await collection.get()
                        .then(snapshot => {
                            snapshot.forEach(doc => {
                                infoDB.push({ id: doc.id, data: doc.data() });
                            });
                        });
                    updateCache = setCache(cacheRoute, infoDB);
                    return { info: infoDB, cache: false, startCache: updateCache };
                }
            }
            else{
                collection = firestore.collection(route);
                await collection.get()
                    .then(snapshot => {
                        snapshot.forEach(doc => {
                            infoDB.push({ id: doc.id, data: doc.data() });
                        });
                    });
                return { info: infoDB, cache: false, startCache: false };
            };
    }
};

controller.insert = async (dbms, route, data, id) => {
    if(!route)
        throw new Error("route can't be null or undefined");
    if(!data || Object.entries(data).length === 0 || data === [])
        throw new Error("data can't be null or undefined");
    let cacheRoute = null;
    let generateID = null;
    let updateCache = false;
    let routeInCache = false;
    switch (dbms) {
        case service.REAL_TIME:
            if(routes.realtime)
                cacheRoute = routes.realtime.findOneBy('name',route);
            if((cacheRoute && cacheRoute.read_only) || (!cacheRoute && routes.read_only))
                throw new Error("the path is read-only");
            if(id)
                await rtdb.ref(route).child(id).set(data);
            else 
                generateID = await rtdb.ref().child(route).push(data);
            if(cacheRoute){
                routeInCache = true;
                updateCache = insertCache(cacheRoute, service.REAL_TIME, data, id? id : generateID.key);
            }
            return { routeInConfig: routeInCache, updateCache: updateCache }
    
        case service.FIRESTORE:
            if(routes.firestore)
                cacheRoute = routes.firestore.findOneBy('name',route);
            if((cacheRoute && cacheRoute.read_only) || (!cacheRoute && routes.read_only))
                throw new Error("the path is read-only");
            if(id)
                await firestore.collection(route).doc(id).set(data);
            else
                generateID = await firestore.collection(route).add(data);
            if(cacheRoute){
                routeInCache = true;
                updateCache = insertCache(cacheRoute, service.FIRESTORE, data, id? id : generateID.id);
            }
            return { routeInConfig: routeInCache, updateCache: updateCache }
    }
}

controller.update = async (dbms, route, data, id) => {
    if(!route)
        throw new Error("route can't be null or undefined");
    if(!data || Object.entries(data).length === 0 || data === [])
        throw new Error("data can't be null or undefined");
    if(!id)
        throw new Error("id can't be null or undefined");
    let cacheRoute = null;
    let updateCache = false;
    let routeInCache = false;
    switch (dbms) {
        case service.REAL_TIME:
            if(routes.realtime)
                cacheRoute = routes.realtime.findOneBy('name',route);
            if((cacheRoute && cacheRoute.read_only) || (!cacheRoute && routes.read_only))
                throw new Error("the path is read-only");
            await rtdb.ref(route).child(id).update(data);
            if(cacheRoute){
                routeInCache = true;
                updateCache = updateCacheInfo(cacheRoute, service.REAL_TIME, data, id);
            }
            return { routeInConfig: routeInCache, updateCache: updateCache }
    
        case service.FIRESTORE:
            if(routes.firestore)
                cacheRoute = routes.firestore.findOneBy('name',route);
            if((cacheRoute && cacheRoute.read_only) || (!cacheRoute && routes.read_only))
                throw new Error("the path is read-only");
            firestore.collection(route).doc(id).update(data);
            if(cacheRoute){
                routeInCache = true;
                updateCache = updateCacheInfo(cacheRoute, service.FIRESTORE, data, id);
            }
            return { routeInConfig: routeInCache, updateCache: updateCache }
    }
}

controller.delete = async (dbms, route, id) => {
    if(!route)
        throw new Error("route can't be null or undefined");
    if(!id)
        throw new Error("id can't be null or undefined");
    let cacheRoute = null;
    let updateCache = false;
    let routeInCache = false;
    switch (dbms) {
        case service.REAL_TIME:
            if(routes.realtime)
                cacheRoute = routes.realtime.findOneBy('name',route);
            if((cacheRoute && cacheRoute.read_only) || (!cacheRoute && routes.read_only))
                throw new Error("the path is read-only");
            await rtdb.ref(route).child(id).remove()
            if(cacheRoute){
                routeInCache = true;
                updateCache = deleteCache(cacheRoute, service.REAL_TIME, id);
            }
            return { routeInConfig: routeInCache, updateCache: updateCache }
    
        case service.FIRESTORE:
            if(routes.firestore)
                cacheRoute = routes.firestore.findOneBy('name',route);
            if((cacheRoute && cacheRoute.read_only) || (!cacheRoute && routes.read_only))
                throw new Error("the path is read-only");
            firestore.collection(route).doc(id).delete();
            if(cacheRoute){
                routeInCache = true;
                updateCache = deleteCache(cacheRoute, service.FIRESTORE, id);
            }
            return { routeInConfig: routeInCache, updateCache: updateCache }
    }
}

controller.routeInConfig = (dbms, route) => {
    switch (dbms) {
        case service.REAL_TIME:
            if(routes.realtime && routes.realtime.findOneBy('name', route))
                return true;
        break;
    
        default:
            if(routes.firestore && routes.firestore.findOneBy('name', route))
                return true;
        break;
    };

    return false;
}
//--------------------------------------------controller METHODS---------------------------------------------

module.exports = {
    controller,
    service
}