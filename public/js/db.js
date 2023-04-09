const DB_TYPE_DEFAULT = 1
const DB_TYPE_IMPORT = 2
const DB_TYPE_METADATA = 3

var g_db = {
    db_findVal(key, val) {
        let ret
        this.entries((k, v) => {
            if (v[key] == val) {
                ret = k
                return false
            }
        })
        return ret
    },

    db_readJSON(name, def, db) {
        let path = this.db_getVal(db || this.current, 'path')
        let file = path + '\\' + name + '.json'
        let r
        try {
            if (nodejs.files.exists(file)) {
                r = JSON.parse(nodejs.files.read(file))
            }
        } catch (e) {}
        return r || def
    },

    db_saveJSON(name, data, db) {
        // TODO 检查库是否有写入权限（库配置是否有密码且与本地密码相符）
        // TODO 如果没有写入权限则显示红色标识
        let path = this.db_getVal(db || this.current, 'path')
        let file = path + '\\' + name + '.json'
        nodejs.files.write(file, JSON.stringify(data))
    },

    init(funs = {}) {
        const self = this
        assignInstance(self, funs)

        self.list = local_readJson('dbs', {})
        g_action.registerAction({
            db_clear: dom => {
                confirm('你确定要清空所有数据库嘛?', { type: 'danger' }).then(() => {
                    Promise.all(Object.keys(g_data.table_indexs).filter(k => ![].includes(k)).map(k => g_data.run(`DELETE FROM `+k))).then(() => location.reload())
                })
            },
            db_menu: dom => g_dropdown.show('db_menu', dom),
            db_new: () => self.db_edit(),
            db_edit: dom => self.db_edit($(dom).parents('[data-db]').data('db')),
            db_open: () => self.db_open(),
            db_manager: () => self.db_manager(),
            db_location: () => ipc_send('openFolder', g_db.db.file),
            db_switch: (dom, action) => self.db_switch(action[1] || $(dom).parents('[data-db]').data('db')),
        })

        g_dropdown.register('db_menu', {
            position: 'end-top',
            offsetLeft: 5,
            autoClose: 'true',
            parent: ['menu', 'db'],
            list() {
                let list = Object.assign({
                    new: {
                        title: '新建资源库',
                        action: 'db_new',
                    },
                    open: {
                        title: '打开资源库',
                        action: 'db_open',
                    },
                    manager: {
                        title: '管理资源库',
                        action: 'db_manager',
                    },
                    location: {
                        title: '打开资源库位置',
                        action: 'db_location',
                    },
                }, self.db_menu || {}, {
                    drive: {
                        type: 'divider'
                    }
                })
                // 素材库列表
                return Object.assign(list, self.toDropdown())
            },
        }).init()

        g_hotkey.register('ctrl+keyl', {
            title: '切换素材库',
            content: `
            if(!g_dropdown.isShowing('db_menu')){
                g_dropdown.quickShow('db_menu')
            }
            `,
            type: 2,
        })
    },

    toDropdown(action = 'db_switch') {
        let list = {}
        this.entries((name, item) => {
            list[name] = {
                title: item.title,
                class: name == g_db.current ? 'active' : '',
                icon: item.icon || 'box',
                action: action + ',' + name,
                attr: 'tabindex="0"'
            }
        })
        return list
    },

    entries(callback) {
        for (let [name, item] of Object.entries(this.list)) {
            if (callback(name, item) === false) return
        }
    },

    db_getPath() {

    },

    db_getCurrentVal(k) {
        return this.db_getVal(this.current, k)
    },

    db_getVal(id, k, def) {
        return (this.db_get(id) || {})[k] || def
    },

    async db_getTables() {
        return (await g_data.all(`SELECT * FROM sqlite_master WHERE type='table'`)).map(table => table.name).filter(table => !['sqlite_sequence'].includes(talbe))
    },

    // 素材库列表窗口
    db_manager() {
        let h = ''
        this.entries((k, v) => {
            h += `
                <div class="list-group-item" data-db="${k}">
                  <div class="row align-items-center">
                    <div class="col-auto"><span class="badge bg-${k == this.current ? 'success' : 'secondary'}"></span></div>
                    <div class="col-auto">
                     <span class="avatar"><i class="fs-1 ti ti-${v.icon || 'box'}"></i></span>
                    </div>
                    <div class="col text-truncate">
                      <a href="#" class="text-reset d-block" data-action="db_switch">${v.title}</a>
                      <div class="d-block text-muted text-truncate mt-n1">${v.desc || ''}</div>
                    </div>
                    <div class="col-auto">
                      <a href="#" class="list-group-item-actions" data-action="db_edit">
                        <i class="ti ti-dots"></i>
                      </a>
                    </div>
                  </div>
                </div>
            `
        })
        alert(h ? `
            <div class="card">
              <div class="list-group list-group-flush list-group-hoverable">${h}</div>
            </div>
            ` : '<h4 class="text-center">还没有任何资源库...</h4>', {
            title: '资源库列表',
            btn_ok: '新建',
            id: 'db_manager',
        }).then(() => this.db_edit())
    },

    // 获取DB配置
    async db_getConfig(key, def) {
        return (await g_data.get('SELECT value FROM config WHERE key=?', key) || {}).value || def
    },

    // 写入DB配置
    async db_setConfig(key, value) {
        return g_data.data_set2({ table: 'config', key: 'key', value: key, data: { key, value } })
    },

    // 打开素材库
    db_open() {
        openFileDiaglog({
            title: '打开数据库',
            properties: ['openDirectory'],
        }, path => {
            this.db_import(path[0])
        })
    },

    // 导入素材库
    db_import(path, opts) {
        try {
            let json = JSON.parse(nodejs.files.read(path + '/db.json'))
            // 如果是云导入则把目录改成选中目录
            // TODO 怎么判断是云导入？
            // 因为本地素材库可能素材的位置会在别处
            json.path = path
            this.db_edit(json)
        } catch (e) {
            this.db_edit({ path: path })
        }
    },

    db_get(name) {
        return this.list[name]
    },
    db_remove(name, save = true) {
        delete this.list[name]
        save && this.save()
        if (name == this.current) setTimeout(() => location.reload(), 200)
    },
    set(name, vals, save = true) {
        this.list[name] = vals
        save && this.save()
        nodejs.files.write(vals.path + '\\db.json', JSON.stringify(vals))
    },
    save() {
        local_saveJson('dbs', this.list)
    },
    db_dbs() {
        return Object.keys(this.list)
    },
    // 切换指定数据库
    db_switch(name) {
        g_modal.remove('db_manager')
        console.log('加载数据库 ' + name)

        let d = this.db_get(name)
        if (!d || isEmpty(name)) { // 不存在则弹出新建或者选择
            return this.db_dbs().length ? this.db_manager() : this.db_edit()
        }

        setConfig('db', name)
        let opts = copyObj(d)
        if (!isEmpty(this.current)) { // 
            return setTimeout(() => location.reload(), 200) // 搞个类似于videoManager那样账号的？？
        }

        this.current = name
        this.opts = opts
        $('#title').html(opts.title)

        this.db = this.db_read({
            file: opts.path + '\\items.db',
            type: DB_TYPE_DEFAULT
        })
        if (!this.db) {
            return confirm(`数据库${opts.title}加载失败!`, {
                title: '加载数据库失败!',
                type: 'danger',
                btn_ok: '再次加载',
                btn_cancel: '选择其他数据库'
            })
        }
        g_plugin.callEvent('db_read', { name, opts })
        return this.db

    },
    // 创建新的数据库
    db_edit(key) {
        let d
        if (typeof(key) == 'object') {
            d = copyObj(key)
            key = new Date().getTime()
        } else {
            d = this.db_get(key)
        }

        d = Object.assign({
            title: '',
            path: '',
            icon: 'box',
            syncFolders: {},
        }, d)

        let title = (key ? '编辑' : '创建') + '数据库'
        g_form.confirm('db_edit', {
            elements: {
                guid: {
                    title: 'guid',
                    required: true,
                    value: d.guid || guid(),
                    class: 'hide',
                },
                title: {
                    title: '名称',
                    required: true,
                    value: d.title || '',
                },
                // TODO 数据库同步目录（不同于全局？）
                path: {
                    title: '储存目录',
                    type: 'file_chooser',
                    required: true,
                    opts: {
                        title: '选择数据库',
                        properties: ['openDirectory'],
                    },
                    value: d.path,
                    placeHolder: '支持网络目录',
                },
                icon: {
                    title: '图标',
                    type: 'icon',
                    value: d.icon,
                    placeHolder: '输入网址使用网络图片',
                },
            },
        }, {
            id: 'db_edit',
            title: title,
            buttons: [{
                id: 'save',
                text: '保存',
                class: 'btn-primary',
            }, {
                id: 'delete',
                text: '删除',
                class: 'btn-danger ' + (isEmpty(key) ? 'hide' : ''),
            }, {
                id: 'folder',
                text: '定位',
                class: 'btn-info',
            }],
            onBtnClick: (btn, modal) => {
                // TODO 检测目录是否有存在数据库
                switch (btn.id) {
                    case 'btn_save':
                        let vals = g_form.getVals('db_edit')
                        if(!vals) return
                            
                        if (!key) key = new Date().getTime()
                        this.set(key, vals)
                        if (isEmpty(this.current)) this.db_switch(key)
                        toast(title + '成功', 'success')
                        break
                    case 'btn_delete':
                        // todo 显示数据库素材数量以及是否删除数据库文件夹
                        confirm('确定删除数据库【' + this.db_getVal(key, 'title') + '】吗?', {
                            title: '删除数据库',
                            type: 'danger'
                        }).then(() => {
                            this.db_remove(key)
                            this.db_manager() // 刷新显示列表
                        })
                        break
                    case 'btn_folder':
                        d.path && ipc_send('openFolder', d.path)
                        break
                }
                g_modal.remove('db_edit')

            }
        })
    },
    // 加载数据库
    db_read(opts) {
        opts = Object.assign({
            table: g_db.table_sqlite,
            config: g_db.getOption ? g_db.getOption(opts) : {
                readonly: false,
                type: DB_TYPE_DEFAULT
            }
        }, opts)

        let exists = files.exists(opts.file);
        if (!exists && opts.config.readonly) return false;
        let db = g_db.db_class(opts.file, opts.config)
        db.exec(opts.table);
        return db;
    },


    // 根据md5获取储存路径
    getSaveTo(md5, path) {
        if (isEmpty(path)) path = this.opts.path
        return path + `\\files\\${md5.substr(0, 2)}\\${md5.substr(2, 2)}\\${md5}\\`;
    },

}