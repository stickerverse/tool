#!/bin/bash

# Create a script to copy ONNX Runtime WASM files to public directory
echo "🔧 Setting up ONNX Runtime Web files..."

# Check if node_modules exists
if [ ! -d "node_modules/onnxruntime-web" ]; then
    echo "❌ Error: onnxruntime-web not found in node_modules"
    echo "Please run: npm install onnxruntime-web"
    exit 1
fi

# Create directory if it doesn't exist
mkdir -p public

# Copy ONNX Runtime files from node_modules to public
echo "📋 Copying WASM files..."
cp -f node_modules/onnxruntime-web/dist/*.wasm public/ 2>/dev/null || echo "⚠️  No .wasm files found"

echo "📋 Copying JS files..."
cp -f node_modules/onnxruntime-web/dist/ort*.js public/ 2>/dev/null || echo "⚠️  No .js files found"
cp -f node_modules/onnxruntime-web/dist/ort*.mjs public/ 2>/dev/null || echo "⚠️  No .mjs files found"

# List copied files
echo ""
echo "✅ ONNX Runtime files setup complete!"
echo "📁 Files in public directory:"
ls -la public/ort*.* public/*.wasm 2>/dev/null | grep -E "\.(wasm|mjs|js)$" || echo "No ONNX files found in public/"

# Check if models directory exists
if [ -d "public/models" ]; then
    echo ""
    echo "📦 Models directory found:"
    ls -la public/models/*.onnx 2>/dev/null || echo "No .onnx models found"
else
    echo ""
    echo "⚠️  Models directory not found. Run: ./scripts/download-models.sh"
fi