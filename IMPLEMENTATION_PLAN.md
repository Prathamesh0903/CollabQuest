# Implementation Plan for DSA Sheet, Contest, and Discuss Pages

## Overview
This document outlines the plan to implement three major features in the CollabQuest platform:
1. DSA Sheet Page
2. Contest Page
3. Discuss Page

## Phase 1: DSA Sheet Page

### Components to Create:
1. `DSASheet.tsx` - Main component for the DSA Sheet page
   - Displays a list of DSA topics (Arrays, Strings, Linked Lists, etc.)
   - Each topic expands to show problems
   - Progress tracking for each problem
   - Search and filter functionality

2. `ProblemCard.tsx` - Reusable component for each problem
   - Problem title and difficulty
   - Completion status
   - Link to solve (opens in editor)
   - Tags and categories

3. `ProgressTracker.tsx` - Shows user's progress
   - Total problems solved
   - Progress by difficulty
   - Streak counter

### API Endpoints Needed:
- `GET /api/dsa-sheet` - Get all DSA problems
- `POST /api/dsa-sheet/progress` - Update problem status
- `GET /api/dsa-sheet/progress` - Get user's progress

## Phase 2: Contest Page

### Components to Create:
1. `ContestList.tsx` - Shows upcoming and past contests
   - Contest cards with details
   - Registration status
   - Countdown timer

2. `ContestDetail.tsx` - Detailed view of a single contest
   - Problem list
   - Leaderboard
   - Submission status
   - Timer

3. `Leaderboard.tsx` - Shows contest rankings
   - User rankings
   - Score distribution
   - Problem-wise performance

### API Endpoints Needed:
- `GET /api/contests` - Get all contests
- `GET /api/contests/:id` - Get contest details
- `POST /api/contests/:id/register` - Register for contest
- `GET /api/contests/:id/leaderboard` - Get contest leaderboard

## Phase 3: Discuss Page

### Components to Create:
1. `DiscussHome.tsx` - Main discussion forum
   - List of discussion threads
   - Categories/tags
   - Search functionality

2. `ThreadList.tsx` - Shows threads in a category
   - Thread previews
   - Sort by date/activity/votes
   - Pagination

3. `ThreadDetail.tsx` - Single thread view
   - Original post
   - Comments and replies
   - Upvote/downvote
   - Mark as solution

4. `CreateThread.tsx` - Form to create new discussion
   - Title, content, tags
   - Code snippets
   - Preview mode

### API Endpoints Needed:
- `GET /api/discuss/threads` - Get threads
- `POST /api/discuss/threads` - Create thread
- `GET /api/discuss/threads/:id` - Get thread details
- `POST /api/discuss/threads/:id/comments` - Add comment
- `POST /api/discuss/comments/:id/vote` - Vote on comment

## Implementation Order
1. Set up basic routing for all three pages
2. Implement DSA Sheet page (Phase 1)
3. Implement Contest page (Phase 2)
4. Implement Discuss page (Phase 3)
5. Add integration between pages
6. Testing and refinement

## File Structure
```
src/
  components/
    DSASheet/
      DSASheet.tsx
      ProblemCard.tsx
      ProgressTracker.tsx
    Contest/
      ContestList.tsx
      ContestDetail.tsx
      Leaderboard.tsx
    Discuss/
      DiscussHome.tsx
      ThreadList.tsx
      ThreadDetail.tsx
      CreateThread.tsx
```

## First Steps
1. Create the basic file structure
2. Set up routing for the new pages
3. Create placeholder components
4. Implement DSA Sheet page first
