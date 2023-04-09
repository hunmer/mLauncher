var g_folder = {
    list: {},
    // 循环
    entries(callback) {
        for (let [id, item] of Object.entries(this.list)) {
            if (callback(id, item) === false) return false
        }
    },
    // 取文件夹名称
    folder_getid(folder){
        return (this.folder_get(folder) || {}).title || folder
    },
    // 根据标题取ID
    folder_getParentByid(title) {
        return this.folder_findValue('title', title)
    },
    // 查找值
    folder_findValue(key, val) {
        let find
        this.entries((id, item) => {
            if (item[key] == val) {
                find = id
                return false
            }
        })
        return find
    },
    // 设置单个值
    folder_setValue(folder, key, val, update = true) {
        this.folder_get(folder)[key] = val
        update && this.update(true)
        this.save()
    },
    // 取所有上级目录
    folder_getParents(folder) {
        let r = []
        let p = this.folder_getValue(folder, 'parent')
        while (!isEmpty(p)) {
            r.unshift(p)
            p = this.folder_getParent(p)
        }
        return r
    },
    // 取值
    folder_getValue(folder, key, defV) {
        let d = this.folder_get(folder)
        return d && d[key] != undefined ? d[key] : defV
    },
    // 取父目录
    folder_getParent(id) {
        return this.folder_get(id).parent
    },
    // 清空
    clear() {
        this.reset()
    },
    // 保存
    save() {
        g_folder.saveData('folders', this.list)
    },
    update(){

    },
    // 重置
    reset() {
        this.list = {}
        this.update(true)
    },
    // 初始化
    init(funs) {
       Object.assign(this, funs)
        const self = this
        self.list = g_folder.getData('folders', {})
        g_sort.set('folders_folder', folder => self.folder_getParent(folder) || '未分组')

        g_action.
        registerAction(['folder_edit', 'folder_delete', 'folder_new', 'folder_newSub', 'folder_clear'], (dom, action) => {
            let folder = self.menu_folder
            g_dropdown.hide('actions_folders')
            g_menu.hideMenu('folder_item')
            switch (action[0]) {
                case 'folder_clear':
                    self.reset()
                    break;
                case 'folder_newSub':
                    return self.folder_edit('', folder)

                case 'folder_new':
                case 'folder_edit':
                    return self.folder_edit(folder)

                case 'folder_delete':
                    // TODO 删除目录时更多选项(删除所有视频)
                    return confirm('确定要删除目录【' + self.folder_getid(folder) + '】吗？\n删除后素材不会消失', {
                        title: '删除目录',
                        type: 'danger'
                    }).then(() => {
                        self.folder_remove(folder)
                    })
            }
            delete self.menu_folder
        })
       
        if (!self.list.import) {
            self.reset()
        } else {
            self.update()
        }

    },

    // 目录是否存在
    folder_exists(folder) {
        return this.folder_get(folder) != undefined
    },

    // 移除目录
    folder_remove(folder) {
        // 设置目录下所有的目录为上级目录
        let par = this.folder_getParent(folder)
        this.folder_getItems(folder).forEach(child => {
            this.folder_get(child).parent = par
        })
        delete this.list[folder]
        this.update(true)
    },

    // 设置目录值
    folder_set(id, vals, update = true) {
        vals = Object.assign({
            title: '文件夹',
            parent: '',
            ctime: new Date().getTime()
        }, vals || {})

        if (isEmpty(vals.icon)) vals.icon = 'folder'
        if (Array.isArray(vals.parent)) vals.parent = vals.parent[0] || '' // 不能是自己
        if (vals.parent == id) vals.parent = '' // 不能是自己

        this.list[id] = Object.assign(this.folder_get(id) || {}, vals)
        update && this.update(true)
        this.save()
    },

    // 添加目录（去重复名称）
    folder_add(title, vals){
        let id = this.folder_getParentByid(title)
        if(id == undefined){
            id = guid()
            this.folder_set(id, vals)
        }
       return id
    },

    // 编辑目录
    folder_edit(id = '', parent = '') {
        delete this.menu_folder
        let d = this.folder_get(id, true) || {
            icon: 'folder',
        }
        g_form.confirm('folder_edit', {
            elements: {
                title: {
                    title: '名称',
                    required: true,
                    value: d.title || '',
                },
                parent: {
                    title: '父目录',
                    type: 'folders',
                    value: parent || d.parent || '',
                    otps: {
                        multi: false,
                    }
                },
                icon: {
                    title: '图标',
                    type: 'icon',
                    value: d.icon || 'folder',
                    placeholder: '输入网址使用网络图片',
                }
            },
        }, {
            id: 'folder_edit',
            title: '编辑目录',
            btn_ok: '保存',
            onBtnClick: (btn, modal) => {
                if (btn.id == 'btn_ok') {
                    if (!id) id = guid()
                    this.folder_set(id,  g_form.getVals('folder_edit'))
                }
            }
        })
    },

    // 
    folder_get(id, copy = false) {
        let r = this.list[id]
        if (r) {
            return copy ? copyObj(r) : r
        }
    },

    // 取所有子目录
    folder_getItems(id = '', obj = false) {
        let r = obj ? {} : []
        for (let [k, v] of Object.entries(this.list)) {
            if (v.parent == id) {
                let val = obj ? this.folder_get(k, true) : k
                if (obj) {
                    r[k] = val
                } else r.push(val)
            }
        }
        return r
    },

    // 排序
    sort() {
        let r = {}
        for (let [id, item] of Object.entries(this.list)) {
            // for (let folder of item.parent.concat(id)) {

            // }
        }
    },

    

    // 增减目录
    item_toggleFolders(md5, added, removed) {
         g_data.data_arr_changes(md5, 'folders', added, removed)
    },

    // 设置目录
    item_setFolders(md5, folder, add = true) {
         g_data.data_arr_toggle(md5, 'folders', folder, add)
    },

    // 所有目录
    folder_all() {
        return Object.keys(this.list)
    },

    // 文件夹分组
    folder_sort(type, tags) {
        if (!type) type = g_filter.getOpts('filter.folder.type', 'sz')
        if (!tags) tags = this.folder_all()
        return g_sort.sort(type, tags)
    },
}

// var obj
// confirm(`<div id="test_folders"></div>`, {
//     onShow: () => {
//        obj = g_tags.register('test_folders', {
//             container: '#test_folders',
//             defaultList: 'sz',
//             onSelectedList(id) {
//                 if(id == 'group') id = 'folders_folder'
//                 // g_filter.setOpts('filter.tag.type', action[1])
//                 return g_folder.folder_sort(id)
//             }
//         })
//         obj.show()
//     }
// }).then(() => {
//     console.log(obj.getSelected())

// })