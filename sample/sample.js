
const { FBCache } = require('fbcache');
const fbcache = require('fbcache');
const util = require('util')

const config = {
    "read_only": false,    
    "firestore": [
        {
            "name": "usuarios",
            "refresh": "10 s",
            "read_only": true
        }
    ],
    "realtime": [
        {
            "name": "persons",
            "period": "20 s",
            "start": "2020-10-08 02:00:30 am",
            "read_only": false
        }
    ],
    "max_size": "50 MB",
};

const insert = {
    "read_only": false,    
    "firestore": [
        {
            "name": "usuarios",
            "refresh": "10 s",
            "read_only": true
        }
    ],
    "realtime": [
        {
            "name": "persons",
            "period": "20 s",
            "read_only": false
        }
    ],
    "max_size": "50 MB",
}

const test = async () => {
    await fbcache.initFBCache(config, /*URL to the Firebase project*/ , "file", /*PATH to the credential file*/)

    let result = null; 
    let fbc = new FBCache();
    
    result = await fbc.database().ref("persons/-MFU6_KbcEoAYJLr-hlZ/data").once();
    console.log(util.inspect(result, {showHidden: false, depth: null}));
    await fbc.database().ref("persons/-MFU6_KbcEoAYJLr-hlZ").child("data").set(insert);
    await fbc.database().ref("persons").child("-MJ8cqUMx2L9SUDrQOEr").remove();
    await fbc.database().ref("persons").push(insert);
}

test();