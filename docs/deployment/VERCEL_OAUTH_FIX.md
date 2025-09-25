# Vercel OAuth Redirect Fix Guide

## 🚨 Problem Identified

After Google OAuth authentication, users are getting "localhost refused to connect" error because:

1. **OAuth redirect URLs are not properly configured for production**
2. **Supabase redirect URLs don't include your Vercel domain**
3. **Environment variables may not be properly set in Vercel**

## 🔧 Step-by-Step Fix

### 1. Update Supabase Redirect URLs

**Go to your Supabase Dashboard:**
1. Navigate to: https://supabase.com/dashboard/project/qrxjhmpudchgisaxfdtn
2. Go to **Authentication > URL Configuration**
3. Update the **Site URL** to your Vercel domain:
   ```
   https://your-vercel-app.vercel.app
   ```
4. Add these **Redirect URLs**:
   ```
   https://your-vercel-app.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

### 2. Update Google Cloud Console

**Go to Google Cloud Console:**
1. Navigate to: https://console.cloud.google.com/
2. Go to **APIs & Services > Credentials**
3. Find your OAuth 2.0 Client ID
4. Update **Authorized JavaScript origins**:
   ```
   https://your-vercel-app.vercel.app
   http://localhost:3000
   ```
5. Update **Authorized redirect URIs**:
   ```
   https://qrxjhmpudchgisaxfdtn.supabase.co/auth/v1/callback
   ```

### 3. Set Environment Variables in Vercel

**In your Vercel Dashboard:**
1. Go to your project → **Settings → Environment Variables**
2. Add these variables:

```bash
REACT_APP_SUPABASE_URL=https://qrxjhmpudchgisaxfdtn.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyeGpobXB1ZGNoZ2lzYXhmZHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTEyNzYsImV4cCI6MjA3Mzg2NzI3Nn0.R_BE6DCzm31yNIDDQinuwea5Wx_BCBmsLInNb_OVPWM
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_SOCKET_URL=https://your-backend-url.onrender.com
```

### 4. Redeploy Your Application

After updating the configuration:

```bash
# In your client directory
npm run build
vercel --prod
```

## 🔍 Verification Steps

### 1. Check OAuth Flow
1. Go to your Vercel deployment URL
2. Click "Sign in with Google"
3. Complete the OAuth flow
4. Verify you're redirected back to your Vercel app (not localhost)

### 2. Check Browser Console
Open browser dev tools and look for:
- ✅ `Current origin: https://your-vercel-app.vercel.app`
- ✅ `Starting Google OAuth with redirect: https://your-vercel-app.vercel.app/auth/callback`
- ❌ No localhost references

### 3. Check Network Tab
Look for successful requests to:
- `https://qrxjhmpudchgisaxfdtn.supabase.co/auth/v1/authorize`
- `https://your-vercel-app.vercel.app/auth/callback`

## 🚀 Quick Fix Script

If you want to quickly test the fix, you can use this script:

```bash
# Check current environment
echo "Current Vercel URL:"
vercel ls

# Check environment variables
vercel env ls

# Redeploy
vercel --prod
```

## 🔧 Troubleshooting

### Issue: Still getting localhost redirect
**Solution:** Clear browser cache and cookies, then try again.

### Issue: OAuth provider not configured
**Solution:** Make sure Google OAuth is enabled in Supabase Dashboard > Authentication > Providers.

### Issue: Environment variables not loading
**Solution:** 
1. Check Vercel dashboard for correct variable names
2. Redeploy the application
3. Check browser console for environment variable values

### Issue: CORS errors
**Solution:** Make sure your backend (Render) has your Vercel domain in CORS settings.

## 📋 Checklist

- [ ] Supabase Site URL updated to Vercel domain
- [ ] Supabase Redirect URLs include Vercel callback URL
- [ ] Google Cloud Console origins include Vercel domain
- [ ] Google Cloud Console redirect URIs include Supabase callback
- [ ] Vercel environment variables are set correctly
- [ ] Application redeployed to Vercel
- [ ] OAuth flow tested in production

## 🎯 Expected Result

After completing these steps:
1. ✅ Google OAuth should work in production
2. ✅ Users should be redirected to your Vercel app after authentication
3. ✅ No more "localhost refused to connect" errors
4. ✅ Authentication state should persist correctly

## 📞 Need Help?

If you're still experiencing issues:
1. Check the browser console for error messages
2. Verify all URLs are correct (no typos)
3. Make sure all services are properly configured
4. Test the OAuth flow step by step
