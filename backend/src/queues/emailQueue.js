const { Queue } = require('bullmq');
const connection = require('../config/queueConnection');

const emailQueue = new Queue('emails', { connection });

module.exports = emailQueue;