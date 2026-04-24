import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  BETTER_AUTH_SECRET: Joi.string().required(),
  BETTER_AUTH_URL: Joi.string().default('http://localhost:3000'),
  APP_URL: Joi.string().default('http://localhost:8090'),
  CORS_ORIGIN: Joi.string().default('http://localhost:8090'),

  WOMPI_PUBLIC_KEY: Joi.string().required(),
  WOMPI_PRIVATE_KEY: Joi.string().required(),
  WOMPI_INTEGRITY_SECRET: Joi.string().required(),
  WOMPI_EVENTS_SECRET: Joi.string().required(),
  WOMPI_API_URL: Joi.string().default('https://sandbox.wompi.co/v1'),

  RESEND_API_KEY: Joi.string().required(),
  RESEND_FROM_EMAIL: Joi.string().default('HypePass <no-reply@hypepass.com>'),

  ADMIN_NOTIFICATION_EMAILS: Joi.string().required(),

  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  CLOUDINARY_FOLDER: Joi.string().default('hypepass'),

  PLATFORM_FEE_PERCENTAGE_PRIMARY: Joi.number().default(10),
  PLATFORM_FEE_PERCENTAGE_RESALE: Joi.number().default(10),
  INVENTORY_HOLD_MINUTES: Joi.number().default(10),
  DEFAULT_QR_VISIBLE_HOURS_BEFORE: Joi.number().default(24),

  QR_HMAC_SECRET: Joi.string().min(16).required(),
  QR_TOKEN_TTL_SECONDS: Joi.number().default(60),
  CHECKIN_GRACE_MINUTES: Joi.number().default(120),

  RESALE_PRICE_CAP_MULTIPLIER: Joi.number().default(1.2),
  RESALE_RESERVATION_MINUTES: Joi.number().default(10),
  RESALE_MAX_DAYS: Joi.number().default(30),
  PAYOUT_ESCROW_HOURS_AFTER_EVENT: Joi.number().default(48),

  THROTTLE_TTL_MS: Joi.number().default(60_000),
  THROTTLE_LIMIT: Joi.number().default(120),
  THROTTLE_AUTH_LIMIT: Joi.number().default(20),
  THROTTLE_CHECKOUT_LIMIT: Joi.number().default(10),

  SWEEPER_ENABLED: Joi.boolean().default(true),
});
