FROM node:latest
COPY package.json package.json
RUN npm install
WORKDIR /app
USER node
EXPOSE 8108
# CMD [ "npm", "start" ]