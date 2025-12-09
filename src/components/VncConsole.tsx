import React, { useEffect, useRef, useState } from 'react';
import {
    EmptyState,
    EmptyStateBody,
    EmptyStateHeader,
    EmptyStateIcon,
    Spinner,
    TextInput,
    Button,
    Modal,
    ModalVariant
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

// @ts-ignore - noVNC doesn't have great TypeScript support
import RFB from '@novnc/novnc/lib/rfb';

export interface VncConsoleProps {
    wsPort: number;
    onConnected?: () => void;
    onDisconnected?: (reason?: string) => void;
    onError?: (error: string) => void;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export const VncConsole: React.FC<VncConsoleProps> = ({
    wsPort,
    onConnected,
    onDisconnected,
    onError
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rfbRef = useRef<any>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (!containerRef.current || wsPort <= 0) return;

        const connect = () => {
            setConnectionState('connecting');
            setErrorMessage('');

            try {
                const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
                const host = window.location.hostname;
                const url = `${protocol}://${host}:${wsPort}`;

                const rfb = new RFB(containerRef.current, url, {
                    shared: true,
                    credentials: password ? { password } : undefined
                });

                rfb.scaleViewport = true;
                rfb.resizeSession = true;
                rfb.clipViewport = false;

                rfb.addEventListener('connect', () => {
                    setConnectionState('connected');
                    onConnected?.();
                });

                rfb.addEventListener('disconnect', (e: any) => {
                    const reason = e.detail?.clean ? undefined : 'Connection lost';
                    setConnectionState('disconnected');
                    onDisconnected?.(reason);
                });

                rfb.addEventListener('credentialsrequired', () => {
                    setShowPasswordModal(true);
                });

                rfb.addEventListener('securityfailure', (e: any) => {
                    const msg = e.detail?.reason || 'Security failure';
                    setConnectionState('error');
                    setErrorMessage(msg);
                    onError?.(msg);
                });

                rfbRef.current = rfb;
            } catch (err: any) {
                const msg = err?.message || 'Failed to connect';
                setConnectionState('error');
                setErrorMessage(msg);
                onError?.(msg);
            }
        };

        connect();

        return () => {
            if (rfbRef.current) {
                rfbRef.current.disconnect();
                rfbRef.current = null;
            }
        };
    }, [wsPort, password]);

    const handlePasswordSubmit = () => {
        setShowPasswordModal(false);
        if (rfbRef.current) {
            rfbRef.current.sendCredentials({ password });
        }
    };

    if (connectionState === 'connecting') {
        return (
            <EmptyState>
                <EmptyStateHeader icon={<EmptyStateIcon icon={Spinner} />} titleText="Connecting..." />
                <EmptyStateBody>
                    Establishing VNC connection...
                </EmptyStateBody>
            </EmptyState>
        );
    }

    if (connectionState === 'error') {
        return (
            <EmptyState>
                <EmptyStateHeader
                    icon={<EmptyStateIcon icon={ExclamationCircleIcon} color="var(--pf-v5-global--danger-color--100)" />}
                    titleText="Connection Error"
                />
                <EmptyStateBody>
                    {errorMessage}
                </EmptyStateBody>
            </EmptyState>
        );
    }

    return (
        <>
            <div ref={containerRef} className="vnc-console-container" />
            <Modal
                variant={ModalVariant.small}
                title="VNC Password Required"
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                actions={[
                    <Button key="submit" variant="primary" onClick={handlePasswordSubmit}>
                        Connect
                    </Button>,
                    <Button key="cancel" variant="link" onClick={() => setShowPasswordModal(false)}>
                        Cancel
                    </Button>
                ]}
            >
                <TextInput
                    type="password"
                    value={password}
                    onChange={(_event, value) => setPassword(value)}
                    placeholder="Enter VNC password"
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                />
            </Modal>
        </>
    );
};
