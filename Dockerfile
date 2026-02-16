FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
# We use the start script from your package.json (which points to server.js)
CMD ["npm", "start"]
