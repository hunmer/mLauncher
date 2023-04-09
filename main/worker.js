var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

addEventListener('message', async e => {
    let { id, data } = e.data
    let [method, ...args] = data
    postMessage({ ret: await this[method].apply(this, args), id });
})

function walkSync(opts, callback) {
    let { dir, skipList, baseDir } = opts
    fs.readdirSync(dir).forEach(function(name) {
        let filePath = path.join(dir, name);
        let stat = fs.statSync(filePath);
        if(skipList.length){
            let fn = filePath.replace(baseDir, '').replaceAll('\\', '/')
            if(skipList.findIndex(skipFile => fn.startsWith(skipFile)) !== -1) return
        }
        if (stat.isFile()) return callback(filePath, stat);
        opts.dir = filePath
        walkSync(opts, callback);
    });
}

function generateFileList(dir, skipList = []) {
    if(!fs.existsSync(dir)) return {}
    let res = {};
    walkSync({ dir, skipList, baseDir: dir }, (file, stat) => {
        let buffer = fs.readFileSync(file);
        let hash = crypto.createHash('md5');
        hash.update(buffer, 'utf8');
        res[file.replace(dir, '/').replaceAll('\\', '/')] = hash.digest('hex');
    });
    return res
}