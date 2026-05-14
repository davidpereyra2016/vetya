const DICEBEAR_AVATAAARS_BASE_URL = 'https://api.dicebear.com/7.x/avataaars';

export const normalizeAvatarUri = (uri) => {
  if (!uri || typeof uri !== 'string') return uri;

  return uri.replace(
    `${DICEBEAR_AVATAAARS_BASE_URL}/svg?`,
    `${DICEBEAR_AVATAAARS_BASE_URL}/png?`
  );
};

export const getUserAvatarUri = (user) => normalizeAvatarUri(user?.profilePicture);
