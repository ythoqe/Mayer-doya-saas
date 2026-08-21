export type SettingsTab = 
  | 'profile' 
  | 'users'
  | 'factory' 
  | 'language' 
  | 'notifications' 
  | 'preferences' 
  | 'roles' 
  | 'security' 
  | 'system';

export interface FactoryInfo {
  name: string;
  subtitle: string;
  address: string;
  phone: string;
  email: string;
  tradeLicense: string;
  vatBin: string;
  boilerCapacity: string;
  activeShifts: string;
  establishedYear: string;
  industrialZone: string;
}

export interface NotificationSettingsState {
  lowStockAlerts: boolean;
  orderStatusUpdates: boolean;
  chequeReminders: boolean;
  paymentReceipts: boolean;
  dailyEveningDigest: boolean;
  emailNotifications: boolean;
}

export interface SystemPreferencesState {
  compactDensity: boolean;
  soundAlerts: boolean;
  autoPrintPrompt: boolean;
  currencySymbol: string;
  dateFormat: string;
  numberSystem: 'en-IN' | 'bn-BD' | 'en-US';
}
