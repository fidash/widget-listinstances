/* global Utils,UI */

var OpenStackListInstance = (function (JSTACK) {
    "use strict";

    var ERRORS = {
        '500 Error': 'An error has occurred on the server side.',
        '503 Error': 'Cloud service is not available at the moment.',
        '422 Error': 'You are not authenticated in the wirecloud platform.'
    };

    var authURL = 'https://cloud.lab.fiware.org/keystone/v3/auth/';


    /******************************************************************/
    /*                      C O N S T R U C T O R                     */
    /******************************************************************/

    function OpenStackListInstance () {

        this.init = init;
        this.authenticate = authenticate;
        this.listInstance = getInstanceList;

    }


    /******************************************************************/
    /*                P R I V A T E   F U N C T I O N S               */
    /******************************************************************/

    function createWidgetUI (tokenResponse) {
        
        var token = tokenResponse.getHeader('x-subject-token');
        var responseBody = JSON.parse(tokenResponse.responseText);

        // Temporal change to fix catalog name
        responseBody.token.serviceCatalog = responseBody.token.catalog;

        // Mimic JSTACK.Keystone.authenticate behavior on success
        JSTACK.Keystone.params.token = token;
        JSTACK.Keystone.params.access = responseBody.token;
        JSTACK.Keystone.params.currentstate = 2;

        UI.stopLoadingAnimation($('.loading'));
        UI.createTable(getInstanceList);
        getInstanceList(true);

    }

    function handlePreferences () {

        UI.updateHiddenColumns();

    }

    function onError (error) {


        if (error.message in ERRORS) {
            Utils.createAlert('danger', 'Error', ERRORS[error.message], error);            
        }
        else {
            Utils.createAlert('danger', error.message, error.body);
        }

        console.log('Error: ' + JSON.stringify(error));
    }

    function authError (error) {
        onError(error);
        authenticate();
    }


    /******************************************************************/
    /*                 P U B L I C   F U N C T I O N S                */
    /******************************************************************/

    function init () {

        // Initialize preferences
        handlePreferences();

        // Preferences handler
        MashupPlatform.prefs.registerCallback(handlePreferences);
    }

    function authenticate () {
        
        var headersAuth = {
            "X-FI-WARE-OAuth-Token": "true",
            "X-FI-WARE-OAuth-Token-Body-Pattern": "%fiware_token%",
            "Accept": "application/json"
        };

        var authBody = {
            "auth": {
                "identity": {
                    "methods": [
                        "oauth2"
                    ],
                    "oauth2": {
                        "access_token_id": "%fiware_token%"
                    }
                }
            }
        };

        JSTACK.Keystone.init(authURL);
        UI.startLoadingAnimation($('.loading'), $('.loading i'));

        // Get token with user's FIWARE token
        MashupPlatform.http.makeRequest(authURL + 'tokens', {
            method: 'POST',
            requestHeaders: headersAuth,
            contentType: "application/json",
            postBody: JSON.stringify(authBody),
            onSuccess: createWidgetUI,
            onFailure: authError
        });
        
    }

    function getInstanceList (autoRefresh) {

        JSTACK.Nova.getserverlist(true, null, UI.drawInstances.bind(null, getInstanceList, autoRefresh), onError, "Prague");

    }

    return OpenStackListInstance;
})(JSTACK);
