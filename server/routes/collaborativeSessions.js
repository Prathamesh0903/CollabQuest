const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const CollaborativeSession = require('../models/CollaborativeSession');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Validation middleware
const validateSession = [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Session name is required and must be less than 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('type').optional().isIn(['collaborative', 'battle', 'presentation', 'tutorial', 'workshop']).withMessage('Invalid session type'),
  body('mode').optional().isIn(['real-time', 'version-control', 'read-only']).withMessage('Invalid session mode'),
  body('defaultLanguage').optional().isIn(['javascript', 'python', 'java', 'cpp', 'csharp', 'typescript', 'go', 'rust', 'php', 'ruby']).withMessage('Invalid language'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('category').optional().trim().isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Invalid difficulty level')
];

const validateFile = [
  body('fileName').trim().isLength({ min: 1, max: 100 }).withMessage('File name is required and must be less than 100 characters'),
  body('language').isIn(['javascript', 'python', 'java', 'cpp', 'csharp', 'typescript', 'go', 'rust', 'php', 'ruby', 'html', 'css', 'json', 'markdown']).withMessage('Invalid language'),
  body('content').optional().isString().withMessage('Content must be a string')
];

const validateCollaborator = [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('role').optional().isIn(['owner', 'editor', 'viewer', 'guest']).withMessage('Invalid role'),
  body('permissions').optional().isObject().withMessage('Permissions must be an object')
];

// Helper function to check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// GET /api/collaborative-sessions - Get all sessions for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      isPublic,
      category,
      difficulty,
      search 
    } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by visibility
    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by difficulty
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Get sessions where user is creator or collaborator
    query.$or = [
      { createdBy: req.user._id },
      { 'collaborators.userId': req.user._id }
    ];

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { updatedAt: -1 },
      populate: [
        { path: 'createdBy', select: 'displayName avatar' },
        { path: 'collaborators.userId', select: 'displayName avatar' }
      ]
    };

    const sessions = await CollaborativeSession.paginate(query, options);

    res.json({
      success: true,
      data: sessions.docs,
      pagination: {
        page: sessions.page,
        limit: sessions.limit,
        totalDocs: sessions.totalDocs,
        totalPages: sessions.totalPages,
        hasNextPage: sessions.hasNextPage,
        hasPrevPage: sessions.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching collaborative sessions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch collaborative sessions',
      message: error.message 
    });
  }
});

// GET /api/collaborative-sessions/public - Get public sessions
router.get('/public', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category,
      difficulty,
      search 
    } = req.query;

    const query = {
      isPublic: true,
      status: 'active',
      isArchived: false
    };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by difficulty
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'createdBy', select: 'displayName avatar' },
        { path: 'collaborators.userId', select: 'displayName avatar' }
      ]
    };

    const sessions = await CollaborativeSession.paginate(query, options);

    res.json({
      success: true,
      data: sessions.docs,
      pagination: {
        page: sessions.page,
        limit: sessions.limit,
        totalDocs: sessions.totalDocs,
        totalPages: sessions.totalPages,
        hasNextPage: sessions.hasNextPage,
        hasPrevPage: sessions.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching public sessions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch public sessions',
      message: error.message 
    });
  }
});

