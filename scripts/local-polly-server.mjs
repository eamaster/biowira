import { createServer } from 'node:http';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

// Initialize Polly Client using environment variables
// This ensures keys are never hardcoded in the file!
const polly = new PollyClient({
  region: 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const server = createServer((req, res) => {
  // Add CORS headers so the Vite frontend proxy can talk to us
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Token');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Intercept the specific synthesis route
  if (req.method === 'POST' && req.url === '/api/v1/narration/synthesize') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { text } = JSON.parse(body);
        if (!text) throw new Error('No text provided');

        console.log(`[Polly Server] Synthesizing: "${text.substring(0, 50)}..."`);
        
        // Command to generate MP3 from text
        const command = new SynthesizeSpeechCommand({
          Text: text,
          OutputFormat: 'mp3',
          VoiceId: 'Joanna', // Standard voice
        });

        const response = await polly.send(command);
        
        res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
        // response.AudioStream is a Node.js stream in the v3 SDK
        response.AudioStream.pipe(res);
        
      } catch (err) {
        console.error('[Polly Server] Error:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errorCode: 'INVALID_NARRATION_TEXT', message: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`\n🎙️ Local Mock Polly Backend running on http://localhost:${PORT}`);
  console.log(`Listening for requests from the BioWira frontend...`);
  console.log(`Press Ctrl+C to stop.\n`);
});
