const DICEBEAR_AVATAAARS_BASE_URL = "https://api.dicebear.com/7.x/avataaars";

export const createDefaultAvatarUrl = (seed = "Vetya") => {
  const encodedSeed = encodeURIComponent(String(seed || "Vetya").trim() || "Vetya");
  return `${DICEBEAR_AVATAAARS_BASE_URL}/png?seed=${encodedSeed}&size=256`;
};

export const normalizeAvatarUrl = (url) => {
  if (!url || typeof url !== "string") return url;

  return url.replace(`${DICEBEAR_AVATAAARS_BASE_URL}/svg?`, `${DICEBEAR_AVATAAARS_BASE_URL}/png?`);
};
