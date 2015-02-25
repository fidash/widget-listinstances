/* global OpenStackListInstance */

describe('Test Instance Table', function () {
	"use strict";

	var openStack = null;
	var respInstanceList = null;
	var respAuthenticate = null;
	var respTenants = null;
	var respServices = null;
	var instanceListSingleInstance = null;
	var prefsValues;

	beforeEach(function() {

		// Set/Reset prefs values
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
		        "task": false
		    }
		};

		// Set/Reset strategy
		MashupPlatform.setStrategy(new MyStrategy(), prefsValues);

		// Set/Reset fixtures
		setFixtures('<table id="instances_table"></table>');
		jasmine.getJSONFixtures().fixturesPath = 'src/test/fixtures/json';
		respInstanceList = getJSONFixture('respInstanceList.json');
		respAuthenticate = getJSONFixture('respAuthenticate.json');
		respTenants = getJSONFixture('respTenants.json');
		respServices = getJSONFixture('respServices.json');
		instanceListSingleInstance = getJSONFixture('instanceListSingleInstance.json');

		// Create new instance
		openStack = new OpenStackListInstance();
	});

	afterEach(function () {
		$('#instances_table').empty();
	});


	/**************************************************************************/
	/*****************************AUXILIAR FUNCTIONS***************************/
	/**************************************************************************/

	function callListInstance() {

		var handleServiceTokenCallback, getTenantsOnSuccess;
		openStack.init();

		getTenantsOnSuccess = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onSuccess;
		respTenants = {
			responseText: JSON.stringify(respTenants)
		};
		getTenantsOnSuccess(respTenants);
		
		handleServiceTokenCallback = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onSuccess;
		respServices = {
			responseText: JSON.stringify(respServices)
		};
		handleServiceTokenCallback(respServices);

		openStack.listInstance();

	}

	function callgetTenantsWithError () {
		
		var getTenantsOnError;

		openStack.init();
		getTenantsOnError = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onFailure;
		getTenantsOnError('Test successful');
	}

	function callAuthenticateWithError () {
		
		var authenticateError, getTenantsOnSuccess;

		getTenantsOnSuccess = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onSuccess;
		respTenants = {
			responseText: JSON.stringify(respTenants)
		};
		getTenantsOnSuccess(respTenants);

		authenticateError = MashupPlatform.http.makeRequest.calls.mostRecent().args[1].onFailure;
		authenticateError('Test successful');
	}

	function callListInstanceSuccessCallback (instanceList) {

		var callback = JSTACK.Nova.getserverlist.calls.mostRecent().args[2];
		
		callback(instanceList);

	}


	/**************************************************************************/
	/****************************FUNCTIONALITY TESTS***************************/
	/**************************************************************************/

	it('should authenticate through wirecloud proxy', function() {

		callListInstance();

		expect(MashupPlatform.http.makeRequest.calls.count()).toBe(2);
		expect(JSTACK.Keystone.params.currentstate).toBe(2);

	});

	it('should have created a table with the received instances', function () {

		callListInstance();
		callListInstanceSuccessCallback(respInstanceList);

		var rows = document.querySelectorAll('tbody > tr');

		expect(rows.length).toBeGreaterThan(0);
	});

	it('should call error callback for getTenants correctly',function () {

		console.log = jasmine.createSpy("log").and.callThrough();	// REFACTOR

		callgetTenantsWithError();
		expect(console.log.calls.mostRecent().args[0]).toBe('Error: "Test successful"');
	});

	it('should call error callback for authenticate correctly', function () {
		
		console.log = jasmine.createSpy("log").and.callThrough();	// REFACTOR

		callgetTenantsWithError();
		callAuthenticateWithError();
		expect(console.log.calls.mostRecent().args[0]).toBe('Error: "Test successful"');
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

		var instance = instanceListSingleInstance.servers[0];
		var addr = instance.addresses["private"][0].addr + instance.addresses["private"][1].addr;
		var expectedTextList = [instance.name, instance.status, addr, instance["OS-EXT-STS:power_state"]];
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
			'Power State'
		];

		callListInstance();
		callListInstanceSuccessCallback(respInstanceList);

		for (var i=0; i<expectedColumns.length; i++) {

			column = $('thead > tr > th');
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
			'Flavor'
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

			column = $('thead > tr > th');
			expect(column).toContainText(expectedColumns[i]);
		}
	});

	it('should push a wiring event when a click event is triggered' +
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

	it('should push a wiring event when a click event is triggered' +
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
});
