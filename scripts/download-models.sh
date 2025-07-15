#!/bin/bash

# Create models directory if it doesn't exist
mkdir -p public/models

echo "🤖 Downloading AI models for background removal..."

# Download U2Net model (recommended)
echo "📥 Downloading U2Net model..."
curl -L "https://github.com/imgly/background-removal-js/raw/main/packages/models/small/model.onnx" \
  -o "public/models/u2net.onnx" \
  --progress-bar

# Download quantized version for faster processing
echo "📥 Downloading quantized U2Net model..."
curl -L "https://github.com/imgly/background-removal-js/raw/main/packages/models/small/model_quant.onnx" \
  -o "public/models/u2net_quant.onnx" \
  --progress-bar

echo "✅ Models downloaded successfully!"
echo "📁 Models location: public/models/"
ls -lh public/models/