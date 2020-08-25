FROM node:12
# Create app directory
WORKDIR ~/ws/dockerImages
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=productio
# Bundle app source
COPY . .
EXPOSE 8080
CMD [ "node", "server.js" ]