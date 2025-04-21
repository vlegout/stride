#!/bin/sh

set -ex

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

aws s3 cp -r s3://vlegout-sport/data ./public

npm run build
