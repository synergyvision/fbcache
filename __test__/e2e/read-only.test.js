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
            "read_only": true,    
            "firestore": [
                {
                    "name": "users",
                    "refresh": "30 s",
                    "read_only": true
                }
            ],
            "realtime": [
                {
                    "name": "persons",
                    "period": "20 s",
                    "start": "2020-09-17 12:38:30 am",
                    "read_only": true
                }
            ],
            "max_size": "50 kB"
        }, config.URL, "file", firebaseCredential);
    });

    test("don't insert - route in config", async () => {
        let fbc = new FBCache();
        try {
            await fbc.database().ref(realtimeRoute).child("test").set({ name: "Test" });
        } catch (error) {
            expect(error.message).toBe("the path was specified as read-only");
        }
        try {
            await fbc.firestore().collection(firestoreRoute).doc("test").set({ name: "Test" });
        } catch (error) {
            expect(error.message).toBe("the path was specified as read-only");
        }
    });

    test("don't insert - route not in config", async () => {
        let fbc = new FBCache();
        try {
            await fbc.database().ref("route").child("test").set({ name: "Test" });
        } catch (error) {
            expect(error.message).toBe("the path was specified as read-only");
        }
        try {
            await fbc.firestore().collection("route").doc("test").set({ name: "Test" });
        } catch (error) {
            expect(error.message).toBe("the path was specified as read-only");
        }
    });

    test("don't update - route in config", async () => {
        let fbc = new FBCache();
        try {
            await fbc.database().ref(realtimeRoute).child("test").update({ name: "Test" });
        } catch (error) {
            expect(error.message).toBe("the path was specified as read-only");
        }
        try {
            await fbc.firestore().collection(firestoreRoute).doc("test").update({ name: "Test" });
        } catch (error) {
            expect(error.message).toBe("the path was specified as read-only");
        }
    });

    test("don't update - route not in config", async () => {
        let fbc = new FBCache();
        try {
            await fbc.database().ref("route").child("test").update({ name: "Test" });
        } catch (error) {
            expect(error.message).toBe("the path was specified as read-only");
        }
        try {
            await fbc.firestore().collection("route").doc("test").update({ name: "Test" });
        } catch (error) {
            expect(error.message).toBe("the path was specified as read-only");
        }
    });

    test("don't delete - route in config", async () => {
        let fbc = new FBCache();
        try {
            await fbc.database().ref(realtimeRoute).child("test").remove({ name: "Test" });
        } catch (error) {
            expect(error.message).toBe("the path was specified as read-only");
        }
        try {
            await fbc.firestore().collection(firestoreRoute).doc("test").delete({ name: "Test" });
        } catch (error) {
            expect(error.message).toBe("the path was specified as read-only");
        }
    });

    test("don't delete - route not in config", async () => {
        let fbc = new FBCache();
        try {
            await fbc.database().ref("route").child("test").remove({ name: "Test" });
        } catch (error) {
            expect(error.message).toBe("the path was specified as read-only");
        }
        try {
            await fbc.firestore().collection("route").doc("test").delete({ name: "Test" });
        } catch (error) {
            expect(error.message).toBe("the path was specified as read-only");
        }
    });
})