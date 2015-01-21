<?php

App::uses('Model', 'Model');

/**
 * 平台Api封装
 *
 * @author luke
 */
App::uses('Wechat', 'Vendor');
App::uses('WechatErrCode', 'Vendor');

App::uses('PtSetting', 'Model');

class PtApi extends Model {

    public $useTable = false;

    const PT_TYPE_WECHAT              = 1;
    const PT_TYPE_BAIDU               = 2;
    const ERR_MSG_PTSETTING_NOT_FOUND = '没有平台配置';
    const ERR_MSG_FUNCTION_NOT_FOUND  = '没有此平台方法';

    public static $functions = array(
        //基本接口
        'getServerIp',
        'getShortUrl',
        'uploadMedia',
        'getMedia',
        'uploadArticles',
        //高级群发
        'sendMassMessage',
        'sendGroupMassMessage',
        'deleteMassMessage',
        //粉丝信息
        'getUserList',
        'getUserInfo',
        'updateUserRemark',
        'getUserGroup',
        //分组操作
        'getGroup',
        'createGroup',
        'updateGroup',
        'updateGroupMembers',
        //发送消息
        'sendCustomMessage',
        'sendTemplateMessage',
        //多客服
        'getCustomServiceKFlist',
        'getCustomServiceOnlineKFlist',
        'getCustomServiceMessage',
        //语义理解
        'querySemantic',
        //二维码
        'getQRCode',
        'getQRUrl',
        //自定义菜单
        'createMenu',
        'getMenu',
        'deleteMenu',
        //支付
        'sendPayDeliverNotify'
        //卡券接口
    );

    static function get($function, $seller_config_id, $options = null) {

        if ($ptSettingData = self::getPtSettingById($seller_config_id)) {
            switch ($ptSettingData['type']) {
                case self::PT_TYPE_WECHAT:
                    if (!in_array($function, self::$functions)) {
                        return array(
                            'errCode' => -1,
                            'errMsg'  => self::ERR_MSG_FUNCTION_NOT_FOUND,
                            'result'  => '',
                        );
                    }
                    $wxObj  = new Wechat($ptSettingData['settings']);
                    $result = self::run($wxObj, $function, $options);
                    if ($wxObj->errCode == 40001 ||$wxObj->errCode == 42001) {
                        $wxObj->resetAuth();
                        $result = self::run($wxObj, $function, $options);
                    }
                    return array(
                        'errCode' => $wxObj->errCode,
                        'result'  => $result,
                        'errMsg'  => WechatErrCode::getErrText($wxObj->errCode),
                    );

                case self::PT_TYPE_BAIDU:
                //do nothing
            }
        }
        return array(
            'errCode' => -1,
            'errMsg'  => self::ERR_MSG_PTSETTING_NOT_FOUND,
            'result'  => '',
        );
    }

    static function run($wxObj, $function, $options) {
        if (is_null($options)) {
            $result = $wxObj->$function();
        } else {
            $result = $wxObj->$function($options);
        }
        return $result;
    }

    static function getPtSettingById($seller_config_id) {
        $pt            = new PtSetting;
        $ptSettingData = $pt->get($seller_config_id);
        if ($ptSettingData) {
            return $ptSettingData['PtSetting'];
        }
        return false;
    }

}
