export const isValidIndianMobile = (mobile) => {
  if (!mobile) return false;
  const cleaned = String(mobile).replace(/\D/g, "").trim();
  if (cleaned.length !== 10) return false;
  return /^[6-9]\d{9}$/.test(cleaned);
};

export const sanitizeIndianMobile = (mobile) => {
  if (!mobile) return "";
  return String(mobile).replace(/\D/g, "").slice(0, 10);
};
