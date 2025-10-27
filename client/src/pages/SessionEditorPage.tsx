import React from 'react';
import { useParams } from 'react-router-dom';
import CollaborativeEditor from '../components/CollaborativeEditor';

const SessionEditorPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <CollaborativeEditor sessionId={sessionId} />;
};

export default SessionEditorPage;



