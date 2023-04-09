const { app, BrowserWindow, ipcMain, Menu, shell, dialog, session, Tray } = require('electron')
const path = require('path')
const fs = require('fs-extra')
const _files = require('./file.js')
app.commandLine.appendSwitch("disable-http-cache");
// app.commandLine.appendSwitch('wm-window-animations-disabled');
// app.disableHardwareAcceleration()

Menu.setApplicationMenu(null)
const remote = require("@electron/remote/main")
var win;

const send = (k, v) => win.webContents && win.webContents.send(k, v);
const _appPath = app.isPackaged ? path.join(process.resourcesPath, 'app') : __dirname;
const _basePath = path.resolve(_appPath, '../../');


function isEmpty(s, trim = false) {
    if (s === null || typeof s === 'undefined') return true;
    if (typeof s === 'string') return (trim ? s.trim() : s).length === 0;
    return false;
}

function openFileDialog(opts, callback) {
    opts = Object.assign({
        title: '选中文件',
        properties: ['openFile'], // multiSelections
    }, opts);
    dialog.showOpenDialog(win, Object.assign({}, opts)).then(res => callback(res.filePaths || res.filePath));
}

var lastBounds // win如何获取隐藏状态??
function toggleShow(show) {
    if (show == undefined) show = lastBounds != undefined
    if (show || win.isMaximized()) {
        win.show()
        lastBounds && win.setBounds(lastBounds)
        lastBounds = undefined
    } else {
        lastBounds = win.getBounds()
        win.hide()
    }
}

ipcMain.on("method", async function(event, data) {
    let d = data.msg;
    switch (data.type) {
        case 'toggleShow':
            return toggleShow()
        case 'show':
            return toggleShow(true)
        case 'hide':
            return toggleShow(false)
        case 'exit':
            return app.exit()
        case 'ondragstart':
            // TODO 判断是否为云盘，云盘的文件加载封面会报错就很奇怪...难道要异步保存到本地再startDrag??
            let list = [];
            for (let file of d.files) {
                if (_files.exists(file)) list.push(file);
            }
            event.sender.startDrag({
                files: list,
                // icon: d.icon || _appPath + '/files.ico', 
                icon: _appPath + '/files.ico',
            });
            break;
        case 'pin':
            if (d == undefined) d = !win.isAlwaysOnTop();
            return win.setAlwaysOnTop(d, 'screen');
        case 'min':
            return win.minimize()
        case 'max':
            return win.isMaximized() ? win.restore() : win.maximize()
        case 'exit':
            return app.exit()
        case 'close':
            return win.close()
        case 'progress':
            return win.setProgressBar(d.val, d.type || 'normal')
        case 'fileDialog':
            openFileDialog(d, res => {
                event.sender.send('fileDialog_revice', {
                    id: d.id,
                    paths: res
                })
            });
            break;

        case 'saveAsZip':
            let { saveTo, files, fileName } = d
            if (!saveTo) {
                saveTo = await openFileDialog({
                    title: '选择保存位置',
                    defaultPath: fileName,
                    filters: [{
                        name: '压缩文件',
                        extensions: ['zip'],
                    }],
                    properties: ['openFile'], // multiSelections
                });
                if (!saveTo) return
            } else {
                saveTo += '\\' + fileName
            }
            const archiver = require('archiver');
            const output = fs.createWriteStream(saveTo);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            output.on('close', function() {
                event.sender.send('callback', Object.assign({ type: 'zip_complete', saveTo, size: archive.pointer() }))
            });
            const showErr = err => dialog.showErrorBox('打包失败', err.toString());
            archive.on('warning', showErr);
            archive.on('error', showErr);
            archive.pipe(output);
            for (let [file, name] of Object.entries(files)) {
                if (_files.exists(file)) {
                    //var name = _files.safePath(d.files[file]);
                    archive.file(file, { name: name + path.extname(file) });
                }
            }
            archive.finalize();
            break;
    }
});

