#!/bin/bash

# AtusHome AWS Deployment Script
# This script deploys the complete backend infrastructure to AWS

set -e

echo "=========================================="
echo "AtusHome AWS Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
    exit 1
fi

# Check SAM CLI
if ! command -v sam &> /dev/null; then
    echo -e "${RED}AWS SAM CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
fi

# Check if user is logged in to AWS
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Not logged in to AWS. Please run 'aws configure' first.${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)
echo -e "${GREEN}Logged in to AWS Account: $ACCOUNT_ID in region: $REGION${NC}"

# Configuration
STACK_NAME="atushome-backend"
S3_BUCKET="atushome-deployment-$ACCOUNT_ID"

echo ""
echo "=========================================="
echo "Configuration:"
echo "  Stack Name: $STACK_NAME"
echo "  S3 Bucket: $S3_BUCKET"
echo "  Region: $REGION"
echo "=========================================="
echo ""

# Create S3 bucket if it doesn't exist
echo -e "${YELLOW}Creating S3 bucket for deployments...${NC}"
if aws s3 ls "s3://$S3_BUCKET" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://$S3_BUCKET" --region "$REGION"
    echo -e "${GREEN}Created S3 bucket: $S3_BUCKET${NC}"
else
    echo -e "${GREEN}S3 bucket already exists: $S3_BUCKET${NC}"
fi

# Build the SAM application
echo ""
echo -e "${YELLOW}Building SAM application...${NC}"
cd backend
npm run build

# Deploy the SAM application
echo ""
echo -e "${YELLOW}Deploying SAM application...${NC}"
sam deploy \
    --stack-name "$STACK_NAME" \
    --s3-bucket "$S3_BUCKET" \
    --region "$REGION" \
    --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
    --no-confirm-changeset

# Get the API Gateway URL
echo ""
echo -e "${YELLOW}Getting API Gateway URL...${NC}"
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

echo -e "${GREEN}API Gateway URL: $API_URL${NC}"

# Seed the database
echo ""
echo -e "${YELLOW}Seeding database with initial data...${NC}"
SEED_FUNCTION=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`SeedDataFunction`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -n "$SEED_FUNCTION" ]; then
    aws lambda invoke \
        --function-name "$SEED_FUNCTION" \
        --payload '{}' \
        seed_response.json
    echo -e "${GREEN}Database seeded successfully!${NC}"
    cat seed_response.json
    rm seed_response.json
else
    echo -e "${YELLOW}Seed function not found. You may need to seed data manually.${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "API Endpoint: $API_URL"
echo ""
echo "Next steps:"
echo "1. Update your frontend .env file with:"
echo "   VITE_API_URL=$API_URL"
echo ""
echo "2. Build and deploy your frontend:"
echo "   npm run build"
echo "   # Upload dist/ to S3 or your preferred hosting"
echo ""
echo "3. Test the API:"
echo "   curl $API_URL/categories"
echo "   curl $API_URL/products"
echo ""
echo "Admin Login:"
echo "  Email: admin@atushome.com"
echo "  Password: password"
echo ""
echo "=========================================="
