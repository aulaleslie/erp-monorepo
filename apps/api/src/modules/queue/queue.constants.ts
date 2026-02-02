export const QUEUE_NAMES = {
  DOC_ENGINE: 'doc-engine',
  EXPIRY: 'expiry',
} as const;

export const JOB_NAMES = {
  PROCESS_OUTBOX: 'process-outbox',
  MEMBERSHIP_EXPIRY: 'membership-expiry',
  PT_PACKAGE_EXPIRY: 'pt-package-expiry',
  EXPIRY_NOTIFICATION: 'expiry-notification',
} as const;

export const JOB_OPTIONS = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5 seconds initial delay
  },
  removeOnComplete: true,
  removeOnFail: false, // Keep failed jobs for manual inspection
} as const;
