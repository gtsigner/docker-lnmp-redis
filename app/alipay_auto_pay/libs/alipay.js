// # Alipay-Supervisor

process.env.UV_THREADPOOL_SIZE = 64; //https://www.fedepot.com/cong-node-request-esockettimedoutcuo-wu-shuo-kai-lai/

const config = require('./config');
const Email = require('./email');

const email = new Email(config.smtpHost, config.smtpPort, config.smtpUsername, config.smtpPassword);

const Push = require('./push');
const push = new Push(config.pushStateAPI, config.pushAppId, config.pushAppKey, config.pushStateSecret);

let request = require('request');

const FileCookieStore = require('tough-cookie-filestore');
const j = request.jar(new FileCookieStore(config.tempPath + 'cookies.json'));
request = request.defaults({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
        //'Host': 'consumeprod.alipay.com',
        //'Referer': 'https://personalweb.alipay.com/portal/i.htm'
    },
    jar: j
});


const crypto = require('crypto');
const iconv = require('iconv-lite');
iconv.skipDecodeWarning = true;
const fs = require('fs');
const _ = require('lodash');
const cheerio = require("cheerio");
const logger = require("./logger").logger;
const bufferHelper = require("bufferhelper");

// 即时Cookie
let cookies = config.alipayCookies;


// Util - 恢复被转义的unicode字符 (\\uXXXX)
function decodeUnic(s) {
    return unescape(s.replace(/\\(u[0-9a-fA-F]{4})/gm, '%$1'));
}


const AlipayAutoer = function () {
    let orderList = [];
    this.restoreOrderList = function () {
        let date = new Date;
        let filename = 'Orders_' + date.getFullYear().toString() + '_' + (date.getMonth() + 101).toString().substr(1) + '_' + (date.getDate() + 100).toString().substr(1) + '.json';
        // 先add空值确保文件存在
        fs.writeFileSync('./orders/' + filename, '', {flag: 'a'});
        let ordersString = fs.readFileSync('./orders/' + filename);
        try {
            return JSON.parse(ordersString);
        } catch (error) {
            return {};
        }
    };

    function spiderOrder() {
        logger.debug('Start fetch orders');
        let rI = request.defaults({headers: {'Cookie': cookies}});
        // 先请求个人主页
        rI.get('https://my.alipay.com/portal/i.htm', {timeout: 1500}, function (err, response) {
            // error
            if (err) {
                logger.debug(err);
                // Email报告
                if (config.enableExNotify) {
                    email.sendMail(config.product, '<b>An web request error happened in your alipay supervisor</b><br>' + err.message, config.email);
                }
                return false;
            }
            // ok
            if (!err && response.statusCode === 200) {
                // 再请求订单页面
                let recReq = rI.get('https://consumeprod.alipay.com/record/advanced.htm?fundFlow=in&_input_charset=utf-8', {timeout: 1500});
                // error
                recReq.on('error', function (error) {
                    logger.debug(error.message);
                    // Email报告
                    if (config.enableExNotify) {
                        email.sendMail(config.product, '<b>An web request error happened in your alipay supervisor</b><br>' + err.message, config.email);
                    }
                });
                // ok
                recReq.on('response', function (res) {
                    let buff = [];
                    recReq.on('data', function (chunk) {
                        buff.push(chunk);
                    });
                    recReq.on('end', function () {
                        let result = iconv.decode(Buffer.concat(buff), 'GBK');
                        result = result.replace('charset="GBK"', 'charset="utf-8"');
                        logger.debug('Fetch orders page content successfully');
                        fs.writeFileSync(config.tempPath + 'orders.html', result);
                        parseOrdersHtml(result);
                    });
                });
            }
        });
    }

    function parseOrdersHtml(html) {
        logger.debug('Star parse page content');
        let $ = cheerio.load(html);
        // 检查是否含有列表form以判断是否订单列表页(例如cookies无效时是返回登录页的内容)
        let form = $('#J-submit-form');
        if (form.length < 1) {
            logger.error('异常页面：', $('title').text());
            // Email报告
            if (config.debug) {
                email.sendMail(config.product, '<b>Cookie可能失效，为了不影响您得业务，请即时更换Cookies', config.email);
            }
            return false;
        } else {
            logger.info("订单数据页面正常");
        }

        let orderTable = $('#tradeRecordsIndex>tbody');
        let orderRows = orderTable.find('tr');

        orderRows.each(function (index, ele) {
            let orderData = {};
            let orderRow = $(this);
            // 订单时间
            let timeSel = orderRow.children('td.time').children('p');
            orderData.time = _.trim(timeSel.first().text()) + ' ' + _.trim(timeSel.last().text());
            // 备注
            orderData.memo = _.trim(orderRow.find('.memo-info').text());
            // 订单描述
            orderData.description = _.trim(orderRow.children('td.name').children('p').text());
            // 订单商户流水号(商户独立系统)与订单交易号(支付宝系统)
            let orderNoData = orderRow.children('td.tradeNo').children('p').text().split('|');
            if (orderNoData.length > 1) {
                orderData.orderId = _.trim(orderNoData[0].split(':')[1]);
                orderData.tradeNo = _.trim(orderNoData[1].split(':')[1]);
            } else {
                orderData.tradeNo = _.trim(orderNoData[0].split(':')[1]);
            }

            // 对方支付宝用户名
            orderData.username = _.trim(decodeUnic(orderRow.children('td.other').children('p').text()));
            // 金额
            let amountText = orderRow.children('td.amount').children('span').text().replace(' ', ''); // + 100.00 / - 100.00 / 100.00
            orderData.amount = parseFloat(amountText);
            // 订单状态
            orderData.status = orderRow.children('td.status').children('p').text();

            // 推送通知
            if (orderData.amount > 0) {
                pushStateToServer(orderData); // 仅对收入做处理
            }

        });
        logger.info('监控订单完成');
    }

    function pushStateToServer(orderData) {
        if (orderList[orderData['tradeNo']]) {
            logger.debug('Order has been handled successfully, ignore this time');
            return;
        }

        let callback = function (resp) {
            if (typeof resp === 'object' && resp.isError) {
                // Email报告
                if (config.enableExNotify) {
                    email.sendMail(config.product, '<b>An error happened in your alipay supervisor</b><br>Push state to remote server with error returned, please check your server configuration.<br>The error info is: ' + resp.code + ', ' + resp.message, config.email);
                }
            }
            if (resp === 'success') {
                orderList[orderData['tradeNo']] = orderData;
                //backupOrderList(); //将orderList保存到文件
                // Email报告
                email.sendMail(config.product, '<b>A order is handled successfully in your alipay supervisor</b><br>The order info is: <pre>' + JSON.stringify(orderData) + '</pre>', config.email);
            }
        };

        logger.debug('Start push order status to server');
        console.log(orderData);
        push.pushState(orderData, callback);
    }

    // 每日通过邮件报告
    function DailyReport() {
        // Email报告
        if (config.enableExNotify) {
            let date = new Date;
            email.sendMail('Alipay Supervisor Service Daily Report(' + date.toLocaleString() + ')', '<b>Currently handled orders:</b><br><pre>' + JSON.stringify(orderList) + '</pre>', config.email);
        }

    }

    this.StartUp = function () {
        spiderOrder();
    };
    this.DailyReport = DailyReport;
    return this;
};
module.exports = new AlipayAutoer();
