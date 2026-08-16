export default {
    // Fetch event handler to serve static assets
    async fetch(request, env) {
        const url = new URL(request.url);

        // Redirect root path to /tv-online
        if (url.pathname === '/') {
            url.pathname = '/tv-online';
            return Response.redirect(url.toString(), 301);
        }

        if (url.pathname === '/send/message' && request.method === 'POST') {
            try {
                const appsScriptEndpoint = env.APPS_SCRIPT_ENDPOINT;
                const contentType = request.headers.get('Content-Type') || '';
                let formData;

                if (contentType.includes('application/json')) {
                    formData = await request.json();
                } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
                    formData = Object.fromEntries(await request.formData());
                } else {
                    console.error(await request.text());
                    throw new Error('Failed to parse request body: Unsupported Content-Type.');
                }

                const appsScriptResponse = await fetch(appsScriptEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (!appsScriptResponse.ok) {
                    throw new Error(`Failed to get a successful response from endpoint with: ${appsScriptResponse.status} ${appsScriptResponse.statusText}.`);
                }

                const appsScriptData = await appsScriptResponse.json();
                const result = appsScriptData?.result;
                if (!result || result === 'error') {
                    console.error(appsScriptData);
                    throw new Error(`Failed to get a successful result from endpoint. \n${JSON.stringify(appsScriptData.error)}`);
                }
                console.log('Successfully sent message to Apps Script endpoint');

                return new Response(result, { status: appsScriptResponse.status });

            } catch (error) {
                error.message = `Error sending message to Apps Script endpoint: ${error.message}`;
                console.error(error);
                return new Response(error.message, { status: 500 });
            }
        }

        let response = await env.ASSETS.fetch(request);

        // If the response is HTML, set the Content-Security-Policy header based on the origins stored in the KV store
        const contentType = response.headers.get('Content-Type') || '';
        if (contentType.includes('text/html')) {
            try {
                const kvKeyCSP = env.CLOUDFLARE_KV_KEY_CSP;
                let origins = await env.KEY_VALUE.get(kvKeyCSP);

                if (!origins) {
                    try {
                        // Fetch the config.json file from the ASSETS special binding
                        const configResponse = await env.ASSETS.fetch(new URL('/assets/config.json', request.url));
                        if (!configResponse.ok) {
                            throw new Error(`Failed to fetch config.json: ${configResponse.status} ${configResponse.statusText}`);
                        }
                        const configData = await configResponse.json();

                        // Extract unique origins from the config.json file
                        const uniqueOrigins = new Set();
                        configData.webpages?.forEach(webpage => {
                            webpage.urls.forEach(url => uniqueOrigins.add(new URL(url).origin));
                        });
                        origins = Array.from(uniqueOrigins).join(' ');

                        // Update the KV store with the unique origins
                        await env.KEY_VALUE.put(kvKeyCSP, origins);
                        console.log(`KV key ${kvKeyCSP} updated successfully with origins: ${origins}`);

                    } catch (error) {
                        error.message = `Failed to update KV key ${kvKeyCSP}: ${error.message}`;
                        throw error;
                    }
                }

                // Set the Content-Security-Policy header with the origins from the KV store
                const cspValue = [
                    "default-src 'self'",
                    "script-src 'self'",
                    "style-src 'self' https://www.w3schools.com",
                    "img-src 'self' data:",
                    "object-src 'none'",
                    `frame-src 'self' ${origins}`,
                    `connect-src 'self' ${origins}`
                ].join('; ');
                response = new Response(response.body, response);
                response.headers.set('Content-Security-Policy', cspValue);

            } catch (error) {
                error.message = `Error setting Content-Security-Policy header: ${error.message}`;
                console.error(error);
            }
        }

        return response;
    },

    // Scheduled event handler to trigger the Cloud Run endpoint based on the schedule defined in config.json and KV store
    async scheduled(controller, env, ctx) {
        ctx.waitUntil(
            (async () => {
                try {
                    const kvKeyCron = env.CLOUDFLARE_KV_KEY_CRON;
                    let times = await env.KEY_VALUE.get(kvKeyCron);

                    if (!times) {
                        try {
                            // Fetch the config.json file from the ASSETS special binding
                            const configResponse = await env.ASSETS.fetch(new URL('/assets/config.json', 'http://internal-assets'));
                            if (!configResponse.ok) {
                                throw new Error(`Failed to fetch config.json: ${configResponse.status} ${configResponse.statusText}`);
                            }
                            const configData = await configResponse.json();

                            // Extract unique times from the config.json file
                            const uniqueTimes = new Set();
                            configData.webpages?.forEach(webpage => {
                                if (webpage.isTime24H) {
                                    uniqueTimes.add(webpage.time);
                                }
                            });
                            times = Array.from(uniqueTimes).sort().join(' ');

                            // Update the KV store with the unique times
                            await env.KEY_VALUE.put(kvKeyCron, times);
                            console.log(`KV key ${kvKeyCron} updated successfully with times: ${times}`);

                        } catch (error) {
                            error.message = `Failed to update KV key ${kvKeyCron}: ${error.message}`;
                            throw error;
                        }
                    }

                    const scheduledTime = new Date(controller.scheduledTime);
                    scheduledTime.setUTCMinutes(scheduledTime.getUTCMinutes() + parseInt(env.CRONS_DELAY, 10));
                    const targetTime = scheduledTime.toISOString().slice(11, 16);

                    const scheduledCrons = env.SCHEDULED_CRONS.split(' ');
                    const scheduledTimes = times.split(' ');
                    const scheduledTasks = [...new Set([...scheduledCrons, ...scheduledTimes])].sort();

                    const cronsInterval = parseInt(env.CRONS_INTERVAL, 10);

                    // Check if the target time is within the schedule defined in scheduledCrons and config.json
                    if (!evaluateSchedule(targetTime, scheduledTasks, cronsInterval)) {
                        throw new Error(`Target time ${targetTime} is outside the schedule defined in the scheduled tasks. No run performed.`);
                    }

                    const cloudRunEndpoint = env.CLOUD_RUN_ENDPOINT;
                    const cloudRunApiToken = env.CLOUD_RUN_API_TOKEN;

                    // Trigger the Cloud Run endpoint with the Target Time and Crons Interval
                    const cloudRunResponse = await fetch(cloudRunEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${cloudRunApiToken}`
                        },
                        body: JSON.stringify({
                            'x-target-time-utc': targetTime,
                            'x-crons-interval': cronsInterval,
                            'x-origin': 'Cloudflare Pages Cron Trigger',
                            'x-message': 'Scheduled task triggered'
                        })
                    });

                    if (!cloudRunResponse.ok) {
                        throw new Error(`Failed to trigger Cloud Run endpoint: ${cloudRunResponse.status} ${cloudRunResponse.statusText}`);
                    }

                    const cloudRunData = await cloudRunResponse.json();
                    console.log('Successfully triggered Cloud Run endpoint:');
                    console.log(cloudRunData);

                } catch (error) {
                    error.message = `Error triggering Cloud Run endpoint: ${error.message}`;
                    console.error(error);
                }
            })()
        );
    }
};

// Helper function to evaluate if the target time is within the schedule defined in scheduledCrons and config.json
function evaluateSchedule(targetTime, scheduledTasks, cronsInterval) {
    // Convert time in HH:mm format to total minutes for easier comparison
    const getMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return 60 * hours + minutes;
    };

    const minutesTarget = getMinutes(targetTime);
    for (const scheduledTask of scheduledTasks) {
        const minutesScheduled = getMinutes(scheduledTask);
        const difference = minutesScheduled - minutesTarget;
        if ((difference >= 0 && difference < cronsInterval) || (difference < 0 && difference < cronsInterval - 1440)) {
            return true;
        }
    };
    return false;
}
