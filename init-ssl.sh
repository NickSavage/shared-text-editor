#!/bin/bash

# Load environment variables
set -a
source .env.prod
set +a

# Create required directories
mkdir -p certbot/conf
mkdir -p certbot/www

# Stop any running containers
docker-compose down

# Start nginx
docker-compose up -d nginx

# Get the SSL certificate
docker-compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot \
    --email admin@${DOMAIN} --agree-tos --no-eff-email \
    -d ${DOMAIN}

# Restart nginx to load the certificates
docker-compose restart nginx 