// POST /api/collaborative-sessions - Create a new collaborative session
router.post('/', auth, validateSession, handleValidationErrors, async (req, res) => {
  try {
    const {
      name,
      description,
      type = 'collaborative',
      mode = 'real-time',
      defaultLanguage = 'javascript',
      isPublic = false,
      tags = [],
      category,
      difficulty = 'intermediate',
      settings = {},
      roomId,
      teamId
    } = req.body;

    // Generate unique session ID
    const sessionId = await CollaborativeSession.generateSessionId();

    // Create the session
    const session = new CollaborativeSession({
      sessionId,
      name,
      description,
      createdBy: req.user._id,
      type,
      mode,
      defaultLanguage,
      isPublic,
      tags,
      category,
      difficulty,
      settings: {
        maxCollaborators: settings.maxCollaborators || 20,
        allowCodeExecution: settings.allowCodeExecution !== false,
        allowFileCreation: settings.allowFileCreation !== false,
        allowFileDeletion: settings.allowFileDeletion !== false,
        requireApproval: settings.requireApproval || false,
        autoSave: settings.autoSave !== false,
        autoSaveInterval: settings.autoSaveInterval || 30
      },
      roomId,
      teamId
    });

    // Add creator as owner collaborator
    await session.addCollaborator(req.user._id, 'owner', {
      canEdit: true,
      canExecute: true,
      canCreateFiles: true,
      canDeleteFiles: true,
      canInvite: true
    });

    // Add default file
    await session.addFile('main.js', defaultLanguage, '', req.user._id);

    await session.save();

    // Populate creator info
    await session.populate('createdBy', 'displayName avatar');

    // Generate sharable URL
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const sharableUrl = `${baseUrl}/collaborative-session/${sessionId}`;

    res.status(201).json({
      success: true,
      data: session,
      sharableUrl,
      message: 'Collaborative session created successfully'
    });
  } catch (error) {
    console.error('Error creating collaborative session:', error);
    res.status(500).json({ 
      error: 'Failed to create collaborative session',
      message: error.message 
    });
  }
});

// GET /api/collaborative-sessions/:sessionId - Get a specific session
router.get('/:sessionId', auth, [
  param('sessionId').isLength({ min: 8, max: 8 }).withMessage('Session ID must be 8 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await CollaborativeSession.findBySessionId(sessionId)
      .populate('createdBy', 'displayName avatar')
      .populate('collaborators.userId', 'displayName avatar')
      .populate('roomId', 'name roomCode')
      .populate('teamId', 'name');

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if user has access to this session
    const isCreator = session.createdBy._id.toString() === req.user._id.toString();
    const isCollaborator = session.collaborators.some(c => 
      c.userId._id.toString() === req.user._id.toString()
    );

    if (!isCreator && !isCollaborator && !session.isPublic) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ 
      error: 'Failed to fetch session',
      message: error.message 
    });
  }
});

// PUT /api/collaborative-sessions/:sessionId - Update a session
router.put('/:sessionId', auth, validateSession, handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;

    const session = await CollaborativeSession.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if user is the creator
    if (session.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Only the session creator can update the session' 
      });
    }

    // Update session
    Object.assign(session, updateData);
    await session.save();

    await session.populate('createdBy', 'displayName avatar');

    res.json({
      success: true,
      data: session,
      message: 'Session updated successfully'
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ 
      error: 'Failed to update session',
      message: error.message 
    });
  }
});

// DELETE /api/collaborative-sessions/:sessionId - Delete a session
router.delete('/:sessionId', auth, [
  param('sessionId').isLength({ min: 8, max: 8 }).withMessage('Session ID must be 8 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await CollaborativeSession.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if user is the creator
    if (session.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Only the session creator can delete the session' 
      });
    }

    // Soft delete by archiving
    session.status = 'archived';
    session.isArchived = true;
    await session.save();

    res.json({
      success: true,
      message: 'Session archived successfully'
    });
  } catch (error) {
    console.error('Error archiving session:', error);
    res.status(500).json({ 
      error: 'Failed to archive session',
      message: error.message 
    });
  }
});

