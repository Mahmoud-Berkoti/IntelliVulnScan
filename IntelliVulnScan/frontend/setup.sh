#!/bin/bash

# Create necessary directories
mkdir -p src/components/layouts
mkdir -p src/pages
mkdir -p src/context
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/types
mkdir -p src/utils

# Install dependencies
npm install

# Install dev dependencies
npm install --save-dev @types/react @types/react-dom @types/node typescript

echo "Setup completed successfully!" 