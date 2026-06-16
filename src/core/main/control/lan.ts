import os from 'node:os';

export const getPreferredLanAddress = (): string => {
  const networkInterfaces = os.networkInterfaces();

  for (const addresses of Object.values(networkInterfaces)) {
    if (!addresses) {
      continue;
    }

    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }

  return '127.0.0.1';
};