// POST /api/collaborative-sessions/:sessionId/join - Join a session
router.post('/:sessionId/join', auth, [
  param('sessionId').isLength({ min: 8, max: 8 }).withMessage('Session ID must be 8 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { accessCode } = req.body;

    const session = await CollaborativeSession.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if session is active
    if (session.status !== 'active') {
      return res.status(400).json({ 
        error: 'Session is not active' 
      });
    }

    // Check access code if required
    if (session.accessCode && session.accessCode !== accessCode) {
      return res.status(403).json({ 
        error: 'Invalid access code' 
      });
    }

    // Check if access code is expired
    if (session.accessCodeExpiresAt && new Date() > session.accessCodeExpiresAt) {
      return res.status(403).json({ 
        error: 'Access code has expired' 
      });
    }

    // Check if user is already a collaborator
    const existingCollaborator = session.collaborators.find(c => 
      c.userId.toString() === req.user._id.toString()
    );

    if (existingCollaborator) {
      // Update online status
      existingCollaborator.isOnline = true;
      existingCollaborator.lastActive = new Date();
      await session.save();

      return res.json({
        success: true,
        data: session,
        message: 'Rejoined session successfully'
      });
    }

    // Add user as collaborator
    await session.addCollaborator(req.user._id, 'editor');
    await session.addActivityRecord(req.user._id, 'join');

    await session.populate('createdBy', 'displayName avatar');
    await session.populate('collaborators.userId', 'displayName avatar');

    res.json({
      success: true,
      data: session,
      message: 'Joined session successfully'
    });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ 
      error: 'Failed to join session',
      message: error.message 
    });
  }
});

// POST /api/collaborative-sessions/:sessionId/leave - Leave a session
router.post('/:sessionId/leave', auth, [
  param('sessionId').isLength({ min: 8, max: 8 }).withMessage('Session ID must be 8 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await CollaborativeSession.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if user is a collaborator
    const collaborator = session.collaborators.find(c => 
      c.userId.toString() === req.user._id.toString()
    );

    if (!collaborator) {
      return res.status(400).json({ 
        error: 'You are not a collaborator in this session' 
      });
    }

    // Remove user from session
    await session.removeCollaborator(req.user._id);
    await session.addActivityRecord(req.user._id, 'leave');

    res.json({
      success: true,
      message: 'Left session successfully'
    });
  } catch (error) {
    console.error('Error leaving session:', error);
    res.status(500).json({ 
      error: 'Failed to leave session',
      message: error.message 
    });
  }
});

// POST /api/collaborative-sessions/:sessionId/files - Add a new file
router.post('/:sessionId/files', auth, validateFile, handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { fileName, language, content } = req.body;

    const session = await CollaborativeSession.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if user is a collaborator with file creation permission
    const collaborator = session.collaborators.find(c => 
      c.userId.toString() === req.user._id.toString()
    );

    if (!collaborator) {
      return res.status(403).json({ 
        error: 'You are not a collaborator in this session' 
      });
    }

    if (!collaborator.permissions.canCreateFiles) {
      return res.status(403).json({ 
        error: 'You do not have permission to create files' 
      });
    }

    // Check if file already exists
    const existingFile = session.files.find(f => 
      f.fileName === fileName && f.isActive
    );

    if (existingFile) {
      return res.status(400).json({ 
        error: 'File already exists' 
      });
    }

    // Add file
    await session.addFile(fileName, language, content, req.user._id);
    await session.addActivityRecord(req.user._id, 'create_file', fileName);

    res.status(201).json({
      success: true,
      data: session.files[session.files.length - 1],
      message: 'File created successfully'
    });
  } catch (error) {
    console.error('Error creating file:', error);
    res.status(500).json({ 
      error: 'Failed to create file',
      message: error.message 
    });
  }
});

