$(function () {
    $("#tasks-table").DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: '/tasks?' + $('form').serialize(),
            data: function (d) {
                d.limit = d.length;
                d.page = (d.start / d.length) + 1;
                // d.name = d.search.value;
                d.format = 'datatable';
            }
        },
        searching: false,
        order: [[1, 'asc']], // デフォルトは枝番号昇順
        ordering: false,
        columns: [
            {
                data: null,
                render: function (data, type, row) {
                    return '<ul class="list-unstyled">'
                        // + '<li><a target="_blank" href="/orders/' + data.orderNumber + '">' + data.orderNumber + '</a></li>'
                        // + '<li><span class="text-muted">' + data.confirmationNumber + '</span></li>'
                        + '<li>' + data.id + '</li>'
                        + '<li>' + data.name + '</li>'
                        + '<li>' + data.remainingNumberOfTries + '/' + data.numberOfTried + '</li>'
                        + '</ul>';

                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return '<ul class="list-unstyled">'
                        + '<li>' + data.runsAt + '</li>'
                        + '<li>' + data.lastTriedAt + '</li>'
                        + '</ul>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return '<ul class="list-unstyled">'
                        + '<li><span class="badge ' + data.status + '">' + data.status + '</span></li>'
                        + '</ul>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return '<ul class="list-unstyled">'
                        + '<li><textarea class="form-control" placeholder="" disabled="">' + JSON.stringify(data.executionResults, null, '\t') + '</textarea></li>'
                        + '</ul>';
                }
            }
        ]
    });

    //Date range picker
    $('#runsRange').daterangepicker({
        timePicker: false,
        // timePickerIncrement: 30,
        format: 'YYYY-MM-DDT00:00:00Z'
    })
});