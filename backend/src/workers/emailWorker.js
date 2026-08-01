const { Worker } = require('bullmq');
const connection = require('../config/queueConnection');
const transporter = require('../config/mailer');
const logger = require('../config/logger');

const emailWorker = new Worker(
  'emails',
  async (job) => {
    if (job.name === 'order-confirmation') {
      const { to, orderId, totalAmount } = job.data;

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: `Order Confirmed — #${orderId}`,
        text: `Your order (#${orderId}) for ₹${totalAmount} has been confirmed. Thanks for shopping with FarmConnect!`,
      });

      logger.info({ orderId, to }, 'Order confirmation email sent');
    }
  },
  { connection, concurrency: 5 } // up to 5 emails processed in parallel
);

emailWorker.on('failed', (job, err) =>
  logger.error({ jobId: job?.id, error: err.message }, 'Email job failed')
);

module.exports = emailWorker;