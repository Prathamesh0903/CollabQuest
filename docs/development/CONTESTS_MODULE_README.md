Weekly Contests Module
======================

Overview
--------
This module adds weekly coding contests with secure auth, role-based access, live leaderboard, and admin tools. It is production-ready and integrates with MongoDB and Socket.IO.

API
---
- GET /api/contests?status=upcoming|live|ended|all
- GET /api/contests/:contestId
- POST /api/contests (admin/teacher)
- PUT /api/contests/:contestId (admin/teacher)
- DELETE /api/contests/:contestId (archive) (admin/teacher)
- POST /api/contests/:contestId/join (auth)
- POST /api/contests/:contestId/submit (auth)
- GET /api/contests/:contestId/leaderboard
- POST /api/contests/:contestId/disqualify (admin/teacher)

Sockets
-------
- Client emits: contest:join, contest:leave
- Server emits: contest:leaderboard:update

Models
------
- Contest
- ContestParticipant

Setup
-----
1. Ensure MONGODB_URI and CLIENT_URL are set.
2. Server auto-registers routes and sockets.


