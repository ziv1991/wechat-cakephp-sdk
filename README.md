# wechat-cakephp-sdk
wechat-cakephp-sdk

在wechat-php-sdk上修改适配cakephp,
controller中有使用范例

项目地址：**https://github.com/dodgepudding/wechat-php-sdk**  

###更新
- Wechat.php中增加适配CakePHP的缓存配置,也可以根据实际情况在WechatCache中改为其他的缓存类
- 增加CakePHP使用范例
- 2014-12-25 增加卡券接口
- 2015-01-12 同步到最新版本,上传卡券logo的接口就是上传媒体文件的接口

在CakePHP中使用Wechat.php
-------
此用法不考虑多平台,每次需要获取商户信息

引入微信接口库文件

    App::uses('Wechat', 'Vendor');
    App::uses('WechatErrCode', 'Vendor');


初始化接口，需要先获取商户的appid和appsercet

        $wxObj  = new Wechat(array(
            'token'     => 'tokenaccesskey',
            'appid'     => 'wxdk1234567890',
            'appsecret' => 'xxxxxxxxxxxxxxxxxxx',
        ));
        //调用对应的函数
        $result = $wxObj->getMenu();
        //如果token失效，清除token重试一次
        if ($wxObj->errCode == 40001) {
            $wxObj->resetAuth();
            $result = $wxObj->getMenu();
        }
        //如果返回false，获取errcode和errmsg
        if (!$result) {
            return array(
                'errCode' => $wxObj->errCode,
                'errMsg'  => WechatErrCode::getErrText($wxObj->errCode),
            );
        }
        
在CakePHP中使用PtApi
-------
封装为PtApi,可以兼容多平台,如服务窗,封装获取平台配置的方法,增加token过期重试一次机制

        //得到scene_id和shop_id
        //...

        $this->loadModel('PtApi');
        $ret = PtApi::get('getQRCode', $shop_id, array(
                    'scene_id' => $scene_id,
                    'type'     => 1,
        ));

        if (!$ret['errCode']) {
            //处理错误
            //...
        } else {
            //保存二维码信息
            //...
        }
     
License
-------
This is licensed under the GNU LGPL, version 2.1 or later.   
For details, see: http://creativecommons.org/licenses/LGPL/2.1/