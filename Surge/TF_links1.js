// ==UserScript==
// @name         TF Link Parser for Surge
// @namespace    https://github.com/DecoAri/
// @version      1.1
// @description  解析 TestFlight 公开测试链接，兼容更多数据格式
// @match        https://testflight.apple.com/v2/accounts/*/apps/*/builds/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    let responseBody = $response.body;
    try {
        let obj = JSON.parse(responseBody);
        // 多层校验数据结构，避免 undefined 报错
        if (obj && obj.data && obj.data.builds && obj.data.builds.length > 0) {
            let tfLink = obj.data.builds[0].installURL; 
            if (tfLink) {
                // 直接注入链接到响应体（可根据需求调整展示位置）
                let newBody = JSON.stringify({...obj, customLink: tfLink});
                $done({body: newBody});
            } else {
                $done({body: responseBody});
            }
        } else {
            $done({body: responseBody});
        }
    } catch (e) {
        console.log('TF 链接解析异常:', e);
        $done({body: responseBody});
    }
})();
