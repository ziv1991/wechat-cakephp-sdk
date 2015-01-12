<?php

/**
 * 获取平台配置
 *
 * @author luke
 */

class PtSetting extends AppModel {

    public $name     = 'PtSetting';
    public $useTable = false;

    function store($options, $type = 0) {
        //通过next_api保存
        //...
        //通过数据库保存
//        if (is_array($options)) {
//            return $this->save(
//                            array(
//                                'settings' => json_encode($options),
//                                'type'     => $type,
//            ));
//        }
        return false;
    }

    function get($id) {
        //通过next_api获取
        //...
        //通过数据库获取
        $settings     = array();
        $shopInfo = ClassRegistry::init('ShopInfo');

        $dataShopInfo = $shopInfo->find('first', array('conditions' => array('shop_id' => $id)));
        if ($dataShopInfo) {
            $settings = array(
                'token'          => $dataShopInfo['ShopInfo']['wx_token'], //填写你设定的key
                'encodingaeskey' => '', //填写加密用的EncodingAESKey
                'appid'          => $dataShopInfo['ShopInfo']['wx_appid'], //填写高级调用功能的app id, 请在微信开发模式后台查询
                'appsecret'      => $dataShopInfo['ShopInfo']['wx_secret'], //填写高级调用功能的密钥
            );
        }
//        $dataPaymentSetting = PaymentSetting::find('first', array(
//                    'conditions' => array('PaymentSetting.seller_id' => $id), //条件数组
//        ));
//        if ($dataPaymentSetting) {
//            $settings['partnerid']  = $dataPaymentSetting['PaymentSetting']['partner_id'];
//            $settings['partnerkey'] = $dataPaymentSetting['PaymentSetting']['partner_key'];
//            $settings['paysignkey'] = $dataPaymentSetting['PaymentSetting']['pay_sign_key'];
//        }
        return array('PtSetting' => array(
                'id'       => $id,
                'settings' => $settings,
                'type'     => 1,
        ));
    }

}
