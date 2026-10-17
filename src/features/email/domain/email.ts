export type EmailLogStatus = 'sent' | 'failed' | 'skipped_quota' | 'skipped_env';

export interface EmailLog {
  id: string;
  provider: string;
  category: string;
  to_email: string;
  status: EmailLogStatus;
  error_code: string | null;
  error_message: string | null;
  provider_message_id: string | null;
  created_at: string;
}

export interface EmailQuota {
  provider: string;
  monthly_limit: number;
  daily_limit: number;
  manual_monthly_used: number;
  manual_used_effective: number;
  priority: number;
  active: boolean;
  api_month_used: number;
  today_used: number;
  updated_at: string | null;
}
