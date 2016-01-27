/* global Utils,UI,Region,OStackAuth */

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
        error = error.error;
        onError({message: error.code + " " + error.title, body: error.message, region: "IDM"});
        authenticate();
    }

    function createJoinRegions (regionsLimit, autoRefresh) {

        var currentInstanceList = [];
        var errorList = [];

        function deductRegionLimit () {

            regionsLimit -= 1;

            if (regionsLimit === 0) {

                UI.drawInstances(getInstanceList, autoRefresh, currentInstanceList);
                drawErrors();
            }
        }

        function drawErrors () {
            if (errorList.length === 0) return;

            errorList.forEach(function (error) {
                onError(error);
            });
        }

        function joinRegionsSuccess (region, instanceList) {

            instanceList.servers.forEach(function (instance) {
                instance.region = region;
                currentInstanceList.push(instance);
            });

            deductRegionLimit();
        }

        function joinRegionsErrors (region, error) {

            error.region = region;
            errorList.push(error);

            deductRegionLimit();
        }

        return {
            success: joinRegionsSuccess,
            error: joinRegionsErrors
        };
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
        JSTACK.Keystone.init(authURL);
        UI.startLoadingAnimation($('.loading'), $('.loading i'));

        OStackAuth.getTokenAndParams(OStackAuth.CLOUD_URL)
            .then(function (params) {
                var token = params.token;
                var response = params.response;
                var responseBody = JSON.parse(response.responseText);
                // Temporal change to fix catalog name
                responseBody.token.serviceCatalog = responseBody.token.catalog;

                // Mimic JSTACK.Keystone.authenticate behavior on success
                JSTACK.Keystone.params.token = token;
                JSTACK.Keystone.params.access = responseBody.token;
                JSTACK.Keystone.params.currentstate = 2;

                UI.stopLoadingAnimation($('.loading'));
                UI.createTable(getInstanceList);
                getInstanceList(true);
            })
            .catch(function(error) {
                authError({
                    error: {
                        code: error.status,
                        title: "Error",
                        message: error.statusText
                    }
                });
            });
    }

    function getInstanceList (autoRefresh) {

        var regions = Region.getCurrentRegions();
        if (regions.length === 0) {
            UI.clearTable();

            // Keep the refresh loop in case no regions are selected
            if (autoRefresh) {
                setTimeout(function () {
                    getInstanceList(autoRefresh);
                }, 4000);
            }
        }
        else {
            var joinRegions = createJoinRegions(regions.length, autoRefresh);
            regions.forEach(function (region) {
                JSTACK.Nova.getserverlist(true, null, joinRegions.success.bind(null, region), joinRegions.error.bind(null, region), region);
            });
        }

    }

    return OpenStackListInstance;
})(JSTACK);
