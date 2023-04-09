/*
    各种排序的注册与调用
    因为排序有很多共同处干脆就写给类
*/

var g_sort = {
    init() {

    },
    methods: {
        sz: s => PinYinTranslate.sz(s.toString()).substr(0, 1)
    },
    set(name, callback) {
        this.methods[name] = callback
    },

    // 取排序结果
    sort(name, items) {
        if (!this.methods[name]) return {} // {all: items}

        let r = {}
        Object.entries(items).forEach(([key, item]) => {
            // 有可能返回多个..
             [...toArr(this.methods[name](item, key))].forEach(k => {
                if (!r[k]) r[k] = new Set()
                r[k].add(item)
            })
        })
        return r
    }
}

g_sort.init()

function toArr(v){
    return Array.isArray(v) ? v : v == undefined ? [] : [v]
}