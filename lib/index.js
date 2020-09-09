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

//---------------------------------------------FUNCTIONS--------------------------------------------------

//--------------------------------------------FBCACHE METHODS---------------------------------------------
const FBCache = {};

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
        routes.max_size = config.max_size;
};

FBCache.get = async (dbms, route) => {
    let cacheRoute = null;
    let infoCache = null;
    let infoDB = [];
    switch (dbms) {
        case service.REAL_TIME:
            if(routes.realtime)
                cacheRoute = routes.realtime.findOneBy('name',route);
            if(cacheRoute){
                infoCache = myCache.get(cacheRoute.id);
                if(infoCache)
                    return { data: infoCache, cache: true };
                else{
                    infoDB = await rtdb.ref(route).once('value', (snapshot) => {
                        return snapshot.val();
                    });
                    myCache.set(cacheRoute.id, infoDB, 60);
                    return { data: infoDB, cache: false, startCache: true };
                }
            }
            else{
                infoDB = await rtdb.ref(route).once('value', (snapshot) => {
                    return snapshot.val();
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
                    myCache.set(cacheRoute.id, infoDB, 60);
                    return { data: infoDB, cache: false, startCache: true };
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

//--------------------------------------------FBCACHE METHODS---------------------------------------------

//------------------------------------------------EXPORTS-------------------------------------------------

module.exports = {
    FBCache,
    service
};

//------------------------------------------------EXPORTS-------------------------------------------------