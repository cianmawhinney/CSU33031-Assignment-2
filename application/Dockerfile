FROM node:slim

WORKDIR /usr/src/app

# Bundle source app
COPY . .

# Install app dependencies
WORKDIR /usr/src/app/application
RUN npm install

EXPOSE 3000

CMD ["node", "application.js"]