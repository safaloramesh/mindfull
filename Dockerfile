FROM node:18-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# EXPOSE the port your app uses (your repo uses 3000)
EXPOSE 3000

# FIX: Point to app.js instead of index.js
CMD [ "node", "app.js" ]
