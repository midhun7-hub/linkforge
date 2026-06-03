import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import Url from '../models/Url.js';

/**
 * Finds the next available alias by checking if the base alias exists,
 * then trying base-1, base-2, etc.
 */
const getUniqueAlias = async (baseAlias) => {
  let candidate = baseAlias;
  let suffix = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Url.findOne({ $or: [{ shortCode: candidate }, { customAlias: candidate }] });
    if (!existing) return candidate;
    suffix++;
    candidate = `${baseAlias}-${suffix}`;
  }
};

export const bulkUpload = async (req, res) => {
  try {
    const { urls } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of URLs'
      });
    }

    const createdUrls = [];
    const errors = [];

    for (const item of urls) {
      try {
        const { originalUrl, customAlias, expiryDate, startDate, password } = item;

        let shortCode;
        let shortUrl;

        if (customAlias) {
          // Generate unique alias to avoid collisions
          shortCode = await getUniqueAlias(customAlias);
        } else {
          shortCode = nanoid(8);
        }

        shortUrl = `${process.env.BACKEND_URL}/${shortCode}`;

        const urlData = {
          userId,
          originalUrl,
          shortCode,
          shortUrl,
          startDate: startDate || null,
          expiryDate: expiryDate || null,
          passwordProtected: !!password,
          passwordHash: null
        };

        // Hash password if provided
        if (password) {
          const salt = await bcrypt.genSalt(10);
          urlData.passwordHash = await bcrypt.hash(password, salt);
        }

        // Don't store null customAlias (unique+sparse index).
        if (customAlias) {
          urlData.customAlias = shortCode;
        }

        const url = await Url.create(urlData);

        createdUrls.push(url);
      } catch (error) {
        errors.push({
          originalUrl: item.originalUrl,
          error: error.message
        });
      }
    }

    console.log('\x1b[32m%s\x1b[0m', '[BULK UPLOAD] Created:', createdUrls.length, 'URLs');
    console.log('\x1b[33m%s\x1b[0m', '[BULK UPLOAD] Errors:', errors.length);

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdUrls.length} URLs`,
      createdUrls,
      errors
    });
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[BULK ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Bulk upload failed'
    });
  }
};