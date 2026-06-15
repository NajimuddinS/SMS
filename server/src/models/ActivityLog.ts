import { Schema, model, Document } from 'mongoose';

export interface IActivityLog extends Document {
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  action: { type: String, required: true, index: true },
  details: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
});

export const ActivityLog = model<IActivityLog>('ActivityLog', ActivityLogSchema);
