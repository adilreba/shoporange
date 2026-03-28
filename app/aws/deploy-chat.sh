#!/bin/bash

# AtusHome Chat & WebSocket Deployment Script
# Bu script chat altyapısını AWS'e deploy eder

set -e

STACK_NAME="atushome-chat"
REGION="eu-west-1"
TEMPLATE_FILE="sam/template-chat-addon.yaml"

echo "🚀 AtusHome Chat Altyapısı Deploy Ediliyor..."
echo "================================================"
echo ""

# AWS CLI yüklü mü kontrol et
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI bulunamadı! Lütfen yükleyin:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
    exit 1
fi

# SAM CLI yüklü mü kontrol et
if ! command -v sam &> /dev/null; then
    echo "❌ AWS SAM CLI bulunamadı! Lütfen yükleyin:"
    echo "   https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
fi

# AWS kimlik doğrulama kontrolü
echo "🔐 AWS kimlik bilgileri kontrol ediliyor..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS kimlik bilgileri bulunamadı!"
    echo "   aws configure komutu ile ayarlayın:"
    echo "   aws configure --profile atushome"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $ACCOUNT_ID"
echo ""

# Önceki stack'i kontrol et
echo "📋 Önceki stack kontrol ediliyor..."
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
    echo "⚠️  Mevcut stack bulundu: $STACK_NAME"
    read -p "Stack'i güncellemek istiyor musunuz? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ İptal edildi."
        exit 1
    fi
    DEPLOY_ACTION="update"
else
    echo "✅ Yeni stack oluşturulacak: $STACK_NAME"
    DEPLOY_ACTION="create"
fi

echo ""
echo "📦 Chat altyapısı deploy ediliyor..."
echo "   Stack: $STACK_NAME"
echo "   Region: $REGION"
echo ""

# SAM Build
echo "🔨 SAM Build başlatılıyor..."
cd aws
sam build --template-file sam/template-chat-addon.yaml

# SAM Deploy
echo ""
echo "☁️  SAM Deploy başlatılıyor..."
if [ "$DEPLOY_ACTION" == "create" ]; then
    sam deploy \
        --template-file sam/template-chat-addon.yaml \
        --stack-name $STACK_NAME \
        --region $REGION \
        --capabilities CAPABILITY_IAM \
        --guided \
        --parameter-overrides \
            Environment=prod
else
    sam deploy \
        --template-file sam/template-chat-addon.yaml \
        --stack-name $STACK_NAME \
        --region $REGION \
        --capabilities CAPABILITY_IAM \
        --no-confirm-changeset \
        --no-fail-on-empty-changeset \
        --parameter-overrides \
            Environment=prod
fi

# Deploy sonrası bilgileri al
echo ""
echo "📊 Deploy sonrası bilgiler alınıyor..."

WEBSOCKET_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ChatWebSocketUrl`].OutputValue' \
    --output text)

MESSAGES_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ChatMessagesTable`].OutputValue' \
    --output text)

CONNECTIONS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ChatConnectionsTable`].OutputValue' \
    --output text)

SESSIONS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ChatConnectionsTable`].OutputValue' \
    --output text)

echo ""
echo "================================================"
echo "✅ Deploy BAŞARILI!"
echo "================================================"
echo ""
echo "📡 WebSocket URL:"
echo "   $WEBSOCKET_URL"
echo ""
echo "🗄️  DynamoDB Tabloları:"
echo "   Messages:  $MESSAGES_TABLE"
echo "   Connections: $CONNECTIONS_TABLE"
echo "   Sessions: $SESSIONS_TABLE"
echo ""
echo "⚙️  Frontend .env güncellemesi:"
echo "   VITE_CHAT_WS_URL=$WEBSOCKET_URL"
echo ""
echo "🔧 Test için:"
echo "   1. Frontend .env dosyasına WebSocket URL'sini ekleyin"
echo "   2. Uygulamayı yeniden derleyin: npm run build"
echo "   3. Kullanıcı ve admin olarak giriş yapıp chat'i test edin"
echo ""
echo "📚 Loglar için:"
echo "   aws logs tail /aws/lambda/atushome-chat --region $REGION --follow"
echo ""
