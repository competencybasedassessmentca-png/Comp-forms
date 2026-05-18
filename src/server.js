import './bootEnv.js';
import app from './app.js';

const preferredPort = Number(process.env.PORT) || 3000;
const maxPortTries = 30;

function startListening(port) {
  if (port > preferredPort + maxPortTries) {
    console.error(
      `No free port between ${preferredPort} and ${preferredPort + maxPortTries}. Close whatever is using port ${preferredPort} or set PORT in .env.local.`,
    );
    process.exit(1);
  }

  const server = app.listen(port, () => {
    const addr = server.address();
    const actual = typeof addr === 'object' && addr ? addr.port : port;
    if (actual !== preferredPort) {
      console.warn(`Port ${preferredPort} was in use; using ${actual} instead.`);
    }
    console.log(`CertNova Brevo forms listening on http://localhost:${actual}`);
    console.log(`Form catalog: http://localhost:${actual}/`);
    console.log(`Health: http://localhost:${actual}/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use, trying ${port + 1}…`);
      server.close(() => startListening(port + 1));
      return;
    }
    console.error(err);
    process.exit(1);
  });
}

startListening(preferredPort);
