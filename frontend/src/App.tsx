import React, { useEffect, useState } from 'react';

function App() {
  const [health, setHealth] = useState<{ status: string } | null>(null);

  useEffect(() => {
    fetch('/health')
      .then(r => r.json())
      .then(data => setHealth(data))
      .catch(() => setHealth({ status: 'error' }));
  }, []);

  return React.createElement('div', null,
    React.createElement('h1', null, 'Thebes Library'),
    React.createElement('p', null, 'Backend status: OK'),
    health ? React.createElement('pre', null, JSON.stringify(health, null, 2)) : React.createElement('p', null, 'Loading...')
  );
}

export default App;
