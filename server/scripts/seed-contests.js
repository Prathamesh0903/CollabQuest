/* eslint-disable no-console */
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const Contest = require('../models/Contest');
const User = require('../models/User');

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.error('No admin user found. Create an admin user first.');
    process.exit(1);
  }

  const now = new Date();
  const oneHour = 60 * 60 * 1000;

  const payloads = [
    {
      title: 'Weekly Contest #' + Math.floor(Math.random() * 1000),
      description: 'Auto-seeded weekly contest',
      startTime: new Date(now.getTime() + oneHour),
      endTime: new Date(now.getTime() + 3 * oneHour),
      problems: [
        { problemId: new mongoose.Types.ObjectId(), problemType: 'dsa', points: 100 },
        { problemId: new mongoose.Types.ObjectId(), problemType: 'dsa', points: 200 },
      ],
      visibility: 'public',
      createdBy: admin._id,
    },
  ];

  for (const p of payloads) {
    const contest = await Contest.create(p);
    console.log('Created contest', contest._id.toString());
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


