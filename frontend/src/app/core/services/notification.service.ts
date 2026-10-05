import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly permission = signal<NotificationPermission>(this.getPermission());

  isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'Notification' in window &&
      window.isSecureContext;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    const result = await Notification.requestPermission();
    this.permission.set(result);
    return result;
  }

  async notify(title: string, body: string): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (this.permission() !== 'granted') return false;

    const tag = `tf-${Date.now()}`;
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, {
          body,
          tag,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
        return true;
      }
    }

    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag
    });
    return true;
  }

  private getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }
}
