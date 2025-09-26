const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { DiscussThread, DiscussReply, DiscussVote } = require('../models/DiscussThread');

function getClientIp(req) {
	const fwd = req.headers['x-forwarded-for'];
	if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
	return req.ip || req.connection?.remoteAddress || '0.0.0.0';
}

// Create a thread
router.post('/threads', optionalAuth, async (req, res) => {
	try {
		const { title, content, tags = [] } = req.body;
		if (!title || !content) {
			return res.status(400).json({ error: 'Title and content are required' });
		}
		const thread = await DiscussThread.create({
			title: title.trim(),
			content,
			tags: Array.isArray(tags) ? tags.slice(0, 10).map(t => String(t).trim().toLowerCase()).filter(Boolean) : [],
			metadata: { userAgent: req.headers['user-agent'], ipAddress: getClientIp(req) }
		});
		return res.status(201).json(thread);
    } catch (err) {
        console.error('Create thread error:', err);
        return res.status(500).json({ error: 'Failed to create thread', details: err?.message });
    }
});

// List threads with search, tags, sort, pagination
router.get('/threads', async (req, res) => {
	try {
		const { q = '', tags = '', sort = 'new', page = 1, limit = 20 } = req.query;
		const pageNum = Math.max(1, parseInt(page));
		const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
		const filter = {};
		if (q && String(q).trim().length > 0) {
			filter.$text = { $search: String(q).trim() };
		}
		if (tags) {
			const tagList = String(tags)
				.split(',')
				.map(t => t.trim().toLowerCase())
				.filter(Boolean);
			if (tagList.length) filter.tags = { $in: tagList };
		}
		const sortOption = sort === 'top' ? { upvotes: -1, createdAt: -1 } : { createdAt: -1 };
		const [items, total] = await Promise.all([
			DiscussThread.find(filter).sort(sortOption).skip((pageNum - 1) * pageSize).limit(pageSize),
			DiscussThread.countDocuments(filter)
		]);
		return res.json({ items, total, page: pageNum, pageSize, hasMore: (pageNum - 1) * pageSize + items.length < total });
    } catch (err) {
        console.error('List threads error:', err);
        return res.status(500).json({ error: 'Failed to fetch threads', details: err?.message });
    }
});

// Get thread by id
router.get('/threads/:id', async (req, res) => {
	try {
		const thread = await DiscussThread.findById(req.params.id);
		if (!thread) return res.status(404).json({ error: 'Thread not found' });
		return res.json(thread);
	} catch (err) {
		return res.status(404).json({ error: 'Thread not found' });
	}
});

// Update thread
router.put('/threads/:id', optionalAuth, async (req, res) => {
	try {
		const { title, content, tags } = req.body;
		const updates = {};
		if (title) updates.title = String(title).trim();
		if (content) updates.content = String(content);
		if (Array.isArray(tags)) updates.tags = tags.slice(0, 10).map(t => String(t).trim().toLowerCase()).filter(Boolean);
		const thread = await DiscussThread.findByIdAndUpdate(req.params.id, updates, { new: true });
		if (!thread) return res.status(404).json({ error: 'Thread not found' });
		return res.json(thread);
    } catch (err) {
        console.error('Update thread error:', err);
        return res.status(500).json({ error: 'Failed to update thread', details: err?.message });
    }
});

// Delete thread
router.delete('/threads/:id', optionalAuth, async (req, res) => {
	try {
		const thread = await DiscussThread.findByIdAndDelete(req.params.id);
		if (!thread) return res.status(404).json({ error: 'Thread not found' });
		await DiscussReply.deleteMany({ threadId: thread._id });
		await DiscussVote.deleteMany({ entityType: 'thread', entityId: thread._id });
		return res.json({ success: true });
    } catch (err) {
        console.error('Delete thread error:', err);
        return res.status(500).json({ error: 'Failed to delete thread', details: err?.message });
    }
});

// Vote on thread
router.post('/threads/:id/vote', async (req, res) => {
	try {
		const { value } = req.body; // 1 or -1
		const voteVal = Number(value) === 1 ? 1 : -1;
		const ip = getClientIp(req);
		const thread = await DiscussThread.findById(req.params.id);
		if (!thread) return res.status(404).json({ error: 'Thread not found' });
		const existing = await DiscussVote.findOne({ entityType: 'thread', entityId: thread._id, ipAddress: ip });
		if (existing) {
			if (existing.vote === voteVal) return res.json({ upvotes: thread.upvotes, downvotes: thread.downvotes });
			// reverse previous
			if (existing.vote === 1) thread.upvotes = Math.max(0, thread.upvotes - 1);
			if (existing.vote === -1) thread.downvotes = Math.max(0, thread.downvotes - 1);
			existing.vote = voteVal;
			await existing.save();
		} else {
			await DiscussVote.create({ entityType: 'thread', entityId: thread._id, ipAddress: ip, vote: voteVal });
		}
		if (voteVal === 1) thread.upvotes += 1; else thread.downvotes += 1;
		await thread.save();
		return res.json({ upvotes: thread.upvotes, downvotes: thread.downvotes });
    } catch (err) {
        console.error('Vote thread error:', err);
        return res.status(500).json({ error: 'Failed to vote', details: err?.message });
    }
});

