import React from 'react';
import {
    Page,
    PageSection,
    PageSectionVariants,
    Title,
    Flex,
    FlexItem,
    EmptyState,
    EmptyStateBody,
    EmptyStateHeader,
    EmptyStateIcon,
    Alert,
    AlertVariant
} from '@patternfly/react-core';
import { DesktopIcon, ExclamationTriangleIcon } from '@patternfly/react-icons';

import { VncServerSelector } from './components/VncServerSelector';
import { ConnectionStatus, ConnectionState } from './components/ConnectionStatus';
import { VncConsole } from './components/VncConsole';
import { VncServer, detectVncServers, checkWebsockifyAvailable } from './services/vnc-detection';
import { startWebsockify, stopWebsockify, WebsockifyInstance } from './services/websockify';

type ApplicationProps = {};

type ApplicationState = {
    servers: VncServer[];
    selectedServer: VncServer | null;
    connectionState: ConnectionState;
    errorMessage: string;
    isScanning: boolean;
    websockifyInstance: WebsockifyInstance | null;
    websockifyAvailable: boolean;
    checkingWebsockify: boolean;
};

export class Application extends React.Component<ApplicationProps, ApplicationState> {
    state: ApplicationState = {
        servers: [],
        selectedServer: null,
        connectionState: 'disconnected',
        errorMessage: '',
        isScanning: true,
        websockifyInstance: null,
        websockifyAvailable: true,
        checkingWebsockify: true
    };

    componentDidMount() {
        this.checkDependencies();
        this.scanForServers();
    }

    componentWillUnmount() {
        stopWebsockify();
    }

    checkDependencies = async () => {
        const available = await checkWebsockifyAvailable();
        this.setState({
            websockifyAvailable: available,
            checkingWebsockify: false
        });
    };

    scanForServers = async () => {
        this.setState({ isScanning: true });
        const servers = await detectVncServers();
        this.setState({
            servers,
            isScanning: false,
            // Auto-select first server if only one found
            selectedServer: servers.length === 1 ? servers[0] : this.state.selectedServer
        });
    };

    handleServerSelect = (server: VncServer | null) => {
        this.setState({ selectedServer: server });
    };

    handleConnect = async () => {
        const { selectedServer } = this.state;
        if (!selectedServer) return;

        this.setState({
            connectionState: 'connecting',
            errorMessage: ''
        });

        try {
            const instance = await startWebsockify(selectedServer.port);
            this.setState({ websockifyInstance: instance });
        } catch (err: any) {
            this.setState({
                connectionState: 'error',
                errorMessage: err?.message || 'Failed to start websockify proxy'
            });
        }
    };

    handleDisconnect = () => {
        stopWebsockify();
        this.setState({
            connectionState: 'disconnected',
            websockifyInstance: null,
            errorMessage: ''
        });
    };

    handleVncConnected = () => {
        this.setState({ connectionState: 'connected' });
    };

    handleVncDisconnected = (reason?: string) => {
        this.setState({
            connectionState: reason ? 'error' : 'disconnected',
            errorMessage: reason || ''
        });
    };

    handleVncError = (error: string) => {
        this.setState({
            connectionState: 'error',
            errorMessage: error
        });
    };

    renderContent() {
        const {
            connectionState,
            websockifyInstance,
            servers,
            websockifyAvailable,
            checkingWebsockify
        } = this.state;

        if (checkingWebsockify) {
            return (
                <EmptyState>
                    <EmptyStateHeader titleText="Checking dependencies..." />
                </EmptyState>
            );
        }

        if (!websockifyAvailable) {
            return (
                <EmptyState>
                    <EmptyStateHeader
                        icon={<EmptyStateIcon icon={ExclamationTriangleIcon} color="var(--pf-v5-global--warning-color--100)" />}
                        titleText="websockify not installed"
                    />
                    <EmptyStateBody>
                        The websockify package is required for VNC connections.
                        Install it using your package manager:
                        <br /><br />
                        <code>dnf install python3-websockify</code> or <code>apt install websockify</code>
                    </EmptyStateBody>
                </EmptyState>
            );
        }

        if (connectionState === 'connected' || connectionState === 'connecting') {
            if (websockifyInstance) {
                return (
                    <VncConsole
                        wsPort={websockifyInstance.wsPort}
                        onConnected={this.handleVncConnected}
                        onDisconnected={this.handleVncDisconnected}
                        onError={this.handleVncError}
                    />
                );
            }
        }

        if (servers.length === 0 && !this.state.isScanning) {
            return (
                <EmptyState>
                    <EmptyStateHeader
                        icon={<EmptyStateIcon icon={DesktopIcon} />}
                        titleText="No VNC servers found"
                    />
                    <EmptyStateBody>
                        No VNC servers were detected on this system.
                        Start a VNC server (e.g., x11vnc, tigervnc-server) and click refresh.
                    </EmptyStateBody>
                </EmptyState>
            );
        }

        return (
            <EmptyState>
                <EmptyStateHeader
                    icon={<EmptyStateIcon icon={DesktopIcon} />}
                    titleText="VNC Viewer"
                />
                <EmptyStateBody>
                    Select a VNC server above and click Connect to start a session.
                </EmptyStateBody>
            </EmptyState>
        );
    }

    render() {
        const {
            servers,
            selectedServer,
            connectionState,
            errorMessage,
            isScanning,
            websockifyAvailable,
            checkingWebsockify
        } = this.state;

        const isConnected = connectionState === 'connected' || connectionState === 'connecting';

        return (
            <Page>
                <PageSection variant={PageSectionVariants.light}>
                    <Flex
                        justifyContent={{ default: 'justifyContentSpaceBetween' }}
                        alignItems={{ default: 'alignItemsCenter' }}
                    >
                        <FlexItem>
                            <Title headingLevel="h1" size="xl">VNC Viewer</Title>
                        </FlexItem>
                    </Flex>
                </PageSection>

                {!checkingWebsockify && websockifyAvailable && (
                    <PageSection variant={PageSectionVariants.light}>
                        <Flex
                            spaceItems={{ default: 'spaceItemsLg' }}
                            alignItems={{ default: 'alignItemsCenter' }}
                            flexWrap={{ default: 'wrap' }}
                        >
                            <FlexItem>
                                <VncServerSelector
                                    servers={servers}
                                    selectedServer={selectedServer}
                                    onSelect={this.handleServerSelect}
                                    onRefresh={this.scanForServers}
                                    isLoading={isScanning}
                                    disabled={isConnected}
                                />
                            </FlexItem>
                            <FlexItem>
                                <ConnectionStatus
                                    state={connectionState}
                                    errorMessage={errorMessage}
                                    onConnect={this.handleConnect}
                                    onDisconnect={this.handleDisconnect}
                                    canConnect={selectedServer !== null}
                                />
                            </FlexItem>
                        </Flex>
                    </PageSection>
                )}

                <PageSection
                    isFilled
                    className="vnc-content-section"
                    variant={PageSectionVariants.default}
                >
                    {this.renderContent()}
                </PageSection>
            </Page>
        );
    }
}
