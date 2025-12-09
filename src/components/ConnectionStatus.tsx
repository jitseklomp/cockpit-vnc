import React from 'react';
import {
    Button,
    Label,
    Flex,
    FlexItem,
    Alert,
    AlertVariant
} from '@patternfly/react-core';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    InProgressIcon,
    DisconnectedIcon
} from '@patternfly/react-icons';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionStatusProps {
    state: ConnectionState;
    errorMessage?: string;
    onConnect: () => void;
    onDisconnect: () => void;
    canConnect: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
    state,
    errorMessage,
    onConnect,
    onDisconnect,
    canConnect
}) => {
    const getStatusLabel = () => {
        switch (state) {
            case 'connected':
                return (
                    <Label color="green" icon={<CheckCircleIcon />}>
                        Connected
                    </Label>
                );
            case 'connecting':
                return (
                    <Label color="blue" icon={<InProgressIcon />}>
                        Connecting...
                    </Label>
                );
            case 'error':
                return (
                    <Label color="red" icon={<ExclamationCircleIcon />}>
                        Error
                    </Label>
                );
            default:
                return (
                    <Label color="grey" icon={<DisconnectedIcon />}>
                        Disconnected
                    </Label>
                );
        }
    };

    return (
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
            <Flex spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                    {getStatusLabel()}
                </FlexItem>
                <FlexItem>
                    {state === 'connected' || state === 'connecting' ? (
                        <Button
                            variant="secondary"
                            onClick={onDisconnect}
                            isDisabled={state === 'connecting'}
                        >
                            Disconnect
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={onConnect}
                            isDisabled={!canConnect}
                        >
                            Connect
                        </Button>
                    )}
                </FlexItem>
            </Flex>
            {state === 'error' && errorMessage && (
                <FlexItem>
                    <Alert variant={AlertVariant.danger} isInline title="Connection failed">
                        {errorMessage}
                    </Alert>
                </FlexItem>
            )}
        </Flex>
    );
};
