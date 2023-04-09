var g_ffmpeg = {
    init() {
        this.path = require('path')
        // this.task_add([])
    },

    tasks: {},

    // 任务队列
    query() {

    },

    task_add(list) {

    },

    task_remove() {

    },

    async markCover(md5, params) {
        let d = await g_data.data_get(md5)
        let input = g_item.item_getVal('file', d)
        if (!nodejs.files.exists(input)) return

        let output
        switch (getFileType(input)) {
            case 'video':
                 output = g_db.getSaveTo(md5) + 'cover.jpg'
                if(params == undefined) params = 0 // 裁剪位置

                // TODO 封面同视频比例
                g_ffmpeg.video_cover1({
                    params,
                    input,
                    output,
                    size: '240x180',
                }, () => {
                    g_item.item_saveCover(md5, output)
                })
                break;
            case 'audio':
                 output = g_db.getSaveTo(md5) + 'wave.png'
                let obj = new nodejs.cli.ffmpeg(input)
                    // TODO 根据媒体长度决定宽度，不然媒体长的不明显
                    .setParam('-filter_complex', 'showwavespic=s=640x120')
                    .setParam('-frames:v', '1')
                    .on('end', function() {
                        // TODO 当前preview 更新封面

                    })
                    .on('error', console.error)
                    .save(output)
                break;
            case 'image':
                 output = g_db.getSaveTo(md5) + 'cover.jpg'
                // TODO 封面同视频比例
                g_ffmpeg.image_thumb1({
                    input,
                    output,
                    args: ['-q 95'],
                }, () => {
                    g_item.item_saveCover(md5, output)
                })
                break;
        }
    },

    // 图片压缩
    image_thumb1(opts, callback) {
        nodejs.files.makeSureDir(opts.output)
        this.task_add(
            new nodejs.cli.ffmpeg(opts.input, opts)
            .on('end', function() {
                callback();
            }).on('error', function() {

            }).save(opts.output))
    },

    video_cut(opts, onProgress, callback) {
        nodejs.files.makeSureDir(opts.output)
        this.task_add(
            new nodejs.cli.ffmpeg(opts.input, Object.assign(opts, { progress: true }))
            .on('start', function(cmd) {
                onProgress('waitting')
            })
            .on('progress', function(progress) {
                onProgress(parseInt(toTime(progress) / opts.duration * 100) + '%');
            })
            .on('error', function(e) {
                callback(e)
            })
            .on('end', function(str) {
                callback();
            }).save(opts.output));
    },

    // 封面裁剪
    video_cover1(opts, callback) {
        nodejs.files.makeSureDir(opts.output)
        this.task_add(
            new nodejs.cli.ffmpeg(opts.input, opts)
            .screenshots({
                timestamps: opts.params,
                folder: this.path.dirname(opts.output),
                filename: this.path.basename(opts.output),
                size: opts.size
            }).on('end', function() {
                callback();
            }).on('error', function() {

            }));
    },

    // 视频信息
    video_meta(input, callback) {
        return new Promise(reslove => {
            nodejs.cli.ffprobe(input, {
                env: getProxy()
            }).then(metadata => {
                typeof(callback) == 'function' ? callback(metadata): reslove(metadata)
            });
        })
    },


}



g_ffmpeg.init()
// g_ffmpeg.video_cover1({
//  params: 0,
//  input: 'X:\\aaa\\videos\\1660754068786.mp4',
//  output: 'I:/software\\mCollecion\\resources\\app\\res\\cover2.jpg',
//  size: '200x200',
// }, (...args) => console.log(args))

// g_ffmpeg.video_meta('X:\\aaa\\videos\\1660754068786.mp4', meta => console.log(meta))