export const items = (handler: any, project: number) => [
    {
        key: 'newItem',
        name: 'New',
        icon: 'Add',
        ariaLabel: 'New. Use left and right arrow keys to navigate',
        subMenuProps: {
            items: [
                {
                    key: 'New/Device',
                    name: 'Device',
                    icon: 'AzureServiceEndpoint',
                    onClick: (e) => { e.preventDefault(); handler('/New/Device/?project=' + project) },
                    link: '/New/Device/?project=' + project
                    // href: '/New/Device'
                },
                {
                    key: 'Scene',
                    name: 'Scene',
                    icon: 'Calendar'
                }
            ],
        },
    },
    {
        key: 'share',
        name: 'Share',
        icon: 'Share',
        onClick: () => { return; }
    }

];

export const textOnlyItems = [
    {
        key: 'upload',
        name: 'Upload',
        onClick: () => { return; }
    },
    {
        key: 'share',
        name: 'Share',
        onClick: () => { return; }
    },
    {
        key: 'download',
        name: 'Download',
        onClick: () => { return; }
    }
];

export const iconOnlyItems = [
    {
        key: 'upload',
        name: '',
        icon: 'Upload',
        onClick: () => { return; }
    },
    {
        key: 'share',
        name: '',
        icon: 'Share',
        onClick: () => { return; }
    },
    {
        key: 'download',
        name: '',
        icon: 'Download',
        onClick: () => { return; }
    },
    {
        key: 'move',
        name: '',
        icon: 'MoveToFolder',
        onClick: () => { return; }
    },
    {
        key: 'copy',
        name: '',
        icon: 'Copy',
        onClick: () => { return; }
    },
    {
        key: 'rename',
        name: '',
        icon: 'Edit',
        onClick: () => { return; }
    },
    {
        key: 'disabled',
        icon: 'Cancel',
        onClick: () => { return; }
    }
];

export const overflowItems = [

];

export const farItems = [
    {
        key: 'sort',
        name: 'Sort',
        icon: 'SortLines',
        onClick: () => { return; }
    },
    {
        key: 'tile',
        name: 'Grid view',
        icon: 'Tiles',
        onClick: () => { return; }
    },
    {
        key: 'info',
        name: 'Info',
        icon: 'Info',
        onClick: () => { return; }
    }
];

export const itemsNonFocusable = [
    {
        key: 'newItem',
        name: 'New',
        icon: 'Add',
        ariaLabel: 'New. Use left and right arrow keys to navigate',
        onClick: () => { return; },
        items: [
            {
                key: 'emailMessage',
                name: 'Email message',
                icon: 'Mail'
            },
            {
                key: 'calendarEvent',
                name: 'Calendar event',
                icon: 'Calendar'
            }
        ]
    },
    {
        key: 'upload',
        name: 'Upload',
        icon: 'Upload',
        onClick: () => { return; },
        ['data-automation-id']: 'uploadNonFocusButton'
    }
];

export const farItemsNonFocusable = [
    {
        key: 'sort',
        name: 'Sort',
        iconProps: {
            iconName: 'SortLines'
        }
    },
    {
        key: 'tile',
        name: 'Grid view',
        iconProps: {
            iconName: 'Tiles'
        }
    },
    {
        key: 'Logout',
        name: 'Logout',
        icon: 'AccountManagement'
    },
    {
        key: 'publish',
        name: 'Publish',
        icon: 'CloudUpload',
        onClick: () => { return; }
    }
];
