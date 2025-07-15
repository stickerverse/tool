#!/bin/bash

# Create models directory if it doesn't exist
mkdir -p public/models

echo "🤖 Downloading AI models for background removal..."

# Clean up any existing corrupted files
rm -f public/models/*.onnx

# Download U2Net model (320x320 input) - reliable source
echo "📥 Downloading U2Net model..."
curl -L "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx" \
  -o "public/models/u2net.onnx" \
  --progress-bar

# Verify the download
if [ ! -f "public/models/u2net.onnx" ] || [ $(stat -f%z "public/models/u2net.onnx" 2>/dev/null || stat -c%s "public/models/u2net.onnx" 2>/dev/null) -lt 1000000 ]; then
  echo "❌ Failed to download U2Net model, trying alternative..."
  
  # Alternative: Try another reliable source
  echo "📥 Downloading from alternative source..."
  curl -L "https://github.com/pymatting/pymatting/releases/download/v1.1.8/u2net.onnx" \
    -o "public/models/u2net.onnx" \
    --progress-bar
fi

# Download a smaller model as fallback (320x320 input)
echo "📥 Downloading small model for faster processing..."
curl -L "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx" \
  -o "public/models/u2net_small.onnx" \
  --progress-bar

# Verify file sizes
echo ""
echo "✅ Model download complete!"
echo "📁 Models in public/models/:"
for file in public/models/*.onnx; do
  if [ -f "$file" ]; then
    size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    echo "  - $(basename "$file"): $(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo "${size} bytes")"
  fi
done

echo ""
echo "🎯 Ready to use AI background removal!"