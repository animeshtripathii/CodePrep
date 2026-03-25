const { Queue, QueueEvents } = require('bullmq');

const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
};

// Queue configuration
const submissionQueue = new Queue('code-submissions', {
    connection,
    skipVersionCheck: true,
    defaultJobOptions: {
        removeOnComplete: true, // Don't overflow redis with successful jobs
        removeOnFail: 1000,     // Keep some failed jobs for debugging
        attempts: 2,            // Retry once if Judge0 fails instantly
        backoff: {
            type: 'exponential',
            delay: 2000
        }
    }
});

// Used to listen for completion events synchronously if needed
const queueEvents = new QueueEvents('code-submissions', { connection, skipVersionCheck: true });

module.exports = { submissionQueue, queueEvents, connection };