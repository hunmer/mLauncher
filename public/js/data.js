var g_data = {
    cache: new CacheManager(),
    table_indexs: {
        // 表格字段名，在插入数据的时候只提取以下数据，避免奔溃
        files: ['id', 'title', 'size', 'date', 'birthtime', 'link', 'md5'],
        config: ['key', 'value'],
        trash: ['id', 'title', 'size', 'date', 'birthtime', 'link', 'md5', 'meta', 'last'],
    },

    // 取所有视频数
    async getLengths(query, table = 'files') {
        let r = await this.get(`SELECT COUNT(*) FROM ${table} ${query}`)
        return r ? r['COUNT(*)'] : 0;
    },
    // md5是否存在
    async data_exists(md5) {
        let i = await this.getLengths(`WHERE md5='${md5}'`)
        return i > 0
    },
    // 删除
    data_remove(md5, table = 'files') {
        this.cache.delete(md5)
        return this.run(`DELETE FROM ${table} WHERE md5=?`, md5);
    },

    // 取结果
    get(query, ...args) {
        return this.db.prepare(query).get(args);
    },

    async get1(query, dbFile, args) {
        let data = await this.db.prepare(query, dbFile).get(args)
        return g_plugin.callEvent('db_afterGetData', data)
    },

    // 取结果
    // TODO 没连接db之前禁止这些操作
    async all(query, ...args) {
        return this.db ? await this.db.prepare(query).all(args) : [];
    },

    // 执行操作
    run(query, ...args) {
        return this.db.prepare(query).run(...args);
    },


    // 指定md5保存数据
    data_set(md5, data, table = 'files') {
        return g_data.data_set2({ table, key: 'md5', value: md5, data })
    },

    // 设置数据
    data_set2(opts) {
        debug('data_set', opts)
        return new Promise(reslove => {
            g_plugin.callEvent('db_beforeInsert', opts).then(async opts => {
                let ret = await this.data_update(opts)
                if (ret.changes === 0) {
                    ret = await this.data_insert1(opts)
                }
                reslove(ret)
            })
        })
    },

    // 删除数据
    data_remove2(opts) {
        return new Promise(reslove => {
            g_plugin.callEvent('db_beforeDelete', opts).then(async opts => {
                reslove(this.run(`DELETE FROM ${opts.table} WHERE ${opts.key} = ?`, opts.value))
            })
        })
    },

    // 更新数据
    data_update(opts) {
        let { data, dbFile, table, key, value, meta } = opts
        return new Promise(reslove => {
            this.run1(`UPDATE ${table} SET ${this.format_keys(data, key, table)} WHERE ${key}=?`, dbFile, this.format_values(data, key, table).concat(value)).then(ret => {
                ret.changes > 0 && g_plugin.callEvent('db_afterInsert', { opts, ret, meta, method: 'update' })
                reslove(ret)
            })
        })
    },

    // 根据md5取id
    async data_getID(md5) {
        if (typeof(md5) == 'string' && md5.length == 32) {
            return (await this.data_get(md5) || {}).id
        }
        return md5
    },

    // 插入数据
    data_insert1(opts) {
        let { data, dbFile, table, meta } = opts
        let indexs = this.table_getIndexs(table)
        let keys = Object.keys(data).filter(k => indexs.includes(k))
        return new Promise(reslove => {
            this.run1(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(_k => '@'+_k).join(',')})`, dbFile, data).then(ret => {
                ret.changes > 0 && opts.broadcast !== false && g_plugin.callEvent('db_afterInsert', { opts, ret, meta, method: 'insert' })
                reslove(ret)
            })
        })
    },

    run1(query, dbFile, args) {
        return this.db.prepare(query, dbFile).run(args)
    },



    format_values(data, primaryKey, indexs) {
        indexs = this.table_getIndexs(indexs)

        let vals = []
        for (let [k, v] of Object.entries(data)) {
            if (k != primaryKey && indexs.includes(k)) {
                vals.push(v)
            }
        }
        return vals
    },

    table_getIndexs(key) {
        return Array.isArray(key) ? key : this.table_indexs[key] || []
    },

    // 拼接sqlite参数
    format_keys(data, primaryKey, indexs) {
        indexs = this.table_getIndexs(indexs)

        let join = ' = ?'
        return Object.keys(data).filter(k => indexs.includes(k) && k != primaryKey).join(join + ',') + join;
    },

    // 适用于改一次值
    async date_setVal(d, k, v) {
        d = await this.data_getData(d)
        setObjVal(d, k, v)
        return this.data_setData(d)
    },

    async data_getVal(d, k, defV) {
        d = await this.data_getData(d)
        return getObjVal(d, k, defV)
    },

    // 保证设置数据
    async data_set1(md5, data) {
        return await this.data_set(md5, data).changes || await this.data_add(data).changes
    },

    // 保存数据
    data_setData(data) {
        if (data.md5) {
            return this.data_set(data.md5, data)
        }
    },

    async data_getData(md5, table) {
        return typeof(md5) == 'object' ? md5 : await this.data_get(md5, table)
    },

    data_getData1(md5, callback) {
        if (typeof(md5) == 'object') return callback(md5)
        this.data_get(md5).then(data => callback(data))
    },

    // 数组增减多个
    async data_arr_changes(data, key, added, removed) {
        data = await this.data_getData(data)
        added.forEach(add => {
            if (!data[key].includes(add)) data[key].push(add)
        })
        removed.forEach(remove => {
            let i = data[key].indexOf(remove)
            if (i != -1) data[key].splice(i, 1)
        })
        this.data_setData(data)
    },

    // 数组增减单个
    async data_arr_toggle(data, key, folder, add = true) {
        data = await this.data_getData(data)
        let i = data[key].indexOf(folder)
        let exists = i == -1
        if (add == undefined) add = !exists
        if (add) {
            data[key].push(folder)
        } else {
            data[key].splice(i, 1)
        }
        await this.data_setData(data)
        // TODO 更新当前过滤 ()
        return add
    },


    data_getDataByID(id, table = 'files') {
        return this.data_get1({ table, key: 'id', value: id })
    },

    // 获取视频数据
    async data_get(md5, table = 'files') {
        debug('get', md5, table)
        let ret = this.cache.get(md5)
        if (ret) return ret

        ret = this.data_get1({ table, key: 'md5', value: md5 })
        ret.then(data => {
            if (data) {
                data.table = table
                if (table == 'trash') data.meta = JSON.parse(data.meta)
                this.cache.set(md5, data)
            }
        })
        return ret
    },

    async data_get1(opts) {
        return g_plugin.callEvent('db_beforeGetData', opts).then(async opts => {
            let { dbFile, table, key, value } = opts
            return this.get1(`select * from ${table} where ${key}=?`, dbFile, value);
        })
    },

    deepProxy(Obj, callback) {
        // 深度遍历
        if (typeof Obj === 'object') {
            const status = Array.isArray(Obj);
            if (status) {
                Obj.forEach((v, i) => {
                    if (typeof v === 'object') {
                        Obj[i] = this.deepProxy(v, callback)
                    }
                })
            } else {
                Object.keys(Obj).forEach(v => {
                    if (typeof Obj[v] === 'object') {
                        Obj[v] = this.deepProxy(Obj[v], callback)
                    }
                });
            }
            return new Proxy(Obj, {
                set(target, key, val) {
                    if (target[key] !== val) { // 数据变动
                        Reflect.set(target, key, val)
                        callback(target, key, val)
                    }
                }
            }); // 数据代理
        }
        return new TypeError("Argument must be object or array");
    },

    // 返回一个改动就自动保存的对象
    async data_handle(md5) {
        let data = await this.data_get(md5)
        // 对象里的对象不能Pro
        return this.deepProxy(data, (target, key, val) => {
            // console.log(data)
            g_data.data_setData(data)
        })
    },

    init(funs = {}) {
        const self = this
        let init = funs.init
        if (init) {
            funs.init.apply(this)
            delete funs.init
        }
        Object.assign(this, funs)
        return this
    },

    // 文件列表转成对象
    // files 数组（文件列表） 对象（预设属性）
    file_revice(files, obj = true, callback) {
        return new Promise(async reslove => {
            let r = obj ? {} : []
            for (let [k, d] of Object.entries(files)) {
                let file
                if (typeof(d) == 'object') {
                    file = d.file
                } else {
                    file = d
                    d = {}
                }
                file = file.replaceAll('\\', '//') // 替换正确路径
                let { birthtimeMs, isFile, size } = nodejs.files.stat(file)
                if (!isFile) continue;

                let json = {}
                // TODO 简单判断是否为媒体文件
                // TODO 进度显示
                let meta = await g_ffmpeg.video_meta(file)
                if (meta && meta.streams) {
                    json.duration = meta.format.duration * 1
                    json.width = meta.streams[0].coded_width
                    json.height = meta.streams[0].coded_height
                    json.frame = meta.streams[0].avg_frame_rate
                }
                Object.assign(d, {
                    file,
                    json,
                    birthtime: parseInt(birthtimeMs),
                    size: parseInt(size),
                })
                obj ? r[nodejs.files.getFileMd5(file)] = d : r.push(d)
                callback && callback(d)

            }
            reslove(this.data_import(r))
        })
    },

    // 对象格式化至可以插入SQL
    data_format(data) {
        let d = copyObj(data)
        delete d.id // id会跟sql主键起冲突

        d.title = safePath(d.title)
        if (d.tags != undefined) d.tags = this.arr_join(d.tags)
        if (d.folders != undefined) d.folders = this.arr_join(d.folders)
        if (d.json != undefined) d.json = JSON.stringify(d.json)
        return d
    },

    getMetaInfo(data, table, cache = true) {
        if (!data) return

        // meta 缓存
        if (cache && data.meta && data.meta[table]) {
            return data.meta[table]
        }

        table += '_meta'
        let id = typeof(data) == 'object' ? data.id : data
        if (id != undefined && this.table_indexs[table]) return this.get(`SELECT * FROM ${table} WHERE fid=${id}`)
    },

    arr_join(arr, join = '|') {
        let s = arr.sort().join(join)
        return s == '' ? s : join + s + join
    },

    arr_split(str, split = '|') {
        return str.split(split).filter(s => s != '')
    }
}



module.exports = g_data