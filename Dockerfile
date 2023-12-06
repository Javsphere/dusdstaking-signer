FROM node:18-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
# health check
RUN apk --no-cache add curl

WORKDIR /home/node/app

COPY package*.json ./

USER node
COPY --chown=node:node package.json package-lock.json* ./

RUN npm install

COPY --chown=node:node . .

EXPOSE 4000

CMD [ "node", "--max-old-space-size=4096", "app.ts" ]
