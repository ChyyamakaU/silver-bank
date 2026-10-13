export const getErrorMessage = (err, fallback = 'Something went wrong') => {
  const error = err?.response?.data?.error;
  if (error?.details && typeof error.details === 'object') {
    const messages = Object.values(error.details).flat().filter(Boolean);
    if (messages.length) return messages.join('; ');
  }
  return (
    error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
};

export default getErrorMessage;
