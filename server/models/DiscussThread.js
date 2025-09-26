const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema(
	{
		entityType: { type: String, enum: ['thread', 'reply'], required: true },
		entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
		ipAddress: { type: String, required: true, index: true },
		vote: { type: Number, enum: [1, -1], required: true },
	},
	{ timestamps: true }
);

VoteSchema.index({ entityType: 1, entityId: 1, ipAddress: 1 }, { unique: true });

const ReplySchema = new mongoose.Schema(
	{
		threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscussThread', required: true, index: true },
		content: { type: String, required: true },
		parentReplyId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscussReply', default: null },
		upvotes: { type: Number, default: 0 },
		downvotes: { type: Number, default: 0 },
		metadata: {
			userAgent: String,
			ipAddress: String,
		},
	},
	{ timestamps: true }
);

ReplySchema.index({ threadId: 1, createdAt: -1 });

const DiscussThreadSchema = new mongoose.Schema(
	{
		title: { type: String, required: true, trim: true },
		content: { type: String, required: true },
		tags: { type: [String], index: true, default: [] },
		upvotes: { type: Number, default: 0 },
		downvotes: { type: Number, default: 0 },
		metadata: {
			userAgent: String,
			ipAddress: String,
		},
		repliesCount: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

DiscussThreadSchema.index({ createdAt: -1 });
DiscussThreadSchema.index({ title: 'text', content: 'text', tags: 1 });

const DiscussVote = mongoose.model('DiscussVote', VoteSchema);
const DiscussReply = mongoose.model('DiscussReply', ReplySchema);
const DiscussThread = mongoose.model('DiscussThread', DiscussThreadSchema);

module.exports = { DiscussThread, DiscussReply, DiscussVote };


