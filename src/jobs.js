const cron = require('node-cron');
const { topicService } = require('./services');
const logger = require('./config/logger');

const startJobs = () => {
  logger.info('Started nodecron jobs that run once per day at 1am UTC');
  cron.schedule('0 1 * * *', async () => {
    try {
      // Delete old topics job
      logger.info(`Started delete old topics job.`);
      const deleteResult = await topicService.deleteOldTopics();
      if (deleteResult.length > 0) {
        logger.info(
          `Successfully deleted ${deleteResult.length} old topics. Topic ids: ${deleteResult.map((x) => x._id).join()}`
        );
      } else {
        logger.info(`Did not find any old topics to delete.`);
      }
      logger.info(`Ended delete old topics job.`);

      // Archive topics job
      logger.info(`Started email users to archive job.`);
      const emailResult = await topicService.emailUsersToArchive();
      if (emailResult.length > 0) {
        logger.info(
          `Successfully deleted ${emailResult.length} old topics. Topic ids: ${emailResult.map((x) => x._id).join()}`
        );
      } else {
        logger.info(`Did not find any users to notify for archiving.`);
      }
      logger.info(`Ended email users to archive job.`);
    } catch (err) {
      logger.error('Error occurred in nodecron jobs: ', err);
    }
  });
};

module.exports = {
  startJobs,
};
