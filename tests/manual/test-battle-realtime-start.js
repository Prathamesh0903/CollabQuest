const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';
const SOCKET_BASE = process.env.SOCKET_BASE || 'http://localhost:5001';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('\n🧪 Real-time Battle Start Test');

  let roomId, roomCode;

  try {
    console.log('1) Creating battle room...');
    const createRes = await axios.post(`${API_BASE}/battle/create`, {
      difficulty: 'Easy',
      questionSelection: 'selected',
      selectedProblem: 'two-sum',
      battleTime: 1
    });
    if (!createRes.data?.success) throw new Error('Create failed');
    roomId = createRes.data.roomId;
    roomCode = createRes.data.roomCode;
    console.log(`   ✅ Created roomId=${roomId}, code=${roomCode}`);

    console.log('2) Joining via REST as two users (DB + state)...');
    await axios.post(`${API_BASE}/battle/join`, { roomCode }, { headers: { 'x-user-id': '507f1f77bcf86cd799439011' } });
    await axios.post(`${API_BASE}/battle/join`, { roomCode }, { headers: { 'x-user-id': '507f1f77bcf86cd799439012' } });
    console.log('   ✅ REST joins completed');

    console.log('3) Connecting sockets and joining room...');
    const socket1 = io(SOCKET_BASE, { auth: { token: 'test-1' } });
    const socket2 = io(SOCKET_BASE, { auth: { token: 'test-2' } });

    const s1 = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('socket1 timeout')), 5000);
      socket1.on('connect', () => {
        socket1.emit('join-room', { roomId, mode: 'battle' });
      });
      socket1.on('room-joined', () => { clearTimeout(timeout); resolve(); });
      socket1.on('error', (e) => { /* ignore */ });
    });

    const s2 = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('socket2 timeout')), 5000);
      socket2.on('connect', () => {
        socket2.emit('join-room', { roomId, mode: 'battle' });
      });
      socket2.on('room-joined', () => { clearTimeout(timeout); resolve(); });
      socket2.on('error', (e) => { /* ignore */ });
    });

    await Promise.all([s1, s2]);
    console.log('   ✅ Both sockets joined room');

    // Prepare listeners for battle-started
    const started1 = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('socket1 did not receive battle-started')), 7000);
      socket1.on('battle-started', (payload) => {
        try {
          if (!payload || payload.roomId !== roomId) return;
          clearTimeout(timeout);
          resolve(payload);
        } catch (e) { reject(e); }
      });
    });

    const started2 = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('socket2 did not receive battle-started')), 7000);
      socket2.on('battle-started', (payload) => {
        try {
          if (!payload || payload.roomId !== roomId) return;
          clearTimeout(timeout);
          resolve(payload);
        } catch (e) { reject(e); }
      });
    });

    console.log('4) Starting battle via REST...');
    const startRes = await axios.post(`${API_BASE}/battle/${roomId}/start`);
    if (!startRes.data?.success) throw new Error('Start failed');
    console.log('   ✅ Start endpoint responded');

    const [p1, p2] = await Promise.all([started1, started2]);
    console.log('5) ✅ Both sockets received battle-started');
    console.log('   socket1 payload:', p1);
    console.log('   socket2 payload:', p2);

    socket1.disconnect();
    socket2.disconnect();
    console.log('\n🎉 Real-time Battle Start Test PASSED');
  } catch (err) {
    console.error('\n❌ Real-time Battle Start Test FAILED');
    console.error(err?.response?.data || err);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run();
}