// PUT /api/collaborative-sessions/:sessionId/files/:fileName - Update a file
router.put('/:sessionId/files/:fileName', auth, [
  param('sessionId').isLength({ min: 8, max: 8 }).withMessage('Session ID must be 8 characters'),
  body('content').isString().withMessage('Content must be a string')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId, fileName } = req.params;
    const { content } = req.body;

    const session = await CollaborativeSession.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if user is a collaborator with edit permission
    const collaborator = session.collaborators.find(c => 
      c.userId.toString() === req.user._id.toString()
    );

    if (!collaborator) {
      return res.status(403).json({ 
        error: 'You are not a collaborator in this session' 
      });
    }

    if (!collaborator.permissions.canEdit) {
      return res.status(403).json({ 
        error: 'You do not have permission to edit files' 
      });
    }

    // Check if file exists
    const file = session.files.find(f => 
      f.fileName === fileName && f.isActive
    );

    if (!file) {
      return res.status(404).json({ 
        error: 'File not found' 
      });
    }

    // Update file
    await session.updateFile(fileName, content, req.user._id);
    await session.addActivityRecord(req.user._id, 'edit', fileName);

    res.json({
      success: true,
      data: file,
      message: 'File updated successfully'
    });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ 
      error: 'Failed to update file',
      message: error.message 
    });
  }
});

// DELETE /api/collaborative-sessions/:sessionId/files/:fileName - Delete a file
router.delete('/:sessionId/files/:fileName', auth, [
  param('sessionId').isLength({ min: 8, max: 8 }).withMessage('Session ID must be 8 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId, fileName } = req.params;

    const session = await CollaborativeSession.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if user is a collaborator with delete permission
    const collaborator = session.collaborators.find(c => 
      c.userId.toString() === req.user._id.toString()
    );

    if (!collaborator) {
      return res.status(403).json({ 
        error: 'You are not a collaborator in this session' 
      });
    }

    if (!collaborator.permissions.canDeleteFiles) {
      return res.status(403).json({ 
        error: 'You do not have permission to delete files' 
      });
    }

    // Check if file exists
    const file = session.files.find(f => 
      f.fileName === fileName && f.isActive
    );

    if (!file) {
      return res.status(404).json({ 
        error: 'File not found' 
      });
    }

    // Delete file (soft delete)
    await session.deleteFile(fileName);
    await session.addActivityRecord(req.user._id, 'delete_file', fileName);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      error: 'Failed to delete file',
      message: error.message 
    });
  }
});

// POST /api/collaborative-sessions/:sessionId/collaborators - Add a collaborator
router.post('/:sessionId/collaborators', auth, validateCollaborator, handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, role = 'editor', permissions = {} } = req.body;

    const session = await CollaborativeSession.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if user is the creator or has invite permission
    const currentCollaborator = session.collaborators.find(c => 
      c.userId.toString() === req.user._id.toString()
    );

    if (!currentCollaborator || (!currentCollaborator.permissions.canInvite && session.createdBy.toString() !== req.user._id.toString())) {
      return res.status(403).json({ 
        error: 'You do not have permission to add collaborators' 
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Add collaborator
    await session.addCollaborator(userId, role, permissions);

    await session.populate('collaborators.userId', 'displayName avatar');

    res.json({
      success: true,
      data: session.collaborators[session.collaborators.length - 1],
      message: 'Collaborator added successfully'
    });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ 
      error: 'Failed to add collaborator',
      message: error.message 
    });
  }
});

// DELETE /api/collaborative-sessions/:sessionId/collaborators/:userId - Remove a collaborator
router.delete('/:sessionId/collaborators/:userId', auth, [
  param('sessionId').isLength({ min: 8, max: 8 }).withMessage('Session ID must be 8 characters'),
  param('userId').isMongoId().withMessage('Valid user ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId, userId } = req.params;

    const session = await CollaborativeSession.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if user is the creator
    if (session.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Only the session creator can remove collaborators' 
      });
    }

    // Check if trying to remove the creator
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ 
        error: 'Cannot remove the session creator' 
      });
    }

    // Remove collaborator
    await session.removeCollaborator(userId);

    res.json({
      success: true,
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ 
      error: 'Failed to remove collaborator',
      message: error.message 
    });
  }
});

