const path = require('path')
const _dataPath = path.resolve(__dirname, '../..')
const _appPath = path.join(_dataPath, 'app/')

const { app, ipcRenderer, clipboard, shell } = require('electron');
const remote = require('@electron/remote');
const { getCurrentWindow, getCurrentWebContents, webContents, session, globalShortcut, Menu, Tray } = remote
const files = require(_dataPath+'\\app\\file.js')
const fs = require('fs-extra')
const request = require('request')
const _app = getCurrentWindow()
const _webContent = getCurrentWebContents()

function downloadFile(opts) {
    let progress = 0;
    let total_bytes = 0;
    let received_bytes = 0;
    opts = Object.assign({
        complete: () => {},
        progress: () => {},
    }, opts)
    let opt = {
        method: 'GET',
        url: opts.url,
        timeout: 15000,
        // proxy: 'http://127.0.0.1:4780',
    }

    let fileBuff = [];
    let req = request(opt);
    req.on('data', chunk => {
        received_bytes += chunk.length;
        fileBuff.push(Buffer.from(chunk));
        let newProgress = parseInt(received_bytes / total_bytes * 100);
        if (newProgress != progress) {
            progress = newProgress;
            opts.progress(progress);
        }
    });
    req.on('end', () => {
        let totalBuff = Buffer.concat(fileBuff);
        files.makeSureDir(opts.saveTo)
        if (opts.saveTo) {
            fs.writeFile(opts.saveTo, totalBuff, (err) => {
                opts.complete(opts.saveTo, opts.url)
            });
        } else {
            opts.complete(totalBuff.toString())
        }
    });
    req.on('response', data => total_bytes = parseInt(data.headers['content-length']));
    req.on('error', d => opts.complete(e));
}


function fetchURL(url, success, error, always) {
    fetch(url).then(res => {
        if (res.status == 200) {
            res.json().then(json => success(json))
        } else {
            error && error()
        }
        always && always()
    })
}

ipcRenderer.on('method', (event, args) => {
    doAction(args);
});
ipcRenderer.on('download', (event, args) => {
    g_downloader.item_add(new Date().getTime(), args)
    if (g_setting.getConfig('closeAfterDownloaded')) {
        // let site = g_tabs.ids_get(args.webview)
        let web = g_tabs.ids_getWebview(args.webview)[0]
        if (g_tabs.group_getTabs(web.id.split('-')[0]).length > 1) { // 标签大于1个
            // 下载开始自动关闭标签
            // TODO 全局开关，局部站点开关
            g_tabs.tab_remove(web.id)
        }
    }

});

ipcRenderer.on('togglePin', (event, arg) => {
    getEle('pin').toggleClass('text-primary', arg)
});

ipcRenderer.on('log', (event, args) => {
    console.log(args)
});
ipcRenderer.on('newTab', (event, args) => {
    g_tabs.group_newTab(args.id, args.url);
});
ipcRenderer.on('closeTab', (event, id) => {
    g_tabs.ids_remove(id)
});
ipcRenderer.on('exit', (event, args) => {
    // g_downloader.aria2c.exit()
    fetch('http://127.0.0.1:41597/exit')
    setTimeout(() => {
        send('exit');
    }, 1500)
});

// 文件对话框 回调
ipcRenderer.on('fileDialog_revice', (event, arg) => {
    g_pp.call(arg.id, arg.paths);
});

let enhanceWebRequest
ipcRenderer.on('startNetworkListener', (event, id) => {
    if (getConfig('networkListenter')) {
        // if (!enhanceWebRequest) enhanceWebRequest = require('electron-better-web-request');
        let content = webContents.fromId(id)
        // enhanceWebRequest.default(content.session);
        // content._requestListenerId = content.session.webRequest.addListener('onBeforeRequest', { urls: ['*://*/*'] }, (details, callback) => {
        //     g_network.detail_add(details)
        //     console.log(details)
        //     callback({ cancel: false });
        // }).id;

        // content.session.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
        //      g_network.detail_add(details)
        //      console.log(details)
        //      callback({ cancel: false });
        //  })
    }
})


// todo 重装软件是否会重置这个目录？
// 还是把目录设置成appData? 不知道权限是否有无问题
window.nodejs = {
    fs,
    win: _app,
    require,
    remote,
    files,
    session,
    globalShortcut,
    path,
    shell,
    request,
    dir: __dirname,
    cli: require(_dataPath+'\\app\\cli.js'),
    method(data) {
        var d = data.msg;
        switch (data.type) {
            case 'url':
                shell.openExternal(d);
                break;
            case 'reload':
                location.reload()
                break;
            case 'copy':
                clipboard.writeText(d)
                g_toast && g_toast.toast('复制成功', 'success')
                break;
            case 'toggleFullscreen':
                _app.setFullScreen(!_app.fullScreen);
                break;
            case 'openFolder':
                shell.showItemInFolder(d)
                break;
            case 'devtool':
                if (_webContent.isDevToolsOpened()) {
                    _webContent.closeDevTools();
                } else {
                    _webContent.openDevTools();
                }
                break;
            default:
                send(data);
                break;
        }
    }
}

function send(data, method = 'method') {
    if (typeof(data) != 'object') data = { type: data }
    ipcRenderer.send(method, data);

}

