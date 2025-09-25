# OAuth Fix Testing Guide

## 🧪 Testing Steps

### 1. Pre-Test Verification

Before testing, make sure you've completed these configuration steps:

#### ✅ Supabase Configuration
- [ ] Site URL: `https://your-vercel-app.vercel.app`
- [ ] Redirect URLs include: `https://your-vercel-app.vercel.app/auth/callback`

#### ✅ Google Cloud Console
- [ ] Authorized JavaScript origins include: `https://your-vercel-app.vercel.app`
- [ ] Authorized redirect URIs include: `https://qrxjhmpudchgisaxfdtn.supabase.co/auth/v1/callback`

#### ✅ Vercel Environment Variables
- [ ] `REACT_APP_SUPABASE_URL` is set
- [ ] `REACT_APP_SUPABASE_ANON_KEY` is set
- [ ] `REACT_APP_API_URL` points to your backend
- [ ] `REACT_APP_SOCKET_URL` points to your backend

### 2. Local Testing (Optional)

Test locally first to ensure the code changes work:

```bash
cd client
npm start
```

1. Go to `http://localhost:3000`
2. Click "Sign in with Google"
3. Check browser console for logs
4. Verify redirect works correctly

### 3. Production Testing

#### Step 1: Deploy to Vercel
```bash
cd client
npm run build
vercel --prod
```

#### Step 2: Test OAuth Flow
1. Go to your Vercel deployment URL
2. Open browser developer tools (F12)
3. Go to Console tab
4. Click "Sign in with Google"
5. Watch the console logs

#### Expected Console Logs:
```
Starting Google OAuth with redirect: https://your-vercel-app.vercel.app/auth/callback
Current origin: https://your-vercel-app.vercel.app
Google OAuth initiated successfully: {...}
```

#### Step 3: Complete OAuth Flow
1. Complete Google authentication
2. You should be redirected back to your Vercel app
3. Check console for:
```
Handling OAuth callback...
Current URL: https://your-vercel-app.vercel.app/auth/callback
OAuth parameters detected, processing...
Authentication successful, redirecting to home...
```

### 4. Verification Checklist

- [ ] No "localhost refused to connect" errors
- [ ] OAuth redirects to Vercel domain (not localhost)
- [ ] User is successfully authenticated
- [ ] User is redirected to home page after auth
- [ ] Authentication state persists on page refresh

### 5. Troubleshooting

#### Issue: Still getting localhost redirect
**Solution:**
1. Clear browser cache and cookies
2. Check Supabase redirect URLs configuration
3. Verify Google Cloud Console settings

#### Issue: OAuth provider not configured
**Solution:**
1. Check Supabase Dashboard > Authentication > Providers
2. Ensure Google provider is enabled
3. Verify OAuth credentials are set

#### Issue: Environment variables not loading
**Solution:**
1. Check Vercel dashboard environment variables
2. Redeploy the application
3. Check browser console for variable values

### 6. Success Indicators

✅ **Success**: User can sign in with Google and is redirected to your Vercel app
❌ **Failure**: User gets "localhost refused to connect" or authentication fails

## 🔍 Debug Information

If you encounter issues, check these in browser console:

1. **Environment Variables:**
   ```javascript
   console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
   console.log('Current Origin:', window.location.origin);
   ```

2. **OAuth Flow:**
   - Look for "Starting Google OAuth with redirect" log
   - Check if redirect URL is correct
   - Verify OAuth parameters are detected

3. **Network Tab:**
   - Check for successful requests to Supabase
   - Verify no CORS errors
   - Look for successful authentication responses
