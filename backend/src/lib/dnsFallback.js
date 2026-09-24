import dns from 'node:dns';
import { logger } from './logger.js';

const BROKEN_RESOLVER = new Set(['ECONNREFUSED', 'ESERVFAIL', 'ETIMEOUT', 'EREFUSED', 'ENOTFOUND']);

/**
 * MongoDB Atlas (mongodb+srv://) needs a DNS SRV lookup before it can connect.
 * Some machines point Node at a local resolver (e.g. 127.0.0.1 from a VPN or ad-blocker)
 * that isn't running, so every lookup fails with ECONNREFUSED and the app can't start.
 *
 * Probe the cluster's SRV record and, if the configured resolver refuses, switch this
 * process to public DNS servers. Set DNS_FALLBACK_SERVERS="" to disable.
 *
 * @returns {Promise<boolean>} whether resolution works after this call
 */
export async function ensureSrvResolution(uri, fallbackServers = '8.8.8.8,1.1.1.1') {
  if (!uri?.startsWith('mongodb+srv://')) return true;

  const host = uri.split('@')[1]?.split(/[/?]/)[0];
  if (!host) return true;
  const record = `_mongodb._tcp.${host}`;

  try {
    await dns.promises.resolveSrv(record);
    return true;
  } catch (error) {
    const servers = fallbackServers.split(',').map((s) => s.trim()).filter(Boolean);
    if (!BROKEN_RESOLVER.has(error.code) || !servers.length) return false;

    logger.warn(
      `DNS lookup for ${host} failed (${error.code}) via resolver ${dns.getServers().join(', ')} — retrying with ${servers.join(', ')}`,
    );
    const original = dns.getServers();
    dns.setServers(servers);
    try {
      await dns.promises.resolveSrv(record);
      logger.warn('Using fallback DNS servers for this process. Fix the system resolver to avoid this.');
      return true;
    } catch (retryError) {
      dns.setServers(original);
      logger.error(`DNS still failing with public servers: ${retryError.code}`);
      return false;
    }
  }
}
