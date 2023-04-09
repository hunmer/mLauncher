class basedata {
    insertDefault = {}
    constructor(opts) {
        Object.assign(this, opts)
        this.list = toVal(opts.list, opts.name)
        this.isArr = Array.isArray(this.list)
        if (!this.defaultList) this.defaultList = this.getEmptyVals()
        this.init && this.init()
    }

    getEmptyVals() {
        return this.isArr ? [] : {}
    }

    toggle(key, vals) {
        if (this.exists(key)) {
            this.remove(key)
        } else {
            this.add(key, vals)
        }
    }

    keys(){
        return Object.keys(this.list)
    }

    values(){
        return Object.values(this.list)
    }

    count() {
        return this.keys().length
    }

    setData(data, save){
        this.list = data
        this.save(save)
    }

    add(key, vals = {}, save = true) {
        this.set(key, vals, save);
    }

    merge(key, vals = {}, save) {
        this.set(key, Object.assign(this.get(key) || this.getEmptyVals(), vals), save)
    }

    exists(key) {
        return this.get(key) != undefined
    }

    all(callback = () => true) {
        return Object.entries(this.list).filter(callback)
    }

    getDefaultVal(key) {
        return toVal(this.insertDefault, key)
    }

    getVal(key, k){
        return this.get(key)[k]
    }

    setVal(key, k, v, save = true){
        let d = this.get(key)
        if(d){
            setObjVal(d, k, v)
            // d[k] = v
            this.save(save)
        }
    }

    removeVal(key, k, save = true){
        let d = this.get(key)
        if(d){
            delete d[k]
            this.save(save)
        }
    }

    switchValue(key, vals, save) {
        let d = this.get(key)
        for (let [k, v] of Object.entries(vals)) {
            let val = d[k]
            if (v == undefined && typeof(val) == 'boolean') {
                d[k] = !val
            } else {
                d[k] = v
            }
        }
        this.set(key, d, save)
    }

    toggle(key, vals) {
        let exists = this.exists(key)
        if (exists) {
            this.remove(key)
        } else {
            this.set(key, vals)
        }
        return exists
    }

    set(key, vals = {}, save = true) {
        let exists = this.exists(key)
        if(this.isArr) key = this.find(key) || this.count()
        vals = Object.assign({}, this.getDefaultVal(key), vals);
        this.list[key] = vals
        this.save(save);

        this.callEvent('set', { key, vals, exists })
        return this.getIndex(vals)
    }

    callEvent(method, ...args) {
        args[0].inst = this
        if (this.event) {
            // 内部call
            if (this.event[method]) this.event[method].apply(this, args)

            // 外部call
            g_plugin.callEvent.apply(this, [this.name + '_' + method, ...args])
        }
    }

    // 获取数据在列表的索引
    getIndex(v, k) {
        if (this.primarykey != undefined) return v[this.primarykey]
        return k
    }

    getIndexs(){
        if(this.primarykey == undefined) return this.keys()
        return this.values().map(v => v[this.primarykey])
    }

    getChild(index) {
        return Object.values(this.list)[index]
    }

    find(key, obj = false) {
        let primarykey = this.primarykey
        if(primarykey == undefined){
            if(this.list[key]) return obj ? this.list[key] : key
        }
        let index = this.search(primarykey || 'value', key)
        if (index != undefined && obj) return this.list[index]
        return index
    }

    get(key) {
        return this.find(key, true);
    }

    reset() {
        let list = copyObj(this.list)
        this.list = copyObj(this.defaultList)
        this.save()
        this.callEvent('reset', { list })
    }

    remove(key) {
        let vals = this.get(key)
        if (vals) {
            key = this.find(key)
            this.isArr ? this.list.splice(key, 1) : delete this.list[key]
            this.save();
            this.callEvent('remove', { key, vals })
        }
    }

    save(refresh = true, list) {
        this.saveData && this.saveData(list || this.list)
        refresh && this.refresh();
    }

    entries(callback) {
        for (let [k, v] of Object.entries(this.list)) {
            if (callback(k, v) === false) return
        }
    }

    refresh() {

    }

    keysEntries(callback) {
        for (let [k, v] of Object.entries(this.list)) {
            if (callback(this.getIndex(v), v) === false) return false
        }
    }

    search(key, val, arr) {
        let find
        this.entries((k, v) => {
            if (String(v[key]) == String(val)) { // '1' == true '0' == false 避免掉
                if (Array.isArray(arr)) {
                    arr.push(k)
                } else {
                    find = k
                    return false
                }
            }
        })
        return find || arr
    }
}