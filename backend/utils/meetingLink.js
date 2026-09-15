const isValidGoogleMeetLink = (value) => {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const url = new URL(trimmed);
    const isMeetHost = url.hostname === 'meet.google.com' || url.hostname.endsWith('.meet.google.com');
    if (!isMeetHost) return false;

    const path = url.pathname.replace(/^\//, '').replace(/\/$/, '');
    return /^[A-Za-z0-9-]+$/.test(path) && path.length >= 10;
  } catch (error) {
    return false;
  }
};

module.exports = {
  isValidGoogleMeetLink,
};
