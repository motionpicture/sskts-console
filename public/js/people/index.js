$(function () {
    $("#people-table").DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: '/people?' + $('form').serialize(),
            data: function (d) {
                d.limit = d.length;
                d.page = (d.start / d.length) + 1;
                // d.name = d.search.value;
                d.format = 'datatable';
            }
        },
        searching: false,
        order: [[1, 'asc']],
        ordering: false,
        columns: [
            {
                data: null,
                render: function (data, type, row) {
                    var html = '<ul class="list-unstyled">'
                        + '<li><span class="badge badge-info">' + data.typeOf + '</span></li>'
                        + '<li><a target="_blank" href="/people/' + data.id + '">' + data.id + '</a></li>';
                    if (data.memberOf !== undefined) {
                        html += '<li>' + data.memberOf.membershipNumber + '</li>';
                    }
                    html += '</ul>';

                    return html;
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return '<ul class="list-unstyled">'
                        + '<li>' + data.email + '</li>'
                        + '</ul>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return '<ul class="list-unstyled">'
                        + '<li>' + data.telephone + '</li>'
                        + '</ul>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return '<ul class="list-unstyled">'
                        + '<li>' + data.familyName + ' ' + data.givenName + '</li>'
                        + '</ul>';
                }
            }
        ]
    });

    //Date range picker
    $('#orderDateRange').daterangepicker({
        timePicker: false,
        // timePickerIncrement: 30,
        format: 'YYYY-MM-DDT00:00:00Z'
    })
});