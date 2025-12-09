declare var cockpit: Cockpit.CockpitObject;

export interface VncServer {
    port: number;
    display: number;
    process: string;
    address: string;
}

export async function detectVncServers(): Promise<VncServer[]> {
    return new Promise((resolve) => {
        cockpit.spawn(['ss', '-tlnp'], { superuser: 'try' })
            .done((output: string) => {
                const servers = parseVncServers(output);
                resolve(servers);
            })
            .fail(() => {
                resolve([]);
            });
    });
}

function parseVncServers(ssOutput: string): VncServer[] {
    const servers: VncServer[] = [];
    const lines = ssOutput.split('\n');

    for (const line of lines) {
        // Match lines with VNC ports (5900-5999)
        const portMatch = line.match(/:(\d+)\s/);
        if (!portMatch) continue;

        const port = parseInt(portMatch[1], 10);
        if (port < 5900 || port > 5999) continue;

        // Extract process name if available
        let process = 'unknown';
        const processMatch = line.match(/users:\(\("([^"]+)"/);
        if (processMatch) {
            process = processMatch[1];
        }

        // Extract address
        let address = '0.0.0.0';
        const addressMatch = line.match(/(\d+\.\d+\.\d+\.\d+|\*|::|\[::\]):\d+/);
        if (addressMatch) {
            const addr = addressMatch[0].split(':')[0];
            address = addr === '*' || addr === '::' || addr === '[::]' ? '0.0.0.0' : addr;
        }

        const display = port - 5900;

        servers.push({
            port,
            display,
            process,
            address
        });
    }

    return servers;
}

export async function checkWebsockifyAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
        cockpit.spawn(['which', 'websockify'])
            .done(() => resolve(true))
            .fail(() => resolve(false));
    });
}
