本文以JavaScript语言为例，讲解在服务端通过JavaScript代码完成签名，客户端通过请求获取签名，然后通过表单直传数据到OSS。

### 前提条件

应用服务器对应的域名可通过公网访问。
确保应用服务器已经安装node 8.\*以上版本
确保PC端浏览器支持JavaScript。

### 步骤1：配置应用服务器

1. 下载应用服务器源码
2. 打开example/server/postObject.js文件
   修改对应的`accessKeyId`、`accessKeySecret`、`bucket`配置

```
  const config = {
    accessKeyId: '<yourAccessKeyId>',  //
    accessKeySecret: '<yourAccessKeySecret>', //
    bucket: '<bucket-name>'
  }
```

如果使用通过STS临时授权方式进行表单直传, 则需要修改对应`STS_ROLE`配置

```
  const STS_ROLE = '<STS_ROLE>';
```

3. 执行`npm install`
4. 执行`node postObject.js`

### 步骤2：修改CORS

客户端进行表单直传到OSS时，会从浏览器向OSS发送带有`Origin`的请求消息。OSS对带有`Origin`头的请求消息会进行跨域规则（CORS）的验证。因此需要为Bucket设置跨域规则以支持Post方法。

1. 登录[OSS管理控制台](https://oss.console.aliyun.com/?spm=a2c4g.11186623.2.16.548e4c07WTCBqs)。
2. 在左侧存储空间列表中，单击目标存储空间名称，打开该存储空间概览页面。
3. 单击**基础设置**页签，找到**跨域设置**区域，然后单击**设置**。
4. 单击**创建规则**，配置如下图所示。
   ![](http://static-aliyun-doc.oss-cn-hangzhou.aliyuncs.com/assets/img/9610949651/p12308.png)

### 步骤3：体验表单上传

1. 在浏览器输入`http://localhost:9000/`

2. 填写上传后的文件名称

3. 选择上传的文件

4. 单击**上传**按钮
