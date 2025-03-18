import React from 'react';

// User related types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Asset related types
export interface Asset {
  id: number;
  name: string;
  description: string;
  asset_type: string;
  ip_address: string;
  hostname: string;
  mac_address?: string;
  operating_system: string;
  owner?: string;
  environment?: string;
  criticality?: string;
  created_at: string;
  updated_at: string;
  vulnerability_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  last_scan_date?: string;
  last_scan_id?: number;
}

export interface AssetFormData {
  name: string;
  description: string;
  asset_type: string;
  hostname: string;
  ip_address: string;
  operating_system: string;
  owner: string;
  environment: string;
  criticality: string;
}

// Vulnerability related types
export interface Vulnerability {
  id: number;
  title: string;
  description: string;
  severity: string;
  cvss_score: number;
  cve_id?: string;
  cwe_id?: string;
  status: string;
  remediation?: string;
  asset_id: number;
  asset_name?: string;
  scan_id: number;
  scan_name?: string;
  discovered_date: string;
  created_at: string;
  updated_at: string;
  references?: string[];
  affected_component?: string;
  exploit_available?: boolean;
  exploit_maturity?: string;
}

// Scan related types
export interface Scan {
  id: number;
  name: string;
  description?: string;
  scanner_type: string;
  status: string;
  start_time: string;
  end_time?: string;
  asset_id: number;
  asset_name?: string;
  created_at: string;
  updated_at: string;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

// Dashboard related types
export interface DashboardStats {
  total_assets: number;
  total_vulnerabilities: number;
  total_scans: number;
  critical_vulnerabilities: number;
  high_vulnerabilities: number;
  medium_vulnerabilities: number;
  low_vulnerabilities: number;
  recent_scans: Scan[];
  top_vulnerable_assets: Asset[];
  vulnerability_by_severity: {
    severity: string;
    count: number;
  }[];
  vulnerability_trend: {
    date: string;
    count: number;
  }[];
}

// ML Model related types
export interface MLModel {
  id: number;
  name: string;
  description: string;
  model_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  training_date?: string;
  last_prediction_date?: string;
  version?: string;
  features?: string[];
  feature_importance?: Record<string, number>;
}

// API related types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Event types
export interface ReactChangeEvent {
  target: {
    name: string;
    value: string | number | boolean;
  };
}

export interface ReactFormEvent extends React.FormEvent<HTMLFormElement> {}

// Authentication types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

// Notification types
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
}

// Settings types
export interface SystemSettings {
  scan_frequency: string;
  notification_email: string;
  enable_auto_scan: boolean;
  enable_ml_predictions: boolean;
  retention_period: number;
  api_keys: ApiKey[];
}

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  created_at: string;
  expires_at?: string;
  last_used?: string;
}

// Report types
export interface Report {
  id: number;
  name: string;
  description?: string;
  report_type: string;
  format: string;
  created_at: string;
  created_by: string;
  parameters?: Record<string, any>;
  download_url?: string;
}

// Integration types
export interface Integration {
  id: number;
  name: string;
  integration_type: string;
  status: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_sync?: string;
}

// Extend the global window object to include potential global variables
declare global {
  interface Window {
    config?: {
      apiUrl: string;
      version: string;
      environment: string;
    };
  }
}

export interface VulnerabilityDetailData extends Vulnerability {
  cvss_vector?: string;
  cve_id?: string;
  cwe_id?: string;
  asset?: {
    id: number;
    name: string;
    type: string;
    asset_type: string;
    criticality: string;
  };
  scan?: {
    id: number;
    name: string;
    scanner_type: string;
    status: string;
    created_at: string;
  };
  exploit_available?: boolean;
  exploit_maturity?: string;
  patch_available?: boolean;
  affected_component?: string;
  affected_version?: string;
  business_impact?: string;
  data_classification?: string;
  system_exposure?: string;
  metadata?: Record<string, any>;
  discovered_date: string;
  references?: string[];
} 