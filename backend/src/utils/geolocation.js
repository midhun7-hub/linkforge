import axios from 'axios';

export const getGeolocation = async (ip) => {
  try {
    if (!process.env.GEOLOCATION_API_KEY) {
      return {
        country: 'Unknown',
        city: 'Unknown'
      };
    }

    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 3000
    });

    return {
      country: response.data.country_name || 'Unknown',
      city: response.data.city || 'Unknown'
    };
  } catch (error) {
    console.log('\x1b[33m%s\x1b[0m', '[GEOLOCATION] Using fallback - API unavailable');
    return {
      country: 'Unknown',
      city: 'Unknown'
    };
  }
};
