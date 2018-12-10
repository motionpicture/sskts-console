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
                    var userPoolId = data.object.clientUser.iss.replace('https://cognito-idp.ap-northeast-1.amazonaws.com/', '');
                    var html = '<ul class="list-unstyled">'
                        + '<li>' + data.agent.typeOf + '</li>';

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
                    } else {
                        seller = data.object.transaction.result.order.seller;
                    }

                    return '<ul class="list-unstyled">'
                        + '<li>' + seller.typeOf + '</li>'
                        + '<li><a target="_blank" href="/organizations/' + seller.typeOf + '/' + seller.id + '">' + seller.name + '</a></li>'
                        + '<li>' + seller.telephone + '</li>'
                        + '<li>' + seller.url + '</li>'
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