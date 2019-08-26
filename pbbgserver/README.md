## build
docker build --no-cache -t pbbgserver .

## run locally (mounting /server is only necassary for read/write of server files on host)
docker run --name latest --rm -it -v `pwd -W`:/app -p 8108:8108 pbbgserver

## deploy to Heroku
heroku login
heroku container:login
heroku create
heroku container:push -a APP_NAME web
heroku container:release -a APP_NAME web

## watch Heroku logs
heroku logs --tail -a APP_NAME