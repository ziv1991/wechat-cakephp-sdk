/**
 * 微信JS-SDK是微信公众平台面向网页开发者提供的基于微信内的网页开发工具包。
 *
 * 本扩展在WeixinApi上做的封装
 *
 * @author lukechen(https://github.com/CheerChen)
 */
var WeixinApi2 = (function() {

    "use strict";

    get_sign_url = '/shanghu/getJsSign';
    jsApiList = [
        'onMenuShareTimeline',
        'onMenuShareAppMessage',
        'onMenuShareQQ',
        'onMenuShareWeibo',
    ];

    function getNonceStr(len) {
        var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var maxPos = $chars.length;
        var noceStr = "";
        for (i = 0; i < len; i++) {
            noceStr += $chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return noceStr;
    }
    /**
     * 分享到微信朋友圈
     * @param       {Object}    data       待分享的信息
     * @p-config    {String}    appId      公众平台的appId（服务号可用）
     * @p-config    {String}    imageUrl   图片地址
     * @p-config    {String}    link       链接地址
     * @p-config    {String}    desc       描述
     * @p-config    {String}    title      分享的标题
     *
     * @param       {Object}    callbacks  相关回调方法
     * @p-config    {Boolean}   async                   ready方法是否需要异步执行，默认false
     * @p-config    {Function}  ready(argv)             就绪状态
     * @p-config    {Function}  dataLoaded(data)        数据加载完成后调用，async为true时有用，也可以为空
     * @p-config    {Function}  cancel(resp)    取消
     * @p-config    {Function}  fail(resp)      失败
     * @p-config    {Function}  confirm(resp)   成功
     * @p-config    {Function}  all(resp)       无论成功失败都会执行的回调
     */
    function weixinShareTimeline(data, callbacks) {

        oldVersionFlag = false;
        if (!(typeof(wx) === 'undefined') && data.appId) {
            wx.ready(function() {
                url=window.location.href;
                timestamp = parseInt(Date.now() / 1000);
                nonceStr = getNonceStr(16);
                $.post(get_sign_url, [appid: data.appId, url: url, timestamp: timestamp, nonceStr: nonceStr]).done(function(postData) {
                    wx.config({
                        debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                        appId: postData.appId, // 必填，公众号的唯一标识
                        timestamp: postData.timestamp, // 必填，生成签名的时间戳
                        nonceStr: postData.nonceStr, // 必填，生成签名的随机串
                        signature: postData.signature, // 必填，签名，见附录1
                        jsApiList: jsApiList // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                    });
                });
            });
            wx.checkJsApi({
                jsApiList: jsApiList // 需要检测的JS接口列表，所有JS接口列表见附录2,
                success: function(res) {
                    // 以键值对的形式返回，可用的api值true，不可用为false
                    // 如：{"checkResult":{"chooseImage":true},"errMsg":"checkJsApi:ok"}
                    if (res.checkResult.onMenuShareTimeline) {
                        wx.onMenuShareTimeline({
                            title: data.title, // 分享标题
                            link: data.link, // 分享链接
                            imgUrl: data.imgUrl, // 分享图标
                            success: function() {
                                // 用户确认分享后执行的回调函数
                                callbacks.confirm(resp)
                            },
                            cancel: function() {
                                // 用户取消分享后执行的回调函数
                                callbacks.cancel(resp)
                            }
                        });
                    } else {
                        oldVersionFlag = true;
                    }
                }
            });
        } else {
            oldVersionFlag = true;
        }

        if (oldVersionFlag) {
            callbacks = callbacks || {};
            var shareTimeline = function(theData) {
                WeixinJSBridge.invoke('shareTimeline', {
                    "appid": theData.appId ? theData.appId : '',
                    "img_url": theData.imgUrl,
                    "link": theData.link,
                    "desc": theData.title,
                    "title": theData.desc, // 注意这里要分享出去的内容是desc
                    "img_width": "120",
                    "img_height": "120"
                }, function(resp) {
                    switch (resp.err_msg) {
                        // share_timeline:cancel 用户取消
                        case 'share_timeline:cancel':
                            callbacks.cancel && callbacks.cancel(resp);
                            break;
                            // share_timeline:fail　发送失败
                        case 'share_timeline:fail':
                            callbacks.fail && callbacks.fail(resp);
                            break;
                            // share_timeline:confirm 发送成功
                        case 'share_timeline:confirm':
                        case 'share_timeline:ok':
                            callbacks.confirm && callbacks.confirm(resp);
                            break;
                    }
                    // 无论成功失败都会执行的回调
                    callbacks.all && callbacks.all(resp);
                });
            };
            WeixinJSBridge.on('menu:share:timeline', function(argv) {
                if (callbacks.async && callbacks.ready) {
                    window["_wx_loadedCb_"] = callbacks.dataLoaded || new Function();
                    if (window["_wx_loadedCb_"].toString().indexOf("_wx_loadedCb_") > 0) {
                        window["_wx_loadedCb_"] = new Function();
                    }
                    callbacks.dataLoaded = function(newData) {
                        window["_wx_loadedCb_"](newData);
                        shareTimeline(newData);
                    };
                    // 然后就绪
                    callbacks.ready && callbacks.ready(argv);
                } else {
                    // 就绪状态
                    callbacks.ready && callbacks.ready(argv);
                    shareTimeline(data);
                }
            });
        }
    }

    /**
     * 发送给微信上的好友
     * @param       {Object}    data       待分享的信息
     * @p-config    {String}    appId      公众平台的appId（服务号可用）
     * @p-config    {String}    imageUrl   图片地址
     * @p-config    {String}    link       链接地址
     * @p-config    {String}    desc       描述
     * @p-config    {String}    title      分享的标题
     *
     * @param       {Object}    callbacks  相关回调方法
     * @p-config    {Boolean}   async                   ready方法是否需要异步执行，默认false
     * @p-config    {Function}  ready(argv)             就绪状态
     * @p-config    {Function}  dataLoaded(data)        数据加载完成后调用，async为true时有用，也可以为空
     * @p-config    {Function}  cancel(resp)    取消
     * @p-config    {Function}  fail(resp)      失败
     * @p-config    {Function}  confirm(resp)   成功
     * @p-config    {Function}  all(resp)       无论成功失败都会执行的回调
     */
    function weixinSendAppMessage(data, callbacks) {
        callbacks = callbacks || {};
        var sendAppMessage = function(theData) {
            WeixinJSBridge.invoke('sendAppMessage', {
                "appid": theData.appId ? theData.appId : '',
                "img_url": theData.imgUrl,
                "link": theData.link,
                "desc": theData.desc,
                "title": theData.title,
                "img_width": "120",
                "img_height": "120"
            }, function(resp) {
                switch (resp.err_msg) {
                    // send_app_msg:cancel 用户取消
                    case 'send_app_msg:cancel':
                        callbacks.cancel && callbacks.cancel(resp);
                        break;
                        // send_app_msg:fail　发送失败
                    case 'send_app_msg:fail':
                        callbacks.fail && callbacks.fail(resp);
                        break;
                        // send_app_msg:confirm 发送成功
                    case 'send_app_msg:confirm':
                    case 'send_app_msg:ok':
                        callbacks.confirm && callbacks.confirm(resp);
                        break;
                }
                // 无论成功失败都会执行的回调
                callbacks.all && callbacks.all(resp);
            });
        };
        WeixinJSBridge.on('menu:share:appmessage', function(argv) {
            if (callbacks.async && callbacks.ready) {
                window["_wx_loadedCb_"] = callbacks.dataLoaded || new Function();
                if (window["_wx_loadedCb_"].toString().indexOf("_wx_loadedCb_") > 0) {
                    window["_wx_loadedCb_"] = new Function();
                }
                callbacks.dataLoaded = function(newData) {
                    window["_wx_loadedCb_"](newData);
                    sendAppMessage(newData);
                };
                // 然后就绪
                callbacks.ready && callbacks.ready(argv);
            } else {
                // 就绪状态
                callbacks.ready && callbacks.ready(argv);
                sendAppMessage(data);
            }
        });
    }

    /**
     * 分享到腾讯微博
     * @param       {Object}    data       待分享的信息
     * @p-config    {String}    link       链接地址
     * @p-config    {String}    desc       描述
     *
     * @param       {Object}    callbacks  相关回调方法
     * @p-config    {Boolean}   async                   ready方法是否需要异步执行，默认false
     * @p-config    {Function}  ready(argv)             就绪状态
     * @p-config    {Function}  dataLoaded(data)        数据加载完成后调用，async为true时有用，也可以为空
     * @p-config    {Function}  cancel(resp)    取消
     * @p-config    {Function}  fail(resp)      失败
     * @p-config    {Function}  confirm(resp)   成功
     * @p-config    {Function}  all(resp)       无论成功失败都会执行的回调
     */
    function weixinShareWeibo(data, callbacks) {
        callbacks = callbacks || {};
        var shareWeibo = function(theData) {
            WeixinJSBridge.invoke('shareWeibo', {
                "content": theData.desc,
                "url": theData.link
            }, function(resp) {
                switch (resp.err_msg) {
                    // share_weibo:cancel 用户取消
                    case 'share_weibo:cancel':
                        callbacks.cancel && callbacks.cancel(resp);
                        break;
                        // share_weibo:fail　发送失败
                    case 'share_weibo:fail':
                        callbacks.fail && callbacks.fail(resp);
                        break;
                        // share_weibo:confirm 发送成功
                    case 'share_weibo:confirm':
                    case 'share_weibo:ok':
                        callbacks.confirm && callbacks.confirm(resp);
                        break;
                }
                // 无论成功失败都会执行的回调
                callbacks.all && callbacks.all(resp);
            });
        };
        WeixinJSBridge.on('menu:share:weibo', function(argv) {
            if (callbacks.async && callbacks.ready) {
                window["_wx_loadedCb_"] = callbacks.dataLoaded || new Function();
                if (window["_wx_loadedCb_"].toString().indexOf("_wx_loadedCb_") > 0) {
                    window["_wx_loadedCb_"] = new Function();
                }
                callbacks.dataLoaded = function(newData) {
                    window["_wx_loadedCb_"](newData);
                    shareWeibo(newData);
                };
                // 然后就绪
                callbacks.ready && callbacks.ready(argv);
            } else {
                // 就绪状态
                callbacks.ready && callbacks.ready(argv);
                shareWeibo(data);
            }
        });
    }

    /**
     * 调起微信Native的图片播放组件。
     * 这里必须对参数进行强检测，如果参数不合法，直接会导致微信客户端crash
     *
     * @param {String} curSrc 当前播放的图片地址
     * @param {Array} srcList 图片地址列表
     */
    function imagePreview(curSrc, srcList) {
        if (!curSrc || !srcList || srcList.length == 0) {
            return;
        }
        WeixinJSBridge.invoke('imagePreview', {
            'current': curSrc,
            'urls': srcList
        });
    }

    /**
     * 显示网页右上角的按钮
     */
    function showOptionMenu() {
        WeixinJSBridge.call('showOptionMenu');
    }


    /**
     * 隐藏网页右上角的按钮
     */
    function hideOptionMenu() {
        WeixinJSBridge.call('hideOptionMenu');
    }

    /**
     * 显示底部工具栏
     */
    function showToolbar() {
        WeixinJSBridge.call('showToolbar');
    }

    /**
     * 隐藏底部工具栏
     */
    function hideToolbar() {
        WeixinJSBridge.call('hideToolbar');
    }

    /**
     * 返回如下几种类型：
     *
     * network_type:wifi     wifi网络
     * network_type:edge     非wifi,包含3G/2G
     * network_type:fail     网络断开连接
     * network_type:wwan     2g或者3g
     *
     * 使用方法：
     * WeixinApi.getNetworkType(function(networkType){
     *
     * });
     *
     * @param callback
     */
    function getNetworkType(callback) {
        if (callback && typeof callback == 'function') {
            WeixinJSBridge.invoke('getNetworkType', {}, function(e) {
                // 在这里拿到e.err_msg，这里面就包含了所有的网络类型
                callback(e.err_msg);
            });
        }
    }

    /**
     * 关闭当前微信公众平台页面
     */
    function closeWindow() {
        WeixinJSBridge.call("closeWindow");
    }

    /**
     * 当页面加载完毕后执行，使用方法：
     * WeixinApi.ready(function(Api){
     *     // 从这里只用Api即是WeixinApi
     * });
     * @param readyCallback
     */
    function wxJsBridgeReady(readyCallback) {
        if (readyCallback && typeof readyCallback == 'function') {
            var Api = this;
            var wxReadyFunc = function() {
                readyCallback(Api);
            };
            if (typeof window.WeixinJSBridge == "undefined") {
                if (document.addEventListener) {
                    document.addEventListener('WeixinJSBridgeReady', wxReadyFunc, false);
                } else if (document.attachEvent) {
                    document.attachEvent('WeixinJSBridgeReady', wxReadyFunc);
                    document.attachEvent('onWeixinJSBridgeReady', wxReadyFunc);
                }
            } else {
                wxReadyFunc();
            }
        }
    }

    return {
        version: "1.8",
        ready: wxJsBridgeReady,
        shareToTimeline: weixinShareTimeline,
        shareToWeibo: weixinShareWeibo,
        shareToFriend: weixinSendAppMessage,
        showOptionMenu: showOptionMenu,
        hideOptionMenu: hideOptionMenu,
        showToolbar: showToolbar,
        hideToolbar: hideToolbar,
        getNetworkType: getNetworkType,
        imagePreview: imagePreview,
        closeWindow: closeWindow
    };
})();