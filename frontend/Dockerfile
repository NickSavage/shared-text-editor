FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the app
ARG VITE_API_URL
RUN  VITE_API_URL=${VITE_API_URL} npm run build

# Install serve
RUN npm install -g serve

# Make port 80 available
EXPOSE 80

# Run serve when the container launches
CMD ["serve", "-s", "dist", "-l", "80"]