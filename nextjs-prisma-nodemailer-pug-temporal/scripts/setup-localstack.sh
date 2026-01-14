#!/bin/bash
# This script initializes LocalStack S3 bucket for development
# Run this after docker-compose up

echo "Waiting for LocalStack to be ready..."
sleep 5

# Create S3 bucket
echo "Creating S3 bucket: vintasend-attachments"
aws --endpoint-url=http://localhost:4566 s3 mb s3://vintasend-attachments

# Enable versioning (optional, for better file tracking)
echo "Enabling versioning on bucket..."
aws --endpoint-url=http://localhost:4566 s3api put-bucket-versioning \
  --bucket vintasend-attachments \
  --versioning-configuration Status=Enabled

# Set CORS configuration (if accessing from browser)
echo "Setting CORS configuration..."
cat > /tmp/cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
EOF

aws --endpoint-url=http://localhost:4566 s3api put-bucket-cors \
  --bucket vintasend-attachments \
  --cors-configuration file:///tmp/cors.json

echo "✓ LocalStack S3 bucket setup complete!"
echo "Bucket: vintasend-attachments"
echo "Endpoint: http://localhost:4566"
