const { Queue } = require('bullmq');
const connection = require('../config/queueConnection');

const imageQueue = new Queue('image-processing', { connection });

module.exports = imageQueue;