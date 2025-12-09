declare var cockpit: Cockpit.CockpitObject;

export interface WebsockifyInstance {
    wsPort: number;
    vncPort: number;
    stop: () => void;
}

let currentInstance: WebsockifyInstance | null = null;
let nextWsPort = 6080;

export async function startWebsockify(vncPort: number): Promise<WebsockifyInstance> {
    // Stop any existing instance
    if (currentInstance) {
        currentInstance.stop();
        currentInstance = null;
    }

    const wsPort = nextWsPort++;
    if (nextWsPort > 6099) {
        nextWsPort = 6080;
    }

    return new Promise((resolve, reject) => {
        const process = cockpit.spawn(
            ['websockify', '--timeout=0', `${wsPort}`, `localhost:${vncPort}`],
            { superuser: 'try' }
        );

        let stopped = false;

        const instance: WebsockifyInstance = {
            wsPort,
            vncPort,
            stop: () => {
                if (!stopped) {
                    stopped = true;
                    process.close('terminated');
                    currentInstance = null;
                }
            }
        };

        // Give websockify a moment to start
        setTimeout(() => {
            if (!stopped) {
                currentInstance = instance;
                resolve(instance);
            }
        }, 500);

        process.fail((error: any) => {
            if (!stopped) {
                stopped = true;
                reject(new Error(`Failed to start websockify: ${error?.message || 'Unknown error'}`));
            }
        });
    });
}

export function stopWebsockify(): void {
    if (currentInstance) {
        currentInstance.stop();
        currentInstance = null;
    }
}

export function getCurrentInstance(): WebsockifyInstance | null {
    return currentInstance;
}
