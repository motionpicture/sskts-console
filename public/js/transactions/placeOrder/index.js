$(function () {
    $("#transactions-table").DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: '/transactions/placeOrder?' * $('form').serialize(),
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
                        + '<li><a target="_blank" href="/transactions/placeOrder/' + data.id + '">' + data.id + '</a></li>'
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
                    var html = '<ul class="list-unstyled">'
                        + '<li>' + data.agent.typeOf + '</li>';
                    if (data.agent.memberOf !== undefined) {
                        html += '<li><a target="_blank" href="/people/' + data.agent.id + '">' + data.agent.id + '</a></li>'
                            + '<li>' + data.agent.memberOf.membershipNumber + '</li>';
                    } else {
                        html += '<li>' + data.agent.id + '</li>';
                    }
                    if (data.object.customerContact !== undefined) {
                        html += '<li>' + data.object.customerContact.familyName + ' ' + data.object.customerContact.givenName + '</li>'
                            + '<li>' + data.object.customerContact.email + '</li>'
                            + '<li>' + data.object.customerContact.telephone + '</li>';
                    }
                    html += '</ul>';

                    return html;
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return '<ul class="list-unstyled">'
                        + '<li>' + data.seller.typeOf + '</li>'
                        + '<li><a target="_blank" href="/organizations/' + data.seller.typeOf + '/' + data.seller.id + '">' + data.seller.name.ja + '</a></li>'
                        + '<li>' + data.seller.telephone + '</li>'
                        + '<li>' + data.seller.url + '</li>'
                        + '</ul>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    var userPoolId = data.object.clientUser.iss.replace('https://cognito-idp.ap-northeast-1.amazonaws.com/', '');
                    return '<ul class="list-unstyled">'
                        + '<li>' + data.object.clientUser.sub + '</li>'
                        + '<li><a target="_blank" href="/userPools/' + userPoolId + '">' + data.object.clientUser.iss + '</a></li>'
                        + '<li><a target="_blank" href="/userPools/' + userPoolId + '/clients/' + data.object.clientUser.client_id + '">' + data.object.clientUser.client_id + '</a></li>'
                        + '</ul>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    if (data.result !== undefined) {
                        return '<ul class="list-unstyled">'
                            + '<li><a target="_blank" href="/orders/' + data.result.order.orderNumber + '">' + data.result.order.orderNumber + '</a></li>'
                            + '</ul>';
                    } else {
                        return '<ul class="list-unstyled">'
                            + '<li>No Result</li>'
                            + '</ul>';
                    }
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
        var url = '/transactions/placeOrder?' + $('form').serialize() + '&format=text/csv';
        window.open(url, '_blank');
    });
});