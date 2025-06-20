!(async () => {
let ids = $persistentStore.read('APP_ID')
if (!ids) {
  $persistentStore.write('dDtSst46', 'APP_ID')
  ids = 'dDtSst46'
}
if (ids == '') {
  $notification.post('所有TF已加入完毕','模块已自动关闭','')
  $done($httpAPI('POST', '/v1/modules', {'Auto module for JavaScripts': 'false'}))
} else {
  ids = ids.split(',')
  for await (const ID of ids) {
    await autoPost(ID)
  }
}
$done()
})();

function autoPost(ID) {
  let Key = $persistentStore.read('key')
  let testurl = 'https://testflight.apple.com/v3/accounts/' + Key + '/ru/'
  let header = {
    'X-Session-Id': `${$persistentStore.read('session_id')}`,
    'X-Session-Digest': `${$persistentStore.read('session_digest')}`,
    'X-Request-Id': `${$persistentStore.read('request_id')}`,
    'X-Apple-AMD-X': `${$persistentStore.read('X-Apple-AMD-X')}`,
    'User-Agent': `${$persistentStore.read('TFUA')}`
  }
  return new Promise(function(resolve) {
    $httpClient.get({url: testurl + ID,headers: header}, function(error, resp, data) {
      if (error === null) {
        if (resp.status == 404) {
          ids = $persistentStore.read('APP_ID').split(',')
          ids = ids.filter(ids => ids !== ID)
          $persistentStore.write(ids.toString(),'APP_ID')
          console.log(ID + ' ' + '不存在该TF，已自动删除该APP_ID')
          $notification.post(ID, '不存在该TF', '已自动删除该APP_ID')
          resolve()
        } else {
          try {
            let jsonData = JSON.parse(data)
            if (jsonData.data == null) {
              console.log(ID + ': ' + jsonData.messages[0].message)
              resolve();
            } else if (jsonData.data.status == 'FULL') {
              var name = jsonData.data.app.name
              console.log(name + ' (' + ID + '): ' + jsonData.data.message)
              resolve();
            } else {
              $httpClient.post({url: testurl + ID + '/accept',headers: header}, function(error, resp, body) {
                let appName = JSON.parse(body).data.name
                $notification.post('🎉' + appName, 'TestFlight加入成功', '')
                console.log('🎉' + appName + '🎉' + ' (' + ID + '): ' + ' TestFlight加入成功')
                ids = $persistentStore.read('APP_ID').split(',')
                ids = ids.filter(ids => ids !== ID)
                $persistentStore.write(ids.toString(),'APP_ID')
                resolve()
              });
            }
          } catch (e) {
            console.log(ID + ': 返回内容不是JSON，内容为：' + data)
            // 自动尝试从当前请求中提取TestFlight凭证
            try {
              if (typeof $request !== 'undefined') {
                $persistentStore.write(null, 'request_id');
                let url = $request.url;
                let key = url.replace(/(.*accounts\/) (.*) (\/apps)/, '$2');
                let session_id = $request.headers['x-session-id'] || $request.headers['X-Session-Id'];
                let session_digest = $request.headers['x-session-digest'] || $request.headers['X-Session-Digest'];
                let request_id = $request.headers['x-request-id'] || $request.headers['X-Request-Id'];
                let X_Apple_AMD_X = $request.headers['X-Apple-AMD-X'] || $request.headers['x-apple-amd-x'];
                let UA = $request.headers['User-Agent'] || $request.headers['user-agent'];
                if (key) $persistentStore.write(key, 'key');
                if (session_id) $persistentStore.write(session_id, 'session_id');
                if (session_digest) $persistentStore.write(session_digest, 'session_digest');
                if (request_id) $persistentStore.write(request_id, 'request_id');
                if (X_Apple_AMD_X) $persistentStore.write(X_Apple_AMD_X, 'X-Apple-AMD-X');
                if (UA) $persistentStore.write(UA, 'TFUA');
                if ($persistentStore.read('request_id')) {
                  $notification.post('请关闭本脚本', '信息获取成功','');
                } else {
                  $notification.post('信息获取失败','请打开MITM H2开关并添加testflight.apple.com','');
                }
              }
            } catch (err) {
              console.log('自动提取TestFlight凭证失败: ' + err);
            }
            resolve();
          }
        }
      } else {
        if (error =='The request timed out.') {
          resolve();
        } else if (error.includes("error -1012")) { 
          $notification.post('自动加入TF', error,'请获取TF账户信息，模块已自动关闭，获取成功后再自行打开模块')
          $done($httpAPI('POST', '/v1/modules', {'Auto module for JavaScripts': 'false'}))
          resolve();
        } else {
          $notification.post('自动加入TF', error,'')
          console.log(ID + ': ' + error)
          resolve();
        }
      }
    })
  })
} 
