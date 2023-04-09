class deepFolder {
    constructor(opts = {}) {
        return new basedata(Object.assign({

            // 取文件夹名称
            folder_getName(folder) {
                return (this.folder_get(folder) || {}).title || folder
            },

            // 根据标题取ID
            folder_getFolderIndex(title) {
                return this.folder_findValue(this.df_index || 'title', title)
            },

            // id取文件夹数据
            folder_getFolder(id){
                let index = this.folder_getFolderIndex(id)
                if(index != undefined){
                    return this.folder_get(index)
                }
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
                let item = this.folder_get(folder)
                item[key] = val
                this.folder_set(folder, val, update)
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
                return (this.folder_get(id) || {parent: ''}).parent
            },

            // 目录是否存在
            folder_exists(folder) {
                return this.folder_get(folder) != undefined
            },

            // 移除目录
            folder_remove(folder) {
                // 设置目录下所有的目录为上级目录
                let par = this.folder_getParent(folder)
                this.folder_getItems(folder).forEach(child => this.folder_setValue(child, 'parent', par))
                this.remove(folder)
                this.update(true)
            },

            // 设置目录值
            folder_set(id, vals, update = true) {
                vals = Object.assign(this.getDefaultVal(id), vals || {})

                if(typeof(vals.meta) != 'object') vals.meta = {}
                if (isEmpty(vals.desc)) vals.desc = ''
                if (isEmpty(vals.icon)) vals.icon = 'folder'
                if (Array.isArray(vals.parent)) vals.parent = vals.parent[0] || '' // 不能是自己
                if (vals.parent == id) vals.parent = '' // 不能是自己

                this.set(id, Object.assign(this.folder_get(id) || {}, vals))
                update && this.update(true)
                this.save()
            },

            // 添加目录（去重复名称）
            folder_add(vals) {
                if(typeof(vals) == 'string') vals = {title: vals}
                let id = g_folder.folder_findValue('title', vals.title)
                if(!isEmpty(id.length)){
                    // TODO 提示名称已存在，是否继续
                    id = undefined
                }

                if (id == undefined) {
                    id = this.getNextId()
                    this.folder_set(id, vals)
                }
                return id
            },

            folder_allVals(key){
                let vals = {}
                this.entries((id, item) => {
                    vals[id] = item[key]
                })
                return vals
            },

            getNextId(){
                return guid()
            },

            // 编辑目录
            folder_edit(id = '', parent = '') {
                const self = this
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
                            if (!id) id = self.getNextId()
                            this.folder_set(id, g_form.getVals('folder_edit'))
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

            // 增减目录
            item_toggleFolders(md5, added, removed) {
                // g_data.data_arr_changes(md5, 'folders', added, removed)
                console.log('item_toggleFolders', added, removed)
            },

            // 设置目录
            item_setFolders(md5, folder, add = true) {
                // g_data.data_arr_toggle(md5, 'folders', folder, add)
                console.log('item_setFolders', folder)
            },

            // 所有目录名称
            names() {
                return this.list.map(item => item.title)
            },

            // 所有目录ID
            ids() {
                return this.list.map(item => item.id)
            },

            maps(){
                let r = {}
                 this.list.forEach(item => r[item.id] = item.title)
                 return r
            },

            // 文件夹分组
            folder_sort(type, list) {
                if (!type) type = g_filter.getOpts(`filter.${this.name}.type`, 'sz')
                // if (!list) list = this.maps()
                if (!list) list = this.ids()
                return g_sort.sort(type, list)
            },


        }, opts))
    }
}