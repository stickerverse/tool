#!/bin/bash

# Create models directory
mkdir -p public/models

echo "Downloading background removal models..."

# Download U2NetP (lightweight) - 1.2MB
echo "Downloading U2NetP (lightweight)..."
curl -L https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/u2netp.onnx \
  -o public/models/u2netp.onnx

# Download U2Net (best quality) - optional
echo "Do you want to download the full U2Net model (44MB)? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  echo "Downloading U2Net..."
  curl -L https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/u2net.onnx \
    -o public/models/u2net.onnx
fi

echo "Models downloaded successfully!"

# Verify downloads
echo -e "\nVerifying downloads:"
ls -lh public/models/
