import UAParser from 'ua-parser-js';
import { getGeolocation } from './geolocation.js';

/**
 * Parse user-agent string into browser, operatingSystem, and deviceType.
 * Uses ua-parser-js for accurate detection.
 */
export const parseUserAgent = (ua) => {
  if (!ua) {
    return {
      browser: 'Unknown',
      operatingSystem: 'Unknown',
      device: 'Desktop'
    };
  }

  const parser = new UAParser(ua);
  const browserResult = parser.getBrowser();
  const osResult = parser.getOS();
  const deviceResult = parser.getDevice();

  const browser = browserResult?.name || 'Unknown';
  const operatingSystem = osResult?.name || 'Unknown';

  // Determine device type
  const deviceType = deviceResult?.type || 'desktop';
  let device = 'Desktop';
  if (deviceType === 'mobile') device = 'Mobile';
  else if (deviceType === 'tablet') device = 'Tablet';

  return { browser, operatingSystem, device };
};

/**
 * Enrich visit data with geolocation info.
 * Uses a short timeout to avoid blocking redirects.
 */
export const enrichWithGeolocation = async (ip) => {
  try {
    // Use Promise.race with a 500ms timeout to avoid slow geolocation blocking redirects
    const geoResult = await Promise.race([
      getGeolocation(ip),
      new Promise((resolve) => setTimeout(() => resolve(null), 500))
    ]);

    if (geoResult) {
      return {
        country: geoResult.country || 'Unknown',
        city: geoResult.city || 'Unknown'
      };
    }
  } catch {
    // Ignore geolocation errors
  }

  return { country: 'Unknown', city: 'Unknown' };
};