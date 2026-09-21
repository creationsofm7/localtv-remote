import dgram from 'node:dgram';
import os, { type NetworkInterfaceInfo } from 'node:os';

export type LanAddress = {
  address: string;
  name: string;
};

type NetworkInterfaces = NodeJS.Dict<NetworkInterfaceInfo[]>;

const VIRTUAL_INTERFACE = /(?:vEthernet|WSL|Hyper-V|Docker|VMware|VirtualBox|Loopback)/i;

export const listLanAddresses = (
  networkInterfaces: NetworkInterfaces = os.networkInterfaces(),
): LanAddress[] => {
  const result: LanAddress[] = [];

  for (const [name, addresses] of Object.entries(networkInterfaces)) {
    for (const address of addresses ?? []) {
      const isIpv4 = address.family === 'IPv4';
      const isLinkLocal = address.address.startsWith('169.254.');

      if (isIpv4 && !address.internal && !isLinkLocal) {
        result.push({ address: address.address, name });
      }
    }
  }

  return result;
};

export const selectLanAddress = (
  addresses: LanAddress[],
  routedAddress: string | null,
  manualAddress: string | null,
): string => {
  if (manualAddress && addresses.some((item) => item.address === manualAddress)) {
    return manualAddress;
  }

  if (routedAddress && addresses.some((item) => item.address === routedAddress)) {
    return routedAddress;
  }

  return addresses.find((item) => !VIRTUAL_INTERFACE.test(item.name))?.address
    ?? addresses[0]?.address
    ?? '127.0.0.1';
};

/**
 * Ask the OS routing table which source address it would use for ordinary
 * outbound IPv4 traffic. UDP connect does not send a packet; it only lets the
 * kernel choose the route and local interface.
 */
export const getRoutedLanAddress = (
  probeAddress = '1.1.1.1',
  timeoutMs = 750,
): Promise<string | null> => new Promise((resolve) => {
  const socket = dgram.createSocket('udp4');
  let settled = false;

  const finish = (address: string | null) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    try { socket.close(); } catch { /* already closed */ }
    resolve(address);
  };

  const timer = setTimeout(() => finish(null), timeoutMs);
  socket.once('error', () => finish(null));
  socket.connect(53, probeAddress, () => {
    const local = socket.address();
    finish(typeof local === 'object' ? local.address : null);
  });
});

export const resolveLanAddress = async (
  manualAddress: string | null = null,
): Promise<{ address: string; addresses: LanAddress[] }> => {
  const addresses = listLanAddresses();
  const routedAddress = await getRoutedLanAddress();

  return {
    address: selectLanAddress(addresses, routedAddress, manualAddress),
    addresses,
  };
};
