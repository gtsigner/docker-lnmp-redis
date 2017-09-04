<?php
//phpinfo();

xdebug_start_code_coverage();
define('APP_PATH', "./../");
require APP_PATH . "lib/Hello.class.php";
Hello::sayHello();
var_dump(xdebug_get_code_coverage());
xdebug_stop_code_coverage();