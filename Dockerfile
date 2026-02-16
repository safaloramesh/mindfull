FROM node:18-alpine

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install --production

# Copy the rest of the code
COPY . .

# Expose the port
EXPOSE 3000

# FIX: Changed from index.js to app.js
CMD [ "node", "app.js" ]
