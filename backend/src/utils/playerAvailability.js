const PLAYER_AVAILABILITY_STATUSES = [
  'AVAILABLE',
  'PENDING',
  'INJURED',
  'SUSPENDED',
  'UNAVAILABLE',
];

const BLOCKED_SELECTION_STATUSES = ['INJURED', 'SUSPENDED', 'UNAVAILABLE'];

const normalizeAvailabilityStatus = (value) =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';

const isValidAvailabilityStatus = (value) =>
  PLAYER_AVAILABILITY_STATUSES.includes(normalizeAvailabilityStatus(value));

const isBlockedAvailabilityStatus = (value) =>
  BLOCKED_SELECTION_STATUSES.includes(normalizeAvailabilityStatus(value));

module.exports = {
  PLAYER_AVAILABILITY_STATUSES,
  BLOCKED_SELECTION_STATUSES,
  normalizeAvailabilityStatus,
  isValidAvailabilityStatus,
  isBlockedAvailabilityStatus,
};
