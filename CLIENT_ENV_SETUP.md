# Client Environment Variables Setup

## Your Current Deployment URLs:
- **Frontend (Vercel)**: `https://collab-quest-g2a9ekboj-prathamesh-pawars-projects-de2689ea.vercel.app`
- **Backend (Render)**: `https://collabquest.onrender.com`

## Create Client Environment File

### Option 1: For Local Development
Create a file named `.env.local` in the `client/` directory with:

```bash
# Client Environment Variables - Local Development
REACT_APP_API_URL=https://collabquest.onrender.com
REACT_APP_SOCKET_URL=https://collabquest.onrender.com
```

### Option 2: For Production (Already Done)
Your Vercel deployment already has these environment variables set:
- ✅ `REACT_APP_API_URL=https://collabquest.onrender.com`
- ✅ `REACT_APP_SOCKET_URL=https://collabquest.onrender.com`

## How to Create the File

### Windows (PowerShell):
```powershell
cd client
@"
REACT_APP_API_URL=https://collabquest.onrender.com
REACT_APP_SOCKET_URL=https://collabquest.onrender.com
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
```

### Windows (Command Prompt):
```cmd
cd client
echo REACT_APP_API_URL=https://collabquest.onrender.com > .env.local
echo REACT_APP_SOCKET_URL=https://collabquest.onrender.com >> .env.local
```

### Linux/Mac:
```bash
cd client
cat > .env.local << EOF
REACT_APP_API_URL=https://collabquest.onrender.com
REACT_APP_SOCKET_URL=https://collabquest.onrender.com
EOF
```

## Verify Setup

After creating the file, restart your development server:

```bash
cd client
npm start
```

## Important Notes:

1. **`.env.local`** files are ignored by git (secure)
2. **Vercel** uses its own environment variables (already configured)
3. **Local development** will use `.env.local` if it exists
4. **Production deployment** uses Vercel's environment variables

## Current Status:
- ✅ Vercel environment variables configured
- ✅ Render backend deployed
- 🔧 Local `.env.local` file needed for development