// List replies
router.get('/threads/:id/replies', async (req, res) => {
	try {
		const { page = 1, limit = 20, sort = 'new' } = req.query;
		const pageNum = Math.max(1, parseInt(page));
		const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
		const sortOption = sort === 'top' ? { upvotes: -1, createdAt: -1 } : { createdAt: -1 };
		const [items, total] = await Promise.all([
			DiscussReply.find({ threadId: req.params.id }).sort(sortOption).skip((pageNum - 1) * pageSize).limit(pageSize),
			DiscussReply.countDocuments({ threadId: req.params.id })
		]);
		return res.json({ items, total, page: pageNum, pageSize, hasMore: (pageNum - 1) * pageSize + items.length < total });
    } catch (err) {
        console.error('List replies error:', err);
        return res.status(500).json({ error: 'Failed to fetch replies', details: err?.message });
    }
});

// Create reply
router.post('/threads/:id/replies', optionalAuth, async (req, res) => {
	try {
		const { content, parentReplyId = null } = req.body;
		if (!content) return res.status(400).json({ error: 'Content is required' });
		const thread = await DiscussThread.findById(req.params.id);
		if (!thread) return res.status(404).json({ error: 'Thread not found' });
		const reply = await DiscussReply.create({
			threadId: thread._id,
			content,
			parentReplyId: parentReplyId || null,
			metadata: { userAgent: req.headers['user-agent'], ipAddress: getClientIp(req) }
		});
		thread.repliesCount += 1;
		await thread.save();
		const io = req.app.get('io');
		if (io) {
			io.of('/discuss').to(`thread:${thread._id.toString()}`).emit('discuss:reply:new', { threadId: thread._id.toString(), reply });
		}
		return res.status(201).json(reply);
    } catch (err) {
        console.error('Create reply error:', err);
        return res.status(500).json({ error: 'Failed to create reply', details: err?.message });
    }
});

// Update reply
router.put('/replies/:replyId', optionalAuth, async (req, res) => {
	try {
		const { content } = req.body;
		if (!content) return res.status(400).json({ error: 'Content is required' });
		const reply = await DiscussReply.findByIdAndUpdate(req.params.replyId, { content }, { new: true });
		if (!reply) return res.status(404).json({ error: 'Reply not found' });
		return res.json(reply);
    } catch (err) {
        console.error('Update reply error:', err);
        return res.status(500).json({ error: 'Failed to update reply', details: err?.message });
    }
});

// Delete reply
router.delete('/replies/:replyId', optionalAuth, async (req, res) => {
	try {
		const reply = await DiscussReply.findByIdAndDelete(req.params.replyId);
		if (!reply) return res.status(404).json({ error: 'Reply not found' });
		await DiscussVote.deleteMany({ entityType: 'reply', entityId: reply._id });
		await DiscussThread.findByIdAndUpdate(reply.threadId, { $inc: { repliesCount: -1 } });
		return res.json({ success: true });
    } catch (err) {
        console.error('Delete reply error:', err);
        return res.status(500).json({ error: 'Failed to delete reply', details: err?.message });
    }
});

// Vote on reply
router.post('/replies/:replyId/vote', async (req, res) => {
	try {
		const { value } = req.body; // 1 or -1
		const voteVal = Number(value) === 1 ? 1 : -1;
		const ip = getClientIp(req);
		const reply = await DiscussReply.findById(req.params.replyId);
		if (!reply) return res.status(404).json({ error: 'Reply not found' });
		const existing = await DiscussVote.findOne({ entityType: 'reply', entityId: reply._id, ipAddress: ip });
		if (existing) {
			if (existing.vote === voteVal) return res.json({ upvotes: reply.upvotes, downvotes: reply.downvotes });
			if (existing.vote === 1) reply.upvotes = Math.max(0, reply.upvotes - 1);
			if (existing.vote === -1) reply.downvotes = Math.max(0, reply.downvotes - 1);
			existing.vote = voteVal;
			await existing.save();
		} else {
			await DiscussVote.create({ entityType: 'reply', entityId: reply._id, ipAddress: ip, vote: voteVal });
		}
		if (voteVal === 1) reply.upvotes += 1; else reply.downvotes += 1;
		await reply.save();
		return res.json({ upvotes: reply.upvotes, downvotes: reply.downvotes });
    } catch (err) {
        console.error('Vote reply error:', err);
        return res.status(500).json({ error: 'Failed to vote', details: err?.message });
    }
});

module.exports = router;


