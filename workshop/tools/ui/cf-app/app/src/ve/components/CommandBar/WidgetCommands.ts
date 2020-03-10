export const ClipboardActions = [

]
export const WidgetActions = (handler: (command: string) => {}, selection: any[]) => [
    {
        key: 'delete',
        name: '',
        icon: 'delete',
        className: 'icon-red',
        onClick: (e) => { e.preventDefault(); handler('delete') },
    },
    {
        key: 'undo',
        name: '',
        icon: 'undo',
        global: true,
        onClick: (e) => { e.preventDefault(); handler('undo') },
    },
    {
        key: 'redo',
        name: '',
        icon: 'redo',
        global: true,
        onClick: (e) => { e.preventDefault(); handler('redo') }
    }
]
export const items = (handler: any, project: number, selection: any[]) => [
    {
        key: 'newItem',
        name: '',
        icon: 'paste',
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
    }
]

export const all = (handler: any, project: number, selection: any[]) => {
    return [
        ...items(handler, project, selection),
        ...WidgetActions(handler, selection)
    ];
}

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

];

export const farItemsNonFocusable = [

];
