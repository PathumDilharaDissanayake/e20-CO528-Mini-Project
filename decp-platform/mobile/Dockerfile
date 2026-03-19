# Multi-stage build for React Native Expo app

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --silent

# Stage 2: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Build the app (for web)
RUN npx expo export --platform web

# Stage 3: Production
FROM nginx:alpine AS production

# Copy built app to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Install global packages
RUN npm install -g expo-cli @expo/ngrok

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy app files
COPY . .

# Expose ports for Expo
EXPOSE 19000 19001 19002 8081

# Start Expo
CMD ["npm", "start"]
