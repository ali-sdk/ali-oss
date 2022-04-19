# 使用说明

例子采用 PostObject https://help.aliyun.com/document_detail/31988.html

在微信小程序开发工具打开右上角的详情->本地设置->勾选不检验合法域名、web-view...（用于本地开发,生产环境请登录微信小程序平台，将上传和下载的合法域名填写为Bucket的外网访问域名。）

复制 lib/wx/pages 目录到小程序项目里面

复制 lib/wx/server 目录到单独文件

安装 express ali-oss crypto-js 三个包

```javascript
npm install express ali-oss crypto-js --save
```

然后运行 server.js 文件

```javascript
node server.js
```

可以在终端看到服务已经跑在 8888 端口

然后在小程序开发工具打开刚才复制过去的页面即可以点击上传按钮 (点击前补全 index.js 文件)
