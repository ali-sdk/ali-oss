Page({
  test: () => {
    // 如果需要使用STS服务来上传请在外层包裹下面sts请求返回的数据
    // wx.request() //"http://127.0.0.1:8888/sts" =>credentials //credentials 里面包含sts服务临时生成的ak，sk, securityToken
    // 文件选
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: res => {
        //获取签名
        wx.request({
          url: 'http://127.0.0.1:8888/signature',
          success: result => {
            const host = 'https://xxxxx.aliyuncs.com'; // 你的bucket域名可以在oss控制台看到
            const signature = result.data.signature;
            const ossAccessKeyId = result.data.OSSAccessKeyId; // 如果使用sts这里改成sts服务返回的ak
            const policy = result.data.policy;
            const key = res.tempFiles[0].name;
            const filePath = res.tempFiles[0].path;
            wx.uploadFile({
              url: host, // 开发者服务器的URL。
              filePath: filePath,
              name: 'file', // 必须填file。
              formData: {
                key,
                policy,
                OSSAccessKeyId: ossAccessKeyId,
                signature
                // 'x-oss-security-token': securityToken // 使用STS服务时必传。从sts服务响应里获取 credentials.SecurityToken
              },
              success: res => {
                if (res.statusCode === 204) {
                  console.log('上传成功');
                }
              },
              fail: err => {
                console.log('上传失败', err);
              }
            });
          },
          fail: res => {
            console.log('error:', res);
          },
          complete: res => {
            console.log('complete', res);
          }
        });
      }
    });
  }
});
