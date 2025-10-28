const Event = require('../models/event');
//proven to work (deleted an event i didnt even want gone)
/**
 * Delete events whose EndDate is less than or equal to now.
 * Safe to call repeatedly.
 */
async function deleteExpiredEvents() {
  const now = new Date();
  try {
    const res = await Event.deleteMany({ EndDate: { $lte: now } });
    if (res && res.deletedCount && res.deletedCount > 0) {
      console.log(`cleanup: deleted ${res.deletedCount} expired event(s)`);
    } else {
      // Uncomment to debug noisy logs:
      // console.log('cleanup: no expired events to delete');
    }
  } catch (err) {
    console.error('cleanup: error deleting expired events', err);
  }
}

/**
 * Start periodic cleanup. Runs once immediately, then every intervalMs.
 * Returns the interval id so caller can clearInterval if desired.
 */
function startCleanup(intervalMs) {
  const defaultMs = 1000 * 60 * 60; // 1 hour
  const ms = typeof intervalMs === 'number' && intervalMs > 0
    ? intervalMs
    : (process.env.CLEANUP_INTERVAL_MS ? parseInt(process.env.CLEANUP_INTERVAL_MS, 10) : defaultMs);

  // Run once now
  deleteExpiredEvents();

  const id = setInterval(deleteExpiredEvents, ms);
  console.log(`cleanup: started scheduled cleanup every ${ms}ms`);
  return id;
}

module.exports = { deleteExpiredEvents, startCleanup };
