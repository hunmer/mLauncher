var g_preload = {
	list: {},
	init(){

	},
	register(name, opts){
		this.list[name] = opts
	},
	get(name){
		return this.list[name]
	},
	check(name, cb){
		let d = this.get(name)
		if(d){
			if(!d.check()){
				loadRes(d.list, cb)
			}else{
				cb()
			}
		}
	}
}

g_preload.init()
