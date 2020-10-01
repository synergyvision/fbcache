import 'regenerator-runtime/runtime'
import { config } from "../test-enviroment";
import { initFBCache, FBCache } from "../../lib/index";

let firebaseCredential = {
    type: config.CREDENTIAL_FILE_TYPE,
    project_id: config.CREDENTIAL_FILE_PROYECT_ID,
    private_key_id: config.CREDENTIAL_FILE_PRIVATE_KEY_ID,
    private_key: config.CREDENTIAL_FILE_PRIVATE_KEY,
    client_email: config.CREDENTIAL_FILE_CLIENT_EMAIL,
    client_id: config.CREDENTIAL_FILE_CLIENT_ID,
    auth_uri: config.CREDENTIAL_FILE_AUTH_URI,
    token_uri: config.CREDENTIAL_FILE_TOKEN_URI,
    auth_provider_x509_cert_url: config.CREDENTIAL_FILE_AUTH_PROV_CERT,
    client_x509_cert_url: config.CREDENTIAL_FILE_CLIENT_CERT
};

let realtimeRoute = config.REALTIME_ROUTE;
let firestoreRoute = config.FIRESTORE_ROUTE;

describe("Test insert FBCache", () => {

    beforeAll(async () => {
        await initFBCache({
            "read_only": false,    
            "firestore": [
                {
                    "name": "users",
                    "refresh": "30 s",
                    "read_only": false
                }
            ],
            "realtime": [
                {
                    "name": "persons",
                    "period": "20 s",
                    "start": "2020-09-17 12:38:30 am",
                    "read_only": false
                }
            ],
            "max_size": "50 MB"
        }, config.URL, "file", firebaseCredential);
    });

    test("fail - call only remove() - realtime", async () => {
        let fbc = new FBCache();
        try {
            await fbc.remove();
        } catch (error) {
            expect(error.message).toBe("You cannot call this method without first declaring Real Time Database as DBMS, a collection and a document");
        }
    });

    test("fail - call only delete() - firestore", async () => {
        let fbc = new FBCache();
        try {
            await fbc.delete();
        } catch (error) {
            expect(error.message).toBe("You cannot call this method without first declaring Firestore as DBMS, a collection and a document");
        }
    })

    test("success - update in Real Time Database", async () => {
        let fbc = new FBCache();
        await fbc.database().ref(realtimeRoute).child("test").set({ name: "Test" });
        const resp1 = await fbc.database().ref(realtimeRoute).child("test").remove();
        expect(resp1.routeInConfig).toBeTruthy();
        expect(resp1.updateCache).toBeFalsy();
        await fbc.database().ref(realtimeRoute).child("test").set({ name: "Test" });
        await fbc.database().ref(realtimeRoute).once();
        const resp2 = await fbc.database().ref(realtimeRoute).child("test").remove();
        expect(resp2.routeInConfig).toBeTruthy();
        expect(resp2.updateCache).toBeTruthy();
    });

    test("success - inserts in Firestore", async () => {
        let fbc = new FBCache();
        await fbc.firestore().collection(firestoreRoute).doc("test").set({ name: "Test" });
        const resp1 = await fbc.firestore().collection(firestoreRoute).doc("test").delete();
        expect(resp1.routeInConfig).toBeTruthy();
        expect(resp1.updateCache).toBeFalsy();
        await fbc.firestore().collection(firestoreRoute).doc("test").set({ name: "Test" });
        await fbc.firestore().collection(firestoreRoute).get();
        const resp2 = await fbc.firestore().collection(firestoreRoute).doc("test").delete();
        expect(resp2.routeInConfig).toBeTruthy();
        expect(resp2.updateCache).toBeTruthy();
    });
})