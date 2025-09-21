# Supabase Google OAuth Setup Guide

## 🚨 Critical Issue Identified

Your OAuth requests are failing because the **Google OAuth provider is not properly configured in Supabase**. Here's how to fix it:

## 🔧 Step-by-Step Fix

### 1. Configure Google OAuth in Supabase Dashboard

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/qrxjhmpudchgisaxfdtn
2. **Navigate to Authentication > Providers**
3. **Find Google provider and click "Configure"**
4. **Enable Google provider** if it's not already enabled
5. **Add your Google OAuth credentials**:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret

### 2. Configure Redirect URLs in Supabase

1. **Go to Authentication > URL Configuration**
2. **Set Site URL**: `https://collab-quest-djutv2y7d-prathamesh-pawars-projects-de2689ea.vercel.app`
3. **Add Redirect URLs**:
   ```
   https://collab-quest-djutv2y7d-prathamesh-pawars-projects-de2689ea.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

### 3. Configure Google Cloud Console

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Navigate to APIs & Services > Credentials**
3. **Find your OAuth 2.0 Client ID**
4. **Update "Authorized JavaScript origins"**:
   ```
   https://collab-quest-djutv2y7d-prathamesh-pawars-projects-de2689ea.vercel.app
   http://localhost:3000
   ```
5. **Update "Authorized redirect URIs"**:
   ```
   https://qrxjhmpudchgisaxfdtn.supabase.co/auth/v1/callback
   ```

## 🔍 How to Get Google OAuth Credentials

If you don't have Google OAuth credentials yet:

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create a new project** or select existing one
3. **Enable Google+ API**:
   - Go to APIs & Services > Library
   - Search for "Google+ API"
   - Click "Enable"
4. **Create OAuth 2.0 credentials**:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized origins and redirect URIs as shown above
5. **Copy Client ID and Client Secret**

## 🚀 Alternative: Use Supabase's Built-in Google OAuth

If you want to use Supabase's built-in Google OAuth (easier setup):

1. **In Supabase Dashboard > Authentication > Providers**
2. **Click "Configure" on Google provider**
3. **Click "Use Supabase's Google OAuth"**
4. **Follow the setup wizard**
5. **This will automatically configure the redirect URLs**

## 🔧 Quick Fix Script

Let me also create a script to help you verify the configuration:
