/*
 * ダッシュボードを表現するためのjs
 **/
var WAITER_ENDPOINT = $('input[name="waiterEndpoint"]').val();
var TELEMETRY_API_ENDPOINT = $('input[name="telemetryEndpoint"]').val();
var PROJECT_ID = $('input[name="projectId"]').val();
var waiterDatasets = [];
var waiterRules = [];

var orders = [];
var searchedAllOrders = false;
var limit = 100;
var page = 0;
var numVisitorsChart;

var initialChartStartDate = moment().subtract(29, 'days');
var initialChartEndDate = moment();

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
        startDate: initialChartStartDate,
        endDate: initialChartEndDate
    }, function (start, end) {
        console.log('You chose: ' + start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'))
        updateSalesAmountChart();
    });

    $('#numTransactions2salesAmount .daterange').daterangepicker({
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        startDate: initialChartStartDate,
        endDate: initialChartEndDate
    }, function (start, end) {
        console.log('You chose: ' + start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'))
        updateNumTransactions2salesAmountChart();
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
        startDate: initialChartStartDate,
        endDate: initialChartEndDate
    }, function (start, end) {
        console.log('You chose: ' + start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        updateNumOrderItemsChart();
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
        startDate: initialChartStartDate,
        endDate: initialChartEndDate
    }, function (start, end) {
        console.log('You chose: ' + start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'))
        searchNumPlaceOrder(
            createNumPlaceOrderChart
        );
    });

    // jvectormap data
    // var visitorsData = {
    //     'US': 398, //USA
    //     'SA': 400, //Saudi Arabia
    //     'CA': 1000, //Canada
    //     'DE': 500, //Germany
    //     'FR': 760, //France
    //     'CN': 300, //China
    //     'AU': 700, //Australia
    //     'BR': 600, //Brazil
    //     'IN': 800, //India
    //     'GB': 320, //Great Britain
    //     'RU': 3000 //Russia
    // }
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

    // Fix for charts under tabs
    $('.box ul.nav a').on('shown.bs.tab', function () {
        // area.redraw()
        // donut.redraw()
        // line.redraw()
    })

    /* jQueryKnob */
    $('#salesAmount .knob.byClient').knob();
    $('#salesAmount .knob.byPaymentMethod').knob();
    $('#salesAmount .knob.bySeller').knob();
    $('#numOrderItems .knob.byClient').knob();
    $('#numOrderItems .knob.byPaymentMethod').knob();
    $('#numOrderItems .knob.bySeller').knob();

    updateCharts();
    setInterval(
        function () {
            updateCharts();
        },
        60000
    );

    $.getJSON(
        WAITER_ENDPOINT + '/projects/' + PROJECT_ID + '/rules',
        {}
    ).done(function (data) {
        waiterRules = data;
        startMonitoringWaiter();
    }).fail(function () {
    });
});
function updateCharts() {
    countNewOrder(function () {
    });
    aggregateExitRate(function () {
    });
    countNewUser(function () {
    });
    countNewTransaction(function () {
    });
    updateSalesAmountChart();
    updateNumTransactions2salesAmountChart();
    updateNumOrderItemsChart();
    searchLatestOrders(function () {
    });
}
function updateSalesAmountChart() {
    searchSalesAmount(createSalesAmountChart);
    searchSalesAmountByClient(createSalesAmountByClientChart);
    searchSalesAmountByPaymentMethod(createSalesAmountByPaymentMethodChart);
    searchSalesAmountBySeller(createSalesAmountBySellerChart);
}
function updateNumTransactions2salesAmountChart() {
    searchNumStartedTransactionsByType(createSalesAmountNumTransactionsChart);
}
function updateNumOrderItemsChart() {
    searchNumOrderItems(createNumOrderItemsChart);
    searchNumOrderItemsByClient(createNumOrderItemsByClientChart);
    searchNumOrderItemsByPaymentMethod(createNumOrderItemsByPaymentMethodChart);
    searchNumOrderItemsBySeller(createNumOrderItemsBySellerChart);
    searchNumPlaceOrder(createNumPlaceOrderChart);
}
function searchSalesAmount(cb) {
    $('#salesAmount .overlay').show();
    $.getJSON(
        TELEMETRY_API_ENDPOINT + '/organizations/project/' + PROJECT_ID + '/telemetry/SalesAmount',
        // '/dashboard/telemetry/SalesAmount',
        {
            measureFrom: $('#salesAmount .daterange').data('daterangepicker').startDate.toISOString(),
            measureThrough: $('#salesAmount .daterange').data('daterangepicker').endDate.toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        console.error('売上集計を取得できませんでした')
    }).always(function () {
        $('#salesAmount .overlay').hide();
    });
}
function searchNumStartedTransactionsByType(cb) {
    $('#numTransactions2salesAmount .overlay').show();

    var datasSalesAmount;
    var datasNumStartedTransactions;
    var next = function () {
        if (datasSalesAmount !== undefined && datasNumStartedTransactions !== undefined) {
            cb(datasSalesAmount, datasNumStartedTransactions);
        }
    }

    $.getJSON(
        TELEMETRY_API_ENDPOINT + '/organizations/project/' + PROJECT_ID + '/telemetry/SalesAmount',
        // '/dashboard/telemetry/SalesAmount',
        {
            measureFrom: $('#numTransactions2salesAmount .daterange').data('daterangepicker').startDate.toISOString(),
            measureThrough: $('#numTransactions2salesAmount .daterange').data('daterangepicker').endDate.toISOString()
        }
    ).done(function (data) {
        datasSalesAmount = data;
        next();
    }).fail(function () {
        console.error('売上集計を取得できませんでした')
    }).always(function () {
        $('#numTransactions2salesAmount .overlay').hide();
    });

    $.getJSON(
        TELEMETRY_API_ENDPOINT + '/organizations/project/' + PROJECT_ID + '/telemetry/NumStartedTransactionsByType',
        // '/dashboard/telemetry/SalesAmount',
        {
            measureFrom: $('#numTransactions2salesAmount .daterange').data('daterangepicker').startDate.toISOString(),
            measureThrough: $('#numTransactions2salesAmount .daterange').data('daterangepicker').endDate.toISOString()
        }
    ).done(function (data) {
        datasNumStartedTransactions = data;
        next();
    }).fail(function () {
        console.error('取引タイプごとの開始取引数を取得できませんでした')
    }).always(function () {
        $('#numTransactions2salesAmount .overlay').hide();
    });
}
function searchSalesAmountByClient(cb) {
    $('#salesAmount .overlay').show();
    $.getJSON(
        TELEMETRY_API_ENDPOINT + '/organizations/project/' + PROJECT_ID + '/telemetry/SalesAmountByClient',
        // '/dashboard/telemetry/SalesAmountByClient',
        {
            measureFrom: $('#salesAmount .daterange').data('daterangepicker').startDate.toISOString(),
            measureThrough: $('#salesAmount .daterange').data('daterangepicker').endDate.toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        console.error('売上集計を取得できませんでした')
    }).always(function () {
        $('#salesAmount .overlay').hide();
    });
}
function searchSalesAmountByPaymentMethod(cb) {
    $('#salesAmount .overlay').show();
    $.getJSON(
        TELEMETRY_API_ENDPOINT + '/organizations/project/' + PROJECT_ID + '/telemetry/SalesAmountByPaymentMethod',
        // '/dashboard/telemetry/SalesAmountByPaymentMethod',
        {
            measureFrom: $('#salesAmount .daterange').data('daterangepicker').startDate.toISOString(),
            measureThrough: $('#salesAmount .daterange').data('daterangepicker').endDate.toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        console.error('売上集計を取得できませんでした')
    }).always(function () {
        $('#salesAmount .overlay').hide();
    });
}
function searchSalesAmountBySeller(cb) {
    $('#salesAmount .overlay').show();
    $.getJSON(
        TELEMETRY_API_ENDPOINT + '/organizations/project/' + PROJECT_ID + '/telemetry/SalesAmountBySeller',
        // '/dashboard/telemetry/SalesAmountBySeller',
        {
            measureFrom: $('#salesAmount .daterange').data('daterangepicker').startDate.toISOString(),
            measureThrough: $('#salesAmount .daterange').data('daterangepicker').endDate.toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        console.error('売上集計を取得できませんでした')
    }).always(function () {
        $('#salesAmount .overlay').hide();
    });
}
function searchNumOrderItems(cb) {
    $('#numOrderItems .overlay').show();
    $.getJSON(
        TELEMETRY_API_ENDPOINT + '/organizations/project/' + PROJECT_ID + '/telemetry/NumOrderItems',
        // '/dashboard/telemetry/NumOrderItems',
        {
            measureFrom: $('#numOrderItems .daterange').data('daterangepicker').startDate.toISOString(),
            measureThrough: $('#numOrderItems .daterange').data('daterangepicker').endDate.toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        console.error('注文アイテム数集計を取得できませんでした')
    }).always(function () {
        $('#numOrderItems .overlay').hide();
    });
}
function searchNumOrderItemsByClient(cb) {
    $('#numOrderItems .overlay').show();
    $.getJSON(
        TELEMETRY_API_ENDPOINT + '/organizations/project/' + PROJECT_ID + '/telemetry/NumOrderItemsByClient',
        // '/dashboard/telemetry/NumOrderItemsByClient',
        {
            measureFrom: $('#numOrderItems .daterange').data('daterangepicker').startDate.toISOString(),
            measureThrough: $('#numOrderItems .daterange').data('daterangepicker').endDate.toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        console.error('注文アイテム数集計を取得できませんでした')
    }).always(function () {
        $('#numOrderItems .overlay').hide();
    });
}
function searchNumOrderItemsByPaymentMethod(cb) {
    $('#numOrderItems .overlay').show();
    $.getJSON(
        TELEMETRY_API_ENDPOINT + '/organizations/project/' + PROJECT_ID + '/telemetry/NumOrderItemsByPaymentMethod',
        // '/dashboard/telemetry/NumOrderItemsByPaymentMethod',
        {
            measureFrom: $('#numOrderItems .daterange').data('daterangepicker').startDate.toISOString(),
            measureThrough: $('#numOrderItems .daterange').data('daterangepicker').endDate.toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        console.error('注文アイテム数集計を取得できませんでした')
    }).always(function () {
        $('#numOrderItems .overlay').hide();
    });
}
function searchNumOrderItemsBySeller(cb) {
    $('#numOrderItems .overlay').show();
    $.getJSON(
        TELEMETRY_API_ENDPOINT + '/organizations/project/' + PROJECT_ID + '/telemetry/NumOrderItemsBySeller',
        // '/dashboard/telemetry/NumOrderItemsBySeller',
        {
            measureFrom: $('#numOrderItems .daterange').data('daterangepicker').startDate.toISOString(),
            measureThrough: $('#numOrderItems .daterange').data('daterangepicker').endDate.toISOString()
        }
    ).done(function (data) {
        cb(data);
    }).fail(function () {
        console.error('注文アイテム数集計を取得できませんでした')
    }).always(function () {
        $('#numOrderItems .overlay').hide();
    });
}
function searchNumPlaceOrder(cb) {
    $('#numPlaceOrder .overlay').show();
    $.getJSON(
        TELEMETRY_API_ENDPOINT + '/organizations/project/' + PROJECT_ID + '/telemetry/NumPlaceOrderByStatus',
        // '/dashboard/telemetry/NumPlaceOrderByStatus',
        {
            measureFrom: $('#numPlaceOrder .daterange').data('daterangepicker').startDate.toISOString(),
            measureThrough: $('#numPlaceOrder .daterange').data('daterangepicker').endDate.toISOString()
        }
    ).done(function (data) {
        cb(data);
        $('#numPlaceOrder .overlay').hide();
    }).fail(function () {
        console.error('取引数を取得できませんでした')
    });
}
function searchOrders(cb) {
    page += 1;
    $.getJSON(
        '/dashboard/orders',
        {
            limit: limit,
            page: page,
            orderDateFrom: moment().add(-1, 'month').toISOString(),
            orderDateThrough: moment().toISOString()
        }
    ).done(function (data) {
        searchedAllOrders = (data.data.length < limit);
        $.each(data.data, function (_, order) {
            orders.push(order);
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
function createNumPlaceOrderChart(datas) {
    var statuses = ['Canceled', 'Expired', 'Confirmed'];

    new Morris.Line({
        element: 'numPlaceOrderChart',
        resize: true,
        data: datas.map(function (data) {
            var data4chart = { y: moment(data.measureDate).toISOString() };
            statuses.forEach(function (status) {
                data4chart[status] = (data.value[status] !== undefined) ? data.value[status] : 0
            });

            return data4chart;
        }),
        xkey: 'y',
        ykeys: statuses,
        labels: statuses,
        lineColors: ['#fad684', '#e96c6c', '#79f67d'],
        // lineColors: ['#ffc107', '#dc3545', '#28a745'],
        lineWidth: 2,
        hideHover: 'auto',
        gridTextColor: '#fff',
        gridStrokeWidth: 0.4,
        pointSize: 0,
        pointStrokeColors: ['#fad684', '#e96c6c', '#79f67d'],
        gridLineColor: '#efefef',
        gridTextFamily: 'Open Sans',
        gridTextSize: 10,
        smooth: false
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
        labels: ['売上高'],
        lineColors: ['#efefef'],
        lineWidth: 2,
        hideHover: 'auto',
        gridTextColor: '#fff',
        gridStrokeWidth: 0.4,
        pointSize: 0,
        pointStrokeColors: ['#efefef'],
        gridLineColor: '#efefef',
        gridTextFamily: 'Open Sans',
        gridTextSize: 10,
        smooth: false
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
        if (salesAmountByClient[clientId] !== undefined && totalAmount > 0) {
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
        if (salesAmountByPaymentMethod[paymentMethod] !== undefined && totalAmount > 0) {
            ratio = (salesAmountByPaymentMethod[paymentMethod] / totalAmount * 100).toFixed(1);
        }
        $(this).val(ratio).trigger('change');
    });
}
function createSalesAmountBySellerChart(datas) {
    var salesAmountBySeller = {};
    datas.forEach(function (data) {
        const value = data.value;
        Object.keys(value).forEach(function (sellerId) {
            if (salesAmountBySeller[sellerId] === undefined) {
                salesAmountBySeller[sellerId] = 0;
            }
            salesAmountBySeller[sellerId] += value[sellerId];
        });
    });

    var totalAmount = Object.keys(salesAmountBySeller).reduce(
        function (a, b) {
            return a + salesAmountBySeller[b];
        },
        0
    );
    $('#salesAmount input.knob.bySeller').map(function () {
        var sellerId = $(this).attr('data-sellerId');
        var ratio = 0;
        if (salesAmountBySeller[sellerId] !== undefined && totalAmount > 0) {
            ratio = (salesAmountBySeller[sellerId] / totalAmount * 100).toFixed(1);
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
        pointSize: 0,
        pointStrokeColors: ['#efefef'],
        gridLineColor: '#efefef',
        gridTextFamily: 'Open Sans',
        gridTextSize: 10,
        smooth: false
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
        if (numOrderItemsByClient[clientId] !== undefined && totalNumOrderItems > 0) {
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
        if (numOrderItemsByPaymentMethod[paymentMethod] !== undefined && totalNumOrderItems > 0) {
            ratio = (numOrderItemsByPaymentMethod[paymentMethod] / totalNumOrderItems * 100).toFixed(1);
        }
        $(this).val(ratio).trigger('change');
    });
}
function createNumOrderItemsBySellerChart(datas) {
    var numOrderItemsBySeller = {};
    datas.forEach(function (data) {
        const value = data.value;
        Object.keys(value).forEach(function (sellerId) {
            if (numOrderItemsBySeller[sellerId] === undefined) {
                numOrderItemsBySeller[sellerId] = 0;
            }
            numOrderItemsBySeller[sellerId] += value[sellerId];
        });
    });

    var totalNumOrderItems = Object.keys(numOrderItemsBySeller).reduce(
        function (a, b) {
            return a + numOrderItemsBySeller[b];
        },
        0
    );
    $('#numOrderItems input.knob.bySeller').map(function () {
        var sellerId = $(this).attr('data-sellerId');
        var ratio = 0;
        if (numOrderItemsBySeller[sellerId] !== undefined && totalNumOrderItems > 0) {
            ratio = (numOrderItemsBySeller[sellerId] / totalNumOrderItems * 100).toFixed(1);
        }
        $(this).val(ratio).trigger('change');
    });
}
function createSalesAmountNumTransactionsChart(datasSalesAmount, datasNumStartedTransactionsByType) {
    console.log('creating SalesAmountNumTransactionsChart...', datasSalesAmount.length, datasNumStartedTransactionsByType.length);
    // 売上散布チャート
    var chartDate = datasSalesAmount.map(function (dataSalesAmount) {
        var dataNumStartedTransactions = datasNumStartedTransactionsByType.find(function (data) {
            return data.measureDate === dataSalesAmount.measureDate;
        });
        var x = (dataNumStartedTransactions !== undefined)
            ? (dataNumStartedTransactions.value.PlaceOrder !== undefined) ? dataNumStartedTransactions.value.PlaceOrder : 0
            : 0;

        return {
            x: x,
            y: dataSalesAmount.value
        };
    });

    new Chart($('#numTransactions2salesAmountChart'), {
        type: 'scatter',
        data: {
            // labels: ['12時間前', '9時間前', '6時間前', '3時間前', '0時間前'],
            datasets: [
                {
                    data: chartDate,
                    backgroundColor: 'transparent',
                    borderColor: '#DAA8F5',
                    borderWidth: 1,
                    pointRadius: 2,
                    pointBorderColor: '#DAA8F5',
                    pointBackgroundColor: '#DAA8F5',
                    fill: false
                },
            ]
        },
        options: {
            pointDot: true,
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    display: true,
                    gridLines: {
                        display: true,
                        lineWidth: 1,
                        color: '#555c62',
                        zeroLineColor: '#555c62',
                    },
                    ticks: {
                        beginAtZero: true,
                        fontColor: '#a1a6a9'
                    }
                }],
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    // type: 'time',
                    // time: {
                    //     unit: 'hour',
                    //     stepSize: 1
                    // },
                    display: true,
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        fontColor: '#a1a6a9'
                    }
                }]
            }
        }
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
        $('.latestOrders tbody').html('');
        orders = data.data;
        $.each(data.data, function (_, order) {
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
            ).appendTo(".latestOrders tbody");
        });
        cb();
    }).fail(function () {
        console.error('最近の注文を取得できませんでした')
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
        console.error('新規注文数を取得できませんでした')
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
        console.error('離脱率を取得できませんでした')
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
        console.error('新規ユーザー数を取得できませんでした')
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
        console.error('新規取引数を取得できませんでした')
    });
}
function initializeVisitorsChart() {
    var colorChoices = ['#daa8f5', '#3399FF', '#fad684', '#79f67d', '#79ccf5', '#e96c6c', '#efefef'];
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
        pointSize: 0,
        pointStrokeColors: waiterRules.map(function (_, index) {
            return colorChoices[index % colorChoices.length];
        }),
        gridLineColor: '#efefef',
        gridTextFamily: 'Open Sans',
        gridTextSize: 10,
        smooth: false
    });
}
function updateWaiterChart() {
    numVisitorsChart.setData(waiterDatasets[0].data.map(function (d, index) {
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
    }));
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
                    WAITER_ENDPOINT + '/projects/' + PROJECT_ID + '/passports/' + dataset.scope + '/currentIssueUnit',
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
