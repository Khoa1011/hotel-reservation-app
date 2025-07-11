const cron = require('node-cron');
const logger = require('../config/logger');
const NotificationService = require('./NotificationService');

class CronService {
 constructor() {
   this.jobs = new Map();
 }

 /**
  * Khởi tạo tất cả cron jobs
  */
 initializeJobs() {
   if (process.env.CRON_ENABLED !== 'true') {
     logger.info('⏸️ Cron jobs disabled by environment variable');
     return;
   }

   logger.info('⏰ Initializing cron jobs...');

   // Job 1: Gửi notifications đã lên lịch - chạy mỗi phút
   this.scheduleJob('send-notifications', '* * * * *', async () => {
     try {
       await NotificationService.sendScheduledNotifications();
     } catch (error) {
       logger.error('❌ Error in send-notifications cron:', error);
     }
   });

   // Job 2: Cleanup logs cũ - chạy hàng ngày lúc 2:00 AM
   this.scheduleJob('cleanup-logs', '0 2 * * *', async () => {
     try {
       await NotificationService.cleanupOldLogs();
     } catch (error) {
       logger.error('❌ Error in cleanup-logs cron:', error);
     }
   });

   // Job 3: Health check - chạy mỗi 5 phút
   this.scheduleJob('health-check', '*/5 * * * *', () => {
     logger.info('💓 Notification service health check');
   });

   logger.info('✅ All cron jobs initialized successfully');
 }

 /**
  * Lên lịch một job mới
  */
 scheduleJob(name, cronExpression, task) {
   try {
     const job = cron.schedule(cronExpression, task, {
       scheduled: false,
       timezone: process.env.TIMEZONE || 'Asia/Ho_Chi_Minh'
     });

     this.jobs.set(name, job);
     job.start();

     logger.info(`✅ Scheduled job '${name}' with expression: ${cronExpression}`);
     return job;
   } catch (error) {
     logger.error(`❌ Error scheduling job '${name}':`, error);
     throw error;
   }
 }

 /**
  * Dừng một job
  */
 stopJob(name) {
   const job = this.jobs.get(name);
   if (job) {
     job.stop();
     logger.info(`⏸️ Stopped job: ${name}`);
   }
 }

 /**
  * Dừng tất cả jobs
  */
 stopAllJobs() {
   this.jobs.forEach((job, name) => {
     job.stop();
     logger.info(`⏸️ Stopped job: ${name}`);
   });
   this.jobs.clear();
   logger.info('⏸️ All cron jobs stopped');
 }

 /**
  * Lấy status của các jobs
  */
 getJobsStatus() {
   const status = {};
   this.jobs.forEach((job, name) => {
     status[name] = {
       running: job.running,
       scheduled: job.scheduled
     };
   });
   return status;
 }
}

module.exports = new CronService();