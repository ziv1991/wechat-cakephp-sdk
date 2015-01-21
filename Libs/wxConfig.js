/**!
 * 微信内置浏览器的Javascript API配置js：
 *
 * @author lukechen(https://github.com/cheerchen)
 */
function getNonceStr(len) {
    var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var maxPos = $chars.length;
    var noceStr = "";
    for (i = 0; i < len; i++) {
        noceStr += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return noceStr;
}

get_sign_url = '/home/Api/getJsSign';

jsApiList = [
    'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'startRecord', 'stopRecord', 'onVoiceRecordEnd', 'playVoice', 'pauseVoice', 'stopVoice', 'onVoicePlayEnd', 'uploadVoice', 'downloadVoice', 'chooseImage', 'previewImage', 'uploadImage', 'downloadImage', 'translateVoice', 'getNetworkType', 'openLocation', 'getLocation', 'hideOptionMenu', 'showOptionMenu', 'hideMenuItems', 'showMenuItems', 'hideAllNonBaseMenuItem', 'showAllNonBaseMenuItem', 'closeWindow', 'scanQRCode', 'chooseWXPay', 'openProductSpecificView', 'addCard', 'chooseCard', 'openCard',
];
url = window.location.href;
timestamp = parseInt(Date.now() / 1000);
nonceStr = getNonceStr(16);
$.ajax({
    type: "post",
    url: get_sign_url,
    dataType: 'json',
    data: {
        url: url,
        timestamp: timestamp,
        nonceStr: nonceStr
    },
    success: function(postData) {
        if (!postData.errCode) {
            wx.config({
                debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                appId: postData.result.appId, // 必填，公众号的唯一标识
                timestamp: postData.result.timestamp, // 必填，生成签名的时间戳
                nonceStr: postData.result.nonceStr, // 必填，生成签名的随机串
                signature: postData.result.signature, // 必填，签名，见附录1
                jsApiList: jsApiList // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
            });
        } else {
            alert(postData.errMsg);
        }
    },
    error: function() {
        alert("网络超时，请重试！");
    }
});