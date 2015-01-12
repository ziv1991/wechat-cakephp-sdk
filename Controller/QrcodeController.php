<?php

class QrcodeController extends AppController {

    function makeQrcode() {

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
    }

}
