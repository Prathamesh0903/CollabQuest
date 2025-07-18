const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Room = require('../models/Room');
const { auth } = require('../middleware/auth');

// Get messages for a room
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Verify user has access to the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is a participant in the room
    const isParticipant = room.participants.some(
      p => p.userId.toString() === req.user._id.toString() && p.isActive
    );
    
    if (!isParticipant && room.type === 'private') {
      return res.status(403).json({ error: 'Access denied to private room' });
    }

    // Get messages
    const messages = await Message.getRoomMessages(roomId, parseInt(limit), parseInt(skip));
    
    // Reverse to get chronological order
    const chronologicalMessages = messages.reverse();

    res.json({
      messages: chronologicalMessages,
      hasMore: messages.length === parseInt(limit),
      total: await Message.countDocuments({ roomId, isDeleted: false })
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a new message
router.post('/room/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, type = 'text', metadata = {} } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    }

    // Verify user has access to the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is a participant in the room
    const isParticipant = room.participants.some(
      p => p.userId.toString() === req.user._id.toString() && p.isActive
    );
    
    if (!isParticipant && room.type === 'private') {
      return res.status(403).json({ error: 'Access denied to private room' });
    }

    // Create new message
    const message = new Message({
      roomId,
      sender: {
        userId: req.user._id,
        displayName: req.user.displayName || req.user.email,
        avatar: req.user.avatar
      },
      content: content.trim(),
      type,
      metadata
    });

    await message.save();

    // Update room stats
    room.stats.messagesSent += 1;
    await room.save();

    // Populate sender info for response
    await message.populate('sender.userId', 'displayName avatar');

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Edit a message
router.put('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    }

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    // Check if message is too old to edit (e.g., 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (message.timestamp < fiveMinutesAgo) {
      return res.status(400).json({ error: 'Message is too old to edit' });
    }

    // Edit message
    await message.editMessage(content.trim());
    await message.populate('sender.userId', 'displayName avatar');

    res.json({
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Delete a message (soft delete)
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender or has admin privileges
    const isSender = message.sender.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin'; // Assuming user has role field

    if (!isSender && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    // Soft delete message
    await message.deleteMessage();

    res.json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Add/remove reaction to a message
router.post('/:messageId/reactions', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Add/remove reaction
    await message.addReaction(req.user._id, emoji, req.user.displayName || req.user.email);
    await message.populate('sender.userId', 'displayName avatar');

    res.json({
      message: 'Reaction updated successfully',
      data: message
    });
  } catch (error) {
    console.error('Error updating reaction:', error);
    res.status(500).json({ error: 'Failed to update reaction' });
  }
});

// Get recent messages for a room (last 24 hours)
router.get('/room/:roomId/recent', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { hours = 24 } = req.query;

    // Verify user has access to the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is a participant in the room
    const isParticipant = room.participants.some(
      p => p.userId.toString() === req.user._id.toString() && p.isActive
    );
    
    if (!isParticipant && room.type === 'private') {
      return res.status(403).json({ error: 'Access denied to private room' });
    }

    // Get recent messages
    const messages = await Message.getRecentMessages(roomId, parseInt(hours));
    
    // Reverse to get chronological order
    const chronologicalMessages = messages.reverse();

    res.json({
      messages: chronologicalMessages,
      hours: parseInt(hours)
    });
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    res.status(500).json({ error: 'Failed to fetch recent messages' });
  }
});

module.exports = router; 