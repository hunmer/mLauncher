/*
本地插件和网络插件
保存插件会保存meta信息到列表
本地插件没有指定位置，则默认scripts/目录下, namespace.js

网络插件配置updateURL,

*/


var g_plugin = new basedata({
    name: 'plugins',
    defaultList: [],
    primarykey: 'namespace',
    list: local_readJson('plugins', []),
    saveData: data => local_saveJson('plugins', data),

    require(name) {
        return nodejs.require(this.getSciptPath() + 'node_modules\\' + name)
    },

    getSciptPath() {
        return nodejs.dir + "\\scripts\\"
    },

    pluginLoaded(name) {
        return this.getPlugins().find(script => getFileName(script, false) == name) != undefined
    },

    // 加载所有插件
    initPlugins() {
        loadRes(this.getPlugins(), () => {
            console.info(`[plugins] 成功加载所有插件`);
        });
    },

    async getScriptContent(file, defV) {
        // TODO 缓存
        if (file.startsWith('http')) return (await (await fetch(file)).text()) || defV
        return nodejs.files.read(file, defV)
    },

    // 更新插件信息
    async refreshPlugins(update) {
        if (update == undefined) update = await confirm('是否同时更新插件?')

        const readMeta = async url => await (await fetch(url)).text()

        Promise.all(this.getPlugins().map(file => {
            return this.getScriptContent(file).then(async content => {
                try {
                    let { meta } = this.parseScript(content)
                    if (meta) {
                        if (!isEmpty(meta.updateURL) && update) {
                            let obj1 = this.parseScript(await readMeta(meta.updateURL))
                            if (obj1.meta.version > meta.version && obj1.meta.namespace == meta.namespace) {
                                if (obj1.meta.directURL) obj1.code = await readMeta(obj1.meta.directURL)

                                delete obj1.meta.directURL
                                nodejs.files.write(file, this.formatScript(obj1))
                                toast(`插件【${meta.name}】 ${meta.version} -> ${obj1.meta.version}`, 'success')
                                Object.assign(meta, obj1.meta)
                            }
                        }
                        this.merge(meta.namespace, meta)
                    }
                } catch (err) { toast(err.toString(), 'danger') }
            })
        })).then(() => alert('检测更新完成!'))
    },

    // 获取所有插件
    getPlugins(all = false) {
        return this.values().filter(plugin => all || plugin.enable).map(plugin => this.getSciptFile(plugin))
    },

    init(opts = {}) {
        const self = this
        assignInstance(self, opts)

        self.initPlugins()
        g_menu.registerMenu({
            name: 'plugin_item',
            dataKey: 'data-key',
            selector: '#modal_plugins tr[data-key]',
            items: [{
                icon: 'pencil',
                text: '编辑',
                action: 'plugin_item_edit'
            }, {
                icon: 'trash',
                text: '删除',
                class: 'text-danger',
                action: 'plugin_item_delete'
            }]
        })

        g_action.
        registerAction({
            modal_plugin: () => self.modal_show(),
            plugin_item_edit: () => {
                self.prompt_add(g_menu.key);
                g_menu.hideMenu('plugin_item');
            },
            plugin_item_delete: () => {
                self.prompt_delete(g_menu.key);
                g_menu.hideMenu('plugin_item');
            },
            plugin_enable: dom => {
                self.setVal(getParentAttr(dom, 'data-key'), 'enable', dom.checked, false)
            }
        })
        return self
    },


    prompt_delete(key) {
        confirm('是否移除插件 【' + this.getVal(key, 'name') + '】 ? 只会从列表移除，不会删除本地文件!', { title: '删除插件', type: 'danger' }).then(() => {
            this.remove(key);
            $('#modal_plugins_edit').modal('hide');
            toast('删除成功', 'success');
        })
    },

    async prompt_add(d = {}) {
        if (typeof(d) == 'string') d = copyObj(this.get(d))
        let key = this.getIndex(d)
        let isNew = key == undefined
        let gid = guid()
        if (isEmpty(d.content)) d.content = isNew ? `// ==UserScript==
// @name        示例插件
// @namespace   ${gid}
// @version     0.0.1
// @author      作者名称
// @description 注释说明
// @updateURL               
// @primary     1
// ==/UserScript==
` : await this.getScriptContent(this.getSciptFile(d))

        g_form.confirm('plugins_edit', {
            elements: {
                file: {
                    title: '文件位置',
                    value: d.file || '',
                    type: 'file_chooser',
                },
                content: {
                    title: '代码',
                    type: 'textarea',
                    rows: 10,
                    value: d.content,
                    placeHolder: '输入代码...',
                },
                enable: {
                    title: '启用',
                    value: d.enable || false,
                    type: 'switch',
                }
            },
        }, {
            id: 'plugins_edit',
            title: '编辑插件',
            btn_ok: '保存',
            once: true,
            btn_cancel: isNew ? '取消' : '删除',
            onBtnClick: (btn, modal) => {
                if (btn.id == 'btn_ok') {
                    return this.saveScript(Object.assign(g_form.getVals('plugins_edit'), { isNew }))
                }
                if (btn.id == 'btn_cancel') {
                    if (!isNew) {
                        this.prompt_delete(key);
                        return false;
                    }
                }
            }
        })
    },

    getSciptFile(d, name) {
        let path = this.getSciptPath()
        if (isEmpty(d.file)) return path + (d.name || name) + '.js'
        return d.file.replace('./', path)
    },

    async saveScript(d) {
        let { meta, code } = this.parseScript(d.content)
        d.file = this.getSciptFile(d, meta.name)

        if (!meta.namespace) {
            // 增加namespace
            meta.namespace = guid()
            d.content = this.formatScript({ meta, code })
            if (d.import && await prompt(d.content, { title: '修改确定', rows: 20 })) {
                nodejs.files.write(d.file, d.content)
            }
        }
        if (!d.import) {
            if (nodejs.files.exists(d.file) && d.isNew) {
                toast('文件名:' + d.file + '已经存在', 'danger')
                return false
            }
            nodejs.files.write(d.file, d.content)
        }

        d.file = d.file.replace(this.getSciptPath(), './')
        delete d.content;
        delete d.isNew;
        this.set(meta.namespace, Object.assign(meta, d))
    },

    refresh() {
        let tbody = $('#modal_plugins tbody')
        if (!tbody.length) return

        let h = '';
        this.keysEntries((k, v) => {
            let id = 'check_plugin_' + k;
            h += `
                <tr data-key="${k}">
                  <td>
                    <div class="form-check">
                      <input class="form-check-input" data-change="plugin_enable" type="checkbox" value="" id="${id}" ${v.enable ? 'checked' : ''}>
                      <label class="form-check-label" for="${id}"></label>
                    </div>
                  </td>
                  <td>${v.name}</td>
                  <td>${v.description}</td>
                  <td>${v.version}</td>
                </tr>
            `;
        })
        tbody.html(h);
    },
    // 插件列表
    modal_show() {
        let before = this.getPlugins()
        this.modal = g_modal.modal_build({
            html: `
                <div class="table-responsive">
                    <table class="table table-vcenter table-nowrap">
                      <thead>
                        <tr>
                          <th scope="col"></th>
                          <th scope="col">插件名</th>
                          <th scope="col">说明</th>
                          <th scope="col">版本</th>
                        </tr>
                      </thead>
                      <tbody>
                      </tbody>
                    </table>
                </div>
            `,
            id: 'plugins',
            title: '插件列表',
            width: '80%',
            once: true,
            buttons: [{
                    id: 'add',
                    text: '新增',
                    class: 'btn-warning',
                }, {
                    id: 'reset',
                    text: '重置',
                    class: 'btn-secondary',
                },
                {
                    id: 'refresh',
                    text: '刷新',
                    class: 'btn-primary',
                },
                {
                    id: 'open',
                    text: '导入',
                    class: 'btn-success',
                }, {
                    id: 'more',
                    text: '获取更多',
                    class: 'btn-info',
                }
            ],
            onClose: () => {
                if (!arr_equal(before, this.getPlugins())) {
                    confirm('插件需要重载才能生效,是否重载页面?', { title: '重载页面', }).then(() => location.reload())
                }
            },
            onBtnClick: (btn, modal) => {
                switch (btn.id) {
                    case 'btn_more':
                        return ipc_send('url', 'https://github.com/hunmer/mSearch/issues');
                    case 'btn_add':
                        return this.prompt_add();
                    case 'btn_reset':
                        return confirm('确定要重置吗?').then(() => this.reset())
                    case 'btn_refresh':
                        return this.refreshPlugins()
                    case 'btn_open':
                        return openFileDiaglog({
                            title: '打开脚本文件',
                            properties: ['openFile'],
                            filters: [{ name: 'js文件', extensions: ['js'] }, ],
                        }, path => {
                            !isEmpty(path[0]) && this.script_import(path[0])
                        })
                }
            }
        });
        this.refresh();
    },

    script_import(file) {
        return this.saveScript(Object.assign({ file, enable: false, content: nodejs.files.read(file), import: true }))
    },

})

