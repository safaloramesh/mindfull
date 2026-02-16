FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the code
COPY . .

# Expose the port used in your vite.config.ts and server.js
EXPOSE 3000

# THE FIX: Use the start script from package.json
# This will correctly run "node server.js"
CMD [ "npm", "start" ]
