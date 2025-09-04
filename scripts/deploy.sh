#!/bin/bash

# EasyCal Deployment Script
# Handles building and deploying to Cloudflare Pages

set -e

echo "🚀 Starting EasyCal deployment..."

# Check if required environment variables are set
if [ -z "$HL_CLIENT_ID" ] || [ -z "$HL_CLIENT_SECRET" ] || [ -z "$ENCRYPTION_KEY" ]; then
    echo "❌ Error: Required environment variables not set"
    echo "Please ensure HL_CLIENT_ID, HL_CLIENT_SECRET, and ENCRYPTION_KEY are configured"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run clean

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Type checking
echo "🔍 Running type checks..."
npm run type-check

# Linting
echo "✨ Running linter..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test

# Build the application
echo "🏗️ Building application..."
npm run build

# Push database schema (if needed)
echo "📊 Updating database schema..."
npm run db:push

# Deploy to Cloudflare Pages
echo "☁️ Deploying to Cloudflare Pages..."
wrangler pages deploy ./out --project-name easycal

echo "✅ Deployment completed successfully!"
echo "🌐 Your app should be available at your Cloudflare Pages URL"
