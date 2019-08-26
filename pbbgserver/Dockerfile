FROM node:latest as build
RUN mkdir /tmp/app
WORKDIR /tmp/app
COPY package.json ./
RUN npm install
COPY ./ ./
FROM node:12-slim
COPY --from=build /tmp/app /app
RUN chown -R node:node /app
WORKDIR /app
USER node
EXPOSE 8108
CMD [ "npm", "start" ]