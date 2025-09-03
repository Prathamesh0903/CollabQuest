const io = require('socket.io-client');

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testNames() {
  console.log('🧪 Verifying collaborator names reflect login/displayName...');

  const roomId = 'name-room-1';
  const url = 'http://localhost:5001';

  const alice = io(url, { auth: { token: 'dev-token-alice' } });
  const bob = io(url, { auth: { token: 'dev-token-bob' } });

  const aliceName = 'Alice Tester';
  const bobName = 'Bob Reviewer';

  let usersSeenByAlice = [];
  let usersSeenByBob = [];
  let aliceSawBobJoinName = null;
  let bobSawAliceJoinName = null;

  const done = async () => {
    await delay(300);
    alice.disconnect();
    bob.disconnect();
  };

  // Listen for roster updates
  alice.on('users-in-room', (users) => {
    usersSeenByAlice = users.map((u) => u.displayName);
  });
  bob.on('users-in-room', (users) => {
    usersSeenByBob = users.map((u) => u.displayName);
  });

  // Listen for join notifications
  alice.on('user-joined-room', (data) => {
    aliceSawBobJoinName = data.displayName;
  });
  bob.on('user-joined-room', (data) => {
    bobSawAliceJoinName = data.displayName;
  });

  // Connect and join with explicit userInfo
  await new Promise((resolve) => {
    alice.on('connect', () => {
      alice.emit('join-collab-room', {
        roomId,
        language: 'javascript',
        userInfo: { displayName: aliceName, avatar: '' }
      });
      resolve();
    });
  });

  await delay(300);

  await new Promise((resolve) => {
    bob.on('connect', () => {
      bob.emit('join-collab-room', {
        roomId,
        language: 'javascript',
        userInfo: { displayName: bobName, avatar: '' }
      });
      resolve();
    });
  });

  await delay(1000);

  const aliceHasBoth = usersSeenByAlice.includes(aliceName) && usersSeenByAlice.includes(bobName);
  const bobHasBoth = usersSeenByBob.includes(aliceName) && usersSeenByBob.includes(bobName);
  const joinsCorrect = aliceSawBobJoinName === bobName && (!bobSawAliceJoinName || bobSawAliceJoinName === aliceName);

  const pass = aliceHasBoth && bobHasBoth && joinsCorrect;

  if (pass) {
    console.log('✅ Names verified in presence and join events:', usersSeenByAlice);
  } else {
    console.error('❌ Name verification failed');
    console.error('  usersSeenByAlice:', usersSeenByAlice);
    console.error('  usersSeenByBob  :', usersSeenByBob);
    console.error('  aliceSawBobJoinName:', aliceSawBobJoinName);
    console.error('  bobSawAliceJoinName:', bobSawAliceJoinName);
    process.exitCode = 1;
  }

  await done();
}

testNames().catch((e) => {
  console.error('❌ Test error:', e);
  process.exit(1);
});


