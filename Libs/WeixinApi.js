/**!
 * 微信内置浏览器的Javascript API，功能包括：
 *
 * 1、分享到微信朋友圈
 * 2、分享给微信好友
 * 3、分享到腾讯微博
 * 4、隐藏/显示右上角的菜单入口
 * 5、隐藏/显示底部浏览器工具栏
 * 6、获取当前的网络状态
 * 7、调起微信客户端的图片播放组件
 * 8、关闭公众平台Web页面
 * 9、判断当前网页是否在微信内置浏览器中打开
 * 10、支持WeixinApi的错误监控
 * 11、发送电子邮件
 * 12、禁止用户分享
 *
 * @author zhaoxianlie(http://www.baidufe.com)
 * @modifier lukechen
 */
(function(window) {

    "use strict";

    /**
     * 定义WeixinApi
     */
    var WeixinApi = {
        version: 4.3
    };

    // 将WeixinApi暴露到window下：全局可使用，对旧版本向下兼容
    window.WeixinApi = WeixinApi;

    /////////////////////////// CommonJS /////////////////////////////////
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        if (define.amd) {
            // AMD 规范，for：requirejs
            define(function() {
                return WeixinApi;
            });
        } else if (define.cmd) {
            // CMD 规范，for：seajs
            define(function(require, exports, module) {
                module.exports = WeixinApi;
            });
        }
    }

    /**
     * 对象简单继承，后面的覆盖前面的，继承深度：deep=1
     * @private
     */
    var _extend = function() {
        var result = {},
                obj, k;
        for (var i = 0, len = arguments.length; i < len; i++) {
            obj = arguments[i];
            if (typeof obj === 'object') {
                for (k in obj) {
                    obj[k] && (result[k] = obj[k]);
                }
            }
        }
        return result;
    };

    /**
     * 内部私有方法，分享用
     * @private
     */
    var _share = function(cmd, data, callbacks) {
        callbacks = callbacks || {};

        // 分享过程中的一些回调
        var progress = function(resp) {
            switch (true) {
                // 用户取消
                case (/\:cancel$/i).test(resp.err_msg):
                    callbacks.cancel && callbacks.cancel(resp);
                    break;
                    // 发送成功
                case (/\:(confirm|ok)$/i).test(resp.err_msg):
                    callbacks.confirm && callbacks.confirm(resp);
                    break;
                    // fail　发送失败
                case (/\:fail$/i).test(resp.err_msg):
                default:
                    callbacks.fail && callbacks.fail(resp);
                    break;
            }
            // 无论成功失败都会执行的回调
            callbacks.all && callbacks.all(resp);
        };

        // 执行分享，并处理结果
        var handler = function(theData, argv) {

            // 加工一下数据
            if (cmd.menu == 'menu:share:timeline' ||
                    (cmd.menu == 'general:share' && argv.shareTo == 'timeline')) {

                var title = theData.title;
                theData.title = theData.desc || title;
                theData.desc = title || theData.desc;
            }

            // 如果是收藏操作，并且在wxCallbacks中配置了favorite为false，则不执行回调
            if (argv && (argv.shareTo == 'favorite' || argv.scene == 'favorite')) {
                if (callbacks.favorite === false) {
                    WeixinJSBridge.invoke('sendAppMessage', theData, new Function());
                } else {
                    WeixinJSBridge.invoke(cmd.action, theData, progress);
                }
            } else {
                // 新的分享接口，单独处理
                if (cmd.menu === 'general:share') {
                    if (argv.shareTo === 'timeline') {
                        WeixinJSBridge.invoke('shareTimeline', theData, progress);
                    } else if (argv.shareTo === 'friend') {
                        WeixinJSBridge.invoke('sendAppMessage', theData, progress);
                    } else if (argv.shareTo === 'QQ') {
                        WeixinJSBridge.invoke('shareQQ', theData, progress);
                    } else if (argv.shareTo === 'weibo') {
                        WeixinJSBridge.invoke('shareWeibo', theData, progress);
                    }
                } else {
                    WeixinJSBridge.invoke(cmd.action, theData, progress);
                }
            }
        };

        // 监听分享操作
        WeixinJSBridge.on(cmd.menu, function(argv) {
            callbacks.dataLoaded = callbacks.dataLoaded || new Function();
            if (callbacks.async && callbacks.ready) {
                WeixinApi["_wx_loadedCb_"] = callbacks.dataLoaded;
                if (WeixinApi["_wx_loadedCb_"].toString().indexOf("_wx_loadedCb_") > 0) {
                    WeixinApi["_wx_loadedCb_"] = new Function();
                }
                callbacks.dataLoaded = function(newData) {
                    callbacks.__cbkCalled = true;
                    var theData = _extend(data, newData);
                    theData.img_url = theData.imgUrl || theData.img_url;
                    delete theData.imgUrl;
                    WeixinApi["_wx_loadedCb_"](theData);
                    handler(theData, argv);
                };
                // 然后就绪
                if (!(argv && (argv.shareTo == 'favorite' || argv.scene == 'favorite') && callbacks.favorite === false)) {
                    callbacks.ready && callbacks.ready(argv, data);
                    // 如果设置了async为true，但是在ready方法中并没有手动调用dataLoaded方法，则自动触发一次
                    if (!callbacks.__cbkCalled) {
                        callbacks.dataLoaded({});
                        callbacks.__cbkCalled = false;
                    }
                }
            } else {
                // 就绪状态
                var theData = _extend(data);
                if (!(argv && (argv.shareTo == 'favorite' || argv.scene == 'favorite') && callbacks.favorite === false)) {
                    callbacks.ready && callbacks.ready(argv, theData);
                }
                handler(theData, argv);
            }
        });
    }

    /**
     * 分享到微信朋友圈
     * @param       {Object}    data       待分享的信息
     * @p-config    {String}    appId      公众平台的appId（服务号可用）
     * @p-config    {String}    imgUrl     图片地址
     * @p-config    {String}    link       链接地址
     * @p-config    {String}    desc       描述
     * @p-config    {String}    title      分享的标题
     *
     * @param       {Object}    callbacks  相关回调方法
     * @p-config    {Boolean}   async                   ready方法是否需要异步执行，默认false
     * @p-config    {Function}  ready(argv, data)       就绪状态
     * @p-config    {Function}  dataLoaded(data)        数据加载完成后调用，async为true时有用，也可以为空
     * @p-config    {Function}  cancel(resp)    取消
     * @p-config    {Function}  fail(resp)      失败
     * @p-config    {Function}  confirm(resp)   成功
     * @p-config    {Function}  all(resp)       无论成功失败都会执行的回调
     */
    WeixinApi.shareToTimeline = function(data, callbacks) {
        _share({
            menu: 'menu:share:timeline',
            action: 'shareTimeline'
        }, {
            "appid": data.appId ? data.appId : '',
            "img_url": data.imgUrl,
            "link": data.link,
            "desc": data.desc,
            "title": data.title,
            "img_width": "640",
            "img_height": "640"
        }, callbacks);
    };

    /**
     * 发送给微信上的好友
     * @param       {Object}    data       待分享的信息
     * @p-config    {String}    appId      公众平台的appId（服务号可用）
     * @p-config    {String}    imgUrl     图片地址
     * @p-config    {String}    link       链接地址
     * @p-config    {String}    desc       描述
     * @p-config    {String}    title      分享的标题
     *
     * @param       {Object}    callbacks  相关回调方法
     * @p-config    {Boolean}   async                   ready方法是否需要异步执行，默认false
     * @p-config    {Function}  ready(argv, data)       就绪状态
     * @p-config    {Function}  dataLoaded(data)        数据加载完成后调用，async为true时有用，也可以为空
     * @p-config    {Function}  cancel(resp)    取消
     * @p-config    {Function}  fail(resp)      失败
     * @p-config    {Function}  confirm(resp)   成功
     * @p-config    {Function}  all(resp)       无论成功失败都会执行的回调
     */
    WeixinApi.shareToFriend = function(data, callbacks) {
        _share({
            menu: 'menu:share:appmessage',
            action: 'sendAppMessage'
        }, {
            "appid": data.appId ? data.appId : '',
            "img_url": data.imgUrl,
            "link": data.link,
            "desc": data.desc,
            "title": data.title,
            "img_width": "640",
            "img_height": "640"
        }, callbacks);
    };

    /**
     * 分享到腾讯微博
     * @param       {Object}    data       待分享的信息
     * @p-config    {String}    link       链接地址
     * @p-config    {String}    desc       描述
     *
     * @param       {Object}    callbacks  相关回调方法
     * @p-config    {Boolean}   async                   ready方法是否需要异步执行，默认false
     * @p-config    {Function}  ready(argv, data)       就绪状态
     * @p-config    {Function}  dataLoaded(data)        数据加载完成后调用，async为true时有用，也可以为空
     * @p-config    {Function}  cancel(resp)    取消
     * @p-config    {Function}  fail(resp)      失败
     * @p-config    {Function}  confirm(resp)   成功
     * @p-config    {Function}  all(resp)       无论成功失败都会执行的回调
     */
    WeixinApi.shareToWeibo = function(data, callbacks) {
        _share({
            menu: 'menu:share:weibo',
            action: 'shareWeibo'
        }, {
            "content": data.desc,
            "url": data.link
        }, callbacks);
    };

    /**
     * 新的分享接口
     * @param       {Object}    data       待分享的信息
     * @p-config    {String}    appId      公众平台的appId（服务号可用）
     * @p-config    {String}    imgUrl     图片地址
     * @p-config    {String}    link       链接地址
     * @p-config    {String}    desc       描述
     * @p-config    {String}    title      分享的标题
     *
     * @param       {Object}    callbacks  相关回调方法
     * @p-config    {Boolean}   async                   ready方法是否需要异步执行，默认false
     * @p-config    {Function}  ready(argv, data)       就绪状态
     * @p-config    {Function}  dataLoaded(data)        数据加载完成后调用，async为true时有用，也可以为空
     * @p-config    {Function}  cancel(resp)    取消
     * @p-config    {Function}  fail(resp)      失败
     * @p-config    {Function}  confirm(resp)   成功
     * @p-config    {Function}  all(resp)       无论成功失败都会执行的回调
     */
    WeixinApi.generalShare = function(data, callbacks) {
        _share({
            menu: 'general:share'
        }, {
            "appid": data.appId ? data.appId : '',
            "img_url": data.imgUrl,
            "link": data.link,
            "desc": data.desc,
            "title": data.title,
            "img_width": "640",
            "img_height": "640"
        }, callbacks);
    };

    /**
     * 设置页面禁止分享：包括朋友圈、好友、腾讯微博、qq
     * @param callback
     */
    WeixinApi.disabledShare = function(callback) {
        callback = callback || function() {
            alert('当前页面禁止分享！');
        };
        ['menu:share:timeline', 'menu:share:appmessage', 'menu:share:qq',
            'menu:share:weibo', 'general:share'
        ].forEach(function(menu) {
            WeixinJSBridge.on(menu, function() {
                callback();
                return false;
            });
        });
    };

    WeixinApi.isOldVersion = function() {
        var a = navigator.userAgent.toLowerCase().match(/micromessenger\/(\d+\.\d+\.\d+)/) ||
                navigator.userAgent.toLowerCase().match(/micromessenger\/(\d+\.\d+)/);
        var y = a ? a[1] : "";
        return "6.0.2" > y;
    };
    /**
     * 使用微信内置地图查看位置接口。
     *
     * @param callback
     */
    WeixinApi.openLocation = function(lat, lng, scale) {
        if (!lat || !lng) {
            return;
        }
        var scale = scale ? scale : 13;
        if (!WeixinApi.isOldVersion()) {
            wx.openLocation({
                latitude: lat, // 纬度，浮点数，范围为90 ~ -90
                longitude: lng, // 经度，浮点数，范围为180 ~ -180。
                name: '', // 位置名
                address: '', // 地址详情说明
                scale: scale, // 地图缩放级别,整形值,范围从1~28。默认为最大
                infoUrl: '' // 在查看位置界面底部显示的超链接,可点击跳转
            });
        } else {
            return;
        }
    };
    /**
     * 获取地理位置接口。
     *
     * @param callback
     */
    WeixinApi.getLocation = function(callback) {
        if (callback && typeof callback == 'function') {
            if (!WeixinApi.isOldVersion()) {
                wx.getLocation({
                    timestamp: 0, // 位置签名时间戳，仅当需要兼容6.0.2版本之前时提供
                    nonceStr: '', // 位置签名随机串，仅当需要兼容6.0.2版本之前时提供
                    addrSign: '', // 位置签名，仅当需要兼容6.0.2版本之前时提供，详见附录4
                    success: function(res) {
                        callback({
                            latitude: res.latitude, // 纬度，浮点数，范围为90 ~ -90
                            longitude: res.longitude, // 经度，浮点数，范围为180 ~ -180。
                            speed: res.speed, // 速度，以米/每秒计
                            accuracy: res.accuracy // 位置精度
                        });
                    }
                });
            } else {
                return;
            }
        }
    };
    /**
     * 调起微信扫一扫接口。
     *
     * @param callback
     */
    WeixinApi.scanQRCode = function(callback) {
        if (callback && typeof callback == 'function') {
            if (!WeixinApi.isOldVersion()) {
                wx.scanQRCode({
                    desc: 'scanQRCode desc',
                    needResult: 0, // 默认为0，扫描结果由微信处理，1则直接返回扫描结果，
                    scanType: ["qrCode", "barCode"], // 可以指定扫二维码还是一维码，默认二者都有
                    success: function(res) {
                        callback(res.resultStr); // 当needResult 为 1 时，扫码返回的结果
                    }
                });
            } else {
                return;
            }
        }
    };
    /**
     * 拍照或从手机相册中选图接口。
     *
     * @param callback
     */
    WeixinApi.chooseImage = function(callback) {
        if (callback && typeof callback == 'function') {
            if (!WeixinApi.isOldVersion()) {
                wx.chooseImage({
                    success: function(res) {
                        callback(res.localIds); // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
                    }
                });
            } else {
                return;
            }
        }
    };
    /**
     * 调起微信Native的图片播放组件。
     * 这里必须对参数进行强检测，如果参数不合法，直接会导致微信客户端crash
     *
     * @param {String} curSrc 当前播放的图片地址
     * @param {Array} srcList 图片地址列表
     */
    WeixinApi.imagePreview = function(curSrc, srcList) {
        if (!curSrc || !srcList || srcList.length == 0) {
            return;
        }
        if (!WeixinApi.isOldVersion()) {
            wx.previewImage({
                current: curSrc, // 当前显示的图片链接
                urls: srcList // 需要预览的图片链接列表
            });
        } else {
            WeixinJSBridge.invoke('imagePreview', {
                'current': curSrc,
                'urls': srcList
            });
        }
    };

    /**
     * 显示网页右上角的按钮
     */
    WeixinApi.showOptionMenu = function() {
        if (!WeixinApi.isOldVersion()) {
            wx.showOptionMenu();
        } else {
            WeixinJSBridge.call('showOptionMenu');
        }

    };


    /**
     * 隐藏网页右上角的按钮
     */
    WeixinApi.hideOptionMenu = function() {
        if (!WeixinApi.isOldVersion()) {
            wx.hideOptionMenu();
        } else {
            WeixinJSBridge.call('hideOptionMenu');
        }
    };

    /**
     * 显示底部工具栏
     */
    WeixinApi.showToolbar = function() {
        if (!WeixinApi.isOldVersion()) {
            wx.showAllNonBaseMenuItem();
        } else {
            WeixinJSBridge.call('showToolbar');
        }
    };

    /**
     * 隐藏底部工具栏
     */
    WeixinApi.hideToolbar = function() {
        if (!WeixinApi.isOldVersion()) {
            wx.hideAllNonBaseMenuItem();
        } else {
            WeixinJSBridge.call('hideToolbar');
        }
    };

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
    WeixinApi.getNetworkType = function(callback) {
        if (callback && typeof callback == 'function') {
            if (!WeixinApi.isOldVersion()) {
                wx.getNetworkType({
                    success: function(res) {
                        callback(res.networkType); // 返回网络类型2g，3g，4g，wifi
                    }
                });
            } else {
                WeixinJSBridge.invoke('getNetworkType', {}, function(e) {
                    // 在这里拿到e.err_msg，这里面就包含了所有的网络类型
                    callback(e.err_msg);
                });
            }
        }
    };

    /**
     * 关闭当前微信公众平台页面
     * @param       {Object}    callbacks       回调方法
     * @p-config    {Function}  fail(resp)      失败
     * @p-config    {Function}  success(resp)   成功
     */
    WeixinApi.closeWindow = function(callbacks) {
        callbacks = callbacks || {};
        if (!WeixinApi.isOldVersion()) {
            wx.closeWindow();
        } else {
            WeixinJSBridge.invoke("closeWindow", {}, function(resp) {
                switch (resp.err_msg) {
                    // 关闭成功
                    case 'close_window:ok':
                        callbacks.success && callbacks.success(resp);
                        break;

                        // 关闭失败
                    default:
                        callbacks.fail && callbacks.fail(resp);
                        break;
                }
            });
        }
    };

    /**
     * 当页面加载完毕后执行，使用方法：
     * WeixinApi.ready(function(Api){
     *     // 从这里只用Api即是WeixinApi
     * });
     * @param readyCallback
     */
    WeixinApi.ready = function(readyCallback) {

        /**
         * 加一个钩子，同时解决Android和iOS下的分享问题
         * @private
         */
        var _hook = function() {
            var _WeixinJSBridge = {};
            Object.keys(WeixinJSBridge).forEach(function(key) {
                _WeixinJSBridge[key] = WeixinJSBridge[key];
            });
            Object.keys(WeixinJSBridge).forEach(function(key) {
                if (typeof WeixinJSBridge[key] === 'function') {
                    WeixinJSBridge[key] = function() {
                        try {
                            var args = arguments.length > 0 ? arguments[0] : {},
                                    runOn3rd_apis = args.__params ? args.__params.__runOn3rd_apis || [] : [];
                            ['menu:share:timeline', 'menu:share:appmessage', 'menu:share:weibo',
                                'menu:share:qq', 'general:share'
                            ].forEach(function(menu) {
                                runOn3rd_apis.indexOf(menu) === -1 && runOn3rd_apis.push(menu);
                            });
                        } catch (e) {
                        }
                        return _WeixinJSBridge[key].apply(WeixinJSBridge, arguments);
                    };
                }
            });
        };

        if (readyCallback && typeof readyCallback == 'function') {
            var Api = this;
            var wxReadyFunc = function() {
                _hook();
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
    };

    /**
     * 判断当前网页是否在微信内置浏览器中打开
     */
    WeixinApi.openInWeixin = function() {
        return /MicroMessenger/i.test(navigator.userAgent);
    };

    /**
     * 发送邮件
     * @param       {Object}  data      邮件初始内容
     * @p-config    {String}  subject   邮件标题
     * @p-config    {String}  body      邮件正文
     *
     * @param       {Object}    callbacks       相关回调方法
     * @p-config    {Function}  fail(resp)      失败
     * @p-config    {Function}  success(resp)   成功
     * @p-config    {Function}  all(resp)       无论成功失败都会执行的回调
     */
    WeixinApi.sendEmail = function(data, callbacks) {
        callbacks = callbacks || {};
        WeixinJSBridge.invoke("sendEmail", {
            "title": data.subject,
            "content": data.body
        }, function(resp) {
            if (resp.err_msg === 'send_email:sent') {
                callbacks.success && callbacks.success(resp);
            } else {
                callbacks.fail && callbacks.fail(resp);
            }
            callbacks.all && callbacks.all(resp);
        })
    };

    /**
     * 开启Api的debug模式，比如出了个什么错误，能alert告诉你，而不是一直很苦逼的在想哪儿出问题了
     * @param    {Function}  callback(error) 出错后的回调，默认是alert
     */
    WeixinApi.enableDebugMode = function(callback) {
        /**
         * @param {String}  errorMessage   错误信息
         * @param {String}  scriptURI      出错的文件
         * @param {Long}    lineNumber     出错代码的行号
         * @param {Long}    columnNumber   出错代码的列号
         */
        window.onerror = function(errorMessage, scriptURI, lineNumber, columnNumber) {

            // 有callback的情况下，将错误信息传递到options.callback中
            if (typeof callback === 'function') {
                callback({
                    message: errorMessage,
                    script: scriptURI,
                    line: lineNumber,
                    column: columnNumber
                });
            } else {
                // 其他情况，都以alert方式直接提示错误信息
                var msgs = [];
                msgs.push("额，代码有错。。。");
                msgs.push("\n错误信息：", errorMessage);
                msgs.push("\n出错文件：", scriptURI);
                msgs.push("\n出错位置：", lineNumber + '行，' + columnNumber + '列');
                alert(msgs.join(''));
            }
        };
    };

    /**
     * 通用分享，一种简便的写法
     * @param wxData
     * @param wxCallbacks
     */
    WeixinApi.share = function(wxData, wxCallbacks) {
        WeixinApi.ready(function(Api) {
            // 用户点开右上角popup菜单后，点击分享给好友，会执行下面这个代码
//            if (!WeixinApi.isOldVersion()) {
//                wx.onMenuShareTimeline({
//                    title: wxData.title, // 分享标题
//                    link: wxData.link, // 分享链接
//                    imgUrl: wxData.imgUrl, // 分享图标
//                    success: function() {
//                        // 用户确认分享后执行的回调函数
//                        wxCallbacks.confirm();
//                    },
//                    cancel: function() {
//                        // 用户取消分享后执行的回调函数
//                        wxCallbacks.cancel();
//                    }
//                });
//                wx.onMenuShareAppMessage({
//                    title: wxData.title, // 分享标题
//                    link: wxData.link, // 分享链接
//                    imgUrl: wxData.imgUrl, // 分享图标
//                    success: function() {
//                        // 用户确认分享后执行的回调函数
//                        wxCallbacks.confirm();
//                    },
//                    cancel: function() {
//                        // 用户取消分享后执行的回调函数
//                        wxCallbacks.cancel();
//                    }
//                });
//                wx.onMenuShareWeibo({
//                    title: wxData.title, // 分享标题
//                    link: wxData.link, // 分享链接
//                    imgUrl: wxData.imgUrl, // 分享图标
//                    success: function() {
//                        // 用户确认分享后执行的回调函数
//                        wxCallbacks.confirm();
//                    },
//                    cancel: function() {
//                        // 用户取消分享后执行的回调函数
//                        wxCallbacks.cancel();
//                    }
//                });
//            } else {

                Api.shareToFriend(wxData, wxCallbacks);

                // 点击分享到朋友圈，会执行下面这个代码
                Api.shareToTimeline(wxData, wxCallbacks);

                // 点击分享到腾讯微博，会执行下面这个代码
                Api.shareToWeibo(wxData, wxCallbacks);

                // 分享到各渠道
                Api.generalShare(wxData, wxCallbacks);
//            }
        });
    };
})(window);