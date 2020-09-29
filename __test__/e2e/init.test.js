import 'regenerator-runtime/runtime'
import { config } from "../test-enviroment";
import { initFBCache } from "../../lib/index";

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

let fbcacheConfig = {}

describe("Test initFBCache", () => {

    beforeEach(() => {
        fbcacheConfig = {
            "read_only": true,    
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
        }
    });

    test("fail - null in a route to Firebase or Real Time Database", async () => {
        let errorConfig = fbcacheConfig;
        errorConfig.firestore[0].name = null;
        try {
            await initFBCache(errorConfig, config.URL, "file", firebaseCredential);
        } catch (error) {
            expect(error.message).toBe("A route defined to Firebase don't have name")
        };
    });

    test("fail - fbcacheConfig undefined or null", async () => {
        try {
            await initFBCache(undefined, config.URL, "file", firebaseCredential);
        } catch (error) {
            expect(error.message).toBe("config can't be null or undefined");
        };
        try {
            await initFBCache(null, config.URL, "file", firebaseCredential);
        } catch (error) {
            expect(error.message).toBe("config can't be null or undefined");
        }
    });

    test("fail - URL null", async () => {
        try{
            await initFBCache(fbcacheConfig, null, "file", firebaseCredential);
        } catch (error) {
            expect(error.message).toBe("url is undefined")
        }
    });

    test("success", async () => {
        const resp = await initFBCache(fbcacheConfig, config.URL, "file", firebaseCredential);
        expect(resp).toStrictEqual({ success: true })
    });
})