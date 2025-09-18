# Seed DSA Data in Render Database

## The Issue
Your DSA sheet is not visible because the database doesn't have the DSA problems and categories seeded. The Render backend is running but the database is empty.

## Solution: Seed DSA Data

### Option 1: Use Render Shell (Recommended)

1. **Go to your Render dashboard**: https://dashboard.render.com
2. **Find your backend service** (collab-backend)
3. **Click on your service**
4. **Go to the "Shell" tab**
5. **Run the seeding command**:

```bash
cd server
node scripts/seed-dsa.js
```

### Option 2: Use MongoDB Atlas Directly

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Connect to your database**
3. **Use MongoDB Compass or shell**
4. **Run the seeding script locally** (make sure to set MONGODB_URI to your Atlas connection string):

```bash
cd server
MONGODB_URI="your-atlas-connection-string" node scripts/seed-dsa.js
```

### Option 3: Add Seeding to Render Build Process

You can also modify your Render service to automatically seed data on startup by updating the start command:

**In Render Dashboard → Environment:**
- Change start command from `npm start` to `npm run seed:dsa && npm start`

**Or add to server/package.json scripts:**
```json
{
  "scripts": {
    "start": "node server.js",
    "seed:dsa": "node scripts/seed-dsa.js",
    "start:with-seed": "npm run seed:dsa && npm start"
  }
}
```

## What the Seeding Script Does

The `seed-dsa.js` script will:
- ✅ Create DSA categories (Arrays, Strings, Trees, etc.)
- ✅ Add sample problems for each category
- ✅ Create a demo DSA user
- ✅ Set up the database structure

## Verify the Fix

After seeding, check:
1. **Visit your Vercel app**: https://collab-quest.vercel.app
2. **Navigate to DSA section**
3. **You should see problems listed**
4. **Categories should be populated**

## Expected Results

After successful seeding:
- ✅ DSA problems list will be visible
- ✅ Categories will be populated
- ✅ Problem details will load
- ✅ Database queries will work

## Troubleshooting

If seeding fails:
1. **Check MongoDB connection** in Render logs
2. **Verify MONGODB_URI** environment variable
3. **Check database permissions** in MongoDB Atlas
4. **Ensure database user has write permissions**

## Quick Test

You can test if the API is working by visiting:
`https://collabquest.onrender.com/api/dsa/problems`

This should return a JSON response with problems if the database is seeded.
