FROM node:slim

WORKDIR /usr/src/app

# Bundle source app
COPY . .

# Install app dependencies
WORKDIR /usr/src/app/forwarder
RUN npm install

EXPOSE 51510

CMD ["node", "forwarder.js"]