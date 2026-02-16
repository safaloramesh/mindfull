FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
# This matches your server.js file from the screenshot
CMD ["node", "server.js"]
