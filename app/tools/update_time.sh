#!/bin/bash
sudo su
sudo echo 'Asia/Shanghai' > /etc/timezone
docker run --rm -v /etc/localtime:/data/localtime centos cp /usr/share/zoneinfo/Asia/Shanghai /data/localtime
