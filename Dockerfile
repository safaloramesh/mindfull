# 1. Use an official Node.js runtime as a parent image
FROM node:18-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package files and install dependencies
# Doing this before copying the full code saves build time (caching)
COPY package*.json ./
RUN npm install --production

# 4. Copy the rest of your application code
COPY . .

# 5. Expose the port the app runs on
EXPOSE 3000

# 6. Define the command to run your app
CMD [ "node", "index.js" ]
