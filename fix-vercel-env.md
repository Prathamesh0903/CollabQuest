# Fix Vercel Environment Variables

## 🚨 URGENT: Environment Variable Issue

Your Vercel deployment is still using the **OLD incorrect Supabase URL** in the environment variables, even though we fixed the code.

## 🔧 How to Fix This

### Option 1: Update via Vercel Dashboard (Recommended)

1. **Go to your Vercel Dashboard**: https://vercel.com/prathamesh-pawars-projects-de2689ea/collab-quest
2. **Click on your project** (collab-quest)
3. **Go to Settings > Environment Variables**
4. **Find and update these variables**:

   **REACT_APP_SUPABASE_URL**
   - Current (WRONG): `https://qrxjhmudchgisaxfdtn.supabase.co`
   - Change to (CORRECT): `https://qrxjhmpudchgisaxfdtn.supabase.co`

5. **Save the changes**
6. **Redeploy** by going to Deployments and clicking "Redeploy" on the latest deployment

### Option 2: Update via Vercel CLI

Run these commands in your terminal:

```bash
# Set the correct Supabase URL
vercel env add REACT_APP_SUPABASE_URL production
# When prompted, enter: https://qrxjhmpudchgisaxfdtn.supabase.co

# Set the correct Supabase Anon Key
vercel env add REACT_APP_SUPABASE_ANON_KEY production
# When prompted, enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyeGpobXB1ZGNoZ2lzYXhmZHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTEyNzYsImV4cCI6MjA3Mzg2NzI3Nn0.R_BE6DCzm31yNIDDQinuwea5Wx_BCBmsLInNb_OVPWM

# Redeploy
vercel --prod
```

## 🔍 Why This Happened

- The `vercel.json` file has the correct URL
- But Vercel environment variables override the `vercel.json` settings
- The environment variables in Vercel dashboard still have the old URL
- This is why the OAuth is failing with DNS_PROBE_FINISHED_NXDOMAIN

## ✅ After Fixing

Once you update the environment variables and redeploy:
1. The OAuth should work correctly
2. You can remove the OAuth debugger from the login page
3. Google authentication will redirect properly

## 🚀 Quick Fix Command

If you want to do it quickly via CLI, run this in your client directory:

```bash
vercel env rm REACT_APP_SUPABASE_URL production
vercel env add REACT_APP_SUPABASE_URL production
# Enter: https://qrxjhmpudchgisaxfdtn.supabase.co

vercel --prod
```
