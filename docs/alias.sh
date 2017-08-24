#!/usr/bin/env bash
#composer
alias composer="docker run -it --rm -v=\$PWD:/app --workdir=/app composer"
#php
alias php="docker run -it --rm -v=\$PWD:/app --workdir=/app php:7.1-cli"
#其他