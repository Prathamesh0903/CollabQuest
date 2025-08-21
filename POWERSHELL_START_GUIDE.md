# 🚀 PowerShell Start Guide - Collaborative Editor

## ⚡ **Quick Start (PowerShell)**

### **Option 1: Use the Automated Script**
```powershell
# Run the automated startup script
.\start-services.ps1
```

### **Option 2: Manual Start (3 Terminal Windows)**

#### **Terminal 1 - Start Main Server**
```powershell
cd server
npm start
```

#### **Terminal 2 - Start Executor Service**
```powershell
cd executor
npm start
```

#### **Terminal 3 - Start Client**
```powershell
cd client
npm start
```

## 🔧 **PowerShell Commands Reference**

### **Navigation**
```powershell
# Change directory
cd server
cd ..\client
cd ..\executor

# List files
ls
Get-ChildItem
```

### **Starting Services**
```powershell
# Start server
cd server; npm start

# Start executor
cd executor; npm start

# Start client
cd client; npm start
```

### **Testing**
```powershell
# Test server connection
node test-server-connection.js

# Check if ports are in use
netstat -ano | findstr :5000
netstat -ano | findstr :5001
netstat -ano | findstr :3000
```

### **Process Management**
```powershell
# Kill process on specific port
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# List Node.js processes
Get-Process | Where-Object {$_.ProcessName -eq "node"}
```

## 🎯 **Step-by-Step Manual Setup**

### **1. Install Dependencies**
```powershell
# Server dependencies
cd server
npm install

# Client dependencies
cd ..\client
npm install

# Executor dependencies
cd ..\executor
npm install

# Root dependencies
cd ..
npm install
```

### **2. Environment Setup**
```powershell
# Copy environment files
Copy-Item server\env.example server\.env
Copy-Item .env.example .env
```

### **3. Start Services (in order)**

#### **Step 1: Start Main Server**
```powershell
cd server
npm start
```
**Expected output:**
```
Server running on port 5000
Environment: development
```

#### **Step 2: Start Executor Service**
```powershell
# Open new PowerShell window
cd executor
npm start
```
**Expected output:**
```
🚀 Secure code executor service listening on port 5001
🛡️  Security features enabled:
   - Container isolation
   - Memory and CPU limits
   - Network isolation
   - Read-only filesystem
   - Privilege dropping
   - Code validation
   - Rate limiting
```

#### **Step 3: Start Client**
```powershell
# Open new PowerShell window
cd client
npm start
```
**Expected output:**
```
Compiled successfully!

You can now view client in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### **4. Test the System**
```powershell
# In the root directory
node test-server-connection.js
```

## 🔍 **Troubleshooting (PowerShell)**

### **Port Already in Use**
```powershell
# Find process using port
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F
```

### **Permission Issues**
```powershell
# Run PowerShell as Administrator
# Or set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **Service Not Starting**
```powershell
# Check if Node.js is installed
node --version
npm --version

# Check if dependencies are installed
cd server
npm list

cd ..\executor
npm list

cd ..\client
npm list
```

### **Network Issues**
```powershell
# Test localhost connectivity
Test-NetConnection -ComputerName localhost -Port 5000
Test-NetConnection -ComputerName localhost -Port 5001
Test-NetConnection -ComputerName localhost -Port 3000
```

## 🧪 **Testing Code Execution**

### **Test JavaScript**
```javascript
console.log("Hello from PowerShell!");
console.log("Testing collaborative editor!");
```

### **Test Python**
```python
print("Hello from Python!")
name = input("Enter your name: ")
print(f"Hello, {name}!")
```

### **Test with Input**
```python
# This will prompt for input in the terminal
name = input("What's your name? ")
age = input("How old are you? ")
print(f"Hello {name}, you are {age} years old!")
```

## 📁 **File Management**

### **Creating Files**
1. Click "New File" in sidebar
2. Enter filename (e.g., `main.js`)
3. Select language
4. Click "Create File"

### **Uploading Files**
1. Click "Open Local Folder"
2. Select files or folders
3. Files are imported into the session

## 🎉 **Success Indicators**

✅ **All services running:**
- Main server: http://localhost:5000/api/health
- Executor service: http://localhost:5001/health
- Client: http://localhost:3000

✅ **Test passes:**
```powershell
node test-server-connection.js
# Should show: 🎉 All tests passed! Server is running correctly.
```

✅ **Terminal shows output:**
- Click "Run Code" button
- Terminal panel displays execution results

---

**🎯 You're all set! The collaborative editor is now working with PowerShell.**

