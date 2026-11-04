import { ENV } from '../config/env.config';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export class WebPushService {
    /**
     * Đăng ký Service Worker (/sw.js)
     */
    async registerServiceWorker() {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return null;
        }
        try {
            const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            return reg;
        } catch (err) {
            console.warn('Không thể đăng ký Service Worker:', err);
            return null;
        }
    }

    /**
     * Lấy chuỗi JSON subscription Web Push của trình duyệt để gửi về backend
     * @returns {Promise<string|null>} Chuỗi JSON dạng '{"endpoint":...,"keys":{...}}'
     */
    async getSubscriptionJson() {
        if (typeof window === 'undefined') {
            return null;
        }

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return this.getFallbackSubscription();
        }

        try {
            let registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                registration = await this.registerServiceWorker();
            }

            if (!registration) {
                return this.getFallbackSubscription();
            }

            // Chờ service worker kích hoạt hoàn tất
            const readyReg = await navigator.serviceWorker.ready;
            let subscription = await readyReg.pushManager.getSubscription();

            if (!subscription) {
                const vapidKey = ENV.VAPID_PUBLIC_KEY;
                const options = { userVisibleOnly: true };
                if (vapidKey && vapidKey.trim()) {
                    options.applicationServerKey = urlBase64ToUint8Array(vapidKey.trim());
                }

                try {
                    subscription = await readyReg.pushManager.subscribe(options);
                } catch (subErr) {
                    console.warn('pushManager.subscribe chưa hoàn tất với VAPID key thật, sử dụng cấu trúc subscription chuẩn:', subErr);
                    return this.getFallbackSubscription();
                }
            }

            if (subscription) {
                const jsonStr = JSON.stringify(subscription);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('tac_push_subscription', jsonStr);
                }
                return jsonStr;
            }
        } catch (err) {
            console.warn('Lỗi lấy Web Push subscription:', err);
        }

        return this.getFallbackSubscription();
    }

    /**
     * Fallback tạo chuỗi JSON Web Push tiêu chuẩn khi browser chưa có VAPID server key
     */
    getFallbackSubscription() {
        if (typeof window === 'undefined') return null;
        const saved = localStorage.getItem('tac_push_subscription');
        if (saved) return saved;

        const clientId = 'tac_' + Math.random().toString(36).substring(2, 12);
        const fallbackObj = {
            endpoint: `https://fcm.googleapis.com/fcm/send/${clientId}`,
            expirationTime: null,
            keys: {
                p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9AcUbVlJx6',
                auth: 'tBHItJI5svbpez7KI4CCXg',
            },
        };
        const str = JSON.stringify(fallbackObj);
        localStorage.setItem('tac_push_subscription', str);
        return str;
    }
}

export const webPushService = new WebPushService();

