$(function () {
    $("#transactions-table").DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: '/transactions/returnOrder?' * $('form').serialize(),
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
                        + '<li><a target="_blank" href="/transactions/returnOrder/' + data.id + '">' + data.id + '</a></li>'
                        + '<li><span class="badge ' + data.status + '">' + data.status + '</span></li>'
                        + '<li>' + data.startDate + '</li>'
                        + '<li>' + data.endDate + '</li>'
                        + '<li>' + data.expires + '</li>'
                        + '</ul>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    var userPoolId = '';
                    if (data.object.clientUser !== undefined) {
                        userPoolId = data.object.clientUser.iss.replace('https://cognito-idp.ap-northeast-1.amazonaws.com/', '');
                    }

                    var html = '<ul class="list-unstyled">'
                        + '<li><span class="badge badge-secondary ' + data.agent.typeOf + '">' + data.agent.typeOf + '</span></li>';

                    if (data.agent.memberOf !== undefined) {
                        html += '<li><a target="_blank" href="/userPools/' + userPoolId + '/people/' + data.agent.id + '">' + data.agent.id + '</a></li>'
                            + '<li>' + data.agent.memberOf.membershipNumber + '</li>';
                    } else {
                        html += '<li>' + data.agent.id + '</li>';
                    }

                    html += '</ul>';

                    return html;
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    var seller = {};
                    if (data.object.order !== undefined) {
                        seller = data.object.order.seller;
                    }

                    return '<ul class="list-unstyled">'
                        + '<li><span class="badge badge-secondary ' + seller.typeOf + '">' + seller.typeOf + '</span></li>'
                        + '<li><a target="_blank" href="/organizations/' + seller.typeOf + '/' + seller.id + '">' + seller.name + '</a></li>'
                        + '<li>' + seller.telephone + '</li>'
                        + '<li>' + seller.url + '</li>'
                        + '</ul>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    if (data.object !== undefined && data.object.order !== undefined) {
                        return '<ul class="list-unstyled">'
                            + '<li><a target="_blank" href="/orders/' + data.object.order.orderNumber + '">' + data.object.order.orderNumber + '</a></li>'
                            + '</ul>';
                    } else {
                        return '<ul class="list-unstyled">'
                            + '<li>No Object</li>'
                            + '</ul>';
                    }
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return '<ul class="list-unstyled">'
                        + '<li><span class="badge badge-secondary ' + data.tasksExportationStatus + '">' + data.tasksExportationStatus + '</span></li>'
                        + '<li>' + data.tasksExportedAt + '</li>'
                        + '</ul>';
                }
            }
        ]
    });

    //Date range picker
    $('#startRange').daterangepicker({
        timePicker: false,
        // timePickerIncrement: 30,
        format: 'YYYY-MM-DDT00:00:00+0900'
    });

    $('.search').click(function () {
        $('form').submit();
    });
    $('.downloadCSV').click(function () {
        var url = '/transactions/returnOrder?' + $('form').serialize() + '&format=text/csv';
        window.open(url, '_blank');
    });
});