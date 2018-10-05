var movieTheater = JSON.parse($('#jsonViewer textarea').val());
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
        '/organizations/movieTheater/' + movieTheater.id + '/orders',
        { limit: limit, page: page }
    ).done(function (data) {
        $('#orderCount').html(data.totalCount.toString());
        searchedAllOrders = (data.data.length < limit);
        $.each(data.data, function (key, order) {
            orders.push(order);
            $('<tr>').html(
                '<td>' + '<a target="_blank" href="/orders/' + order.orderNumber + '">' + order.orderNumber + '</a>' + '</td>'
                + '<td>' + order.orderDate + '</td>'
                + '<td>' + order.acceptedOffers.map((o) => o.itemOffered.reservedTicket.ticketedSeat.seatNumber).join(',') + '</td>'
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

$(function () {
    $('button.delete').click(function () {
        if (window.confirm('元には戻せません。本当に削除しますか？')) {
            $.ajax({
                url: '/organizations/movieTheater/<%= movieTheater.id %>',
                type: 'DELETE'
            }).done(function () {
                alert('削除しました');
                location.href = '/organizations/movieTheater';
            }).fail(function () {
                alert('削除できませんでした');
            }).always(function () {
            });
        } else {
        }
    });
});