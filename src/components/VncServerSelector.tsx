import React from 'react';
import {
    Select,
    SelectOption,
    SelectList,
    MenuToggle,
    MenuToggleElement,
    Button,
    Flex,
    FlexItem,
    Spinner
} from '@patternfly/react-core';
import { SyncIcon } from '@patternfly/react-icons';
import { VncServer } from '../services/vnc-detection';

export interface VncServerSelectorProps {
    servers: VncServer[];
    selectedServer: VncServer | null;
    onSelect: (server: VncServer | null) => void;
    onRefresh: () => void;
    isLoading: boolean;
    disabled?: boolean;
}

export const VncServerSelector: React.FC<VncServerSelectorProps> = ({
    servers,
    selectedServer,
    onSelect,
    onRefresh,
    isLoading,
    disabled
}) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const onToggle = () => {
        setIsOpen(!isOpen);
    };

    const onSelectOption = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
        const port = parseInt(value as string, 10);
        const server = servers.find(s => s.port === port) || null;
        onSelect(server);
        setIsOpen(false);
    };

    const getToggleText = () => {
        if (isLoading) {
            return 'Scanning...';
        }
        if (selectedServer) {
            return `Display :${selectedServer.display} (${selectedServer.process}) - Port ${selectedServer.port}`;
        }
        if (servers.length === 0) {
            return 'No VNC servers found';
        }
        return 'Select a VNC server';
    };

    const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
            ref={toggleRef}
            onClick={onToggle}
            isExpanded={isOpen}
            isDisabled={disabled || isLoading || servers.length === 0}
            style={{ minWidth: '300px' }}
        >
            {isLoading && <Spinner size="sm" style={{ marginRight: '8px' }} />}
            {getToggleText()}
        </MenuToggle>
    );

    return (
        <Flex>
            <FlexItem>
                <Select
                    isOpen={isOpen}
                    selected={selectedServer?.port.toString()}
                    onSelect={onSelectOption}
                    onOpenChange={setIsOpen}
                    toggle={toggle}
                >
                    <SelectList>
                        {servers.map((server) => (
                            <SelectOption key={server.port} value={server.port.toString()}>
                                Display :{server.display} ({server.process}) - Port {server.port}
                            </SelectOption>
                        ))}
                    </SelectList>
                </Select>
            </FlexItem>
            <FlexItem>
                <Button
                    variant="plain"
                    onClick={onRefresh}
                    isDisabled={isLoading || disabled}
                    aria-label="Refresh server list"
                >
                    <SyncIcon />
                </Button>
            </FlexItem>
        </Flex>
    );
};
