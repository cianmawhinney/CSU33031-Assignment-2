FROM node:slim

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle source app
COPY . .

# FIXME: work out is this is the right port to use or not
EXPOSE 51510

CMD ["node", "controller.js"]