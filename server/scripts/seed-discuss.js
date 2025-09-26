require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { DiscussThread, DiscussReply, DiscussVote } = require('../models/DiscussThread');

async function main() {
	const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/collabquest';
	await mongoose.connect(uri);
	console.log('Connected to MongoDB');

	await Promise.all([
		DiscussThread.deleteMany({}),
		DiscussReply.deleteMany({}),
		DiscussVote.deleteMany({})
	]);

	const threads = await DiscussThread.insertMany([
		{ title: 'Welcome to Discuss 🎉', content: 'Share tips, ask questions, and collaborate. Use **Markdown** and tags!', tags: ['welcome', 'guide'], metadata: { ipAddress: '127.0.0.1' } },
		{ title: 'Best VSCode extensions?', content: 'What are your must-have extensions for JS/TS dev?', tags: ['vscode', 'productivity'], metadata: { ipAddress: '127.0.0.1' } },
		{ title: 'Show your setup', content: 'Share your desk setup pics and tools list.', tags: ['setup', 'hardware'], metadata: { ipAddress: '127.0.0.1' } }
	]);

	for (const t of threads) {
		const replies = await DiscussReply.insertMany([
			{ threadId: t._id, content: 'This is awesome! 🚀', metadata: { ipAddress: '127.0.0.1' } },
			{ threadId: t._id, content: 'Subscribing to this thread.', metadata: { ipAddress: '127.0.0.2' } }
		]);
		await DiscussThread.findByIdAndUpdate(t._id, { $set: { repliesCount: replies.length } });
	}

	console.log('Seeded discuss data');
	await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });


