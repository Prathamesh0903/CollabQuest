import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const OAuthDebugger: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConfig = async () => {
      try {
        // Check Supabase configuration
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        
        console.log('Supabase URL:', supabaseUrl);
        console.log('Supabase Key (first 20 chars):', supabaseKey?.substring(0, 20) + '...');
        
        // Test Supabase connection
        const { data, error } = await supabase.auth.getSession();
        
        setConfig({
          supabaseUrl,
          supabaseKeyLength: supabaseKey?.length,
          currentUrl: window.location.origin,
          hasSession: !!data.session,
          sessionError: error?.message
        });
        
        if (error) {
          setError(error.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    checkConfig();
  }, []);

  const testGoogleOAuth = async () => {
    try {
      console.log('Testing Google OAuth...');
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log('Redirect URL:', redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      });
      
      if (error) {
        console.error('OAuth test error:', error);
        setError(`OAuth test failed: ${error.message}`);
      } else {
        console.log('OAuth test successful:', data);
      }
    } catch (err) {
      console.error('OAuth test exception:', err);
      setError(`OAuth test exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#f5f5f5', margin: '20px' }}>
      <h3>OAuth Configuration Debugger</h3>
      
      {config && (
        <div>
          <h4>Configuration:</h4>
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </div>
      )}
      
      {error && (
        <div style={{ color: 'red', margin: '10px 0' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <button 
        onClick={testGoogleOAuth}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#4285F4', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Google OAuth
      </button>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>Instructions:</strong></p>
        <ol>
          <li>Check the configuration above</li>
          <li>Click "Test Google OAuth" to test the flow</li>
          <li>Check browser console for detailed logs</li>
          <li>Verify Supabase dashboard has Google provider configured</li>
        </ol>
      </div>
    </div>
  );
};

export default OAuthDebugger;
