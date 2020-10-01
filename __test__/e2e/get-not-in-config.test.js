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

describe("Test get FBCache", () => {

    beforeAll(async () => {
        await initFBCache({
            "read_only": false,
            "max_size": "50 B"
        }, config.URL, "file", firebaseCredential);
    });

    test("success - get from Real Time Database - route not in config", async () => {
        let fbc = new FBCache();
        const resp = await fbc.database().ref(realtimeRoute).once();
        expect(resp.cache).toBeFalsy();
        expect(resp.startCache).toBeFalsy();
    });

    test("success - get from Firestore - route not in config", async () => {
        let fbc = new FBCache();
        const resp = await fbc.firestore().collection(firestoreRoute).get();
        expect(resp.cache).toBeFalsy();
        expect(resp.startCache).toBeFalsy();
    });
})