// # Alipay-Supervisor Configuration

//var path = require('path');
const process = require("process");
const config = {
    debug: true,
    tempPath: __dirname + "/../temp/",
    // 接收通知服务器API地址
    pushStateAPI: process.env.NOTIFY_URI ? `${process.env.NOTIFY_URI}/api/alipay/pushOrder` : 'http://192.168.99.100/api/alipay/pushOrder', // 示例 https://www.xxx.net/paynotify

    // 推送方的应用ID(本程序), 用于区分和辨别合法的发送方
    pushAppId: '',

    // 推送方的应用密钥
    pushAppKey: '',

    // 服务器验证签名参数, 此密钥用于按既定签名算法生成签名
    pushStateSecret: '',

    // 支付宝登录成功后的cookies, 用于请求订单列表页的身份验证(获取方式: 首先访问你的个人支付宝,
    // 进入到https://consumeprod.alipay.com/record/advanced.htm订单列表页面
    // , 使用chrome按F12打开调试工具, 进console选项卡,
    // 输入document.cookie回车, 返回的字符串即为cookies,
    // 复制全部, 不包含包含首尾双引号, 粘贴到此处双引号中)
    alipayCookies: "UM_distinctid=15b487ea7dc11a-0dcd9855e4bbf7-7d123a4e-1fa400-15b487ea7dd950; NEW_ALIPAY_TIP=1; l=AsjIpv3-2Slag2qPvNQdE-EMGD3acSx7; isg=Ah0dKBnUGImNR_1I6GL5p-yWLPkdO2n4AY473d_iTnSjljzIp4iEXPhGtrxr; session.cookieNameId=ALIPAYJSESSIONID; mobileSendTime=-1; credibleMobileSendTime=-1; ctuMobileSendTime=-1; riskMobileBankSendTime=-1; riskMobileAccoutSendTime=-1; riskMobileCreditSendTime=-1; riskCredibleMobileSendTime=-1; riskOriginalAccountMobileSendTime=-1; cna=DRpBEY89rEQCAX1A3BCcodu8; ctoken=uGH9Mh9ejF7xDYm9; _hvn_login=1; zone=RZ25B; ALIPAYJSESSIONID.sig=OlOdCJqNKCbkfO2JFxor0TROor531t9pu_AuZYnveqs; ALIPAYJSESSIONID=RZ25qb71uR7GBk41jtekASciefGJvLauthRZ25GZ00; spanner=JsEtNbA7pl3mYTJGX4QBomWLoY1DG5Ra; rtk=iSbCvPEHCfZ+NBGl6SMsG49Ub7LoLuCSlJJr8DueOUa7M3tb/o7",

    // 开启异常邮件通知(cookies过期异常忽略该选项并始终都会通知)
    enableExNotify: false,

    // 异常通知邮箱地址(多个邮箱以逗号分隔)
    email: 'zhaojunlike@qq.com',

    // SMTP配置 - Host
    smtpHost: 'smtp.163.com',

    // SMTP配置 - Port
    smtpPort: 465,

    // SMTP配置 - username
    smtpUsername: '15760079693@163.com',

    // SMTP配置 - password
    smtpPassword: 'zhaojunlike123',
    product: 'Alipay转账通知'
};

module.exports = config;