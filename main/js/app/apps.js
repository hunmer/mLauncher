var g_apps = new basedata({
    name: 'apps',
    list: {},
    defaultList: {
        main: { title: '应用启动器', description: '启动中心', path: './main/' }
    },
    worker: new Worker_IPC('worker.js'),
    saveData: data => nodejs.fs.writeJSON(_appPath + 'apps.json', data),
    init() {
        let cfg = _appPath + 'apps.json'
        if (nodejs.files.exists(cfg)) this.list = nodejs.fs.readJsonSync(cfg)
        let actions = ['launch', 'checkUpdate', 'edit', 'new', 'checkUpdateAll', 'discover', 'openFolder', 'delete'].map(k => 'app_' + k)
        g_action.registerAction(actions, (dom, action, ev) => {
            let key = getParentAttr(dom, 'data-app')
            switch (actions.indexOf(action[0])) {
                case 0:
                    return this.app_launch({ key, blank: ev.ctrlKey })

                case 1:
                    return this.app_update(key)

                case 2:
                    return this.app_edit(Object.assign(this.get(key), { id: key }))

                case 3:
                    return this.app_edit()

                case 4:
                    return toast('todo...')

                case 5:
                    return toast('todo...')
                    let names = nodejs.files.listDir(_appPath).filter(dir => nodejs.files.exists(dir + '\\index.html')).map(dir => nodejs.path.basename(dir)).filter(name => name != 'main' && !this.get(name))
                    if (!names.length) return toast('没有发现应用')
                    return

                case 6:
                    return ipc_send('openFolder', _appPath + key + '\\index.html')

                case 7:
                    return confirm('确定要删除应用吗？此操作只会从列表中移除，而不会删除代码文件，请自行删除!', { type: 'danger' }).then(() => this.remove(key))
            }
        })

        g_ui.register('apps', {
            target: '#content',
            html: `
                <div id="app_list" class="row w-full p-2 m-0"></div>
            `,
            onShow: () => this.refresh(),
        }).show('apps')
        // this.app_update('test')
        // this.app_build({path: _appPath+'mCollection', skip: `/scripts/\n/bin/\n/package-lock.json\n/test/\n/mCollection.zip`})
    },
    app_launch(opts) {
        let { key, blank } = opts
        if (key == 'main') return toast('此应用只能更新，不适合在这里启动', 'danger')
        let d = this.get(key)
        if (d) {
            // TODO 判断是否正在运行
            nodejs.cli.run(nodejs.path.resolve(_dataPath, '../mCollection.exe'), [key])
            setTimeout(() => !blank && ipc_send('exit'), 250)
        }
    },
    app_edit(d = {}) {
        g_form.confirm1({
            elements: {
                id: {
                    title: '应用ID',
                    required: true,
                    value: d.id || ''
                },
                title: {
                    title: '应用名称',
                    required: true,
                    value: d.title || ''
                },
                description: {
                    title: '注释',
                    value: d.description || ''
                },
                updateURL: {
                    title: '更新地址',
                    value: d.updateURL || ''
                },
                dataPath: {
                    title: '目录位置',
                    type: 'file_chooser',
                    help: '不填默认,根目录/cache/应用名称',
                    opts: {
                        title: '选择数据保存目录',
                        properties: ['openDirectory'],
                    },
                    value: d.path || ''
                },
                pin: {
                    title: '固定到任务栏右键启动列表',
                    type: 'switch',
                    value: d.pin || false
                },
            },
            title: '编辑应用',
            callback: ({ vals }) => {
                let id = vals.id
                delete vals.id

                vals.path = './' + id + '/'
                if (!nodejs.files.exists(nodejs.path.resolve(_appPath, vals.path))) {
                    toast(`根目录/resources/app/${id} 不存在，请先讲应用放到此处`, 'danger')
                    return false
                }

                let isNew = d.isNew
                delete d.isNew
                if (isNew && this.get(id)) {
                    toast(`目标应用${id}已经存在,请先删除原本的应用`, 'danger')
                    return false
                }

                this.set(id, vals)
                toast('保存成功', 'success')
            }
        })
    },
    app_build(opts) {
        g_form.confirm1({
            elements: {
                dir: {
                    title: '目录',
                    type: 'file_chooser',
                    required: true,
                    value: opts.path || '',
                    opts: {
                        title: '选择要上传更新的目录',
                        properties: ['openDirectory'],
                    }
                },
                skip: {
                    title: '排除列表',
                    type: 'textarea',
                    rows: 8,
                    value: opts.skip || '',
                },
            },
            title: '生成listFile.json',
            callback: ({ vals }) => {
                let { dir, skip } = vals
                if (!nodejs.files.exists(dir)) return toast('目标目录不存在', 'danger')
                this.worker.send(['generateFileList', dir, ['/listFile.json', ...skip.split('\n')]], files => {
                    console.log(files)
                    confirm(Object.keys(files).join('</br>'), { title: '是以下这些文件吗？', scrollable: true }).then(() => nodejs.fs.writeJSON(dir + '\\listFile.json', files))
                })
            }
        })
    },
    app_update(name) {
        let app = this.get(name)
        if (!app) return

        let { title, path, updateURL } = app
        if (isEmpty(updateURL)) return toast(name + ' 无可用更新地址')
        if (!updateURL.endsWith('/')) updateURL += '/'
        $.getJSON(updateURL + 'listFile.json', (json, textStatus) => {
            if (textStatus !== 'success') return toast('检测更新失败!', 'danger')
            let dir = nodejs.path.join(_dataPath + '\\app', path)
            this.worker.send(['generateFileList', dir], files => {
                let news = Object.entries(json).filter(([k, v]) => {
                    k = k.replaceAll('//', '/')
                    return !files[k] || files[k] !== v
                })
                let names = news.map(([k]) => k)
                if (names.length == 0) return toast('已经是最新版本!', 'success')
                confirm(names.join('</br>'), { scrollable: true, title: '共发现了' + names.length + '个文件有更新!是否更新?' }).then(() => {
                    let id = 'progress_update'
                    let progress = new Progress(id, {
                        datas: names,
                        onProgress: i => i >= 100 && g_modal.modal_get(id).find('#btn_ok').html('完成'),
                        onClose: () => g_modal.remove(id)
                    }).build(html => alert(html, {
                        id,
                        title: '更新文件',
                        btn_ok: '取消',
                        scrollable: true,
                    }).then(() => {
                        progress.destroy()
                        progress.val >= 100 && alert('刷新应用才会生效!')
                    }))
                    let next = () => {
                        let item = news.shift()
                        if (item == undefined) return toast('更新完成!', 'success')

                        let [name, md5] = item
                        downloadFile({
                            md5,
                            name,
                            url: updateURL + name.replaceAll('\\', '/'),
                            saveTo: nodejs.path.join(dir + name),
                            complete(saveTo) {
                                let success = typeof (saveTo) == 'string' && nodejs.files.getFileMd5(saveTo) == this.md5
                                progress.setSloved(this.name, 1, `<p class="text-${success ? 'success' : 'danger'}">${success ? '√ 成功下载' : 'X 下载失败'}: %%s%%</p>`)
                                next()
                            },
                        })
                    }
                    next()
                })
            })
        });
    },
    refresh() {
        let h = ''
        this.entries((k, v) => {
            h += `
           <div class="col-6 col-md-4 col-xl-2 mt-2" data-app="${k}">
            <div class="card ">
              <div class="card-body text-center position-relative">
                <div class="dropdown">
                  <a class="btn dropdown-toggle position-absolute end-0 top-0 p-2" data-bs-toggle="dropdown"><i class="ti ti-dots"></i></a>
                  <div class="dropdown-menu">
                    <a class="dropdown-item" data-action="app_edit">编辑</a>
                    <a class="dropdown-item" data-action="app_checkUpdate">检查更新</a>
                    <a class="dropdown-item" data-action="app_openFolder">定位</a>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item text-danger" data-action="app_delete">删除</a>
                  </div>
                </div>
                <div class="mb-3">
                  <span class="avatar avatar-xl rounded" style="background-image: url(${v.icon || '../' + v.path + 'favicon.svg'})"></span>
                </div>
                <div class="card-title mb-1">${v.title}</div>
                <div class="text-muted">${v.description}</div>
              </div>
              <a class="card-btn" data-action="app_launch">启动</a>
            </div>
          </div>`
        })
        $('#app_list').html(h)
    },
    getItem(app) {
        return getEle({ app })
    }
})