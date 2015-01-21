<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

class ApiController extends AppController {

    function index() {

    }

    function getJsSign() {
        if ($this->request->is('post')) {
            $url       = $this->request->data('url');
            $timestamp = $this->request->data('timestamp');
            $nonceStr  = $this->request->data('nonceStr');
            $appId     = 'yourappid';
            $wxObj     = new Wechat(array(
                'token'     => 'yourtoken',
                'appid'     => $appId,
                'appsecret' => 'yourpants',
            ));
            //调用对应的函数
            $sign    = $wxObj->getJsSign($url, $timestamp, $nonceStr);
            //如果token失效，清除token重试一次
            if ($wxObj->errCode == 40001 ||$wxObj->errCode == 42001 ) {
                $wxObj->resetAuth();
                $sign = $wxObj->getJsSign();
            }
            //如果返回false，获取errcode和errmsg
            if (!$sign) {
                return $this->sentJson(array(
                            'errCode' => $wxObj->errCode,
                            'errMsg'  => WechatErrCode::getErrText($wxObj->errCode),
                ));
            }
            $package = array(
                'signature' => $sign,
                'nonceStr'  => $nonceStr,
                'appId'     => $appId,
                'timestamp' => $timestamp,
            );
            return $this->sentJson(array(
                        'errCode' => 0,
                        'errMsg'  => '',
                        'result'  => $package,
            ));
        }
    }

}
