// Network utilities for capturing device information
export interface NetworkAdapter {
  macAddress: string;
  adapterType: 'wifi' | 'ethernet' | 'bluetooth' | 'other';
  adapterName: string;
  isActive: boolean;
}

// Function to get network adapter information
export async function getNetworkAdapters(): Promise<NetworkAdapter[]> {
  const adapters: NetworkAdapter[] = [];

  try {
    // Note: In a real browser environment, we can't directly access MAC addresses
    // due to security restrictions. This is a mock implementation for demonstration.
    // In production, you would need to use a different approach or require user input.

    // For development/testing, use the actual factory device MAC addresses
    const factoryAdapters: NetworkAdapter[] = [
      {
        macAddress: '9C:FC:E8:07:12:B4',
        adapterType: 'wifi',
        adapterName: 'WiFi',
        isActive: true
      },
      {
        macAddress: 'C0-3E-BA-68-A7-6C',
        adapterType: 'ethernet',
        adapterName: 'Ethernet',
        isActive: true
      }
    ];

    // In a real implementation, you might:
    // 1. Use WebRTC to get some network information
    // 2. Require users to manually input MAC addresses
    // 3. Use a browser extension with additional permissions
    // 4. Use a desktop application that can access system information

    return factoryAdapters;
  } catch (error) {
    console.error('Error getting network adapters:', error);
    return [];
  }
}

// Generate a mock MAC address for demonstration
function generateMockMacAddress(): string {
  const hex = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    if (i > 0) mac += ':';
    mac += hex[Math.floor(Math.random() * 16)];
    mac += hex[Math.floor(Math.random() * 16)];
  }
  return mac;
}

// Function to get enhanced device information including network adapters
export async function getEnhancedDeviceInfo() {
  const networkAdapters = await getNetworkAdapters();
  
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    isTablet: /tablet|ipad|playbook|silk/i.test(navigator.userAgent),
    isMobile: /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent),
    isFactoryDevice: window.location.hostname === 'localhost' || 
                    window.location.hostname.includes('factory') ||
                    window.location.hostname.includes('192.168') ||
                    window.location.hostname.includes('10.0'),
    screenResolution: `${screen.width}x${screen.height}`,
    timestamp: new Date().toISOString(),
    networkAdapters: networkAdapters
  };
}

// Function to validate MAC address format
export function isValidMacAddress(mac: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}

// Function to format MAC address
export function formatMacAddress(mac: string): string {
  // Remove any non-hex characters and convert to uppercase
  const cleaned = mac.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  
  // Add colons every 2 characters
  return cleaned.match(/.{1,2}/g)?.join(':') || mac;
}
