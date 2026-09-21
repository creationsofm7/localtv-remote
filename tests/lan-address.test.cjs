const assert = require('node:assert/strict');
const test = require('node:test');

const {
  listLanAddresses,
  selectLanAddress,
} = require('../dist/core/main/control/lan.js');

const interfaces = {
  'vEthernet (WSL (Hyper-V firewall))': [
    {
      address: '172.23.64.1',
      family: 'IPv4',
      internal: false,
      mac: '00:15:5d:00:00:01',
      netmask: '255.255.240.0',
      cidr: '172.23.64.1/20',
    },
  ],
  WiFi: [
    {
      address: '172.20.10.2',
      family: 'IPv4',
      internal: false,
      mac: '00:11:22:33:44:55',
      netmask: '255.255.255.240',
      cidr: '172.20.10.2/28',
    },
  ],
  Ethernet: [
    {
      address: '169.254.196.156',
      family: 'IPv4',
      internal: false,
      mac: '00:11:22:33:44:66',
      netmask: '255.255.0.0',
      cidr: '169.254.196.156/16',
    },
  ],
};

test('route-selected physical address wins over the first virtual adapter', () => {
  const addresses = listLanAddresses(interfaces);

  assert.deepEqual(addresses, [
    { address: '172.23.64.1', name: 'vEthernet (WSL (Hyper-V firewall))' },
    { address: '172.20.10.2', name: 'WiFi' },
  ]);
  assert.equal(selectLanAddress(addresses, '172.20.10.2', null), '172.20.10.2');
});

test('manual address wins while it remains available', () => {
  const addresses = listLanAddresses(interfaces);

  assert.equal(selectLanAddress(addresses, '172.20.10.2', '172.23.64.1'), '172.23.64.1');
});

test('missing manual address falls back to the routed address', () => {
  const addresses = listLanAddresses(interfaces);

  assert.equal(selectLanAddress(addresses, '172.20.10.2', '10.0.0.8'), '172.20.10.2');
});

