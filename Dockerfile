# Stage 1: Build the frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# This creates the 'dist' folder the server needs
RUN npm run build

# Stage 2: Run the backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
# Copy only the built 'dist' folder from the builder stage
COPY --from=builder /app/dist ./dist
# Copy the backend server
COPY server.js ./
# Copy any other necessary files (like metadata.json)
COPY metadata.json ./

EXPOSE 3000
CMD ["node", "server.js"]
