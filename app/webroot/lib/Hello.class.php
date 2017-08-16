<?php

class Hello
{
    public static function sayHello()
    {
        echo json_encode(['code' => 200, 'msg' => 'hello']);
    }
}