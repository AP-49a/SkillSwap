# Use official Node LTS Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (only production)
RUN npm ci --only=production

# Copy source code files (excludes files in .dockerignore)
COPY . .

# Expose port 5000
EXPOSE 5000

# Start server
CMD ["npm", "start"]
