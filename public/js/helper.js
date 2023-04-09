var g_helper = {

   enable(list, enable = true){
      list.forEach(method => this[method](enable))
   },

   wheelScroll(){
        $(document).on('mousewheel', '.scroll-x', function(e){
           this.scrollLeft += e.originalEvent.deltaY
        })
   }

}