import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
  { path: 'demo/core', loadComponent: () => import('./pages/demo-core/demo-core.component').then(m => m.DemoCoreComponent) },
  { path: 'demo/chatbot', loadComponent: () => import('./pages/demo-chatbot/demo-chatbot.component').then(m => m.DemoChatbotComponent) },
  { path: 'demo/autosuggest', loadComponent: () => import('./pages/demo-autosuggest/demo-autosuggest.component').then(m => m.DemoAutosuggestComponent) },
  { path: 'demo/smartform', loadComponent: () => import('./pages/demo-smartform/demo-smartform.component').then(m => m.DemoSmartformComponent) },
  { path: 'demo/analytics', loadComponent: () => import('./pages/demo-analytics/demo-analytics.component').then(m => m.DemoAnalyticsComponent) },
  { path: 'demo/image-caption', loadComponent: () => import('./pages/demo-image-caption/demo-image-caption.component').then(m => m.DemoImageCaptionComponent) },
  { path: 'demo/emotion-ui', loadComponent: () => import('./pages/demo-emotion-ui/demo-emotion-ui.component').then(m => m.DemoEmotionUiComponent) },
  { path: 'demo/doc-intelligence', loadComponent: () => import('./pages/demo-doc-intelligence/demo-doc-intelligence.component').then(m => m.DemoDocIntelligenceComponent) },
  { path: 'demo/predictive-input', loadComponent: () => import('./pages/demo-predictive-input/demo-predictive-input.component').then(m => m.DemoPredictiveInputComponent) },
  { path: 'demo/smart-notify', loadComponent: () => import('./pages/demo-smart-notify/demo-smart-notify.component').then(m => m.DemoSmartNotifyComponent) },
  { path: 'demo/voice-actions', loadComponent: () => import('./pages/demo-voice-actions/demo-voice-actions.component').then(m => m.DemoVoiceActionsComponent) },
  { path: 'demo/smart-datatable', loadComponent: () => import('./pages/demo-smart-datatable/demo-smart-datatable.component').then(m => m.DemoSmartDatatableComponent) },
  { path: 'demo/spin-360', loadComponent: () => import('./pages/demo-spin-360/demo-spin-360.component').then(m => m.DemoSpin360Component) },
  { path: '**', redirectTo: '' }
];
