
var order = JSON.parse($('#jsonViewer textarea').val());

$(function () {
    console.log('order:', order);

    // 配送メール送信
    $('button.sendEmailMessage').click(function () {
        var button = $(this);
        var message = '注文番号: ' + order.orderNumber
            + '\nの配送メールを送信しようとしています。'
            + '\nよろしいですか？';
        if (window.confirm(message)) {
            button.addClass('disabled');
            $.ajax({
                url: '/orders/' + order.orderNumber + '/sendEmailMessage',
                type: 'POST',
                dataType: 'json'
                // data: $('form').serialize()
            }).done(function (data) {
                alert('メールを送信しました');
                console.log(data);
            }).fail(function (xhr) {
                var res = $.parseJSON(xhr.responseText);
                alert('メールを送信できませんでした\n' + res.error.message);
            }).always(function () {
                button.removeClass('disabled');
            });
        } else {
        }
    });

    // 返品
    $('button.returnOrder').click(function () {
        var button = $(this);
        var message = '注文番号: ' + order.orderNumber
            + '\nの返品処理を開始しようとしています。'
            + '\nよろしいですか？';
        if (window.confirm(message)) {
            button.addClass('disabled');
            $.ajax({
                url: '/orders/' + order.orderNumber + '/return',
                type: 'POST'
                // dataType: 'json'
                // data: $('form').serialize()
            }).done(function () {
                alert('返品処理を開始しました');
                location.reload();
            }).fail(function (xhr) {
                var res = $.parseJSON(xhr.responseText);
                alert('返品処理を開始できませんでした\n' + res.error.message);
            }).always(function () {
                button.removeClass('disabled');
            });
        } else {
        }
    });
});
