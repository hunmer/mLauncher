var g_input = {
    init() {
        const self = this
        $(document)
        .on('change', 'input', function(e) {
            let k = this.name
            // k = getParentAttr(this, 'id')
            if (self.list[k]) {
                let val
                let selected
                switch (this.type) {
                    case 'color':
                    case 'radio':
                    case 'checkbox':
                        selected = this.checked
                        val = this.value
                }
                self.list[k].call(this, { selected, val, e })
            }
        })
        .on('change', 'select,textarea', function(e) {
            let k = this.name
            if (self.list[k]) {
                self.list[k].call(this, { val: this.value, e })
            }
        })
        .on('mousewheel', 'select', function(e) {
            let selected = $(this).find('option:selected')
            let next = selected[e.originalEvent.deltaY < 0 ? 'prev' : 'next']()
            if(!next.length) next = $(this).find('option:eq(0)')

            if(next.length) next.prop('selected', true).trigger('change')
        })
    },

    list: {},
    bind(name, callback) {
        let isArr = Array.isArray(name)
        if (typeof(name) == 'object' && !isArr) {
            Object.assign(this.list, name)
            return this
        }

        if (!isArr) name = [name];
        for (var alisa of name) this.list[alisa] = callback;
        return this
    },

    getVal(name){
        // BUG name可能有复数，最好返回数组
        let el = $('[name="'+name+'"]')
        switch(el[0].nodeName.toLowerCase()){
            case 'select':
            case 'input':
                return el.val()

            case 'checkbox':
            case 'radio':
                return el.find(':checked').val()
        }
    }
}


g_input.init()