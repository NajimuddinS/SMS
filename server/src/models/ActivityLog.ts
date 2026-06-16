export interface ActivityLog {
  _id: string; // maps to Postgres id (UUID)
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date | string;
}
