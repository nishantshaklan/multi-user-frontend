#!/bin/bash

# SonarQube Docker Setup Script

echo "🚀 Setting up SonarQube with Docker..."

if docker ps -a | grep -q sonarqube; then
    echo "📦 SonarQube container found. Starting it..."
    docker start sonarqube
else
    echo "📦 Creating new SonarQube container..."
    docker run -d \
        --name sonarqube \
        -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
        -p 9000:9000 \
        sonarqube:latest
fi

echo ""
echo "⏳ Waiting for SonarQube to start (this may take 30-60 seconds)..."
echo ""

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:9000 > /dev/null 2>&1; then
        echo "✅ SonarQube is ready!"
        echo ""
        echo "🌐 Open http://localhost:9000 in your browser"
        echo "🔑 Login with: admin / admin"
        echo "📝 You'll be asked to change the password"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Login to SonarQube"
        echo "   2. Go to: Projects → Create Project → Manually"
        echo "   3. Project Key: multi-user-frontend"
        echo "   4. Display Name: Multi User Frontend"
        echo "   5. Go to: My Account → Security → Generate Token"
        echo "   6. Export the token: export SONAR_TOKEN=<your-token>"
        echo "   7. Run: npm run sonar"
        exit 0
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

echo ""
echo "⚠️  SonarQube is taking longer than expected to start."
echo "🌐 Please check http://localhost:9000 manually"
echo "📊 Check status with: docker logs sonarqube"
