export interface WaTemplateParam {
  name: string;
  description: string;
}

export interface WaTemplate {
  id: string;
  event_key: string;
  enabled: boolean;
  meta_template_name: string;
  meta_template_language: string;
  body: string;
  params: WaTemplateParam[];
  updated_at: string | null;
  updated_by: string | null;
}

export interface WaUsage {
  provider: string;
  used_count: number;
  limit_count: number;
  warn_threshold_percent: number;
  percent: number;
  level: 'ok' | 'warn' | 'exhausted';
  period_start: string;
  updated_at: string | null;
}

export interface WaLog {
  id: string;
  provider: string;
  event_key: string;
  to_phone: string;
  template_name: string | null;
  channel: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface WaTestSendResult {
  sent: boolean;
  reason: string | null;
  usage: WaUsage | null;
}
