class Config {
    static init(obj, key, vals = {}) {
        obj.config = getConfig(key, vals)

        obj.setConfig = function(k, v) {
            obj.config[k] = v
            obj.saveConfig()
        }
        obj.saveConfig = function(v) {
            if (typeof(v) != 'undefined') obj.config = v
            setConfig(key, obj.config)
        }

        obj.getConfig = function(k, def) {
            return typeof(obj.config[k]) != 'undefined' ? obj.config[k] : def
        }
    }
}