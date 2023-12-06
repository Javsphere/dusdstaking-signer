FROM node:18-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
# healthCheck im AWS
RUN apk --no-cache add curl

WORKDIR /home/node/app

COPY . .

USER node
COPY --chown=node:node package.json package-lock.json* ./

RUN npm install

RUN npm test

COPY --chown=node:node . .

EXPOSE 3000

CMD [ "npm", "run", "prod" ]
