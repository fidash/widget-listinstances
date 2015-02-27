var OpenStackListInstance = (function (JSTACK) {
    "use strict";

    var url = 'https://cloud.lab.fiware.org/keystone/v2.0/';
    var dataTable, hiddenColumns;

    function authenticate () {
        
        var tokenId, tenantId;
        var postBody, headersAuth;
        var options;
        var USERNAME, PASSWORD;
        var headersTenants = {};

        headersAuth = {
            "Accept": "application/json",
            "X-FI-WARE-OAuth-Token": "true",
            "X-FI-WARE-OAuth-Token-Body-Pattern": "%fiware_token%"
        };

        headersTenants['X-FI-WARE-OAuth-Token'] = 'true';
        headersTenants['X-FI-WARE-OAuth-Header-Name'] = 'X-Auth-Token';

        postBody = {
            "auth": {}
        };

        postBody.auth.token = {
            "id": "%fiware_token%"
        };


        // Initialize Keystone
        JSTACK.Keystone.init(url);

        // Get tenants with the user's FIWARE token
        MashupPlatform.http.makeRequest(url + 'tenants', {
            method: 'GET',
            requestHeaders: headersTenants,
            onSuccess: function (response) {

                response = JSON.parse(response.responseText);
                postBody.auth.tenantId = response.tenants[0].id;

                // Post request to receive service token from Openstack
                MashupPlatform.http.makeRequest(url + 'tokens', {
                    requestHeaders: headersAuth,
                    contentType: "application/json",
                    postBody: JSON.stringify(postBody),
                    onSuccess: function (response) {
                        response = JSON.parse(response.responseText);

                        // Mimic JSTACK.Keystone.authenticate behavior on success
                        JSTACK.Keystone.params.token = response.access.token.id;
                        JSTACK.Keystone.params.access = response.access;
                        JSTACK.Keystone.params.currentstate = 2;

                        createTable();
                        getInstanceList();
                    },
                    onFailure: function (response) {
                        onError(response);
                    }
                });

            },
            onFailure: function (response) {
                onError(response);
            }
        });
        
    }

    function createTable () {

        var refresh, createButton, modalCreateButton;

        // TODO let the user choose the content of columns as a preference
        var columns = [
            {'title': 'ID'},
            {'title': 'Name'},
            {'title': 'Tenant'},
            {'title': 'Status'},
            {'title': 'Addresses'},
            {'title': 'Owner'},
            {'title': 'Created'},
            {'title': 'Updated'},
            {'title': 'Image'},
            {'title': 'Key Pair'},
            {'title': 'Flavor'},
            {'title': 'Disk Config'},
            {'title': 'VM State'},
            {'title': 'Power State'},
            {'title': 'Task'}
        ];

        dataTable = $('#instances_table').DataTable({
            'columns': columns,
            "columnDefs": [
                {
                    "targets": hiddenColumns,
                    "visible": false
                }
            ],
            'binfo': false,
            //responsive: true,
            'pagingType': 'full_numbers',
            'info': false
        });

        // Set refresh button
        refresh = $('<button>');
        refresh.text('Refresh');
        refresh.addClass('btn btn-default action-button pull-left');
        refresh.click(getInstanceList);
        refresh.insertBefore($('#instances_table_paginate'));

    }

    function getInstanceList () {

        JSTACK.Nova.getserverlist(true, null, callbackInstanceList, onError);

    }

    function rowClickCallback (id) {
        var data = {
            'id': id,
            'access': JSTACK.Keystone.params.access
        };
        MashupPlatform.wiring.pushEvent('instance_id', JSON.stringify(data));
    }

    function handlePreferences () {

        var display;
        var preferenceList = [
            "id",
            "name",
            "tenant",
            "status",
            "addresses",
            "owner",
            "created",
            "updated",
            "image",
            "key_pair",
            "flavor",
            "disk_config",
            "vm_state",
            "power_state",
            "task"
        ];

        hiddenColumns = [];
        
        for (var i=0; i<preferenceList.length; i++) {

            display = MashupPlatform.prefs.get(preferenceList[i]);

            if (!display) {
                hiddenColumns.push(i);
            }

            if (dataTable) {
                dataTable.column(i).visible(display, false);
            }

        }

        // Recalculate all columns size at once
        if (dataTable) {
            dataTable.columns.adjust().draw(false);
        }

        // Image ID events
        if (MashupPlatform.prefs.get('image')) {
            $('#instances_table > tbody > tr > td').on('click', 'a', function () {

                var data = {
                    "id": $(this).text(),
                    "access": JSTACK.Keystone.params.access
                };

                MashupPlatform.wiring.pushEvent('image_id', JSON.stringify(data));
            });
        }

    }

    function getDisplayableAddresses(addresses) {

        var privateAddresses = addresses["private"];
        var displayableAddresses;
        
        if (!privateAddresses) {
            return '';
        }

        displayableAddresses = privateAddresses[0].addr;

        for (var i=1; i<privateAddresses.length; i++) {
            displayableAddresses += '<br/>' + privateAddresses[i].addr;
        }

        return displayableAddresses;

    }

    function getDisplayablePowerState (power_state) {
        var states = [
            "SHUT DOWN",
            "RUNNING",
            "SHUTOFF",
        ];

        return states[power_state];
    }

    function callbackInstanceList (result) {
        
        var instance,
            displayableAddresses,
            displayablePowerState,
            displayableTask,
            imageId;

        var dataSet = [];

        // Clear previous elements
        dataTable.clear();

        // Build table body
        for (var i=0; i<result.servers.length; i++) {
            instance = result.servers[i];

            displayableAddresses = instance.addresses ? getDisplayableAddresses(instance.addresses) : '';
            displayablePowerState = instance['OS-EXT-STS:power_state'] ? getDisplayablePowerState(instance["OS-EXT-STS:power_state"]) : '';
            displayableTask = (instance["OS-EXT-STS:task_state"] && instance["OS-EXT-STS:task_state"] !== '') ? instance["OS-EXT-STS:task_state"] : "None";

            imageId = '<a style="text-overflow: ellipsis;">' + instance.image.id + '</a>';
            dataTable.row.add([
                instance.id,
                instance.name,
                instance.tenant_id,
                instance.status,
                displayableAddresses,
                instance.user_id,
                instance.created,
                instance.updated,
                imageId,
                instance.key_name,
                instance.flavor,
                instance["OS-DCF:diskConfig"],
                instance["OS-EXT-STS:vm_state"],
                displayablePowerState,
                displayableTask
            ]).draw();
        }

        // Image ID events
        $('#instances_table > tbody > tr > td').on('click', 'a', function () {
            var data = {
                "id": $(this).text(),
                "access": JSTACK.Keystone.params.access
            };

            MashupPlatform.wiring.pushEvent('image_id', JSON.stringify(data));
        });

        // Row events
        $('#instances_table tbody').on('click', 'tr', function () {
            var data = dataTable.row(this).data();
            var id = data[0];
            $('#instances_table tbody tr').removeClass('selected');
            $(this).addClass('selected');
            rowClickCallback(id);
        });

        dataTable.columns.adjust().draw();

        setTimeout(function () {
            getInstanceList();
        }, 2000);

    }

    function onError (error) {
        console.log('Error: ' + JSON.stringify(error));
    }

    function OpenStackListInstance () {

        // Initialize parameters
        dataTable = null;
        hiddenColumns = [];

        this.init = authenticate;
        this.listInstance = getInstanceList;

        // Initialize preferences
        handlePreferences();

        // Preferences handler
        MashupPlatform.prefs.registerCallback(handlePreferences);

    }

    return OpenStackListInstance;
})(JSTACK);