assignInstance(g_plugin, {
    events: {},
    initEvent(eventName, callback, overwrite = false) {
        let event = this.getEvent(eventName, true);
        event.finish = callback;
        // 绑定最后执行函数
    },

    // 注册事件
    registerEvent(eventName, callback, primary = 1, id = guid()) {
        let event = this.getEvent(eventName);
        if (event) {
            event.listeners[id] = {
                id,
                callback,
                primary
            }
        }
        return id
    },

    // 取消注册事件
    unregisterEvent(id) {
        for (let eventName in this.events) {
            let obj = this.events[eventName]
            if (obj.listeners[id]) {
                delete obj.listeners[id]
            }
        }
    },

    // 获取事件
    getEvent(eventName, create = true) {
        if (create && !this.events[eventName]) {
            this.events[eventName] = {
                listeners: {},
            }
        }
        return this.events[eventName];
    },

    // 执行事件
    callEvent(eventName, data) {
        return new Promise(async (reslove, reject) => {
            let event = g_plugin.getEvent(eventName);
            if (event) {
                for (let k in data) {
                    if (typeof(data[k]) == 'function') {
                        // 执行函数取值
                        data[k] = data[k].apply(data)
                    }
                }
                for (let [id, listener] of Object.entries(event.listeners).sort((a, b) => {
                        return b[1].primary - a[1].primary;
                    })) {
                    if (await listener.callback(data) === false) {
                        return reject();
                    }
                }
                event.finish && event.finish(data);
                reslove(data)
            }
        })
    },

})

assignInstance(g_plugin, {
    // 格式化脚本
    formatScript(obj) {
        let s = ''
        for (let [k, v] of Object.entries(obj.meta)) s += `// @` + k + '    ' + v + "\n"
        return `// ==UserScript==\n${s}\n// ==/UserScript==\n${obj.code}`
    },


    // 解析脚本
    parseScript(script) {
        let code = ''
        let meta = {}
        let status
        script.split('\n').forEach(text => {
            let args = text.trim().replaceAll('  ', ' ').split(' ').filter(arg => arg != '')
            if (status != 'end' && args[0] == '//') {
                if (args[1] == '==UserScript==') {
                    status = 'start'
                } else
                if (args[1] == '==/UserScript==') {
                    status = 'end'
                } else {
                    if (args[1][0] == '@') {
                        meta[args[1].substr(1, args[1].length - 1)] = arr_join_range(args, ' ', 2)
                    }
                }
            } else
            if (status == 'end') {
                code += text + "\n"
            }
        })
        return { meta, code }
    },

})

function _callEvent(k, v){
    g_plugin.callEvent(k, v)
}