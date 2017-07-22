// # Alipay-Supervisor Startup
const schedule = require('node-schedule');
const AliSpider = require('./libs/alipay');

let checkOrderTask;
let dailyReportTask;

// 每分钟第30秒执行check order
function scheduleCronCheckOrdersTask() {
    checkOrderTask = schedule.scheduleJob('*/5 * * * * *', function () {
        AliSpider.StartUp();
    });
}

// 每天的23点59 daily report
function scheduleCronReportTask() {
    dailyReportTask = schedule.scheduleJob({hour: 23, minute: 59}, function () {
        AliSpider.DailyReport();
    });
}

scheduleCronCheckOrdersTask();
scheduleCronReportTask();