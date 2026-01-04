#!/bin/bash

echo "📧 Gmail Email Setup Helper"
echo "============================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "This script will help you add Gmail credentials to your .env file."
echo ""
echo "📝 Step 1: Get Gmail App Password"
echo "   1. Go to: https://myaccount.google.com/apppasswords"
echo "   2. Generate an App Password for 'Mail' → 'Other' → 'EduConnect'"
echo "   3. Copy the 16-character password"
echo ""
read -p "Press Enter when you have your App Password ready..."

echo ""
echo "📝 Step 2: Enter your Gmail credentials"
echo ""
read -p "Enter your Gmail email address: " email
read -sp "Enter your 16-character App Password: " password
echo ""

# Update .env file
if grep -q "^EMAIL_USER=" .env; then
    # Replace existing EMAIL_USER
    sed -i.bak "s|^EMAIL_USER=.*|EMAIL_USER=$email|" .env
else
    # Add EMAIL_USER after EMAIL_HOST
    sed -i.bak "/^EMAIL_HOST=/a\\
EMAIL_USER=$email" .env
fi

if grep -q "^EMAIL_PASS=" .env; then
    # Replace existing EMAIL_PASS
    sed -i.bak "s|^EMAIL_PASS=.*|EMAIL_PASS=$password|" .env
else
    # Add EMAIL_PASS after EMAIL_USER
    sed -i.bak "/^EMAIL_USER=/a\\
EMAIL_PASS=$password" .env
fi

# Update EMAIL_FROM
if grep -q "^EMAIL_FROM=" .env; then
    sed -i.bak "s|^EMAIL_FROM=.*|EMAIL_FROM=EduConnect <$email>|" .env
fi

echo ""
echo "✅ Email credentials added to .env file!"
echo ""
echo "📝 Step 3: Restart the backend"
echo "   Run: npm run dev"
echo ""
echo "You should see: ✅ Email service configured"
echo ""

