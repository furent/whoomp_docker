# Stage 0: Build
FROM node:20 AS build-stage

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy TypeScript configuration files
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./

# Copy index.html from the root directory
COPY index.html ./

# Copy the frontend source code
COPY src/ ./src

# Build the React app
RUN npm run build

# Stage 1: Serve with NGINX
FROM nginx:1.23-alpine

# Copy the built React app to the NGINX HTML directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
