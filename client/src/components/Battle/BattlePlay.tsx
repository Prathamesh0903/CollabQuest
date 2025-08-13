import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import './BattlePlay.css';
import problems from './problems';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const BattlePlay: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const battleConfig = location.state?.battleConfig;
  
  const [difficulty, setDifficulty] = useState<Difficulty>(battleConfig?.difficulty || 'Easy');
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
  const [timer, setTimer] = useState<number>((battleConfig?.battleTime || 10) * 60);
  const [roomCode, setRoomCode] = useState<string>(battleConfig?.roomCode || '');

  const problem = useMemo(() => {
    if (battleConfig?.questionSelection === 'specific' && battleConfig?.selectedProblem) {
      return problems.find(p => p.id === battleConfig.selectedProblem) || problems[0];
    }
    const pool = problems.filter(p => p.difficulty === difficulty);
    return pool[Math.floor(Math.random() * pool.length)];
  }, [difficulty, battleConfig]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="battle-play">
      <header className="battle-play__header">
        <div className="brand" onClick={() => navigate('/battle')}>
          <span className="brand-mark">⚔️</span>
          <span className="brand-text">Code Battle</span>
        </div>
        <div className="header-controls">
          {roomCode && <div className="room-code-display">Room: {roomCode}</div>}
          <select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <select value={language} onChange={e => setLanguage(e.target.value as any)}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
          <button className="cta" onClick={() => window.location.reload()}>New Random</button>
          <button className="cta cta--ghost" onClick={() => navigate('/')}>Exit</button>
        </div>
      </header>

      <div className="battle-play__content">
        <section className="problem-panel">
          <div className="problem-header">
            <h2 className="problem-title">{problem.title}</h2>
            <span className={`badge ${problem.difficulty === 'Easy' ? 'badge--easy' : problem.difficulty === 'Medium' ? 'badge--medium' : 'badge--hard'}`}>{problem.difficulty}</span>
          </div>
          <div className="problem-body">
            <div className="problem-desc" dangerouslySetInnerHTML={{ __html: problem.description }} />
            <div className="problem-meta">
              <div>
                <div className="meta-label">Examples</div>
                {problem.examples.map((ex, idx) => (
                  <pre key={idx} className="io-block"><strong>Input</strong>: {ex.input}\n<strong>Output</strong>: {ex.output}</pre>
                ))}
              </div>
              <div>
                <div className="meta-label">Constraints</div>
                <ul className="constraints">
                  {problem.constraints.map((c, idx) => (<li key={idx}>{c}</li>))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="editor-panel">
          <div className="editor-header">
            <div className="timer">⏱ {Math.floor(timer/60).toString().padStart(2,'0')}:{(timer%60).toString().padStart(2,'0')}</div>
            <div className="actions">
              <button className="cta cta--secondary">Run</button>
              <button className="cta">Submit</button>
            </div>
          </div>
          <div className="editor-container">
            <Editor
              height="100%"
              theme="vs-dark"
              defaultLanguage={language}
              defaultValue={language === 'javascript' ? problem.templates.javascript : problem.templates.python}
              options={{ minimap: { enabled: true }, fontSize: 14, wordWrap: 'on', automaticLayout: true }}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default BattlePlay;


