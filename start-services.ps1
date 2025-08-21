# PowerShell script to start all collaborative editor services

Write-Host "🚀 Starting Collaborative Editor Services..." -ForegroundColor Green

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Function to wait for a service to be ready
function Wait-ForService {
    param([int]$Port, [string]$ServiceName, [int]$Timeout = 30)
    
    Write-Host "⏳ Waiting for $ServiceName on port $Port..." -ForegroundColor Yellow
    $startTime = Get-Date
    
    while ((Get-Date) -lt ($startTime.AddSeconds($Timeout))) {
        if (Test-Port -Port $Port) {
            Write-Host "✅ $ServiceName is ready on port $Port" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 1
    }
    
    Write-Host "❌ $ServiceName failed to start on port $Port" -ForegroundColor Red
    return $false
}

# Start the main server
Write-Host "📡 Starting main server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start" -WindowStyle Normal

# Wait for server to start
if (Wait-ForService -Port 5000 -ServiceName "Main Server" -Timeout 30) {
    Write-Host "✅ Main server started successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start main server" -ForegroundColor Red
    exit 1
}

# Start the executor service
Write-Host "⚡ Starting executor service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd executor; npm start" -WindowStyle Normal

# Wait for executor to start
if (Wait-ForService -Port 5001 -ServiceName "Executor Service" -Timeout 30) {
    Write-Host "✅ Executor service started successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start executor service" -ForegroundColor Red
    exit 1
}

# Start the client
Write-Host "🌐 Starting client..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm start" -WindowStyle Normal

# Wait for client to start
if (Wait-ForService -Port 3000 -ServiceName "Client" -Timeout 60) {
    Write-Host "✅ Client started successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start client" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 All services started successfully!" -ForegroundColor Green
Write-Host "📱 Access your application at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 API endpoint: http://localhost:5000" -ForegroundColor Cyan
Write-Host "⚡ Executor service: http://localhost:5001" -ForegroundColor Cyan

# Test the system
Write-Host "🧪 Testing system connectivity..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
node test-server-connection.js

Write-Host "✨ Setup complete! You can now use the collaborative editor." -ForegroundColor Green
