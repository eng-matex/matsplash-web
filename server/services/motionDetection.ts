// Motion Detection Service for CCTV cameras
import { db } from '../database';

interface MotionEvent {
  id: string;
  camera_id: number;
  timestamp: string;
  confidence: number;
  bounding_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  event_type: 'motion_start' | 'motion_end' | 'person_detected' | 'object_detected';
  metadata?: Record<string, any>;
}

interface MotionDetectionConfig {
  camera_id: number;
  enabled: boolean;
  sensitivity: number; // 0-100
  detection_area?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  min_confidence: number; // 0-1
  cooldown_period: number; // seconds
  auto_recording: boolean;
  recording_duration: number; // seconds
}

class MotionDetectionService {
  private activeDetections: Map<number, boolean> = new Map();
  private lastMotionTime: Map<number, number> = new Map();
  private recordingSessions: Map<number, string> = new Map();

  /**
   * Process motion detection for a camera
   */
  async processMotionDetection(
    cameraId: number, 
    motionData: {
      hasMotion: boolean;
      confidence: number;
      boundingBox?: { x: number; y: number; width: number; height: number };
      timestamp: string;
    }
  ): Promise<{ eventCreated: boolean; recordingStarted?: boolean }> {
    try {
      const config = await this.getMotionConfig(cameraId);
      if (!config || !config.enabled) {
        return { eventCreated: false };
      }

      const now = Date.now();
      const lastMotion = this.lastMotionTime.get(cameraId) || 0;
      const cooldownMs = config.cooldown_period * 1000;

      // Check if we're in cooldown period
      if (now - lastMotion < cooldownMs) {
        return { eventCreated: false };
      }

      // Check confidence threshold
      if (motionData.confidence < config.min_confidence) {
        return { eventCreated: false };
      }

      const wasDetecting = this.activeDetections.get(cameraId) || false;
      let eventCreated = false;
      let recordingStarted = false;

      if (motionData.hasMotion && !wasDetecting) {
        // Motion started
        await this.createMotionEvent({
          id: `motion_${cameraId}_${now}`,
          camera_id: cameraId,
          timestamp: motionData.timestamp,
          confidence: motionData.confidence,
          bounding_box: motionData.boundingBox,
          event_type: 'motion_start',
          metadata: {
            detection_area: config.detection_area,
            sensitivity: config.sensitivity
          }
        });

        this.activeDetections.set(cameraId, true);
        this.lastMotionTime.set(cameraId, now);
        eventCreated = true;

        // Start auto recording if enabled
        if (config.auto_recording) {
          recordingStarted = await this.startAutoRecording(cameraId, config.recording_duration);
        }

      } else if (!motionData.hasMotion && wasDetecting) {
        // Motion ended
        await this.createMotionEvent({
          id: `motion_end_${cameraId}_${now}`,
          camera_id: cameraId,
          timestamp: motionData.timestamp,
          confidence: motionData.confidence,
          event_type: 'motion_end',
          metadata: {
            detection_area: config.detection_area,
            sensitivity: config.sensitivity
          }
        });

        this.activeDetections.set(cameraId, false);
        eventCreated = true;
      }

      return { eventCreated, recordingStarted };

    } catch (error) {
      console.error('Error processing motion detection:', error);
      return { eventCreated: false };
    }
  }

  /**
   * Get motion detection configuration for a camera
   */
  private async getMotionConfig(cameraId: number): Promise<MotionDetectionConfig | null> {
    try {
      const camera = await db('cameras').where('id', cameraId).first();
      if (!camera || !camera.motion_detection) {
        return null;
      }

      // Default configuration
      return {
        camera_id: cameraId,
        enabled: camera.motion_detection,
        sensitivity: 70, // Default sensitivity
        min_confidence: 0.5, // Default confidence threshold
        cooldown_period: 30, // 30 seconds cooldown
        auto_recording: true, // Auto start recording on motion
        recording_duration: 300 // 5 minutes recording
      };

    } catch (error) {
      console.error('Error getting motion config:', error);
      return null;
    }
  }

  /**
   * Create a motion event in the database
   */
  private async createMotionEvent(event: MotionEvent): Promise<void> {
    try {
      await db('motion_events').insert({
        id: event.id,
        camera_id: event.camera_id,
        timestamp: event.timestamp,
        confidence: event.confidence,
        bounding_box: event.bounding_box ? JSON.stringify(event.bounding_box) : null,
        event_type: event.event_type,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        created_at: new Date().toISOString()
      });

      // Log system activity
      await db('system_activity').insert({
        user_id: 1, // System user
        user_email: 'system',
        action: 'MOTION_DETECTED',
        details: `Motion ${event.event_type} detected on camera ${event.camera_id} (confidence: ${event.confidence})`,
        ip_address: '127.0.0.1',
        user_agent: 'Motion Detection Service',
        created_at: new Date().toISOString()
      });

      console.log(`🎯 Motion event created: ${event.event_type} for camera ${event.camera_id}`);

    } catch (error) {
      console.error('Error creating motion event:', error);
    }
  }

