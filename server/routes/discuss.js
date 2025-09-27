const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { DiscussThread, DiscussReply, DiscussVote } = require('../models/DiscussThread');
const { performanceMonitor } = require('../utils/databaseOptimization');
const { checkDatabaseIntegrity } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { sanitizeHtml, validateDiscussInput, validateReplyInput } = require('../middleware/sanitize');

// Rate limiting for discuss routes
const discussLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const createThreadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 thread creations per minute
  message: { error: 'Too many thread creations, please wait before creating another thread.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
router.use(discussLimiter);

function getClientIp(req) {
	const fwd = req.headers['x-forwarded-for'];
	if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
	return req.ip || req.connection?.remoteAddress || '0.0.0.0';
}

// Create a thread - Enhanced with DSA pattern
router.post('/threads', createThreadLimiter, sanitizeHtml, validateDiscussInput, optionalAuth, asyncHandler(async (req, res) => {
	try {
		const { title, content, tags = [] } = req.body;
		
		// Sanitize and validate tags (additional validation beyond middleware)
		const sanitizedTags = Array.isArray(tags) 
			? tags.slice(0, 10)
				.map(t => String(t).trim().toLowerCase())
				.filter(tag => tag.length > 0 && tag.length <= 50 && /^[a-zA-Z0-9-_]+$/.test(tag))
			: [];
		
		const startTime = Date.now();
		const thread = await DiscussThread.create({
			title: title.trim(),
			content: content.trim(),
			tags: sanitizedTags,
			metadata: { 
				userAgent: req.headers['user-agent'] || 'Unknown', 
				ipAddress: getClientIp(req),
				userId: req.user?.uid || null
			}
		});
		
		const queryTime = Date.now() - startTime;
		performanceMonitor.recordQuery(queryTime, 'DiscussThread.create');
		
		return res.status(201).json(thread);
    } catch (err) {
        console.error('Create thread error:', err);
        return res.status(500).json({ error: 'Failed to create thread', details: err?.message });
    }
}));

// List threads with search, tags, sort, pagination - Enhanced with DSA pattern
router.get('/threads', checkDatabaseIntegrity, asyncHandler(async (req, res) => {
	try {
		const { q = '', tags = '', sort = 'new', page = 1, limit = 20 } = req.query;
		const pageNum = Math.max(1, parseInt(page));
		const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
		const skip = (pageNum - 1) * pageSize;
		
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
		
		// Execute optimized query with performance monitoring (following DSA pattern)
		const startTime = Date.now();
		const [items, total] = await Promise.all([
			DiscussThread.find(filter)
				.select('title content tags upvotes downvotes repliesCount createdAt')
				.sort(sortOption)
				.skip(skip)
				.limit(pageSize),
			DiscussThread.countDocuments(filter)
		]);
		
		const queryTime = Date.now() - startTime;
		performanceMonitor.recordQuery(queryTime, 'DiscussThread.find');
		
		return res.json({ 
			items, 
			total, 
			page: pageNum, 
			pageSize, 
			hasMore: (pageNum - 1) * pageSize + items.length < total 
		});
    } catch (err) {
        console.error('List threads error:', err);
        return res.status(500).json({ error: 'Failed to fetch threads', details: err?.message });
    }
}));

// Get thread by id - Enhanced with DSA pattern
router.get('/threads/:id', checkDatabaseIntegrity, asyncHandler(async (req, res) => {
	try {
		const startTime = Date.now();
		const thread = await DiscussThread.findById(req.params.id)
			.select('title content tags upvotes downvotes repliesCount createdAt metadata');
		
		const queryTime = Date.now() - startTime;
		performanceMonitor.recordQuery(queryTime, 'DiscussThread.findById');
		
		if (!thread) return res.status(404).json({ error: 'Thread not found' });
		return res.json(thread);
	} catch (err) {
		console.error('Get thread error:', err);
		return res.status(404).json({ error: 'Thread not found' });
	}
}));

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

// List replies - Enhanced with DSA pattern
router.get('/threads/:id/replies', checkDatabaseIntegrity, asyncHandler(async (req, res) => {
	try {
		const { page = 1, limit = 20, sort = 'new' } = req.query;
		const pageNum = Math.max(1, parseInt(page));
		const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
		const skip = (pageNum - 1) * pageSize;
		const sortOption = sort === 'top' ? { upvotes: -1, createdAt: -1 } : { createdAt: -1 };
		
		// Execute optimized query with performance monitoring (following DSA pattern)
		const startTime = Date.now();
		const [items, total] = await Promise.all([
			DiscussReply.find({ threadId: req.params.id })
				.select('threadId content parentReplyId upvotes downvotes createdAt metadata')
				.sort(sortOption)
				.skip(skip)
				.limit(pageSize),
			DiscussReply.countDocuments({ threadId: req.params.id })
		]);
		
		const queryTime = Date.now() - startTime;
		performanceMonitor.recordQuery(queryTime, 'DiscussReply.find');
		
		return res.json({ items, total, page: pageNum, pageSize, hasMore: (pageNum - 1) * pageSize + items.length < total });
    } catch (err) {
        console.error('List replies error:', err);
        return res.status(500).json({ error: 'Failed to fetch replies', details: err?.message });
    }
}));

// Create reply - Enhanced with DSA pattern
router.post('/threads/:id/replies', sanitizeHtml, validateReplyInput, optionalAuth, asyncHandler(async (req, res) => {
	try {
		const { content, parentReplyId = null } = req.body;
		
		const startTime = Date.now();
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
		
		const queryTime = Date.now() - startTime;
		performanceMonitor.recordQuery(queryTime, 'DiscussReply.create');
		
		// Emit real-time update
		const io = req.app.get('io');
		if (io) {
			io.of('/discuss').to(`thread:${thread._id.toString()}`).emit('discuss:reply:new', { threadId: thread._id.toString(), reply });
		}
		
		return res.status(201).json(reply);
    } catch (err) {
        console.error('Create reply error:', err);
        return res.status(500).json({ error: 'Failed to create reply', details: err?.message });
    }
}));

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

// GET /api/discuss/stats - Get discussion statistics (similar to DSA progress tracking)
router.get('/stats', checkDatabaseIntegrity, asyncHandler(async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Get overall discussion statistics
    const [threadStats, replyStats, recentActivity] = await Promise.all([
      // Thread statistics
      DiscussThread.aggregate([
        {
          $group: {
            _id: null,
            totalThreads: { $sum: 1 },
            totalUpvotes: { $sum: '$upvotes' },
            totalDownvotes: { $sum: '$downvotes' },
            avgRepliesPerThread: { $avg: '$repliesCount' },
            mostActiveThread: { $max: '$repliesCount' }
          }
        }
      ]),
      
      // Reply statistics
      DiscussReply.aggregate([
        {
          $group: {
            _id: null,
            totalReplies: { $sum: 1 },
            totalReplyUpvotes: { $sum: '$upvotes' },
            totalReplyDownvotes: { $sum: '$downvotes' }
          }
        }
      ]),
      
      // Recent activity (last 7 days)
      DiscussThread.find({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
        .select('title createdAt repliesCount')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);
    
    // Get popular tags
    const popularTags = await DiscussThread.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const queryTime = Date.now() - startTime;
    performanceMonitor.recordQuery(queryTime, 'DiscussThread.stats');
    
    res.json({
      success: true,
      stats: {
        threads: threadStats[0] || {
          totalThreads: 0,
          totalUpvotes: 0,
          totalDownvotes: 0,
          avgRepliesPerThread: 0,
          mostActiveThread: 0
        },
        replies: replyStats[0] || {
          totalReplies: 0,
          totalReplyUpvotes: 0,
          totalReplyDownvotes: 0
        },
        popularTags,
        recentActivity
      }
    });
  } catch (err) {
    console.error('Error fetching discuss stats:', err);
    res.status(500).json({ message: 'Failed to fetch discussion statistics', error: err.message });
  }
}));

module.exports = router;


