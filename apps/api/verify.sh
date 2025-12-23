#!/bin/bash
set -e

echo "1. Logging in..."
curl -v -c cookies.txt -b cookies.txt -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gym.com","password":"password123"}'

echo "\n\n2. Getting Profile..."
curl -v -c cookies.txt -b cookies.txt http://localhost:3001/auth/me

echo "\n\n3. Logging out..."
curl -v -c cookies.txt -b cookies.txt -X POST http://localhost:3001/auth/logout

echo "\n\nDone."
