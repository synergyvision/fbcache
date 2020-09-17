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

        case undefined:
            admin.initializeApp();
            break;
    
        default:
            throw new Error(`${credentialType} is not a valid value for credentialType`);
    }
}

function setMaxSize(max_size){
    const baseMaxSize = max_size.split(' ');
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
function getRoutes(routes, read_only){
    let arrayRoutes = [];
    routes.forEach(route => {
        if (!route.name)
            throw new Error("A route defined to Firebase don't have name");
        
        if (route.refresh && route.period)
            throw new Error("Refresh and period can't be defined in the same time in the same route");

        if ((!route.period && route.start))
            throw new Error("start can't be defined without period");

        route.id = uuidv4();

        if(route.start)
            route.start = moment(route.start,formatMoment);
        else
            route.start = moment();

        if(route.read_only === undefined)
            if(read_only === undefined)
                route.read_only = true;
            else
                route.read_only = read_only;

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

function setTTL(time, type, start){
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

    seconds = moment.duration(deadLine.diff(now)).as('seconds');
    return Math.round(seconds);
};

function setCache(cacheRoute, info){
    if(writeCache()){
        if(cacheRoute.refresh)
            myCache.set(cacheRoute.id, info, setTTL(cacheRoute.refresh, "refresh"));
        else
            myCache.set(cacheRoute.id, info, setTTL(cacheRoute.period, "period", cacheRoute.start));
        return true;
    }
    else
        return false;
};

//---------------------------------------------FUNCTIONS--------------------------------------------------

//--------------------------------------------FBCACHE METHODS---------------------------------------------
const FBCache = {};

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
FBCache.init = (config, url, credentialType, credential) => {
    if(!url)
        throw new Error("url is undefined");

    firebaseConection(url, credentialType, credential);

    rtdb = admin.database();
    firestore = admin.firestore();

    if(config.read_only || config.read_only === undefined)
        routes.read_only = true;
    else
        routes.read_only = false;

    if(config.realtime)
        routes.realtime = getRoutes(config.realtime);

    if(config.firestore)
        routes.firestore = getRoutes(config.firestore);

    if(config.max_size)
        routes.max_size = setMaxSize(config.max_size);
};

/**
 * Method to make a query to Real Time Database or Firestore, if the path is specified to make a cache, it is about consulting the cache, in case the information is expired or the path is not specified, it will be done a query to Firebase
 *
 * @param   {string}  dbms   Indicates if you want to make a query to Real Time Database or Firestore
 * @param   {string}  route  Route to be consulted
 *
 * @return  {object}         Query result, along with indicators on whether or not the cache was queried, or refreshed
 */
FBCache.get = async (dbms, route) => {
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
                    return { data: infoCache, cache: true };
                else{
                    await rtdb.ref(route).once('value', (snapshot) => {
                        infoDB = snapshot.val();
                        updateCache = setCache(cacheRoute, snapshot.val());
                    });
                    return { data: infoDB, cache: false, startCache: updateCache };
                }
            }
            else{
                await rtdb.ref(route).once('value', (snapshot) => {
                    infoDB = snapshot.val();
                });
                return { data: infoDB, cache: false, startCache: false };
            };
        break;
        
        case service.FIRESTORE:
            let collection = null;
            if(routes.firestore)
                cacheRoute = routes.firestore.findOneBy('name',route);
            if(cacheRoute){
                infoCache = myCache.get(cacheRoute.id);
                if(infoCache)
                    return { data: infoCache, cache: true };
                else{
                    collection = firestore.collection(route);
                    await collection.get()
                        .then(snapshot => {
                            snapshot.forEach(doc => {
                                infoDB.push({ id: doc.id, data: doc.data() });
                            });
                        });
                    updateCache = setCache(cacheRoute, infoDB);
                    return { data: infoDB, cache: false, startCache: updateCache };
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
                return { data: infoDB, cache: false, startCache: false };
            };
        break;
        
        default:
            throw new Error("dbms value invalid");
    }
};


FBCache.insert = async (dbms, route, data, id) => {
    let cacheRoute = null;
    let childRef = null;
    let child = null;
    let collection = null;
    let generateID = null;
    switch (dbms) {
        case service.REAL_TIME:
            if(routes.realtime)
                cacheRoute = routes.realtime.findOneBy('name',route);
            if((cacheRoute && cacheRoute.read_only) || (!cacheRoute && routes.read_only))
                throw new Error("the path was specified as read-only");
            if(id){
                childRef = rtdb.ref(route);
                child = childRef.child(id);
                await child.set(data);
            }
            else {
                childRef = rtdb.ref();
                child = childRef.child(route);
                await child.push(data);
            }
        break;
    
        case service.FIRESTORE:
            if(routes.firestore)
                cacheRoute = routes.firestore.findOneBy('name',route);
            if((cacheRoute && cacheRoute.read_only) || (!cacheRoute && routes.read_only))
                throw new Error("the path was specified as read-only");
            collection = firestore.collection(route);
            if(id){
                await collection.doc(id).set(data);
            }
            else{
                await collection.add(data);
            }
        break;

        default:
            throw new Error("dbms value invalid");
    }
}
//--------------------------------------------FBCACHE METHODS---------------------------------------------

//------------------------------------------------EXPORTS-------------------------------------------------

module.exports = {
    FBCache,
    service
};

//------------------------------------------------EXPORTS-------------------------------------------------
