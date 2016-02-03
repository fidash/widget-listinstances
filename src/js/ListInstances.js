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
        this.listInstance = getInstanceList.bind(this);
        this.mintime = 2000;
        this.maxtime = 30000;

    }


    /******************************************************************/
    /*                P R I V A T E   F U N C T I O N S               */
    /******************************************************************/

    function createWidgetUI (tokenResponse) {
        /* jshint validthis: true */
        var token = tokenResponse.getHeader('x-subject-token');
        var responseBody = JSON.parse(tokenResponse.responseText);

        // Temporal change to fix catalog name
        responseBody.token.serviceCatalog = responseBody.token.catalog;

        // Mimic JSTACK.Keystone.authenticate behavior on success
        JSTACK.Keystone.params.token = token;
        JSTACK.Keystone.params.access = responseBody.token;
        JSTACK.Keystone.params.currentstate = 2;

        UI.stopLoadingAnimation($('.loading'));
        UI.createTable(getInstanceList.bind(this));
        getInstanceList.call(this, true);

    }

    function handlePreferences () {
        /* jshint validthis: true */
        this.mintime = MashupPlatform.prefs.get("mintime") * 1000;
        this.maxtime = MashupPlatform.prefs.get("maxtime") * 1000;

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

    // function authError (error) {
    //     error = error.error;
    //     onError({message: error.code + " " + error.title, body: error.message, region: "IDM"});
    //     authenticate.call(this);
    // }

    function createJoinRegions (regionsLimit, autoRefresh) {
        /* jshint validthis: true */

        var currentInstanceList = [];
        var errorList = [];

        function deductRegionLimit () {
            regionsLimit -= 1;

            if (regionsLimit === 0) {

                UI.drawInstances(getInstanceList.bind(this), autoRefresh, currentInstanceList);
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

            deductRegionLimit.call(this);
            UI.deactivateProgressBar();
        }

        function joinRegionsErrors (region, error) {

            error.region = region;
            errorList.push(error);

            deductRegionLimit.call(this);
            UI.deactivateProgressBar();
        }

        return {
            success: joinRegionsSuccess.bind(this),
            error: joinRegionsErrors.bind(this)
        };
    }


    /******************************************************************/
    /*                 P U B L I C   F U N C T I O N S                */
    /******************************************************************/

    function init () {
        /* jshint validthis: true */

        // Initialize preferences
        handlePreferences.call(this);

        // Preferences handler
        MashupPlatform.prefs.registerCallback(handlePreferences.bind(this));
        MashupPlatform.wiring.registerCallback("regions", function(regionsraw) {
            UI.toggleManyRegions(JSON.parse(regionsraw));
            getInstanceList.call(this);
        }.bind(this));
    }

    function authenticate () {
        JSTACK.Keystone.init(authURL);
        UI.startLoadingAnimation($('.loading'), $('.loading i'));

        /* jshint validthis: true */
        MashupPlatform.wiring.registerCallback("authentication", function(paramsraw) {
            var params = JSON.parse(paramsraw);
            var token = params.token;
            var responseBody = params.body;

            if (token === this.token) {
                // same token, ignore
                return;
            }

            // Mimic JSTACK.Keystone.authenticate behavior on success
            JSTACK.Keystone.params.token = token;
            JSTACK.Keystone.params.access = responseBody.token;
            JSTACK.Keystone.params.currentstate = 2;

            this.token = token;
            this.body = responseBody;
            UI.stopLoadingAnimation($('.loading'));
            UI.createTable(getInstanceList.bind(this));
            getInstanceList.call(this, true);
        }.bind(this));
    }

    function getInstanceList (autoRefresh) {
        /* jshint validthis: true */
        UI.activateProgressBar();
        var regions = Region.getCurrentRegions();
        if (regions.length === 0) {
            UI.clearTable();

            // Keep the refresh loop in case no regions are selected
            // if (autoRefresh) {
            //     setTimeout(function () {
            //         getInstanceList.call(this, autoRefresh);
            //     }.bind(this), this.maxtime);
            // }
        }
        else {
            var joinRegions = createJoinRegions.call(this, regions.length, autoRefresh);
            regions.forEach(function (region) {
                JSTACK.Nova.getserverlist(true, null, joinRegions.success.bind(this, region), joinRegions.error.bind(this, region), region);
            });
        }

        if (autoRefresh) {
            setTimeout(function () {
                getInstanceList.call(this, autoRefresh);
            }.bind(this), this.maxtime);
        }
    }
    return OpenStackListInstance;
})(JSTACK);
