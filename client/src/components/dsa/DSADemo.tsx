import React, { useState } from 'react';
import './dsa.css';
import ProblemsList from './ProblemsList';
import ProblemDetail from './ProblemDetail';
import SubmissionForm from './SubmissionForm';
import UserSubmissions from './UserSubmissions';

export default function DSADemo() {
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  return (
    <div className="dsa-container">
      <h1 className="dsa-title">DSA Demo</h1>
      <div className="dsa-card" style={{ display: 'grid', gap: 8 }}>
        <label className="dsa-subtitle">DSA User ID (for submissions history)</label>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Paste a DSA user _id (e.g. from seed)"
          className="dsa-input"
        />
      </div>

      <div className="dsa-grid-2">
        <div>
          <h3 className="dsa-subtitle">Problems</h3>
          <ProblemsList onSelect={(p) => setSelectedProblemId(p._id)} />
        </div>
        <div>
          <h3 className="dsa-subtitle">Details</h3>
          <ProblemDetail problemId={selectedProblemId} />
        </div>
      </div>

      <div className="dsa-grid-2">
        <div>
          <h3 className="dsa-subtitle">Submit</h3>
          <SubmissionForm userId={userId} problemId={selectedProblemId} />
        </div>
        <div>
          <h3 className="dsa-subtitle">Your Submissions</h3>
          <UserSubmissions userId={userId || null} />
        </div>
      </div>
    </div>
  );
}


