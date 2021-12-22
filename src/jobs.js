const cron = require('node-cron');
const { topicService } = require('../src/services');
const logger = require('./config/logger');

const startJobs = () => {
    cron.schedule('* * * * *', async () => {
        logger.info('Starting deleteOldTopics job');
        try {
            const result = await topicService.deleteOldTopics();
            logger.info(`Successfully deleted ${result.deletedCount} old topics.`);
        } catch (err) {
            logger.error('Error occurred in deleteOldTopics job: ', err);
        }
    });
}

module.exports = {
    startJobs,
};