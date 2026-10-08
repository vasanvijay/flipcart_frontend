import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BASE_URL } from '../../utils/config';

const MetaPixel = () => {
    const location = useLocation();

    useEffect(() => {
        const initPixel = async () => {
            // 1. Try to get from Backend if not in LocalStorage (or always update to be safe)
            try {
                const res = await fetch(`${BASE_URL}/api/settings`);
                if (res.ok) {
                    const settings = await res.json();
                    if (settings.meta_pixel_id) {
                        localStorage.setItem('meta_pixel_id', settings.meta_pixel_id);
                    }
                    if (settings.meta_pixel_config) {
                        localStorage.setItem('meta_pixel_config', settings.meta_pixel_config);
                    }
                }
            } catch (error) {
                console.warn("Failed to fetch Meta Pixel config", error);
            }

            // 2. Logic to Select ID (Standard or Multi-Domain)
            const getPixelId = () => {
                const defaultId = localStorage.getItem('meta_pixel_id');
                const configInfo = localStorage.getItem('meta_pixel_config');
                const currentHost = window.location.hostname;

                if (configInfo) {
                    const lines = configInfo.split('\n');
                    for (let line of lines) {
                        const [domain, id] = line.split('=');
                        if (domain && id && currentHost.includes(domain.trim())) {
                            console.log(`[Meta Pixel] matched domain: ${domain}, using ID: ${id}`);
                            return id.trim();
                        }
                    }
                }
                return defaultId;
            };

            const pixelId = getPixelId();

            if (pixelId) {
                // Initialize Meta Pixel Script
                // eslint-disable-next-line no-unused-expressions
                !function (f, b, e, v, n, t, s) {
                    if (f.fbq) return; n = f.fbq = function () {
                        n.callMethod ?
                            n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                    };
                    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
                    n.queue = []; t = b.createElement(e); t.async = !0;
                    t.src = v; s = b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t, s)
                }(window, document, 'script',
                    'https://connect.facebook.net/en_US/fbevents.js');

                window.fbq('init', pixelId);
                window.fbq('track', 'PageView'); // Track initial load
            }
        };

        initPixel();
    }, []); // Run once on mount

    // Track PageViews on route change
    useEffect(() => {
        const pixelId = localStorage.getItem('meta_pixel_id');
        if (pixelId && window.fbq) {
            window.fbq('track', 'PageView');
        }
    }, [location]);

    return null;
};

export default MetaPixel;
