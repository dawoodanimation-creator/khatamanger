export const customerPath = (id: string, action = '') => `/customer/${encodeURIComponent(id)}${action ? `/${action}` : ''}`;
