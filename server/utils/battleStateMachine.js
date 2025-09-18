const Room = require('../models/Room');
const roomStateManager = require('./roomStateManager');

// Simple battle state utilities to keep server authoritative
async function getBattleState(roomId) {
  const state = await roomStateManager.getRoomState(roomId);
  return state && state.battle ? { state, battle: state.battle } : { state, battle: null };
}

async function setUserReady(roomId, userId, ready) {
  const { state, battle } = await getBattleState(roomId);
  if (!state) throw new Error('Room state not found');
  const currentBattle = battle || {};
  const readyMap = currentBattle.ready || {};
  readyMap[userId] = Boolean(ready);
  await roomStateManager.updateRoomState(roomId, { battle: { ...currentBattle, ready: readyMap } });
  return { ...currentBattle, ready: readyMap };
}

async function isHost(roomId, userId) {
  try {
    const room = await Room.findById(roomId).select('createdBy participants');
    if (!room) return false;
    if (room.createdBy && room.createdBy.toString() === userId) return true;
    return room.participants?.some(p => p.userId?.toString() === userId && p.role === 'host');
  } catch (_) {
    return false;
  }
}

async function beginCountdown(io, roomId, seconds = 5) {
  for (let s = seconds; s > 0; s -= 1) {
    io.in(`room:${roomId}`).emit('battle:countdown', { roomId, seconds: s });
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, 1000));
  }
}

async function startBattle(io, roomId) {
  const { state, battle } = await getBattleState(roomId);
  if (!state) throw new Error('Room state not found');
  const durationMinutes = (battle && battle.durationMinutes) || 10;
  const startedAt = new Date();
  const updated = {
    ...(battle || {}),
    started: true,
    startedAt,
    ended: false,
    endedAt: null
  };
  await roomStateManager.updateRoomState(roomId, { battle: updated });
  io.in(`room:${roomId}`).emit('battle:start', { roomId, startedAt, duration: durationMinutes * 60 });
  if (typeof roomStateManager.scheduleBattleEnd === 'function') {
    roomStateManager.scheduleBattleEnd(roomId, durationMinutes * 60 * 1000);
  }
  return updated;
}

module.exports = {
  getBattleState,
  setUserReady,
  isHost,
  beginCountdown,
  startBattle
};


