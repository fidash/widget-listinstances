/* global OpenStackListInstance */

describe('List Instance', function () {
    "use strict";

    var openStack = null;
    var respInstanceList = null;
    var respAuthenticate = null;
    var instanceListSingleInstance = null;
    var prefsValues;

    beforeEach(function() {

        JSTACK.Keystone = jasmine.createSpyObj("Keystone", ["init", "authenticate", "gettenants", "params"]);
        JSTACK.Nova = jasmine.createSpyObj("Nova", ["getserverlist"]);

        // Set/Reset strategy
        MashupPlatform.setStrategy(new MyStrategy(), prefsValues);

        // Set/Reset fixtures
        jasmine.getFixtures().fixturesPath = 'base/src/test/fixtures/html';
        loadFixtures('defaultTemplate.html');
        jasmine.getJSONFixtures().fixturesPath = 'base/src/test/fixtures/json';
        respInstanceList = getJSONFixture('respInstanceList.json');
        respAuthenticate = getJSONFixture('respAuthenticate.json');
        instanceListSingleInstance = getJSONFixture('instanceListSingleInstance.json');

        // Create new instance
        openStack = new OpenStackListInstance();
        openStack.init();
    });


    /**************************************************************************/
    /*                    A U X I L I A R   F U N C T I O N S                 */
    /**************************************************************************/

    function callListInstance() {

        var createWidgetUI;
        openStack.authenticate();

        createWidgetUI = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onSuccess;
        respAuthenticate = {
            responseText: JSON.stringify(respAuthenticate),
            getHeader: function () {}
        };
        createWidgetUI(respAuthenticate);

    }

    function callAuthenticateWithError (error) {
        
        var authError, getTenantsOnSuccess;

        authError = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onFailure;
        authError(error);
    }

    function callListInstanceSuccessCallback (instanceList) {

        var callback = JSTACK.Nova.getserverlist.calls.mostRecent().args[2];
        
        callback(instanceList);

    }

    function callListInstanceErrorCallback (error) {

        var callback = JSTACK.Nova.getserverlist.calls.mostRecent().args[3];

        callback(error);
    }


    /**************************************************************************/
    /*                  F U N C T I O N A L I T Y   T E S T S                 */
    /**************************************************************************/

    it('should authenticate through wirecloud proxy', function() {

        callListInstance();

        expect(MashupPlatform.http.makeRequest.calls.count()).toBe(1);
        expect(JSTACK.Keystone.params.currentstate).toBe(2);

    });

    it('should have created a table with the received instances', function () {

        callListInstance();
        callListInstanceSuccessCallback(respInstanceList);

        var rows = document.querySelectorAll('tbody > tr');

        expect(rows.length).toBeGreaterThan(0);
    });

    it('should call error callback when authenticattion fails', function () {
        
        var consoleSpy = spyOn(console, "log");

        callListInstance();
        callAuthenticateWithError({"error": {"message": "An unexpected error prevented the server from fulfilling your request.", "code": 500, "title": "Internal Server Error"}});
        expect(consoleSpy.calls.mostRecent().args[0]).toBe("Error: " + JSON.stringify({message: "500 Internal Server Error", body: "An unexpected error prevented the server from fulfilling your request.", region: "IDM"}));
    });

    it('should call getserverlist 2 seconds after receiving the last update', function () {

        var expectedCount, callback;
        var setTimeoutSpy = spyOn(window, 'setTimeout');

        callListInstance();
        expectedCount = JSTACK.Nova.getserverlist.calls.count() + 1;
        callListInstanceSuccessCallback(instanceListSingleInstance);
        callback = setTimeout.calls.mostRecent().args[0];
        callback();

        expect(JSTACK.Nova.getserverlist.calls.count()).toEqual(expectedCount);
        expect(setTimeoutSpy).toHaveBeenCalledWith(jasmine.any(Function), 4000);
        
    });

    it('should show an error alert with the appropiate predefined' + 
       ' message and the received message body in the details', function () {

        var imageId = 'id';
        var error = {message: "500 Error", body: "Internal Server Error"};

        callListInstance();
        callListInstanceErrorCallback(error);

        expect($('.alert > strong').last().text()).toBe('Error ');
        expect($('.alert > span').last().text()).toBe('An error has occurred on the server side. ');
        expect($('.alert > div').last().text()).toBe(error.message + ' ' + error.body + ' ' + error.region + ' ');

    });

    it('should show an error alert with the message' + 
       ' received writen on it when ir doesn\'t recognize the error', function () {

        var imageId = 'id';
        var error = {message: "404 Error", body: "Image not found"};

        callListInstance();
        callListInstanceErrorCallback(error);        
        
        expect($('.alert > strong').last().text()).toBe(error.message + ' ');
        expect($('.alert > span').last().text()).toBe(error.body + ' ');

    });

    it('should display the error details when a click event is' + 
       ' triggered in the details button', function () {

        var imageId = 'id';
        var spyEvent = spyOnEvent('.alert a', 'click');
        var error = {message: "500 Error", body: "Internal Server Error"};

        callListInstance();
        callListInstanceErrorCallback(error);
        
        $('.alert a').trigger('click');
        
        expect($('.alert > div').last()).not.toHaveCss({display: "none"});

    });

});
