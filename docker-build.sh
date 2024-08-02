#!/bin/sh

# build docker image
docker build -t densecr2cy6b7nrjs7nu.azurecr.io/lk-device-service:1.0.1 .

docker push densecr2cy6b7nrjs7nu.azurecr.io/lk-device-service:1.0.1

