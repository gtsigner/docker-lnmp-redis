/**
 * Created by zhaojunlike on 7/18/2017.
 */
const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'debug';
logger.debug("Logger Init Success");
exports.logger = logger;