/**
 * DebugManager
 * Minimal collaborative debug state manager for battle rooms.
 * Tracks shared breakpoints, current execution line, and shared variables.
 */
class DebugManager {
  constructor() {
    this.rooms = new Map(); // roomId -> { breakpoints: Map<lineNumber, Set<userId>>, state: { line: number|null, variables: Object, isActive: boolean } }
  }

  ensureRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        breakpoints: new Map(),
        state: { line: null, variables: {}, isActive: false }
      });
    }
    return this.rooms.get(roomId);
  }

  setBreakpoint(roomId, userId, lineNumber) {
    const room = this.ensureRoom(roomId);
    if (!room.breakpoints.has(lineNumber)) room.breakpoints.set(lineNumber, new Set());
    room.breakpoints.get(lineNumber).add(userId);
    return this.serializeBreakpoints(room.breakpoints);
  }

  removeBreakpoint(roomId, userId, lineNumber) {
    const room = this.ensureRoom(roomId);
    if (room.breakpoints.has(lineNumber)) {
      room.breakpoints.get(lineNumber).delete(userId);
      if (room.breakpoints.get(lineNumber).size === 0) room.breakpoints.delete(lineNumber);
    }
    return this.serializeBreakpoints(room.breakpoints);
  }

  clearUserBreakpoints(roomId, userId) {
    const room = this.ensureRoom(roomId);
    for (const [line, set] of room.breakpoints.entries()) {
      set.delete(userId);
      if (set.size === 0) room.breakpoints.delete(line);
    }
    return this.serializeBreakpoints(room.breakpoints);
  }

  startDebug(roomId) {
    const room = this.ensureRoom(roomId);
    room.state.isActive = true;
    room.state.line = 1;
    room.state.variables = {};
    return room.state;
  }

  stopDebug(roomId) {
    const room = this.ensureRoom(roomId);
    room.state.isActive = false;
    room.state.line = null;
    return room.state;
  }

  /**
   * Simulate stepping: advance to next breakpoint line if any; otherwise increment line
   */
  step(roomId) {
    const room = this.ensureRoom(roomId);
    if (!room.state.isActive) return room.state;
    const current = room.state.line || 1;
    const nextBp = Array.from(room.breakpoints.keys()).sort((a,b)=>a-b).find(l => l > current);
    room.state.line = nextBp || current + 1;
    return room.state;
  }

  continue(roomId) {
    return this.step(roomId);
  }

  updateVariables(roomId, vars) {
    const room = this.ensureRoom(roomId);
    room.state.variables = { ...(room.state.variables || {}), ...(vars || {}) };
    return room.state;
  }

  getState(roomId) {
    return this.ensureRoom(roomId).state;
  }

  getBreakpoints(roomId) {
    return this.serializeBreakpoints(this.ensureRoom(roomId).breakpoints);
  }

  serializeBreakpoints(map) {
    return Array.from(map.entries()).map(([lineNumber, userSet]) => ({
      lineNumber,
      users: Array.from(userSet)
    }));
  }
}

module.exports = new DebugManager();



