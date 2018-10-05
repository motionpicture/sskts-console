/*
 * ダッシュボードを表現するためのjs
 **/
var WAITER_ENDPOINT = $('input[name="waiterEndpoint"]').val();
var waiterDatasets = [];
var waiterRules = [];

var orders = [];
var searchedAllOrders = false;
var limit = 100;
var page = 0;
var numVisitorsChart;

$(function () {
    'use strict'

    // Make the dashboard widgets sortable Using jquery UI
    $('.connectedSortable').sortable({
        placeholder: 'sort-highlight',
        connectWith: '.connectedSortable',
        handle: '.card-header, .nav-tabs',
        forcePlaceholderSize: true,
        zIndex: 999999
    })
    $('.connectedSortable .card-header, .connectedSortable .nav-tabs-custom').css('cursor', 'move')

    // jQuery UI sortable for the todo list
    $('.todo-list').sortable({
        placeholder: 'sort-highlight',
        handle: '.handle',
        forcePlaceholderSize: true,
        zIndex: 999999
    })

    // bootstrap WYSIHTML5 - text editor
    $('.textarea').wysihtml5()

    $('#salesAmount .daterange').daterangepicker({
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        startDate: moment().subtract(29, 'days'),
        endDate: moment()
    }, function (start, end) {
        console.log('You chose: ' + start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'))
        searchSalesAmount(
            {
                measureFrom: start.toDate(),
                measureThrough: end.toDate()
            },
            createSalesAmountChart
        );
        searchSalesAmountByClient(
            {
                measureFrom: start.toDate(),
                measureThrough: end.toDate()
            },
            createSalesAmountByClientChart
        );
        searchSalesAmountByPaymentMethod(
            {
                measureFrom: start.toDate(),
                measureThrough: end.toDate()
            },
            createSalesAmountByPaymentMethodChart
        );
    });

    $('#numOrderItems .daterange').daterangepicker({
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        startDate: moment().subtract(29, 'days'),
        endDate: moment()
    }, function (start, end) {
        console.log('You chose: ' + start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'))
        searchNumOrderItems(
            {
                measureFrom: start.toDate(),
                measureThrough: end.toDate()
            },
            createNumOrderItemsChart
        );
        searchNumOrderItemsByClient(
            {
                measureFrom: start.toDate(),
                measureThrough: end.toDate()
            },
            createNumOrderItemsByClientChart
        );
        searchNumOrderItemsByPaymentMethod(
            {
                measureFrom: start.toDate(),
                measureThrough: end.toDate()
            },
            createNumOrderItemsByPaymentMethodChart
        );
    });

    $('#numPlaceOrder .daterange').daterangepicker({
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        startDate: moment().subtract(29, 'days'),
        endDate: moment()
    }, function (start, end) {
        console.log('You chose: ' + start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'))
        searchNumPlaceOrder(
            {
                measureFrom: start.toDate(),
                measureThrough: end.toDate()
            },
            createNumPlaceOrderChart
        );
    });

    // jvectormap data
    var visitorsData = {
        'US': 398, //USA
        'SA': 400, //Saudi Arabia
        'CA': 1000, //Canada
        'DE': 500, //Germany
        'FR': 760, //France
        'CN': 300, //China
        'AU': 700, //Australia
        'BR': 600, //Brazil
        'IN': 800, //India
        'GB': 320, //Great Britain
        'RU': 3000 //Russia
    }
    // World map by jvectormap
    // $('#world-map').vectorMap({
    //     map: 'world_mill_en',
    //     backgroundColor: 'transparent',
    //     regionStyle: {
    //         initial: {
    //             fill: 'rgba(255, 255, 255, 0.7)',
    //             'fill-opacity': 1,
    //             stroke: 'rgba(0,0,0,.2)',
    //             'stroke-width': 1,
    //             'stroke-opacity': 1
    //         }
    //     },
    //     series: {
    //         regions: [{
    //             values: visitorsData,
    //             scale: ['#ffffff', '#0154ad'],
    //             normalizeFunction: 'polynomial'
    //         }]
    //     },
    //     onRegionLabelShow: function (e, el, code) {
    //         if (typeof visitorsData[code] != 'undefined')
    //             el.html(el.html() + ': ' + visitorsData[code] + ' new visitors')
    //     }
    // })

    // Sparkline charts
    var myvalues = [1000, 1200, 920, 927, 931, 1027, 819, 930, 1021]
    $('#sparkline-1').sparkline(myvalues, {
        type: 'line',
        lineColor: '#92c1dc',
        fillColor: '#ebf4f9',
        height: '50',
        width: '80'
    })
    myvalues = [515, 519, 520, 522, 652, 810, 370, 627, 319, 630, 921]
    $('#sparkline-2').sparkline(myvalues, {
        type: 'line',
        lineColor: '#92c1dc',
        fillColor: '#ebf4f9',
        height: '50',
        width: '80'
    })
    myvalues = [15, 19, 20, 22, 33, 27, 31, 27, 19, 30, 21]
    $('#sparkline-3').sparkline(myvalues, {
        type: 'line',
        lineColor: '#92c1dc',
        fillColor: '#ebf4f9',
        height: '50',
        width: '80'
    })

    // The Calender
    $('#calendar').datepicker()

    // SLIMSCROLL FOR CHAT WIDGET
    // $('#chat-box').slimScroll({
    //     height: '250px'
    // })

    /* Morris.js Charts */
    // Sales chart
    // var area = new Morris.Area({
    //     element: 'revenue-chart',
    //     resize: true,
    //     data: [
    //         { y: '2011 Q1', item1: 2666, item2: 2666 },
    //         { y: '2011 Q2', item1: 2778, item2: 2294 },
    //         { y: '2011 Q3', item1: 4912, item2: 1969 },
    //         { y: '2011 Q4', item1: 3767, item2: 3597 },
    //         { y: '2012 Q1', item1: 6810, item2: 1914 },
    //         { y: '2012 Q2', item1: 5670, item2: 4293 },
    //         { y: '2012 Q3', item1: 4820, item2: 3795 },
    //         { y: '2012 Q4', item1: 15073, item2: 5967 },
    //         { y: '2013 Q1', item1: 10687, item2: 4460 },
    //         { y: '2013 Q2', item1: 8432, item2: 5713 }
    //     ],
    //     xkey: 'y',
    //     ykeys: ['item1', 'item2'],
    //     labels: ['Item 1', 'Item 2'],
    //     lineColors: ['#495057', '#007cff'],
    //     hideHover: 'auto'
    // })

    // Donut Chart
    // var donut = new Morris.Donut({
    //     element: 'sales-chart',
    //     resize: true,
    //     colors: ['#007bff', '#dc3545', '#28a745'],
    //     data: [
    //         { label: 'Download Sales', value: 12 },
    //         { label: 'In-Store Sales', value: 30 },
    //         { label: 'Mail-Order Sales', value: 20 }
    //     ],
    //     hideHover: 'auto'
    // })

    // Fix for charts under tabs
    $('.box ul.nav a').on('shown.bs.tab', function () {
        area.redraw()
        donut.redraw()
        // line.redraw()
    })

    /* jQueryKnob */
    $('#salesAmount .knob.byClient').knob();
    $('#salesAmount .knob.byPaymentMethod').knob();
    $('#numOrderItems .knob.byClient').knob();
    $('#numOrderItems .knob.byPaymentMethod').knob();

    countNewOrder(function () {
    });
    aggregateExitRate(function () {
    });
    countNewUser(function () {
    });
    countNewTransaction(function () {
    });
    // searchSalesAmount(
    //     {
    //         measureFrom: moment().subtract(29, 'days').toDate(),
    //         measureThrough: moment().toDate()
    //     },
    //     createSalesAmountChart
    // );
    // searchSalesAmountByClient(
    //     {
    //         measureFrom: moment().subtract(29, 'days').toDate(),
    //         measureThrough: moment().toDate()
    //     },
    //     createSalesAmountByClientChart
    // );
    // searchSalesAmountByPaymentMethod(
    //     {
    //         measureFrom: moment().subtract(29, 'days').toDate(),
    //         measureThrough: moment().toDate()
    //     },
    //     createSalesAmountByPaymentMethodChart
    // );
    // searchNumOrderItems(
    //     {
    //         measureFrom: moment().subtract(29, 'days').toDate(),
    //         measureThrough: moment().toDate()
    //     },
    //     createNumOrderItemsChart
    // );
    // searchNumOrderItemsByClient(
    //     {
    //         measureFrom: moment().subtract(29, 'days').toDate(),
    //         measureThrough: moment().toDate()
    //     },
    //     createNumOrderItemsByClientChart
    // );
    // searchNumOrderItemsByPaymentMethod(
    //     {
    //         measureFrom: moment().subtract(29, 'days').toDate(),
    //         measureThrough: moment().toDate()
    //     },
    //     createNumOrderItemsByPaymentMethodChart
    // );
    // searchNumPlaceOrder(
    //     {
    //         measureFrom: moment().subtract(29, 'days').toDate(),
    //         measureThrough: moment().toDate()
    //     },
    //     createNumPlaceOrderChart
    // );
    // searchLatestOrders(function () {
    // });

    $.getJSON(
        WAITER_ENDPOINT + '/rules',
        {}
    ).done(function (data) {
        waiterRules = data;
        startMonitoringWaiter();
    }).fail(function () {
    });
});
function searchSalesAmount(params, cb) {
    $('#salesAmount .overlay').show();
    $.getJSON(
        '/dashboard/telemetry/SalesAmount',
        {
            measureFrom: moment(params.measureFrom).toISOString(),
            measureThrough: moment(params.measureThrough).toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        alert('売上集計を取得できませんでした')
    }).always(function () {
        $('#salesAmount .overlay').hide();
    });
}
function searchSalesAmountByClient(params, cb) {
    $('#salesAmount .overlay').show();
    $.getJSON(
        '/dashboard/telemetry/SalesAmountByClient',
        {
            measureFrom: moment(params.measureFrom).toISOString(),
            measureThrough: moment(params.measureThrough).toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        alert('売上集計を取得できませんでした')
    }).always(function () {
        $('#salesAmount .overlay').hide();
    });
}
function searchSalesAmountByPaymentMethod(params, cb) {
    $('#salesAmount .overlay').show();
    $.getJSON(
        '/dashboard/telemetry/SalesAmountByPaymentMethod',
        {
            measureFrom: moment(params.measureFrom).toISOString(),
            measureThrough: moment(params.measureThrough).toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        alert('売上集計を取得できませんでした')
    }).always(function () {
        $('#salesAmount .overlay').hide();
    });
}
function searchNumOrderItems(params, cb) {
    $('#numOrderItems .overlay').show();
    $.getJSON(
        '/dashboard/telemetry/NumOrderItems',
        {
            measureFrom: moment(params.measureFrom).toISOString(),
            measureThrough: moment(params.measureThrough).toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        alert('注文アイテム数集計を取得できませんでした')
    }).always(function () {
        $('#numOrderItems .overlay').hide();
    });
}
function searchNumOrderItemsByClient(params, cb) {
    $('#numOrderItems .overlay').show();
    $.getJSON(
        '/dashboard/telemetry/NumOrderItemsByClient',
        {
            measureFrom: moment(params.measureFrom).toISOString(),
            measureThrough: moment(params.measureThrough).toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        alert('注文アイテム数集計を取得できませんでした')
    }).always(function () {
        $('#numOrderItems .overlay').hide();
    });
}
function searchNumOrderItemsByPaymentMethod(params, cb) {
    $('#numOrderItems .overlay').show();
    $.getJSON(
        '/dashboard/telemetry/NumOrderItemsByPaymentMethod',
        {
            measureFrom: moment(params.measureFrom).toISOString(),
            measureThrough: moment(params.measureThrough).toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        alert('注文アイテム数集計を取得できませんでした')
    }).always(function () {
        $('#numOrderItems .overlay').hide();
    });
}
function searchNumPlaceOrder(params, cb) {
    $('#numPlaceOrder .overlay').show();
    var dataStarted;
    var dataCanceled;
    var dataExpired;
    var dataConfirmed;
    var next = function () {
        if (dataStarted !== undefined
            && dataCanceled !== undefined
            && dataExpired !== undefined
            && dataConfirmed !== undefined
        ) {
            $('#numPlaceOrder .overlay').hide();
            cb(dataStarted, dataCanceled, dataExpired, dataConfirmed);
        }
    }

    $.getJSON(
        '/dashboard/telemetry/NumPlaceOrderStarted',
        {
            measureFrom: moment(params.measureFrom).toISOString(),
            measureThrough: moment(params.measureThrough).toISOString()
        }
    ).done(function (data) {
        dataStarted = data;
        next();
    }).fail(function () {
        alert('取引数を取得できませんでした')
    });

    $.getJSON(
        '/dashboard/telemetry/NumPlaceOrderCanceled',
        {
            measureFrom: moment(params.measureFrom).toISOString(),
            measureThrough: moment(params.measureThrough).toISOString()
        }
    ).done(function (data) {
        dataCanceled = data;
        next();
    }).fail(function () {
        alert('取引数を取得できませんでした')
    });

    $.getJSON(
        '/dashboard/telemetry/NumPlaceOrderExpired',
        {
            measureFrom: moment(params.measureFrom).toISOString(),
            measureThrough: moment(params.measureThrough).toISOString()
        }
    ).done(function (data) {
        dataExpired = data;
        next();
    }).fail(function () {
        alert('取引数を取得できませんでした')
    });

    $.getJSON(
        '/dashboard/telemetry/NumPlaceOrderConfirmed',
        {
            measureFrom: moment(params.measureFrom).toISOString(),
            measureThrough: moment(params.measureThrough).toISOString()
        }
    ).done(function (data) {
        dataConfirmed = data;
        next();
    }).fail(function () {
        alert('取引数を取得できませんでした')
    });
}
function searchOrders(cb) {
    page += 1;
    $.getJSON(
        '/dashboard/latestOrders',
        {
            limit: limit,
            page: page,
            orderDateFrom: moment().add(-1, 'month').toISOString(),
            orderDateThrough: moment().toISOString()
        }
    ).done(function (data) {
        $.each(data, function (_, order) {
            orders.push(order);
        });
        cb();
    }).fail(function () {
        alert('注文履歴を取得できませんでした')
    });
}
function createNumPlaceOrderChart(dataStarted, dataCanceled, dataExpired, dataConfirmed) {
    new Morris.Line({
        element: 'numPlaceOrderChart',
        resize: true,
        data: dataStarted.map(function (data, index) {
            return {
                y: moment(data.measureDate).toISOString(),
                started: data.value,
                canceled: dataCanceled[index].value,
                expired: dataExpired[index].value,
                confirmed: dataConfirmed[index].value
            }
        }),
        xkey: 'y',
        ykeys: ['started', 'canceled', 'expired', 'confirmed'],
        labels: ['started', 'canceled', 'expired', 'confirmed'],
        lineColors: ['#efefef', '#79f67d', '#e96c6c', '#79ccf5'],
        lineWidth: 2,
        hideHover: 'auto',
        gridTextColor: '#fff',
        gridStrokeWidth: 0.4,
        pointSize: 4,
        pointStrokeColors: ['#efefef', '#79f67d', '#e96c6c', '#79ccf5'],
        gridLineColor: '#efefef',
        gridTextFamily: 'Open Sans',
        gridTextSize: 10
    });
}
function createSalesAmountChart(datas) {
    console.log('creating salesAmountChart...datas:', datas.length);
    var line = new Morris.Line({
        element: 'salesAmountChart',
        resize: true,
        data: datas.map(function (data) {
            return { y: moment(data.measureDate).toISOString(), salesAmount: data.value }
        }),
        xkey: 'y',
        ykeys: ['salesAmount'],
        labels: ['売上金額'],
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
function createSalesAmountByClientChart(datas) {
    var salesAmountByClient = {};
    datas.forEach(function (data) {
        const value = data.value;
        Object.keys(value).forEach(function (clientId) {
            if (salesAmountByClient[clientId] === undefined) {
                salesAmountByClient[clientId] = 0;
            }
            salesAmountByClient[clientId] += value[clientId];
        });
    });

    var totalAmount = Object.keys(salesAmountByClient).reduce(
        function (a, b) {
            return a + salesAmountByClient[b];
        },
        0
    );
    $('#salesAmount input.knob.byClient').map(function () {
        var clientId = $(this).attr('data-clientId');
        var ratio = 0;
        if (salesAmountByClient[clientId] !== undefined) {
            ratio = (salesAmountByClient[clientId] / totalAmount * 100).toFixed(1);
        }
        $(this).val(ratio).trigger('change');
    });
}
function createSalesAmountByPaymentMethodChart(datas) {
    var salesAmountByPaymentMethod = {};
    datas.forEach(function (data) {
        const value = data.value;
        Object.keys(value).forEach(function (paymentMethod) {
            if (salesAmountByPaymentMethod[paymentMethod] === undefined) {
                salesAmountByPaymentMethod[paymentMethod] = 0;
            }
            salesAmountByPaymentMethod[paymentMethod] += value[paymentMethod];
        });
    });

    var totalAmount = Object.keys(salesAmountByPaymentMethod).reduce(
        function (a, b) {
            return a + salesAmountByPaymentMethod[b];
        },
        0
    );
    $('#salesAmount input.knob.byPaymentMethod').map(function () {
        var paymentMethod = $(this).attr('data-paymentMethod');
        var ratio = 0;
        if (salesAmountByPaymentMethod[paymentMethod] !== undefined) {
            ratio = (salesAmountByPaymentMethod[paymentMethod] / totalAmount * 100).toFixed(1);
        }
        $(this).val(ratio).trigger('change');
    });
}
function createNumOrderItemsChart(datas) {
    console.log('creating NumOrderItemsChart...datas:', datas.length);
    var line = new Morris.Line({
        element: 'numOrderItemsChart',
        resize: true,
        data: datas.map(function (data) {
            return { y: moment(data.measureDate).toISOString(), numOrderItems: data.value }
        }),
        xkey: 'y',
        ykeys: ['numOrderItems'],
        labels: ['注文アイテム数'],
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
function createNumOrderItemsByClientChart(datas) {
    var numOrderItemsByClient = {};
    datas.forEach(function (data) {
        const value = data.value;
        Object.keys(value).forEach(function (clientId) {
            if (numOrderItemsByClient[clientId] === undefined) {
                numOrderItemsByClient[clientId] = 0;
            }
            numOrderItemsByClient[clientId] += value[clientId];
        });
    });

    var totalNumOrderItems = Object.keys(numOrderItemsByClient).reduce(
        function (a, b) {
            return a + numOrderItemsByClient[b];
        },
        0
    );
    $('#numOrderItems input.knob.byClient').map(function () {
        var clientId = $(this).attr('data-clientId');
        var ratio = 0;
        if (numOrderItemsByClient[clientId] !== undefined) {
            ratio = (numOrderItemsByClient[clientId] / totalNumOrderItems * 100).toFixed(1);
        }
        $(this).val(ratio).trigger('change');
    });
}
function createNumOrderItemsByPaymentMethodChart(datas) {
    var numOrderItemsByPaymentMethod = {};
    datas.forEach(function (data) {
        const value = data.value;
        Object.keys(value).forEach(function (paymentMethod) {
            if (numOrderItemsByPaymentMethod[paymentMethod] === undefined) {
                numOrderItemsByPaymentMethod[paymentMethod] = 0;
            }
            numOrderItemsByPaymentMethod[paymentMethod] += value[paymentMethod];
        });
    });

    var totalNumOrderItems = Object.keys(numOrderItemsByPaymentMethod).reduce(
        function (a, b) {
            return a + numOrderItemsByPaymentMethod[b];
        },
        0
    );
    $('#numOrderItems input.knob.byPaymentMethod').map(function () {
        var paymentMethod = $(this).attr('data-paymentMethod');
        var ratio = 0;
        if (numOrderItemsByPaymentMethod[paymentMethod] !== undefined) {
            ratio = (numOrderItemsByPaymentMethod[paymentMethod] / totalNumOrderItems * 100).toFixed(1);
        }
        $(this).val(ratio).trigger('change');
    });
}
function searchLatestOrders(cb) {
    $.getJSON(
        '/dashboard/orders',
        {
            limit: 10,
            page: 1,
            sort: { orderDate: -1 },
            orderDateFrom: moment().add(-1, 'month').toISOString(),
            orderDateThrough: moment().toISOString()
        }
    ).done(function (data) {
        $.each(data.data, function (_, order) {
            orders.push(order);
            let badge = 'badge-info';
            switch (order.orderStatus) {
                case 'OrderDelivered':
                    badge = 'badge-danger';
                    break;
                default:
            }
            $('<tr>').html(
                '<td>' + '<a target="_blank" href="/orders/' + order.orderNumber + '">' + order.orderNumber + '</a>' + '</td>'
                + '<td>' + order.orderDate + '</td>'
                + '<td>' + order.acceptedOffers.map(function (o) { return o.itemOffered.reservedTicket.ticketedSeat.seatNumber }).join(',') + '</td>'
                + '<td>' + '<span class="badge ' + badge + '">' + order.orderStatus + '</span>' + '</td>'
            ).appendTo(".latestOrders tbody");
        });
        cb();
    }).fail(function () {
        alert('最近の注文を取得できませんでした')
    });
}
function countNewOrder(cb) {
    $.getJSON(
        '/dashboard/countNewOrder',
        {}
    ).done(function (data) {
        $('#newOrderCount').html(data.totalCount.toString());
        cb();
    }).fail(function () {
        alert('新規注文数を取得できませんでした')
    });
}
function aggregateExitRate(cb) {
    $.getJSON(
        '/dashboard/aggregateExitRate',
        {}
    ).done(function (data) {
        $('#exitRate').html(data.rate.toString() + '<sup style="font-size: 20px">%</sup>');
        cb();
    }).fail(function () {
        alert('離脱率を取得できませんでした')
    });
}
function countNewUser(cb) {
    $.getJSON(
        '/dashboard/countNewUser',
        {}
    ).done(function (data) {
        $('#newUserCount').html(data.totalCount.toString());
        cb();
    }).fail(function () {
        alert('新規ユーザー数を取得できませんでした')
    });
}
function countNewTransaction(cb) {
    $.getJSON(
        '/dashboard/countNewTransaction',
        {}
    ).done(function (data) {
        $('#newTransactionCount').html(data.totalCount.toString());
        cb();
    }).fail(function () {
        alert('新規取引数を取得できませんでした')
    });
}
function initializeVisitorsChart() {
    var colorChoices = ['#efefef', '#79f67d', '#e96c6c', '#79ccf5'];
    waiterDatasets = waiterRules.map(function (rule) {
        return {
            scope: rule.scope,
            data: [],
            numberOfIssuedPassports: 0,
        };
    });

    numVisitorsChart = new Morris.Line({
        element: 'visitorsChart',
        resize: true,
        data: [],
        xkey: 'y',
        ykeys: waiterRules.map(function (rule) {
            return rule.scope
        }),
        labels: waiterRules.map(function (rule) {
            return rule.scope
        }),
        lineColors: waiterRules.map(function (_, index) {
            return colorChoices[index % colorChoices.length];
        }),
        lineWidth: 2,
        hideHover: 'auto',
        gridTextColor: '#fff',
        gridStrokeWidth: 0.4,
        pointSize: 4,
        pointStrokeColors: waiterRules.map(function (_, index) {
            return colorChoices[index % colorChoices.length];
        }),
        gridLineColor: '#efefef',
        gridTextFamily: 'Open Sans',
        gridTextSize: 10
    });
}
function updateWaiterChart() {
    var datas = waiterDatasets[0].data.map(function (d, index) {
        var data = {
            y: moment(d.x).toISOString()
        };
        waiterRules.forEach(function (rule) {
            var dataset4scope = waiterDatasets.find(function (dataset) {
                return dataset.scope === rule.scope;
            });
            if (dataset4scope !== undefined) {
                data[rule.scope] = dataset4scope.data[index].y
            } else {
                data[rule.scope] = 0;
            }
        });

        return data;
    });
    numVisitorsChart.setData(datas);
}
function startMonitoringWaiter() {
    initializeVisitorsChart();

    var numberOfDatapoints = 30;
    setInterval(
        function () {
            const now = new Date();
            waiterDatasets.map(function (_, index) {
                // 時点での発行数データでチャートを更新
                waiterDatasets[index].data.push({
                    x: now,
                    y: waiterDatasets[index].numberOfIssuedPassports
                });
                waiterDatasets[index].data = waiterDatasets[index].data.slice(-numberOfDatapoints);
            });

            updateWaiterChart();
        },
        2000
    );

    setInterval(
        function () {
            waiterDatasets.map(function (dataset, index) {
                $.getJSON(
                    WAITER_ENDPOINT + '/passports/' + dataset.scope + '/currentIssueUnit',
                    {}
                ).done(function (data) {
                    // 時点での発行数データを追加
                    waiterDatasets[index].numberOfIssuedPassports = data.numberOfRequests;
                }).fail(function () {
                });
            });
        },
        2000
    );
}
