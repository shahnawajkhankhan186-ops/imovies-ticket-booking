import cron from 'node-cron';
import https from 'https';
import http from 'http';

let keepAliveJob = null;

/**
 * Self-ping job for cloud hosts like Render to prevent free-tier containers from spinning down.
 * Render spins down after 15 minutes of inactivity; this job sends an incoming request every 10 minutes.
 */
export function startKeepAliveJob() {
  const targetUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SELF_PING_URL ||
    'https://imovies-ticket-booking-xrmv.onrender.com';

  if (!targetUrl) return;

  const healthUrl = `${targetUrl.replace(/\/$/, '')}/api/health`;

  // Run every 10 minutes: "*/10 * * * *"
  keepAliveJob = cron.schedule('*/10 * * * *', () => {
    try {
      const client = healthUrl.startsWith('https') ? https : http;
      client.get(healthUrl, (res) => {
        if (process.env.NODE_ENV !== 'test') {
          console.log(`\x1b[35m[KEEP-ALIVE]\x1b[0m Pinged ${healthUrl} (Status: ${res.statusCode})`);
        }
      }).on('error', (err) => {
        console.warn('[KEEP-ALIVE WARN] Ping failed:', err.message);
      });
    } catch (e) {
      // quiet fail
    }
  });

  if (process.env.NODE_ENV !== 'test') {
    console.log(`\x1b[32m[KEEP-ALIVE STARTED]\x1b[0m Scheduled ping every 10m to ${healthUrl}`);
  }
}

export function stopKeepAliveJob() {
  if (keepAliveJob) {
    keepAliveJob.stop();
  }
}
