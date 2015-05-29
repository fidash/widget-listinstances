/* global Utils,Region */

var UI = (function (JSTACK) {
    "use strict";

    var hiddenColumns = [];
    var dataTable;

    /******************************************************************/
    /*                P R I V A T E   F U N C T I O N S               */
    /******************************************************************/

    function selectInstance (id) {
        var data = {
            'id': id,
            'access': JSTACK.Keystone.params.access,
            'token': JSTACK.Keystone.params.token
        };
        MashupPlatform.wiring.pushEvent('instance_id', JSON.stringify(data));
    }

    function initDataTable () {

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
            {'title': 'Task'},
            {'title': 'Region'}
        ];

        dataTable = $('#instances_table').dataTable({
            'columns': columns,
            "columnDefs": [
                {
                    "targets": hiddenColumns,
                    "visible": false
                }
            ],
            'binfo': false,
            'dom': 't<"navbar navbar-default navbar-fixed-bottom"p>',
            'pagingType': 'full_numbers',
            'info': false,
            "language": {
                "paginate": {
                    "first": '<i class="fa fa-fast-backward"></i>',
                    "last": '<i class="fa fa-fast-forward"></i>',
                    "next": '<i class="fa fa-forward"></i>',
                    "previous": '<i class="fa fa-backward"></i>'
                }
            }
        });
    }

    function createSearchField (nextElement) {

        var search = $('<div>').addClass('input-group search-container').insertBefore(nextElement);
        var searchButton = $('<button>').addClass('btn btn-default').html('<i class="fa fa-search"></i>');
        $('<span>').addClass('input-group-btn').append(searchButton).appendTo(search);
        var searchInput = $('<input>').attr('type', 'text').attr('placeholder', 'Search for...').addClass('search form-control').appendTo(search);
        var focusState = false;

        searchButton.on('click', function () {
            focusState = !focusState;
            
            searchInput.toggleClass('slideRight');
            searchButton.parent()
                .css('z-index', 20);

            if (focusState) {
                searchInput.focus();
            }

        });

        searchInput.on( 'keyup', function () {
            dataTable.api().search(this.value).draw();
        });
    }

    function createRefreshButton (nextElement, refreshCallback) {

        var refresh = $('<button>')
            .html('<i class="fa fa-refresh"></i>')
            .addClass('btn btn-default action-button pull-left')
            .click(refreshCallback)
            .insertBefore(nextElement);
    }

    function buildTableBody (instanceList) {

        var row, instance, displayableAddresses, displayableTask, displayablePowerState, imageId;

        // Clear previous elements
        dataTable.api().clear();

        instanceList.servers.forEach(function (instance) {

            displayableAddresses = instance.addresses ? Utils.getDisplayableAddresses(instance.addresses) : '';
            displayablePowerState = instance['OS-EXT-STS:power_state'] ? Utils.getDisplayablePowerState(instance["OS-EXT-STS:power_state"]) : '';
            displayableTask = (instance["OS-EXT-STS:task_state"] && instance["OS-EXT-STS:task_state"] !== '') ? instance["OS-EXT-STS:task_state"] : "None";

            imageId = '<a style="text-overflow: ellipsis;">' + instance.image.id + '</a>';
            row = dataTable.api().row.add([
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
                displayableTask,
                "Prague"
            ])
            .draw()
            .nodes()
            .to$();

            if (instance.id === UI.selectedRowId) {
                row.addClass('selected');
            }
        });
    }

    function setImageIdEvents () {

        $('#instances_table > tbody > tr > td').on('click', 'a', function () {
            var data = {
                "id": $(this).text(),
                "access": JSTACK.Keystone.params.access
            };

            MashupPlatform.wiring.pushEvent('image_id', JSON.stringify(data));
        });
    }

    function setSelectInstanceEvents () {

        // Remove previous
        $('#instances_table tbody').off('click', '**');

        $('#instances_table tbody').on('click', 'tr', function () {
            var data = dataTable.api().row(this).data();
            var id = data[0];
            UI.selectedRowId = id;
            
            dataTable.api().row('.selected')
                .nodes()
                .to$()
                .removeClass('selected');
            $(this).addClass('selected');
            selectInstance(id);
        });

    }

    function initFixedHeader () {
        UI.fixedHeader = new $.fn.dataTable.FixedHeader(dataTable);

        $(window).resize(function () {
            UI.fixedHeader._fnUpdateClones(true); // force redraw
            UI.fixedHeader._fnUpdatePositions();
        });
    }


    /******************************************************************/
    /*                 P U B L I C   F U N C T I O N S                */
    /******************************************************************/

    function createTable (refreshCallback) {

        initDataTable();

        // Padding bottom for fixed to bottom bar
        $('#instances_table_wrapper').attr('style', 'padding-bottom: 40px;');

        // Pagination style
        $('#instances_table_paginate').addClass('pagination pull-right');

        createSearchField($('#instances_table_paginate'));
        createRefreshButton($('#instances_table_paginate'), refreshCallback);

    }

    function updateHiddenColumns () {

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

        preferenceList.forEach(function (preference, index) {

            display = MashupPlatform.prefs.get(preference);

            if (!display) {
                hiddenColumns.push(index);
            }

            if (dataTable) {
                dataTable.api().column(index).visible(display, false);
            }

        });

        // Recalculate all columns size at once
        if (dataTable) {
            dataTable.api().columns.adjust();
        }

        setImageIdEvents();

    }

    function drawInstances (getInstanceList, autoRefresh, instanceList) {
        
        // Save previous scroll and page
        var scroll = $(window).scrollTop();
        var page = dataTable.api().page();

        buildTableBody(instanceList);
        setImageIdEvents();
        setSelectInstanceEvents();

        // Restore previous scroll and page
        $(window).scrollTop(scroll);
        dataTable.api().page(page).draw(false);

        if (autoRefresh) {
            setTimeout(function () {
                getInstanceList(true);
            }, 4000);
        }

        initFixedHeader();

    }

    function startLoadingAnimation () {

        var bodyWidth = $('body').width();
        var bodyHeight = $('body').height();

        // Reference size is the smaller between height and width
        var referenceSize = (bodyWidth < bodyHeight) ? bodyWidth : bodyHeight;
        var font_size = referenceSize / 4;

        // Calculate loading icon size
        $('.loading i').css('font-size', font_size);

        // Show
        $('.loading').removeClass('hide');

    }

    function stopLoadingAnimation () {

        // Hide
        $('.loading').addClass('hide');
    }

    return {
        createTable: createTable,
        updateHiddenColumns: updateHiddenColumns,
        drawInstances: drawInstances,
        startLoadingAnimation: startLoadingAnimation,
        stopLoadingAnimation: stopLoadingAnimation
    };
})(JSTACK);