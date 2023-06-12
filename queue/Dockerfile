FROM node:18.16.0-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g ts-node

# Copy your source files to the container
COPY . .

CMD ["npx", "ts-node", "main.ts"]
