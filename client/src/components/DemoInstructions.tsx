import React from 'react';
import './DemoInstructions.css';

const DemoInstructions: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="demo-instructions">
      <div className="demo-container">
        <div className="demo-header">
          <h2>🎯 How to Test the Collaborative Editor</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="demo-steps">
          <div className="step">
            <h3>Step 1: Start the Servers</h3>
            <p>Make sure both frontend and backend servers are running:</p>
            <div className="code-block">
              <code># Terminal 1 - Frontend</code>
              <code>cd client && npm start</code>
              <code># Terminal 2 - Backend</code>
              <code>cd server && npm start</code>
            </div>
          </div>

          <div className="step">
            <h3>Step 2: Open Multiple Browser Tabs</h3>
            <p>Open the application in multiple browser tabs or windows:</p>
            <div className="code-block">
              <code>http://localhost:3000</code>
            </div>
          </div>

          <div className="step">
            <h3>Step 3: Join the Same Room</h3>
            <p>In each tab:</p>
            <ul>
              <li>Enter the same room ID (e.g., "TEST123")</li>
              <li>Choose the same programming language</li>
              <li>Click "Join Room"</li>
            </ul>
          </div>

          <div className="step">
            <h3>Step 4: Start Collaborating</h3>
            <p>Now you can:</p>
            <ul>
              <li>Type code in one tab and see it appear in others</li>
              <li>See active user count in the header</li>
              <li>Toggle between dark and light themes</li>
              <li>Test with different programming languages</li>
            </ul>
          </div>

          <div className="step">
            <h3>Step 5: Test Features</h3>
            <p>Try these features:</p>
            <ul>
              <li>🔄 Real-time code synchronization</li>
              <li>👥 User presence indicators</li>
              <li>🌙 Theme toggle (dark/light)</li>
              <li>💻 Language switching (JavaScript/Python)</li>
              <li>📱 Responsive design on mobile</li>
            </ul>
          </div>
        </div>

        <div className="demo-tips">
          <h3>💡 Pro Tips</h3>
          <ul>
            <li>Use different browsers (Chrome, Firefox, Safari) for better testing</li>
            <li>Try typing simultaneously in different tabs</li>
            <li>Test the theme toggle to see the UI change</li>
            <li>Share room IDs with friends for remote collaboration</li>
            <li>Check the browser console for connection status</li>
          </ul>
        </div>

        <div className="demo-troubleshooting">
          <h3>🔧 Troubleshooting</h3>
          <ul>
            <li><strong>Connection issues:</strong> Check if backend server is running on port 5000</li>
            <li><strong>No real-time sync:</strong> Ensure both servers are running</li>
            <li><strong>Editor not loading:</strong> Check browser console for errors</li>
            <li><strong>Socket errors:</strong> Verify CORS settings in backend</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DemoInstructions; 