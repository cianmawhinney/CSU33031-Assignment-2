FROM node:slim

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle source app
COPY . .

EXPOSE 3000

CMD ["node", "application.js"]