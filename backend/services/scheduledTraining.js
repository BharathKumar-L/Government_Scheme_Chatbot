const cron = require('node-cron');
const RAGTrainer = require('./ragTrainer');
const GovernmentDataScraper = require('./dataScraper');

class ScheduledTrainingService {
  constructor() {
    this.trainer = new RAGTrainer();
    this.scraper = new GovernmentDataScraper();
    this.isTraining = false;
    this.lastTrainingTime = null;
    this.trainingSchedule = null;
  }

  /**
   * Start scheduled training
   */
  startScheduledTraining() {
    console.log('🕐 Starting scheduled training service...');
    
    // Schedule training every 24 hours at 2 AM
    this.trainingSchedule = cron.schedule('0 2 * * *', async () => {
      await this.performScheduledTraining();
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    // Schedule data fetching every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await this.performScheduledDataFetch();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    // Start the training schedule
    this.trainingSchedule.start();
    
    console.log('✅ Scheduled training service started');
    console.log('📅 Training scheduled: Daily at 2:00 AM IST');
    console.log('📅 Data fetching scheduled: Every 6 hours');
  }

  /**
   * Stop scheduled training
   */
  stopScheduledTraining() {
    if (this.trainingSchedule) {
      this.trainingSchedule.stop();
      console.log('⏹️ Scheduled training service stopped');
    }
  }

  /**
   * Perform scheduled training
   */
  async performScheduledTraining() {
    if (this.isTraining) {
      console.log('⚠️ Training already in progress, skipping scheduled training');
      return;
    }

    try {
      console.log('🕐 Starting scheduled RAG model training...');
      this.isTraining = true;
      
      // Check if retraining is needed
      const needsRetraining = await this.checkIfRetrainingNeeded();
      
      if (needsRetraining) {
        console.log('🔄 Retraining needed, starting training process...');
        const results = await this.trainer.retrainModel();
        
        this.lastTrainingTime = new Date();
        console.log('✅ Scheduled training completed successfully');
        console.log(`📊 Training results: ${JSON.stringify(results, null, 2)}`);
      } else {
        console.log('ℹ️ No retraining needed, skipping training');
      }
      
    } catch (error) {
      console.error('❌ Scheduled training failed:', error);
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Perform scheduled data fetching
   */
  async performScheduledDataFetch() {
    try {
      console.log('📡 Starting scheduled data fetch...');
      
      const schemes = await this.scraper.fetchAllSchemeData();
      
      console.log(`✅ Scheduled data fetch completed: ${schemes.length} schemes`);
      
    } catch (error) {
      console.error('❌ Scheduled data fetch failed:', error);
    }
  }

  /**
   * Check if retraining is needed
   */
  async checkIfRetrainingNeeded() {
    try {
      // Get last training time
      const stats = await this.trainer.getTrainingStats();
      const lastTraining = new Date(stats.lastTrainingDate);
      
      // Check if it's been more than 24 hours since last training
      const hoursSinceTraining = (Date.now() - lastTraining.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceTraining > 24) {
        console.log(`⏰ Last training was ${Math.round(hoursSinceTraining)} hours ago, retraining needed`);
        return true;
      }
      
      // Check if data has changed
      const freshData = await this.scraper.fetchAllSchemeData();
      const existingData = await this.scraper.loadScrapedData();
      
      if (this.hasDataChanged(freshData, existingData)) {
        console.log('📊 Data has changed, retraining needed');
        return true;
      }
      
      console.log('ℹ️ No retraining needed');
      return false;
      
    } catch (error) {
      console.error('❌ Error checking retraining status:', error);
      return true; // Default to retraining if check fails
    }
  }

  /**
   * Check if data has changed
   */
  hasDataChanged(newData, existingData) {
    if (newData.length !== existingData.length) {
      console.log(`📊 Data count changed: ${existingData.length} -> ${newData.length}`);
      return true;
    }
    
    // Check if any scheme has been updated
    for (const newScheme of newData) {
      const existingScheme = existingData.find(s => s.id === newScheme.id);
      if (!existingScheme || existingScheme.lastUpdated !== newScheme.lastUpdated) {
        console.log(`📊 Scheme ${newScheme.id} has been updated`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Force immediate training
   */
  async forceTraining() {
    if (this.isTraining) {
      throw new Error('Training already in progress');
    }

    try {
      console.log('🚀 Starting forced training...');
      this.isTraining = true;
      
      const results = await this.trainer.trainRAGModel();
      
      this.lastTrainingTime = new Date();
      console.log('✅ Forced training completed successfully');
      
      return results;
      
    } catch (error) {
      console.error('❌ Forced training failed:', error);
      throw error;
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Get training status
   */
  getTrainingStatus() {
    return {
      isTraining: this.isTraining,
      lastTrainingTime: this.lastTrainingTime,
      isScheduled: this.trainingSchedule ? this.trainingSchedule.running : false,
      nextTraining: this.getNextTrainingTime()
    };
  }

  /**
   * Get next training time
   */
  getNextTrainingTime() {
    if (!this.trainingSchedule) return null;
    
    // Calculate next 2 AM
    const now = new Date();
    const nextTraining = new Date(now);
    nextTraining.setHours(2, 0, 0, 0);
    
    if (nextTraining <= now) {
      nextTraining.setDate(nextTraining.getDate() + 1);
    }
    
    return nextTraining;
  }

  /**
   * Update training schedule
   */
  updateTrainingSchedule(cronExpression) {
    try {
      // Stop current schedule
      this.stopScheduledTraining();
      
      // Create new schedule
      this.trainingSchedule = cron.schedule(cronExpression, async () => {
        await this.performScheduledTraining();
      }, {
        scheduled: false,
        timezone: "Asia/Kolkata"
      });
      
      // Start new schedule
      this.trainingSchedule.start();
      
      console.log(`✅ Training schedule updated: ${cronExpression}`);
      
    } catch (error) {
      console.error('❌ Failed to update training schedule:', error);
      throw error;
    }
  }

  /**
   * Get training statistics
   */
  async getTrainingStatistics() {
    try {
      const [trainingStats, scrapingStats] = await Promise.all([
        this.trainer.getTrainingStats(),
        this.scraper.getScrapingStats()
      ]);
      
      return {
        training: trainingStats,
        scraping: scrapingStats,
        schedule: this.getTrainingStatus(),
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to get training statistics:', error);
      throw error;
    }
  }
}

module.exports = ScheduledTrainingService;
