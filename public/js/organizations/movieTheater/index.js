$(function () {
    $("#movieTheaters-table").DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: '/organizations/movieTheater?' + $('form').serialize(),
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
                        + '<li><a href="/organizations/movieTheater/' + data.id + '">' + data.id + '</a></li>'
                        + '<li>' + data.typeOf + '</li>'
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
                    return '<ul class="list-unstyled">'
                        + '<li>' + data.location.typeOf + '</li>'
                        + '<li>' + data.location.branchCode + '</li>'
                        + '<li>' + data.location.name.ja + '</li>'
                        + '<li>' + data.location.name.en + '</li>'
                        + '</ul>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return '<ul class="list-unstyled">'
                        + '<li><span class="badge ' + 'CreditCard' + '">' + 'CreditCard' + '</span></li>'
                        + '<li>' + JSON.stringify(data.gmoInfo, null, '\t') + '</li>'
                        + data.paymentAccepted.map(function (payment) {
                            return '<li><span class="badge ' + payment.paymentMethodType + '">' + payment.paymentMethodType + '</span></li>'
                                + '<li>' + JSON.stringify(payment, null, '\t') + '</li>';
                        }).join('')
                        + '</ul>';
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return '<ul class="list-unstyled">'
                        + '</ul>';
                }
            }
        ]
    });
});