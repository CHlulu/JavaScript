!(async () => {
  ids = 'dDtSst4s6'
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
    let Key = '47b7aa8c-ca48-4518-84a0-1b1258423dab'
    let testurl = 'https://testflight.apple.com/v3/accounts/' + Key + '/ru/'
    let header = {
      'X-Session-Id': 'CIquDBIQRkIc6PLzTWGlGbaGKu32cQ==',
      'X-Session-Digest': '004bb8f77de61fe2138e237094aa9e15154eba2e',
      'X-Request-Id': '5D1C1341-D830-4EC9-BEA7-2DF74FE055EF',
      'X-Apple-AMD-M': '5rjEab5NxY8WACkJ52kq151lmWz/RMRccfKNlmianH4wBBhwaY/pRGyRYxKXKj1lQjVtnmHa7OWoOFN9',
      'User-Agent': 'Oasis/3.9.0 OasisBuild/514.2 iOS/16.4.1 model/iPhone15,2 hwp/t8120 build/20E252 (6; dt:282) AMS/1 TSE/0'
    }
    return new Promise(function(resolve) {
      $httpClient.get({url: testurl + ID,headers: header}, function(error, resp, data) {
        if (error === null) {
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
