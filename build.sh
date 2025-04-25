#!/bin/sh

set -ex

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
mkdir -p ~/aws/bin
./aws/install -i ~/aws/aws-cli -b ~/aws/bin

export PATH=~/aws/bin:$PATH

aws s3 cp s3://vlegout-sport/public.tar.xz .

tar -xvf public.tar.xz

npm run build
