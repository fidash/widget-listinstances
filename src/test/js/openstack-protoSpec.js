/* global OpenStackListInstance */

describe('Test Instance Table', function () {
    "use strict";

    var openStack = null;
    var respInstanceList = null;
    var respAuthenticate = null;
    var instanceListSingleInstance = null;
    var prefsValues;

    beforeEach(function() {

        JSTACK.Keystone = jasmine.createSpyObj("Keystone", ["init", "authenticate", "gettenants", "params"]);
        JSTACK.Nova = jasmine.createSpyObj("Nova", ["getserverlist"]);

        // Reset prefs values
        prefsValues = {
            "MashupPlatform.prefs.get": {
                "id": false,
                "name": true,
                "tenant": false,
                "status": true,
                "addresses": true,
                "owner": false,
                "created": false,
                "updated": false,
                "image": false,
                "key_pair": false,
                "flavor": false,
                "disk_config": false,
                "vm_state": false,
                "power_state": true,
                "task": true
            }
        };

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

    afterEach(function () {
        $('#instances_table').empty();
        $('.FixedHeader_Cloned.fixedHeader.FixedHeader_Header > table').empty();
    });


    /**************************************************************************/
    /*****************************AUXILIAR FUNCTIONS***************************/
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
    /****************************FUNCTIONALITY TESTS***************************/
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

    it('should call error callback for authenticate correctly', function () {
        
        var consoleSpy = spyOn(console, "log");

        callListInstance();
        callAuthenticateWithError('Test successful');
        expect(consoleSpy.calls.mostRecent().args[0]).toBe('Error: "Test successful"');
    });

    it('should display an empty string when given an instance without addresses', function () {

        var addresses = instanceListSingleInstance.servers[0].addresses;

        instanceListSingleInstance.servers[0].addresses = null;
        callListInstance();
        callListInstanceSuccessCallback(instanceListSingleInstance);

        expect($('tbody > tr').children()[2].textContent).toEqual('');
        instanceListSingleInstance.servers[0].addresses = addresses;
    });

    it('should display an empty string when given an instance without addresses', function () {

        var power_state = instanceListSingleInstance.servers[0]["OS-EXT-STS:power_state"];

        instanceListSingleInstance.servers[0]["OS-EXT-STS:power_state"] = null;
        callListInstance();
        callListInstanceSuccessCallback(instanceListSingleInstance);

        expect($('tbody > tr').children()[3].textContent).toEqual('');
        instanceListSingleInstance.servers[0]["OS-EXT-STS:power_state"] = power_state;
    });

    it('should display "None" when given an instance with an empty string as task', function () {

        var task = instanceListSingleInstance.servers[0]["OS-EXT-STS:task_state"];
        
        instanceListSingleInstance.servers[0]["OS-EXT-STS:task_state"] = '';
        callListInstance();
        callListInstanceSuccessCallback(instanceListSingleInstance);

        expect($('tbody > tr').children()[4].textContent).toEqual('None');

        instanceListSingleInstance.servers[0]["OS-EXT-STS:task_state"] = task;
    });

    it('should display "None" when given an instance without a task', function () {

        var task = instanceListSingleInstance.servers[0]["OS-EXT-STS:task_state"];
        
        instanceListSingleInstance.servers[0]["OS-EXT-STS:task_state"] = null;
        callListInstance();
        callListInstanceSuccessCallback(instanceListSingleInstance);

        expect($('tbody > tr').children()[4].textContent).toEqual('None');

        instanceListSingleInstance.servers[0]["OS-EXT-STS:task_state"] = task;
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

    it('should display an empty string when addresses attribute has no private object', function () {

        var data;
        var addr = instanceListSingleInstance.servers[0].addresses.private;
        instanceListSingleInstance.servers[0].addresses.private = null;

        callListInstance();
        callListInstanceSuccessCallback(instanceListSingleInstance);
        data = $('tbody > tr').first().children();
        instanceListSingleInstance.servers[0].addresses.private = addr;

        expect(data[2].textContent).toBe('');
    });


    /**************************************************************************/
    /*****************************INTERFACE TESTS******************************/
    /**************************************************************************/

    it('should have called MashupPlatform.wiring.pushEvent when click event triggered on a row', function () {

        var spyEvent = spyOnEvent('tbody > tr', 'click');
        var instanceId;

        callListInstance();
        callListInstanceSuccessCallback(respInstanceList);
        $('tbody > tr').trigger('click');

        for (var i=0; i<respInstanceList.servers.length; i++) {

            if (respInstanceList.servers[i].id === JSON.parse(MashupPlatform.wiring.pushEvent.calls.mostRecent().args[1]).id) {
                instanceId = respInstanceList.servers[i].id;
            }
        }

        expect(MashupPlatform.wiring.pushEvent).toHaveBeenCalled();
        expect(instanceId).toBeDefined();
    });

    it('should add the given row', function() {

        var states = [
            "SHUT DOWN",
            "RUNNING",
            "SHUTOFF",
        ];
        var instance = instanceListSingleInstance.servers[0];
        var addr = instance.addresses["private"][0].addr + instance.addresses["private"][1].addr;
        var expectedTextList = [instance.name, instance.status, addr, states[instance["OS-EXT-STS:power_state"]]];
        var cell;

        callListInstance();
        callListInstanceSuccessCallback(instanceListSingleInstance);

        for (var i=0; i<expectedTextList.length; i++) {
            
            cell = $('tbody > tr > td')[i];
            expect(cell).toContainText(expectedTextList[i]);
        }
    });

    it('should make the columns given in the preferences visible', function () {

        var column;
        var expectedColumns = [
            'Name',
            'Status',
            'Addresses',
            'Power State',
            'Region'
        ];

        callListInstance();
        callListInstanceSuccessCallback(respInstanceList);

        for (var i=0; i<expectedColumns.length; i++) {

            column = $('.fixedHeader th');
            expect(column).toContainText(expectedColumns[i]);
        }

    });

    it('should dynamically change the displayed columns when preferences change', function () {

        var column, handlePreferences;
        var expectedColumns = [
            'Owner',
            'Created',
            'Updated',
            'Image',
            'Flavor',
            'Region'
        ];

        // Change preferences
        prefsValues["MashupPlatform.prefs.get"].name = false;
        prefsValues["MashupPlatform.prefs.get"].status = false;
        prefsValues["MashupPlatform.prefs.get"].addresses = false;
        prefsValues["MashupPlatform.prefs.get"].power_state = false;
        prefsValues["MashupPlatform.prefs.get"].created = true;
        prefsValues["MashupPlatform.prefs.get"].updated = true;
        prefsValues["MashupPlatform.prefs.get"].owner = true;
        prefsValues["MashupPlatform.prefs.get"].image = true;
        prefsValues["MashupPlatform.prefs.get"].flavor = true;

        callListInstance();
        callListInstanceSuccessCallback(respInstanceList);
        handlePreferences = MashupPlatform.prefs.registerCallback.calls.mostRecent().args[0];
        handlePreferences();

        for (var i=0; i<expectedColumns.length; i++) {

            column = $('.fixedHeader th');
            expect(column).toContainText(expectedColumns[i]);
        }
    });

    it('should push a wiring event when a click event is triggered ' +
        'in an image id with the columns added before the build', function () {

        var spyEvent, imageId, handlePreferences;

        prefsValues["MashupPlatform.prefs.get"].image = true;

        callListInstance();
        callListInstanceSuccessCallback(instanceListSingleInstance);
        handlePreferences = MashupPlatform.prefs.registerCallback.calls.mostRecent().args[0];
        handlePreferences();
        
        spyEvent = spyOnEvent('tbody > tr > td > a', 'click');
        $('tbody > tr > td > a').trigger('click');
        expect(MashupPlatform.wiring.pushEvent.calls.first().args[0]).toEqual('image_id');
        expect(spyEvent).toHaveBeenTriggered();
    });

    it('should push a wiring event when a click event is triggered ' +
        'in an image id with the columns added before the build', function () {

        var spyEvent, imageId, handlePreferences;

        prefsValues["MashupPlatform.prefs.get"].image = true;

        handlePreferences = MashupPlatform.prefs.registerCallback.calls.mostRecent().args[0];
        handlePreferences();

        callListInstance();
        callListInstanceSuccessCallback(instanceListSingleInstance);

        spyEvent = spyOnEvent('tbody > tr > td > a', 'click');
        $('tbody > tr > td > a').trigger('click');
        expect(MashupPlatform.wiring.pushEvent.calls.first().args[0]).toEqual('image_id');
        expect(spyEvent).toHaveBeenTriggered();
    });

    it('should start loading animation with width lesser than the height', function () {
        
        var bodyWidth = 100;

        $('body').width(bodyWidth);
        $('body').height(bodyWidth + 100);
        callListInstance();
        callListInstanceSuccessCallback(respInstanceList);

        expect($('.loading i').css('font-size')).toBe(Math.floor(bodyWidth/4) + 'px');
    });

    it('should start loading animation with height lesser than the width', function () {
        
        var bodyHeight = 100;
        
        $('body').width(bodyHeight + 100);
        $('body').height(bodyHeight);

        callListInstance();
        callListInstanceSuccessCallback(respInstanceList);

        expect($('.loading i').css('font-size')).toBe(Math.floor(bodyHeight/4) + 'px');
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

    it('should expand the search input when a click event is triggered in the search button', function () {

        var spyEvent = spyOnEvent('.search-container button', 'click');

        callListInstance();
        callListInstanceSuccessCallback(respInstanceList);
        $('.search-container button').trigger('click');

        expect($('.search-container input')).toHaveClass('slideRight');
    });

    it('should correctly search images when new data is introduced in the input field', function () {

        var spyEvent;

        callListInstance();
        callListInstanceSuccessCallback(respInstanceList);
        spyEvent = spyOnEvent('.search-container input', 'keyup');
        $('.search-container input')
            .val('synchronization-3.3.3__instance')
            .trigger('keyup');

        expect('keyup').toHaveBeenTriggeredOn('.search-container input');
        expect($('tbody').children().size()).toBe(1);
    });

});
