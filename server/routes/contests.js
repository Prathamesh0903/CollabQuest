const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Contest = require('../models/Contest');
const ContestParticipant = require('../models/ContestParticipant');
const { optionalAuth, auth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// List contests (public)
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const now = new Date();
    const { status } = req.query; // upcoming | live | ended | all
    const query = { isArchived: false, visibility: 'public' };

    if (status === 'upcoming') query.startTime = { $gt: now };
    else if (status === 'live') query.startTime = { $lte: now }, (query.endTime = { $gte: now });
    else if (status === 'ended') query.endTime = { $lt: now };

    const contests = await Contest.find(query).sort({ startTime: -1 });
    res.json({ contests });
  })
);

// Get contest detail (public)
router.get(
  '/:contestId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const contest = await Contest.findById(contestId);
    if (!contest || contest.isArchived) return res.status(404).json({ error: 'Contest not found' });
    res.json({ contest });
  })
);

// Admin: create contest
router.post(
  '/',
  auth,
  requireRole(['admin', 'teacher']),
  asyncHandler(async (req, res) => {
    const payload = req.body;
    payload.createdBy = req.user._id;
    const contest = await Contest.create(payload);
    res.status(201).json({ contest });
  })
);

// Admin: update contest
router.put(
  '/:contestId',
  auth,
  requireRole(['admin', 'teacher']),
  asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const update = req.body;
    const contest = await Contest.findByIdAndUpdate(contestId, update, { new: true });
    if (!contest) return res.status(404).json({ error: 'Contest not found' });
    res.json({ contest });
  })
);

// Admin: archive contest
router.delete(
  '/:contestId',
  auth,
  requireRole(['admin', 'teacher']),
  asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const contest = await Contest.findByIdAndUpdate(contestId, { isArchived: true }, { new: true });
    if (!contest) return res.status(404).json({ error: 'Contest not found' });
    res.json({ contest });
  })
);

// Join contest
router.post(
  '/:contestId/join',
  auth,
  asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const contest = await Contest.findById(contestId);
    if (!contest || contest.isArchived) return res.status(404).json({ error: 'Contest not found' });

    const now = new Date();
    if (now > contest.endTime) return res.status(400).json({ error: 'Contest ended' });

    if (contest.maxParticipants > 0) {
      const count = await ContestParticipant.countDocuments({ contestId });
      if (count >= contest.maxParticipants) return res.status(400).json({ error: 'Contest is full' });
    }

    const participant = await ContestParticipant.findOneAndUpdate(
      { contestId, userId: req.user._id },
      { $setOnInsert: { contestId, userId: req.user._id, scores: [] } },
      { upsert: true, new: true }
    );

    res.status(200).json({ participant });
  })
);

// Submit score for a problem
router.post(
  '/:contestId/submit',
  auth,
  asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const { problemId, pointsAwarded, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({ error: 'Invalid problemId' });
    }

    const contest = await Contest.findById(contestId);
    if (!contest || contest.isArchived) return res.status(404).json({ error: 'Contest not found' });

    const now = new Date();
    if (now < contest.startTime) return res.status(400).json({ error: 'Contest not started' });
    if (now > contest.endTime) return res.status(400).json({ error: 'Contest ended' });

    const participant = await ContestParticipant.findOne({ contestId, userId: req.user._id });
    if (!participant) return res.status(400).json({ error: 'Join contest first' });
    if (participant.disqualified) return res.status(403).json({ error: 'Disqualified' });

    const problemIdx = participant.scores.findIndex((s) => String(s.problemId) === String(problemId));
    const newScore = {
      problemId,
      pointsAwarded: Math.max(0, Number(pointsAwarded || 0)),
      submittedAt: new Date(),
      status: status || 'accepted',
    };

    if (problemIdx >= 0) participant.scores[problemIdx] = newScore;
    else participant.scores.push(newScore);

    participant.submissionsCount += 1;
    participant.lastSubmissionAt = new Date();
    participant.totalScore = participant.scores.reduce((acc, s) => acc + (s.pointsAwarded || 0), 0);
    await participant.save();

    // Recompute cached marker (allow async aggregation elsewhere)
    await Contest.findByIdAndUpdate(contestId, { leaderboardLastComputedAt: new Date() });

    // Broadcast leaderboard update
    const io = req.app.get('io');
    if (io) io.to(`contest:${contestId}`).emit('contest:leaderboard:update');

    res.status(200).json({ participant });
  })
);

// Leaderboard (public read)
router.get(
  '/:contestId/leaderboard',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const top = Number(req.query.top || 50);
    const leaderboard = await ContestParticipant.find({ contestId, disqualified: { $ne: true } })
      .sort({ totalScore: -1, lastSubmissionAt: 1 })
      .limit(Math.min(200, Math.max(1, top)))
      .populate('userId', 'displayName avatar');
    res.json({ leaderboard });
  })
);

// Admin: disqualify participant
router.post(
  '/:contestId/disqualify',
  auth,
  requireRole(['admin', 'teacher']),
  asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const { userId } = req.body;
    const updated = await ContestParticipant.findOneAndUpdate(
      { contestId, userId },
      { disqualified: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Participant not found' });

    const io = req.app.get('io');
    if (io) io.to(`contest:${contestId}`).emit('contest:leaderboard:update');

    res.json({ participant: updated });
  })
);

module.exports = router;


