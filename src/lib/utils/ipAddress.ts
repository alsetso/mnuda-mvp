/**
 * Utility functions for extracting and validating IP addresses from request headers
 * Handles various proxy/CDN scenarios (Vercel, Cloudflare, etc.)
 */

/**
 * Extracts the real client IP address from request headers
 * Checks multiple headers in order of reliability
 */
export function extractClientIP(request: Request | { headers: Headers }): string | null {
  const headers = request instanceof Request ? request.headers : request.headers;
  
  // Priority order for IP extraction:
  // 1. cf-connecting-ip (Cloudflare) - most reliable when behind Cloudflare
  // 2. x-real-ip (nginx/HAProxy) - direct proxy header
  // 3. x-forwarded-for (standard proxy header) - first IP in chain
  // 4. x-client-ip (some proxies)
  // 5. x-cluster-client-ip (some load balancers)
  
  // Cloudflare header (most reliable)
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) {
    const ip = validateIP(cfIP);
    if (ip) return ip;
  }
  
  // Real IP header (nginx, HAProxy)
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    const ip = validateIP(realIP);
    if (ip) return ip;
  }
  
  // Forwarded For header (can contain multiple IPs: client, proxy1, proxy2)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (original client) from the chain
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    for (const ip of ips) {
      const validated = validateIP(ip);
      if (validated) return validated;
    }
  }
  
  // Other common headers
  const clientIP = headers.get('x-client-ip');
  if (clientIP) {
    const ip = validateIP(clientIP);
    if (ip) return ip;
  }
  
  const clusterIP = headers.get('x-cluster-client-ip');
  if (clusterIP) {
    const ip = validateIP(clusterIP);
    if (ip) return ip;
  }
  
  // For NextRequest, try request.ip (if available)
  if ('ip' in request && typeof request.ip === 'string') {
    const ip = validateIP(request.ip);
    if (ip) return ip;
  }
  
  return null;
}

/**
 * Validates and normalizes an IP address
 * Returns the IP if valid, null otherwise
 */
function validateIP(ip: string): string | null {
  if (!ip || typeof ip !== 'string') return null;
  
  const trimmed = ip.trim();
  if (!trimmed) return null;
  
  // Basic validation - check if it looks like an IP
  // IPv4: 1.2.3.4
  // IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334 or ::1
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  // Check if it's a valid format
  if (ipv4Regex.test(trimmed)) {
    // Validate IPv4 octets (0-255)
    const parts = trimmed.split('.');
    if (parts.length === 4) {
      const allValid = parts.every(part => {
        const num = parseInt(part, 10);
        return !isNaN(num) && num >= 0 && num <= 255;
      });
      if (allValid) return trimmed;
    }
  } else if (ipv6Regex.test(trimmed) || trimmed === '::1') {
    // Accept valid IPv6 (including ::1 for localhost)
    return trimmed;
  }
  
  return null;
}

/**
 * Checks if an IP address is a localhost/private IP
 * Useful for filtering out internal IPs in production
 */
export function isLocalhostIP(ip: string): boolean {
  if (!ip) return false;
  
  // IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return true;
  
  // IPv4 localhost
  if (ip === '127.0.0.1' || ip === 'localhost') return true;
  
  // Private IPv4 ranges
  if (ip.startsWith('10.') || 
      ip.startsWith('192.168.') || 
      ip.startsWith('172.16.') || 
      ip.startsWith('172.17.') || 
      ip.startsWith('172.18.') || 
      ip.startsWith('172.19.') || 
      ip.startsWith('172.20.') || 
      ip.startsWith('172.21.') || 
      ip.startsWith('172.22.') || 
      ip.startsWith('172.23.') || 
      ip.startsWith('172.24.') || 
      ip.startsWith('172.25.') || 
      ip.startsWith('172.26.') || 
      ip.startsWith('172.27.') || 
      ip.startsWith('172.28.') || 
      ip.startsWith('172.29.') || 
      ip.startsWith('172.30.') || 
      ip.startsWith('172.31.')) {
    return true;
  }
  
  return false;
}

