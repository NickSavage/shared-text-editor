#!/bin/bash

# Load environment variables
set -a
source .env.prod
set +a

# Build and push frontend
echo "Building frontend..."
docker build -t --build-arg VITE_API_URL=https://codescribble.com nsavage/codescribble-frontend:latest -f ./frontend/Dockerfile ./frontend
docker push nsavage/codescribble-frontend:latest

# Build and push backend
echo "Building backend..."
docker build -t nsavage/codescribble-backend:latest -f ./backend/Dockerfile ./backend
docker push nsavage/codescribble-backend:latest

echo "Build and push complete!"