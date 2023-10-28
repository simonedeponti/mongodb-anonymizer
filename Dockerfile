FROM node:21
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
CMD ["npx", "mongodb-anonymizer"]