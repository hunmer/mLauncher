
/*
	简单的回应模型
*/

var g_pp = {
	init: function(){

	},
	list: {},
	set: function(key, cb, opts){
		opts = Object.assign({
			once: false
		}, opts)
		this.list[key] = {cb, opts};
	},
	get: function(key){
		return this.list[key];
	},
	call: function(key, ...args){
		var d = this.get(key);
		if(!d) return;
		d.cb.apply(null, args);
		if(d.opts.once) this.del(key);
	},
	del: function(key){
		if(this.list[key]) delete list[key];
	},
	clear: function(){
		this.list = {};
	},

	timer: {},
	setTimeout(name, callback, ms = 3000){
		this.clearTimeout(name)
		let timer = this.timer[name] = setTimeout(() => {
			if(callback() !== false){
				this.clearTimeout(name)
			}
		}, ms)
		return timer
	},

	clearTimeout(name){
		let i = this.timer[name]
		if(i){
			clearTimeout(i)
			delete this.timer[name]
		}
	},

	setInterval(name, callback, ms = 3000){
		this.clearInterval(name)
		this.timer[name] = setInterval(() => {
			if(callback() !== false){
				this.clearInterval(name)
			}
		}, ms)
	},

	clearInterval(name){
		let i = this.timer[name]
		if(i){
			clearInterval(i)
			delete this.timer[name]
		}
	},

	timerAlive(name){
		return this.timer[name] != undefined
	}
}

// g_pp.set('ping', (a, b) => {
// 	console.log(a, b)
// });
// g_pp.call('ping', 1, 2);



            