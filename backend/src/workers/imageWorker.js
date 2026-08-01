const { Worker } = require('bullmq');
const connection = require('../config/queueConnection');
const cloudinary = require('../config/cloudinary');
const Product = require('../models/Product');

const imageWorker = new Worker(
  'image-processing',
  async (job) => {
    const { productId, imagePublicId } = job.data;

    // Ask Cloudinary to generate a thumbnail transformation
    const result = await cloudinary.uploader.explicit(imagePublicId, {
      type: 'upload',
      eager: [{ width: 300, height: 300, crop: 'fill' }],
    });

    const thumbnailUrl = result.eager?.[0]?.secure_url;

    await Product.findByIdAndUpdate(productId, { thumbnailUrl });

    return { thumbnailUrl };
  },
  { connection }
);

imageWorker.on('completed', (job) => {
  console.log(`✅ Image job ${job.id} done for product ${job.data.productId}`);
});

imageWorker.on('failed', (job, err) => {
  console.error(`❌ Image job ${job?.id} failed:`, err.message);
});

module.exports = imageWorker;