var person = JSON.parse($('#jsonViewer textarea.person').val());
var orders = [];
var searchedAllOrders = false;
var limit = 100;
var page = 0;
var lineChart;
$(function () {
    // 注文検索
    console.log('searching orders...', page);
    searchOrders(function () {
    });
});
function searchOrders(cb) {
    page += 1;
    $.getJSON(
        '/people/' + person.id + '/orders',
        { limit: limit, page: page }
    ).done(function (data) {
        $('#orderCount').html(data.totalCount.toString());
        searchedAllOrders = (data.data.length < limit);
        $.each(data.data, function (key, order) {
            orders.push(order);
            $('<tr>').html(
                '<td>' + '<a target="_blank" href="/orders/' + order.orderNumber + '">' + order.orderNumber + '</a>' + '</td>'
                + '<td>' + order.orderDate + '</td>'
                + '<td>' + order.acceptedOffers.map(function (o) {
                    if (o.itemOffered.reservedTicket !== undefined) {
                        return o.itemOffered.reservedTicket.ticketedSeat.seatNumber
                    }
                    return o.itemOffered.typeOf;
                }).join(',') + '</td>'
                + '<td>' + '<span class="badge ' + order.orderStatus + '">' + order.orderStatus + '</span>' + '</td>'
            ).appendTo("#orders tbody");
        });
        if (!searchedAllOrders) {
            searchOrders(cb);
        } else {
            cb();
        }
    }).fail(function () {
        console.error('注文履歴を取得できませんでした')
    });
}