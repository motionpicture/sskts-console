$(function () {
    $("#userPools-table").DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: '/userPools?' + $('form').serialize(),
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
                        + '<li><a target="_blank" href="/userPools/' + data.id + '">' + data.name + '</a></li>'
                        + '</ul>';

                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return data.id;
                }
            }
        ]
    });
});