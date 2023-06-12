# pm2用　現状ウェブソケットが動かない
# FROM node:18.16.0-alpine as builder

# WORKDIR /app

# COPY package*.json ./
# RUN npm install

# RUN npm install -g pm2
# RUN npm install -g typescript

# RUN tsc

# CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
FROM node:18.16.0-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

CMD ["npm", "run", "prod"]