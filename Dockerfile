# Stage 1: Build the React frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the Backend server
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
# Copy the 'dist' folder created in Stage 1
COPY --from=builder /app/dist ./dist
COPY server.js ./
COPY metadata.json ./

EXPOSE 3000
CMD ["node", "server.js"]