// GET /api/collaborative-sessions/:sessionId/execution-history - Get execution history
router.get('/:sessionId/execution-history', auth, [
  param('sessionId').isLength({ min: 8, max: 8 }).withMessage('Session ID must be 8 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const session = await CollaborativeSession.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if user has access
    const isCreator = session.createdBy.toString() === req.user._id.toString();
    const isCollaborator = session.collaborators.some(c => 
      c.userId.toString() === req.user._id.toString()
    );

    if (!isCreator && !isCollaborator && !session.isPublic) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Paginate execution history
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const executionHistory = session.executionHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(startIndex, endIndex);

    // Populate user info for executions
    await session.populate('executionHistory.executedBy', 'displayName avatar');

    res.json({
      success: true,
      data: executionHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: session.executionHistory.length,
        totalPages: Math.ceil(session.executionHistory.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching execution history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch execution history',
      message: error.message 
    });
  }
});

// GET /api/collaborative-sessions/:sessionId/share-url - Get sharable URL for session
router.get('/:sessionId/share-url', auth, [
  param('sessionId').isLength({ min: 8, max: 8 }).withMessage('Session ID must be 8 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await CollaborativeSession.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if user has access to this session
    const isCreator = session.createdBy.toString() === req.user._id.toString();
    const isCollaborator = session.collaborators.some(c => 
      c.userId.toString() === req.user._id.toString()
    );

    if (!isCreator && !isCollaborator && !session.isPublic) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Generate sharable URL
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const sharableUrl = `${baseUrl}/collaborative-session/${sessionId}`;

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        name: session.name,
        sharableUrl,
        isPublic: session.isPublic,
        accessCode: session.accessCode,
        accessCodeExpiresAt: session.accessCodeExpiresAt
      }
    });
  } catch (error) {
    console.error('Error getting share URL:', error);
    res.status(500).json({ 
      error: 'Failed to get share URL',
      message: error.message 
    });
  }
});

// GET /api/collaborative-sessions/:sessionId/activity - Get user activity
router.get('/:sessionId/activity', auth, [
  param('sessionId').isLength({ min: 8, max: 8 }).withMessage('Session ID must be 8 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const session = await CollaborativeSession.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if user has access
    const isCreator = session.createdBy.toString() === req.user._id.toString();
    const isCollaborator = session.collaborators.some(c => 
      c.userId.toString() === req.user._id.toString()
    );

    if (!isCreator && !isCollaborator && !session.isPublic) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Paginate user activity
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const userActivity = session.userActivity
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(startIndex, endIndex);

    // Populate user info for activities
    await session.populate('userActivity.userId', 'displayName avatar');

    res.json({
      success: true,
      data: userActivity,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: session.userActivity.length,
        totalPages: Math.ceil(session.userActivity.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user activity',
      message: error.message 
    });
  }
});

// POST /api/collaborative-sessions/:sessionId/access-code - Set access code for private session
router.post('/:sessionId/access-code', auth, [
  param('sessionId').isLength({ min: 8, max: 8 }).withMessage('Session ID must be 8 characters'),
  body('accessCode').isLength({ min: 4, max: 8 }).withMessage('Access code must be between 4-8 characters'),
  body('expiresInHours').optional().isInt({ min: 1, max: 168 }).withMessage('Expiration must be between 1-168 hours')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { accessCode, expiresInHours = 24 } = req.body;

    const session = await CollaborativeSession.findBySessionId(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Check if user is the creator
    if (session.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Only the session creator can set access codes' 
      });
    }

    // Set access code and expiration
    session.accessCode = accessCode.toUpperCase();
    session.accessCodeExpiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000));

    await session.save();

    // Generate updated sharable URL
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const sharableUrl = `${baseUrl}/collaborative-session/${sessionId}`;

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        name: session.name,
        sharableUrl,
        accessCode: session.accessCode,
        accessCodeExpiresAt: session.accessCodeExpiresAt,
        expiresInHours
      },
      message: 'Access code set successfully'
    });
  } catch (error) {
    console.error('Error setting access code:', error);
    res.status(500).json({ 
      error: 'Failed to set access code',
      message: error.message 
    });
  }
});

module.exports = router;
