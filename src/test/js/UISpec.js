/* global UI */

describe('User Interface', function() {
    "use strict";

    var respInstanceList = null;
    var respAuthenticate = null;
    var instanceListSingleInstance = null;
    var prefsValues;
    var refresh;

    beforeEach(function () {
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

        MashupPlatform.setStrategy(new MyStrategy(), prefsValues);

        // Load fixtures
        jasmine.getFixtures().fixturesPath = 'base/src/test/fixtures/html';
        loadFixtures('defaultTemplate.html');
        jasmine.getJSONFixtures().fixturesPath = 'base/src/test/fixtures/json';
        respInstanceList = getJSONFixture('respInstanceList.json');
        respAuthenticate = getJSONFixture('respAuthenticate.json');
        instanceListSingleInstance = getJSONFixture('instanceListSingleInstance.json');

        // Callbacks spies
        refresh = jasmine.createSpy('refresh');

        // Draw default columns
        UI.createTable(refresh);
        UI.updateHiddenColumns();
    });

    afterEach(function () {
        $('#instances_table').empty();
        $('.FixedHeader_Cloned.fixedHeader.FixedHeader_Header > table').empty();
    });


    /**************************************************************************/
    /*                     I N T E R F A C E   T E S T S                      */
    /**************************************************************************/

    // it('should have called MashupPlatform.wiring.pushEvent when click event triggered on a row', function () {

    //     var spyEvent = spyOnEvent('tbody > tr', 'click');
    //     var instanceId;

    //     UI.drawInstances(refresh, false, respInstanceList.servers);

    //     $('tbody > tr').trigger('click');

    //     for (var i=0; i<respInstanceList.servers.length; i++) {

    //         if (respInstanceList.servers[i].id === JSON.parse(MashupPlatform.wiring.pushEvent.calls.mostRecent().args[1]).id) {
    //             instanceId = respInstanceList.servers[i].id;
    //         }
    //     }

    //     expect(MashupPlatform.wiring.pushEvent).toHaveBeenCalled();
    //     expect(instanceId).toBeDefined();
    // });

    // it('should add the given row', function() {

    //     var states = [
    //         "SHUT DOWN",
    //         "RUNNING",
    //         "SHUTOFF",
    //     ];
    //     var instance = instanceListSingleInstance.servers[0];
    //     var addr = instance.addresses["private"][0].addr + instance.addresses["private"][1].addr;
    //     var expectedTextList = [instance.name, instance.status, addr, states[instance["OS-EXT-STS:power_state"]]];
    //     var cell;

    //     UI.drawInstances(refresh, false, instanceListSingleInstance.servers);

    //     for (var i=0; i<expectedTextList.length; i++) {

    //         cell = $('tbody > tr > td')[i];
    //         expect(cell).toContainText(expectedTextList[i]);
    //     }
    // });

    // it('should make the columns given in the preferences visible', function () {

    //     var column;
    //     var expectedColumns = [
    //         'Name',
    //         'Status',
    //         'Addresses',
    //         'Power State',
    //         'Region'
    //     ];

    //     UI.drawInstances(refresh, false, respInstanceList.servers);

    //     for (var i=0; i<expectedColumns.length; i++) {

    //         column = $('.fixedHeader th');
    //         expect(column).toContainText(expectedColumns[i]);
    //     }

    // });

    // it('should dynamically change the displayed columns when preferences change', function () {

    //     var column, handlePreferences;
    //     var expectedColumns = [
    //         'Owner',
    //         'Created',
    //         'Updated',
    //         'Image',
    //         'Flavor',
    //         'Region'
    //     ];

    //     // Change preferences
    //     prefsValues["MashupPlatform.prefs.get"].name = false;
    //     prefsValues["MashupPlatform.prefs.get"].status = false;
    //     prefsValues["MashupPlatform.prefs.get"].addresses = false;
    //     prefsValues["MashupPlatform.prefs.get"].power_state = false;
    //     prefsValues["MashupPlatform.prefs.get"].created = true;
    //     prefsValues["MashupPlatform.prefs.get"].updated = true;
    //     prefsValues["MashupPlatform.prefs.get"].owner = true;
    //     prefsValues["MashupPlatform.prefs.get"].image = true;
    //     prefsValues["MashupPlatform.prefs.get"].flavor = true;

    //     UI.updateHiddenColumns();
    //     UI.drawInstances(refresh, false, respInstanceList.servers);

    //     for (var i=0; i<expectedColumns.length; i++) {

    //         column = $('.fixedHeader th');
    //         expect(column).toContainText(expectedColumns[i]);
    //     }
    // });

    // it('should push a wiring event when a click event is triggered ' +
    //     'in an image id with the columns added before the build', function () {

    //     var spyEvent, imageId, handlePreferences;

    //     prefsValues["MashupPlatform.prefs.get"].image = true;

    //     UI.updateHiddenColumns();
    //     UI.drawInstances(refresh, false, respInstanceList.servers);

    //     spyEvent = spyOnEvent('tbody > tr > td > a', 'click');
    //     $('tbody > tr > td > a').trigger('click');
    //     expect(MashupPlatform.wiring.pushEvent.calls.first().args[0]).toEqual('image_id');
    //     expect(spyEvent).toHaveBeenTriggered();
    // });

    // it('should push a wiring event when a click event is triggered ' +
    //     'in an image id with the columns added before the build', function () {

    //     var spyEvent, imageId, handlePreferences;

    //     prefsValues["MashupPlatform.prefs.get"].image = true;

    //     UI.updateHiddenColumns();
    //     UI.drawInstances(refresh, false, respInstanceList.servers);

    //     spyEvent = spyOnEvent('tbody > tr > td > a', 'click');
    //     $('tbody > tr > td > a').trigger('click');
    //     expect(MashupPlatform.wiring.pushEvent.calls.first().args[0]).toEqual('image_id');
    //     expect(spyEvent).toHaveBeenTriggered();
    // });

    // it('should start loading animation with width lesser than the height', function () {

    //     var bodyWidth = 100;

    //     $('body').width(bodyWidth);
    //     $('body').height(bodyWidth + 100);

    //     UI.startLoadingAnimation($('.loading'), $('.loading i'));

    //     expect($('.loading i').css('font-size')).toBe(Math.floor(bodyWidth/4) + 'px');

    //     // Return to original state
    //     UI.stopLoadingAnimation($('.loading'));
    // });

    // it('should start loading animation with height lesser than the width', function () {

    //     var bodyHeight = 100;

    //     $('body').width(bodyHeight + 100);
    //     $('body').height(bodyHeight);

    //     UI.startLoadingAnimation($('.loading'), $('.loading i'));

    //     expect($('.loading i').css('font-size')).toBe(Math.floor(bodyHeight/4) + 'px');

    //     // Return to original state
    //     UI.stopLoadingAnimation($('.loading'));
    // });

    // it('should expand the search input when a click event is triggered in the search button', function () {

    //     var spyEvent = spyOnEvent('.search-container button', 'click');

    //     UI.drawInstances(refresh, false, respInstanceList.servers);

    //     $('.search-container button').trigger('click');

    //     expect($('.search-container input')).toHaveClass('slideRight');
    // });

    // it('should correctly search images when new data is introduced in the input field', function () {

    //     var spyEvent;

    //     UI.drawInstances(refresh, false, respInstanceList.servers);

    //     spyEvent = spyOnEvent('.search-container input', 'keyup');
    //     $('.search-container input')
    //         .val('synchronization-3.3.3__instance')
    //         .trigger('keyup');

    //     expect('keyup').toHaveBeenTriggeredOn('.search-container input');
    //     expect($('tbody').children().size()).toBe(1);
    // });

    // it('should display an empty string when given an instance without addresses', function () {

    //     var addresses = instanceListSingleInstance.servers[0].addresses;

    //     instanceListSingleInstance.servers[0].addresses = null;

    //     UI.drawInstances(refresh, false, instanceListSingleInstance.servers);

    //     expect($('tbody > tr').children()[2].textContent).toEqual('');
    //     instanceListSingleInstance.servers[0].addresses = addresses;
    // });

    // it('should display an empty string when given an instance without addresses', function () {

    //     var power_state = instanceListSingleInstance.servers[0]["OS-EXT-STS:power_state"];

    //     instanceListSingleInstance.servers[0]["OS-EXT-STS:power_state"] = null;

    //     UI.drawInstances(refresh, false, instanceListSingleInstance.servers);

    //     expect($('tbody > tr').children()[3].textContent).toEqual('');
    //     instanceListSingleInstance.servers[0]["OS-EXT-STS:power_state"] = power_state;
    // });

    // it('should display "None" when given an instance with an empty string as task', function () {

    //     var task = instanceListSingleInstance.servers[0]["OS-EXT-STS:task_state"];

    //     instanceListSingleInstance.servers[0]["OS-EXT-STS:task_state"] = '';

    //     UI.drawInstances(refresh, false, instanceListSingleInstance.servers);

    //     expect($('tbody > tr').children()[4].textContent).toEqual('None');

    //     instanceListSingleInstance.servers[0]["OS-EXT-STS:task_state"] = task;
    // });

    // it('should display "None" when given an instance without a task', function () {

    //     var task = instanceListSingleInstance.servers[0]["OS-EXT-STS:task_state"];

    //     instanceListSingleInstance.servers[0]["OS-EXT-STS:task_state"] = null;

    //     UI.drawInstances(refresh, false, instanceListSingleInstance.servers);

    //     expect($('tbody > tr').children()[4].textContent).toEqual('None');

    //     instanceListSingleInstance.servers[0]["OS-EXT-STS:task_state"] = task;
    // });

    // it('should display an empty string when addresses attribute has no private object', function () {

    //     var data;
    //     var addr = instanceListSingleInstance.servers[0].addresses.private;
    //     instanceListSingleInstance.servers[0].addresses.private = null;

    //     UI.drawInstances(refresh, false, instanceListSingleInstance.servers);

    //     data = $('tbody > tr').first().children();
    //     instanceListSingleInstance.servers[0].addresses.private = addr;

    //     expect(data[2].textContent).toBe('');
    // });

    it('should expand the search bar', function () {
        var searchButton = $('.search-container button');
        var spyEvent = spyOnEvent('.search-container button', 'click');

        searchButton.click();

        expect('click').toHaveBeenTriggeredOn('.search-container button');
        expect('.search-container input').toHaveClass('slideRight');
        expect('.search-container input').toBeFocused();

        // Return to original state
        searchButton.click();
    });

    it('should collapse the search bar', function () {
        var searchButton = $('.search-container button');

        searchButton.click();
        searchButton.click();

        expect('.search-container input').not.toHaveClass('slideRight');
        expect('.search-container input').not.toBeFocused();
    });

    it('should expand the region selector', function () {
        var regionButton = $('button .fa-globe');
        var spyEvent = spyOnEvent('button .fa-globe', 'click');

        regionButton.click();

        expect('click').toHaveBeenTriggeredOn('button .fa-globe');
        expect('#region-selector').toHaveClass('slideRight');

        // Return to original state
        regionButton.click();
    });

    it('should collapse the region selector', function () {
        var regionButton = $('button .fa-globe');

        regionButton.click();
        regionButton.click();

        expect('#region-selector').not.toHaveClass('slideRight');
    });

    it('should select a region after clicking on its selector', function () {
        var regionSelector = $('input[value=Crete]').parent();

        regionSelector.click();

        expect('input[value=Crete]').toHaveClass('selected');
        expect('input[value=Crete]').toHaveProp('checked', true);

        // Return to original state
        regionSelector.click();
    });

    it('should deselect a region after clicking on its selector twice', function () {
        var regionSelector = $('input[value=Crete]').parent();

        regionSelector.click();
        regionSelector.click();

        expect('input[value=Crete]').not.toHaveClass('selected');
        expect('input[value=Crete]').toHaveProp('checked', false);

    });

    // it("should select Spain2 region when first loading the widget", function () {
    //     expect($('input[value=Spain2]').prop('checked')).toEqual(true);
    // });

});
