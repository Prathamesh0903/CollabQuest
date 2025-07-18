import React from 'react';
import { useParams } from 'react-router-dom';
import BattleSplitView from './BattleSplitView';

const BattleRoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();

  // TODO: Fetch room info, problem, participants, etc. using roomCode
  // For now, use placeholder values
  return (
    <div>
      <BattleSplitView
        problemMarkdown={"Loading problem..."} // TODO: Replace with fetched problem
        initialCode={""}
        language={"javascript"}
        roomId={roomCode || ""}
        socket={null}
        testResults={null}
        leaderboard={[]}
        onRunCode={() => {}}
        timerSeconds={0}
      />
    </div>
  );
};

export default BattleRoomPage; 