  /**
   * Start automatic recording when motion is detected
   */
  private async startAutoRecording(cameraId: number, duration: number): Promise<boolean> {
    try {
      // Check if already recording
      const existingRecording = await db('recording_sessions')
        .where('camera_id', cameraId)
        .where('status', 'recording')
        .first();

      if (existingRecording) {
        return false; // Already recording
      }

      const sessionId = `motion_${cameraId}_${Date.now()}`;
      const recordingSession = {
        id: sessionId,
        camera_id: cameraId,
        start_time: new Date().toISOString(),
        status: 'recording',
        recording_type: 'motion',
        file_path: `recordings/${sessionId}.mp4`
      };

      await db('recording_sessions').insert({
        ...recordingSession,
        created_at: new Date().toISOString()
      });

      this.recordingSessions.set(cameraId, sessionId);

      // Schedule automatic stop after duration
      setTimeout(() => {
        this.stopAutoRecording(cameraId, sessionId);
      }, duration * 1000);

      console.log(`🎥 Auto recording started for camera ${cameraId} (${duration}s)`);
      return true;

    } catch (error) {
      console.error('Error starting auto recording:', error);
      return false;
    }
  }

  /**
   * Stop automatic recording
   */
  private async stopAutoRecording(cameraId: number, sessionId: string): Promise<void> {
    try {
      const endTime = new Date().toISOString();
      const recordingSession = await db('recording_sessions')
        .where('id', sessionId)
        .first();

      if (recordingSession) {
        const duration = Math.floor(
          (new Date(endTime).getTime() - new Date(recordingSession.start_time).getTime()) / 1000
        );

        await db('recording_sessions')
          .where('id', sessionId)
          .update({
            status: 'stopped',
            end_time: endTime,
            duration,
            updated_at: new Date().toISOString()
          });

        this.recordingSessions.delete(cameraId);

        console.log(`🛑 Auto recording stopped for camera ${cameraId} (${duration}s)`);
      }

    } catch (error) {
      console.error('Error stopping auto recording:', error);
    }
  }

  /**
   * Get motion events for a camera
   */
  async getMotionEvents(
    cameraId: number, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<MotionEvent[]> {
    try {
      const events = await db('motion_events')
        .where('camera_id', cameraId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .offset(offset);

      return events.map(event => ({
        id: event.id,
        camera_id: event.camera_id,
        timestamp: event.timestamp,
        confidence: event.confidence,
        bounding_box: event.bounding_box ? JSON.parse(event.bounding_box) : undefined,
        event_type: event.event_type,
        metadata: event.metadata ? JSON.parse(event.metadata) : undefined
      }));

    } catch (error) {
      console.error('Error getting motion events:', error);
      return [];
    }
  }

  /**
   * Update motion detection configuration
   */
  async updateMotionConfig(cameraId: number, config: Partial<MotionDetectionConfig>): Promise<boolean> {
    try {
      await db('cameras')
        .where('id', cameraId)
        .update({
          motion_detection: config.enabled ? 1 : 0,
          updated_at: new Date().toISOString()
        });

      console.log(`⚙️ Motion detection config updated for camera ${cameraId}`);
      return true;

    } catch (error) {
      console.error('Error updating motion config:', error);
      return false;
    }
  }

  /**
   * Get motion detection statistics
   */
  async getMotionStats(cameraId?: number): Promise<{
    totalEvents: number;
    todayEvents: number;
    activeDetections: number;
    avgConfidence: number;
  }> {
    try {
      let query = db('motion_events');
      
      if (cameraId) {
        query = query.where('camera_id', cameraId);
      }

      const totalEvents = await query.clone().count('* as count').first();
      const todayEvents = await query.clone()
        .where('timestamp', '>=', new Date().toISOString().split('T')[0])
        .count('* as count')
        .first();
      
      const avgConfidence = await query.clone()
        .avg('confidence as avg')
        .first();

      const activeDetections = this.activeDetections.size;

      return {
        totalEvents: parseInt(totalEvents.count) || 0,
        todayEvents: parseInt(todayEvents.count) || 0,
        activeDetections,
        avgConfidence: parseFloat(avgConfidence.avg) || 0
      };

    } catch (error) {
      console.error('Error getting motion stats:', error);
      return {
        totalEvents: 0,
        todayEvents: 0,
        activeDetections: 0,
        avgConfidence: 0
      };
    }
  }
}

// Create singleton instance
export const motionDetectionService = new MotionDetectionService();

// Export types and class
export { MotionDetectionService, MotionEvent, MotionDetectionConfig };
export default motionDetectionService;
