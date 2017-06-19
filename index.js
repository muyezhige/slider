(function($){
        // 导航tab切换
        var Tab = {
            init: function(opts){
                var self = this;
                self.opts = opts || {};
                self.$list = self.opts.wrap.find(self.opts.child);
                self._len = self.$list.length;
                self.win_width = $(window).width();

                self._right = self.getPdding().right;
                self._left  = self.getPdding().left;

                self.startX = ((self.win_width - self._left - self._right) /self._len - self.opts.lineLen)/2 + self._left;
                self.renderDOM();
                self.bindEvent();
            },
            getPdding: function () {
                var self = this;
                var style = window.getComputedStyle(self.opts.wrap[0]);
                return {
                    left : parseInt(style.paddingLeft, 10),
                    right: parseInt(style.paddingRight, 10)
                };
            },
            renderDOM: function(){
                var self = this;
                self.$body = $("body");
                self.jLine = $(".j_line");
                self.jLine.css({
                    "transform": "translate("+ self.startX +"px, 0)",
                    "width": self.opts.lineLen + "px"
                });
            },
            changeTab: function(){
                var $this = $(this);
                var self = Tab;

                self.sliderCommon($this.index());
                self.opts.tab_funs && self.opts.tab_funs($this);
            },
            sliderCommon: function(index){
                var self = Tab;

                self.$list.removeClass("cur");
                self.$list.eq(index).addClass("cur");

                var endX = index * ( (self.win_width - self._left - self._right)/self._len) + self.startX;
                self.jLine.css("transform", "translate("+ endX +"px, 0)");
            },
            bindEvent: function(){
                var self = this;
                self.$body.on("click", self.opts.child, self.changeTab);
            }
        };

        Tab.init({
            wrap: $(".j_tablist"),
            child: ".j_tab",
            lineLen: 15,
            tab_funs: function($this){
                var index = $this.index();
                Slider.gotabIndex(index);
            }
        });

        var _dir = "";

        // 左右滑动
        var Slider = {
            init: function(opts){
                var self = this;
                self.wrap = opts.wrap;
                self.$list = self.wrap.find(opts.child);
                self.win_width = $(window).width();
                self.idx = 0;

                // DOM渲染
                self.renderDOM();
                // 事件绑定
                self.bindEvent();
            },
            renderDOM: function(){
                var self = this;
                self.$list.each(function(i, v){
                    $(v).css('-webkit-transform', "translate3d("+ (i * self.win_width)+"px, 0, 0)");
                });
            },
            startHandler: function(evt){
                var self = Slider;
                var touch = evt.touches[0];

                self.startTime = new Date().getTime();
                // 记录按下时x坐标值
                self.startX = touch.pageX;
                self.startY = touch.pageY;
                // x偏移量
                self.offsetX = 0;
                self.offsetY = 0;
                _dir = "";
            },
            moveHandler: function(evt){
                evt.preventDefault();
                var self = Slider;
                var touch = evt.touches[0];
                if (_dir == "Y") {
                    return;
                }
                // 记录手指滑动过程中的x偏移量
                self.offsetX = touch.pageX - self.startX;
                self.offsetY = touch.pageY - self.startY;

                // 一旦判定用户是下拉操作，便不在进行下拉还是左右滑动的判断。
                if (!_dir) {
                    if(Math.abs(self.offsetX) >= Math.abs(self.offsetY)){
                        _dir = "X";
                    }else{
                        _dir = "Y";
                        // 下拉加载时，阻止代码继续执行，产生细微的左右滑动。
                        return false;
                    }
                }

                //i为起始索引， idx为当前滑动块的索引值
                var i = self.idx - 1;
                //结束索引
                var m = i + 3;
                if ((self.idx === 0 && self.offsetX > 0) || (self.idx === 3 && self.offsetX < 0))  {
                    return;
                }

                // 移动时，只控制 左、中、右，三个滑动区块
                for(i; i < m; i++){
                    var _x = ((i-self.idx)*self.win_width + self.offsetX);
                    self.$list[i] && (self.$list[i].style.webkitTransform = 'translate3d('+ _x +'px, 0, 0)');
                }
            },
            endHandler: function(evt){
                evt.preventDefault();
                var self = Slider;
                var endTime = new Date() * 1;
                var boundary = self.win_width/4;

                if(endTime - self.startTime > 300){
                    if(self.offsetX >= boundary){
                        self.goIndex(-1);
                    }else if(self.offsetX < 0 && self.offsetX < -boundary){
                        self.goIndex(1);
                    }else{
                        self.goIndex(0);
                    }

                }else{
                    if(self.offsetX > 60){
                        self.goIndex(-1);
                    }else if(self.offsetX < -60){
                        self.goIndex(+1);
                    }else{
                        // 单击不滑动时触发。
                        self.goIndex(0);
                    }
                }
            },
            goIndex: function(step){
                var self = this;
                var idx = self.idx;
                var len = self.$list.length;
                var cidx;

                cidx = idx + step*1;
                //当索引右超出
                if(cidx > len - 1){
                    cidx = len - 1;
                //当索引左超出    
                }else if(cidx < 0){
                    cidx = 0;
                }

                self.idx = cidx;

                //手指离开屏幕后，左、中、右滑块，所应该的位移值
                self.$list.eq(cidx).addClass("transition");
                self.$list[cidx].style.webkitTransform = 'translate3d(0, 0, 0)';
                if (self.$list[cidx-1]){
                    self.$list.eq(cidx-1).addClass("transition");
                    self.$list[cidx-1].style.webkitTransform = 'translate3d(-'+ self.win_width +'px, 0, 0)';
                }

                if (self.$list[cidx+1]) {
                    self.$list.eq(cidx+1).addClass("transition");
                    self.$list[cidx+1].style.webkitTransform = 'translate3d('+ self.win_width +'px, 0, 0)';
                }

                //导航滑动切换 
                Tab.sliderCommon(cidx);
            },
            gotabIndex: function(step){
                var self = Slider;
                self.$list.each(function(i, v){
                    var _X;
                    if (i == step) {
                        _X = 0;
                    }else{
                        _X = self.win_width * (i - step);
                    }
                    self.$list.eq(i).addClass("transition");
                    self.$list[i].style.webkitTransform = "translate3d("+ _X +"px, 0, 0)";
                });
                self.idx = step;
            },
            bindEvent: function(){
                var self = this;
                self.jslider = self.wrap.find(".j_slider");
                self.jslider.on('touchstart', self.startHandler);
                self.jslider.on('touchmove',  self.moveHandler);
                self.jslider.on('touchend',   self.endHandler);
            }
        };

        Slider.init({
            wrap: $("#container"),
            child: ".j_page"
        });

        // 下拉加载
        var pull = {
            init: function(opts){
                this.opts = opts || {};

                this.bindEvent();
            },
            startHandler: function(evt){
                evt.preventDefault();
                var self = pull;
                var touch = evt.touches[0];
                self.startY = touch.pageY;
                self.offsetY = 0; 
            },
            moveHandler: function(evt){
                evt.preventDefault();
                if (_dir == "X"){
                    return;
                }
                var self = pull;
                var touch = evt.touches[0];
                self.offsetY = touch.pageY - self.startY;
                
                if (self.offsetY > 15 && self.offsetY < 150) {
                    self.opts.wrap.css("-webkit-transform", "translate3d(0, "+ self.offsetY +"px, 0)");
                }
            },
            endHandler: function(evt){
                evt.preventDefault();
                if (_dir == "X"){
                    return;
                }
                var self = pull;
                if (self.offsetY > 15) {
                    self.opts.wrap.addClass("transition");
                    self.opts.wrap.css({
                        "-webkit-transform": "translate3d(0, 50px, 0)"
                    });

                    // 1.5s后面，模拟加载成功
                    setTimeout(function(){
                        self.opts.wrap.addClass("transition");
                        self.opts.wrap.css({
                            "-webkit-transform": "translate3d(0, 0px, 0)"
                        });
                    }, 1500);
                }
            },
            bindEvent: function(){
                var self = this;
                self.opts.wrap.on("touchstart", self.startHandler);
                self.opts.wrap.on("touchmove",  self.moveHandler);
                self.opts.wrap.on("touchend",   self.endHandler);
                self.opts.wrap.on("transitionend webkitTransitionEnd", function(e){
                    if($(e.target).hasClass("js_down_pull")){
                        self.opts.wrap.removeClass("transition");
                    }
                    if($(e.target).hasClass("j_page")){
                        $(".j_page").removeClass("transition");
                    }
                });
            }
        };

        pull.init({
            wrap: $(".js_down_pull")
        });
    })(Zepto);