
var event = JSON.parse($('#jsonViewer textarea').val());
var orders = [];
var searchedAllOrders = false;
var limit = 100;
var page = 0;
var remainingAttendeeCapacityChart;
var remainingAttendeeCapacityChart2;

$(function () {
    // 注文検索
    console.log('searching orders...', page);
    searchOrders(function () {
        console.log('creating line chart...');
        // 全座席数は
        var numberOfSeats = 999;
        if (Number.isInteger(event.maximumAttendeeCapacity)) {
            numberOfSeats = event.maximumAttendeeCapacity
        }
        // 売り出し日時は？
        var reservationStartDate = moment(event.startDate).add(-3, 'days').toDate();
        // var reservationPeriodInMinutes = moment(event.endDate).diff(moment(reservationStartDate), 'hours');
        var datas = orders.reduce(
            (a, b) => {
                numberOfSeats -= b.acceptedOffers.length;
                // 予約開始からの時間
                // const diff = moment(b.orderDate).diff(moment(reservationStartDate), 'hours', true);
                a.push({
                    x: moment(b.orderDate).toISOString(),
                    y: numberOfSeats,
                });

                return a;
            },
            [
                { x: moment(reservationStartDate).toISOString(), y: numberOfSeats },
                { x: moment(event.endDate).toISOString(), y: null }
            ],
        );
        createRemainingAttendeeCapacityChart(datas);
    });
});
function searchOrders(cb) {
    page += 1;
    $.getJSON(
        '/events/screeningEvent/' + event.id + '/orders',
        { limit: limit, page: page }
    ).done(function (data) {
        $('#orderCount').html(data.totalCount.toString());
        searchedAllOrders = (data.data.length < limit);
        $.each(data.data, function (_, order) {
            orders.push(order);
            $('<tr>').html(
                '<td>' + '<a target="_blank" href="/orders/' + order.orderNumber + '">' + order.orderNumber + '</a>' + '</td>'
                + '<td>' + moment(order.orderDate).format('lllZ') + '</td>'
                + '<td>' + order.acceptedOffers.map(function (o) {
                    if (o.itemOffered.reservedTicket !== undefined) {
                        return o.itemOffered.reservedTicket.ticketedSeat.seatNumber
                    }
                    return o.itemOffered.typeOf;
                }).join('<br>') + '</td>'
                + '<td>' + order.paymentMethods.map(function (paymentMethod) {
                    return '<span class="badge badge-secondary ' + paymentMethod.typeOf + '">' + paymentMethod.typeOf + '</span>';
                }).join('&nbsp;') + '</td>'
                + '<td>' + '<span class="badge badge-secondary  ' + order.orderStatus + '">' + order.orderStatus + '</span>' + '</td>'
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
function createRemainingAttendeeCapacityChart(datas) {
    console.log('creating chart...datas:', datas.length);
    remainingAttendeeCapacityChart2 = new Morris.Line({
        element: 'remainingAttendeeCapacityChart2',
        resize: true,
        data: datas.map(function (data) {
            return { y: data.x, remainingCapacity: data.y }
        }),
        xkey: 'y',
        ykeys: ['remainingCapacity'],
        labels: ['残席数遷移'],
        lineColors: ['#efefef'],
        lineWidth: 2,
        hideHover: 'auto',
        gridTextColor: '#fff',
        gridStrokeWidth: 0.4,
        pointSize: 4,
        pointStrokeColors: ['#efefef'],
        gridLineColor: '#efefef',
        gridTextFamily: 'Open Sans',
        gridTextSize: 10
    });
}
