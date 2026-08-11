import path from 'node:path';
import fs from 'node:fs';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const kvNamespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
const kvKeyCron = process.env.CLOUDFLARE_KV_KEY_CRON;
const kvKeyCSP = process.env.CLOUDFLARE_KV_KEY_CSP;
// Start Date - June 19, 2026
// End Date - September 18, 2026
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

(async () => {
    if (!accountId || !kvNamespaceId || !kvKeyCron || !kvKeyCSP || !apiToken) {
        console.log(process.env);
        console.error('Missing required environment variables.');
        process.exit(1);
    }

    try {
        // Read the config.json file
        const configPath = path.resolve('./public/assets/config.json');
        if (!fs.existsSync(configPath)) {
            throw new Error(`Config file not found at path: ${configPath}`);
        }
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const configData = JSON.parse(configContent);

        // Extract unique times and origins from the config data
        const uniqueTimes = new Set();
        const uniqueOrigins = new Set();
        configData.webpages?.forEach(webpage => {
            if (webpage.isTime24H) {
                uniqueTimes.add(webpage.time);
            }
            webpage.urls.forEach(url => uniqueOrigins.add(new URL(url).origin));
        });

        const times = Array.from(uniqueTimes).sort().join(' ');
        const origins = Array.from(uniqueOrigins).join(' ');

        // Prepare the request to update the KV store
        const kvUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${kvNamespaceId}/values`;
        const kvInit = {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'text/plain'
            }
        };

        // Update the KV key for Cron times
        const responseCron = await fetch(`${kvUrl}/${kvKeyCron}`, {
            ...kvInit,
            body: times
        });
        if (!responseCron.ok) {
            throw new Error(`Failed to update KV key ${kvKeyCron}: ${responseCron.status} ${responseCron.statusText}`);
        }
        console.log(`KV key ${kvKeyCron} updated successfully with:`, times);

        // Update the KV key for CSP origins
        const responseCSP = await fetch(`${kvUrl}/${kvKeyCSP}`, {
            ...kvInit,
            body: origins
        });
        if (!responseCSP.ok) {
            throw new Error(`Failed to update KV key ${kvKeyCSP}: ${responseCSP.status} ${responseCSP.statusText}`);
        }
        console.log(`KV key ${kvKeyCSP} updated successfully with:`, origins);

    } catch (error) {
        error.message = `Error updating KV store: ${error.message}`;
        console.error(error);
        process.exit(1);
    }
})();
