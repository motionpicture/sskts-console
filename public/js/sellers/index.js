$(function () {
    $("#sellers-table").DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: '/sellers?' + $('form').serialize(),
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
                    return '<ul class="list-unstyled">'
                        + '<li><a href="/sellers/' + data.id + '">' + data.id + '</a></li>'
                        + '<li><span class="badge badge-info ' + data.typeOf + '">' + data.typeOf + '</span></li>'
                        + '<li>' + data.name.ja + '</li>'
                        + '<li>' + data.name.en + '</li>'
                        + '<li>' + data.telephone + '</li>'
                        + '<li><a target="_blank" href="' + data.url + '">' + data.url + '</a></li>'
                        + '</ul>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    var html = '<ul class="list-unstyled">';
                    if (data.location !== undefined && data.location !== null) {
                        html += '<li><span class="badge badge-info ' + data.location.typeOf + '">' + data.location.typeOf + '</span></li>'
                            + '<li>' + data.location.branchCode + '</li>'
                            + '<li>' + data.location.name.ja + '</li>'
                            + '<li>' + data.location.name.en + '</li>';
                    }
                    html += '</ul>';

                    return html;
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return '<ul class="list-unstyled">'
                        + data.paymentAccepted.map(function (payment) {
                            return '<li><span class="badge badge-info ' + payment.paymentMethodType + '">' + payment.paymentMethodType + '</span></li>'
                                + '<li>' + JSON.stringify(payment, null, '\t') + '</li>';
                        }).join('')
                        + '</ul>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    var html = '<ul class="list-unstyled">';
                    if (Array.isArray(data.areaServed)) {
                        html += data.areaServed.map(function (area) {
                            return '<li><span class="badge badge-info">' + area.typeOf + '</span></li>'
                                + '<li>' + JSON.stringify(area, null, '\t') + '</li>';
                        }).join('')

                    }
                    html += '</ul>';

                    return html;
                }
            }
        ]
    });
});