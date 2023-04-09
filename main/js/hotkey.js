g_hotkey.init({
    defaultList: {
        'f5': {
            title: '刷新',
            content: "location.reload()",
            type: 2,
        },
        'f12': {
            title: '开发者工具',
            content: "ipc_send('devtool')",
            type: 2,
        },
        '-': {
            title: '切换左侧边',
            content: "g_sidebar.toggle('left')",
            type: 2,
        },
        '=': {
            title: '切换右侧边',
            content: "g_sidebar.toggle('right')",
            type: 2,
        },
        'ctrl+shift+k': {
            title: '快捷键设置',
            content: "g_action.do(null, 'modal_hotkey')",
            type: 2,
        },
        'f11': {
            title: '全屏',
            content: "toggleFullScreen()",
            type: 2,
        },
    },
    saveData: (name, data) => local_saveJson(name, data),
    getData: (name, def) => local_readJson(name, def || {}),
})