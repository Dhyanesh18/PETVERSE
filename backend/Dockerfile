FROM node:25-alpine3.22

WORKDIR /backend 

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm","run","dev"]