function createWindow(opts) {
    win = new BrowserWindow({
        // width: 600,
        // height: 800,
        // minHeight: 600,
        // minWidth: 800,
        show: false,
        shadow: true,
        frame: false,
        fullScreen: true,
        icon: opts.icon,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegrationInWorker: true,
            spellcheck: false,
            webSecurity: false,
            // preload: path.join(_appPath, 'preload.js'),
            nodeIntegration: true,
            webviewTag: true,
            contextIsolation: false,
        }
    })
    // remote.enable(win.webContents);
    // win.setThumbarButtons([{
    //     tooltip: 'button1',
    //     icon: path.join(_appPath, 'test.png'),
    //     click() { console.log('button1 clicked') }
    // }])

    // win.setOverlayIcon(opts.icon, opts.title)
    // win.setAppDetails({
    //     appId: 'com.hunmer.'+opts.title,
    //     appIconPath: opts.icon,
    // });
    // win.webContents.openDevTools()
    win.webContents.on('did-attach-webview', (event, webContents) => {
        remote.enable(webContents);
        // 新窗口转为tab
        // webContents.session.setProxy({}) // 重置代理
        webContents.setWindowOpenHandler(function(data) {
            webContents.send('newTab', {
                id: webContents.id,
                url: data.url
            });
            return {
                action: 'deny'
            }
        });
    });
    win.webContents.session.on('will-download', (e, item, webContents) => {
        e.preventDefault();
        send('download', {
            refer: webContents.getURL(),
            url: item.getURL(),
            type: item.getMimeType(),
            fileName: item.getFilename(),
            size: item.getTotalBytes(),
            webview: webContents.id
        })
    });

    win.on('always-on-top-changed', (event, isTop) => send('togglePin', isTop))

    win.on('show', () => {
        // TOOD 复原窗口位置
    })

    win.on('close', (event) => {
        event.preventDefault(true)
        dialog.showMessageBoxSync(win, {
            message: ' 确定退出吗?',
            type: 'info',
            title: '提示',
            buttons: ['确定', '取消'],
            defaultId: 0,
            cancelId: 1,
        }) == 0 && send('exit')
    })
    win.maximize()
    win.loadFile(opts.url, { userAgent: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36 Edg/103.0.1264.71' })
    win.show();
    // if (process.platform === 'win32'){
    app.setAppUserModelId(opts.title);
    // }
}

app.whenReady().then(() => {
    let list = Object.assign({
        launcher: {
            title: '应用启动器',
            description: '',
            path: './main/',
        }
    }, fs.readJsonSync(_appPath + '\\apps.json'))

    for(let k in list){
        let v = list[k]
        if(isEmpty(v.icon) ||!fs.existsSync(v.icon)) v.icon = 'default.ico'
        if(isEmpty(v.dataPath) || !fs.existsSync(v.dataPath)) v.dataPath = '../../cache/'+k;
        ['icon', 'path', 'dataPath'].forEach(n => v[n] = path.resolve(_appPath, v[n]))
        if(!fs.existsSync(v.path)) delete list[k]
    }
    // BUG: setUserTasks只会在固定/取消任务栏时刷新，要避免多次修改 
    app.setUserTasks(Object.entries(list).map(([k, v]) => {
        if (v.pin) {
            return {
                program: process.execPath,
                arguments: k,
                iconPath: v.icon,
                iconIndex: 0,
                title: v.title,
                description: v.description
            }
        }
    }).filter(v => v != undefined))
    let args = process.argv
    let name = args.length < 2 || args[1] == '.' ? 'launcher' : args[1]

    if (!list[name]) return app.exit()
    setHomepage(Object.assign(list[name], { name }))
})

function setHomepage(opts) {
    // if (opts.icon) {
    //     let tray = new Tray(opts.icon);
    //     const menu = Menu.buildFromTemplate([{
    //         label: "退出",
    //         click: () => app.quit()
    //     }]);
    //     tray.setToolTip(opts.title);
    //     tray.setContextMenu(menu);
    //     tray.on("double-click", () => {
    //         toggleShow(true)
    //     });
    // }
    if(!opts.url) opts.url = opts.path + '\\index.html'
    app.setPath('userData', opts.dataPath);
    remote.initialize()
    createWindow(opts)
    app.on('activate', function() {
        if (BrowserWindow.getAllWindows().length === 0) createWindow(opts)
    })
}

// 自动开启新窗口的remote模块
app.on('browser-window-created', (_, window) => {
    require("@electron/remote/main").enable(window.webContents)
})


// 关闭窗口
// ipcMain.handle("closeWindow", (e, id) => {
//   console.log(id);
//   const target = webContents.fromId(id);
//   target.destroy();
//   let win = BrowserWindow.fromWebContents(e.sender);
//   win.close();
// });

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') app.quit()
})