/*global EyesFollow WPEyesFollow EyesPoint Type Formulas ss */
(function($) {
//! WPEyesFollow.debug.js
//

(function() {

Type.registerNamespace('WPEyesFollow');

////////////////////////////////////////////////////////////////////////////////
// WPEyesFollow.WPEyesFollow

WPEyesFollow.WPEyesFollow = function WPEyesFollow_WPEyesFollow() {
    /// <field name="_eyes$4" type="WPEyesFollow.WPEyesFollow" static="true">
    /// </field>
    /// <field name="_nxtTmr$4" type="Number" integer="true">
    /// </field>
    WPEyesFollow.WPEyesFollow.initializeBase(this);
}
WPEyesFollow.WPEyesFollow.get__donation$4 = function WPEyesFollow_WPEyesFollow$get__donation$4() {
    /// <value type="jQueryObject"></value>
    return $("h3:contains('Donation')");
}
WPEyesFollow.WPEyesFollow.prototype = {
    _nxtTmr$4: 0,
    opt: window.WPEyesFollowOptions,

    get__randomPlace$4: function WPEyesFollow_WPEyesFollow$get__randomPlace$4() {
        /// <value type="jQueryObject"></value>
        var list = $('td', $('#content'));
        var i = Formulas.randomOf(list.length - 1);
        return list.eq(i);
    },
    
    whenMouseStops: function WPEyesFollow_WPEyesFollow$whenMouseStops() {
    	var my = this;
    	my.opt = my.opt || window.WPEyesFollowOptions;
        //Inform.debug('Mouse stopped');
        clearTimeout(my.stopTmr);
        my.stopTmr = setTimeout(function() {
	        if (my.opt.homeAction == 'element' && my.opt.homeSelector) {
	        	var $el = $(my.opt.homeSelector);
	        	if ($el.length)
					my._moveNext$4(3000, $el);
	        } else if (my.opt.homeAction == 'hide') {
	        	my.moveTo(-100, -100);
	        }
        }, parseInt(my.opt.stopWait) || 5000);
    },
    
    _moveNext$4: function WPEyesFollow_WPEyesFollow$_moveNext$4(ms, el) {
        /// <param name="ms" type="Number" integer="true">
        /// </param>
        /// <param name="el" type="jQueryObject">
        /// </param>
        window.clearTimeout(this._nxtTmr$4);
        this._nxtTmr$4 = window.setTimeout(ss.Delegate.create(this, function() {
            if (this.get_trackingDone()) {
                this.moveToElement(el);
                this._moveNext$4(Formulas.randomOf(6000) + 3000, this.get__randomPlace$4());
            }
            else {
                this._moveNext$4(ms, el);
            }
        }), ms);
    }
}


////////////////////////////////////////////////////////////////////////////////
// EyesFollow

window.EyesFollow = function EyesFollow() {
    /// <field name="_dv$3" type="Number" static="true">
    /// </field>
    /// <field name="_pluginPath$3" type="String" static="true">
    /// </field>
    /// <field name="_eyeballsImg$3" type="String" static="true">
    /// </field>
    /// <field name="_pupilsImg$3" type="String" static="true">
    /// </field>
    /// <field name="eyeBalls" type="jQueryObject">
    /// </field>
    /// <field name="pupil1" type="jQueryObject">
    /// </field>
    /// <field name="pupil2" type="jQueryObject">
    /// </field>
    /// <field name="_here$3" type="EyesPoint">
    /// </field>
    /// <field name="_pointStack$3" type="Array">
    /// </field>
    /// <field name="eyesOffsetHorz" type="Number">
    /// </field>
    /// <field name="marginBottom" type="Number" integer="true">
    /// </field>
    /// <field name="_angle1$3" type="Number">
    /// </field>
    /// <field name="_angle2$3" type="Number">
    /// </field>
    /// <field name="_d1$3" type="Number" integer="true">
    /// </field>
    /// <field name="_d2$3" type="Number" integer="true">
    /// </field>
    /// <field name="_doFlirting$3" type="Boolean">
    /// </field>
    /// <field name="_fx$3" type="Number">
    /// </field>
    /// <field name="_fy$3" type="Number">
    /// </field>
    /// <field name="_afterPt$3" type="EyesPoint">
    /// </field>
    /// <field name="_beforePt$3" type="EyesPoint">
    /// </field>
    this._here$3 = new EyesPoint(0, 0);
    this._pointStack$3 = [];
    this._afterPt$3 = new EyesPoint(0, 0);
    this._beforePt$3 = new EyesPoint(0, 0);
    EyesFollow.initializeBase(this);
    this.element = $("<div style='position:absolute;top:0px;left:0px;width:69px;height:34px;display:none'/>");
    this.eyeBalls = $("<div style='position:absolute;top:0px;left:0px;width:69px;height:34px;'/>").appendTo(this.element);
    this.pupil1 = $("<div style='position:absolute;top:13px;left:13px;width:12px;height:13px;'/>").appendTo(this.eyeBalls);
    this.pupil2 = $("<div style='position:absolute;top:13px;left:26px;width:12px;height:13px;'/>").appendTo(this.eyeBalls);
    this.eyeBalls.append($("<img src='" + EyesFollow._eyeballsImg$3 + "' width='69' height='34'/>"));
    this.pupil1.append($("<img src='" + EyesFollow._pupilsImg$3 + "' width='13' height='13'/>"));
    this.pupil2.append($("<img src='" + EyesFollow._pupilsImg$3 + "' width='13' height='13'/>"));
    this.fadeIn = 900;
    this.fadeOut = 500;
}
EyesFollow.bodyEyes = function EyesFollow$bodyEyes(flirting) {
    /// <param name="flirting" type="Boolean">
    /// </param>
    /// <returns type="EyesFollow"></returns>
    var eyesFollow = new EyesFollow().flirting(!ss.isValue(flirting) || flirting);
    eyesFollow.element.appendTo(document.body);
    return eyesFollow;
}
EyesFollow.prototype = {
    eyeBalls: null,
    pupil1: null,
    pupil2: null,
    eyesOffsetHorz: 0.333,
    marginBottom: 18,
    _angle1$3: 0,
    _angle2$3: 0,
    _d1$3: 0,
    _d2$3: 0,
    _doFlirting$3: false,
    _fx$3: 0,
    _fy$3: 0,
    
    moveTo: function EyesFollow$moveTo(x, y) {
        /// <param name="x" type="Number" integer="true">
        /// </param>
        /// <param name="y" type="Number" integer="true">
        /// </param>
        /// <returns type="EyesFollow"></returns>
        new Await().addDx(ss.Delegate.create(this, function() {
            this.mouseY = this._here$3.y = y;
            this.mouseX = this._here$3.x = x;
            this.startActing();
        })).addAw(ss.Delegate.create(this, this.waitTrackingDoneAw)).addFn(ss.Delegate.create(this, this.flirt)).commit();
        return this;
    },
    
    moveToElement: function EyesFollow$moveToElement(el) {
        /// <param name="el" type="jQueryObject">
        /// </param>
        /// <returns type="EyesFollow"></returns>
        return this.moveTo(el.offset().left + parseInt(el.width() * this.eyesOffsetHorz), el.offset().top + this.marginBottom);
    },
    
    hideEyes: function EyesFollow$hideEyes() {
        /// <returns type="EyesFollow"></returns>
        this.acting = false;
        window.setTimeout(ss.Delegate.create(this, function() {
            if (!this.acting) {
                this.unfollowMouse();
                this.moveTo(parseInt(Math.random() * window.innerWidth), parseInt(Math.random() * window.innerHeight));
                this.element.fadeOut(this.fadeOut);
            }
        }), 200);
        return this;
    },
    
    flirt: function EyesFollow$flirt() {
        if (this._doFlirting$3) {
            this.stare(350);
        }
    },
    
    flirting: function EyesFollow$flirting(ic) {
        /// <param name="ic" type="Boolean">
        /// </param>
        /// <returns type="EyesFollow"></returns>
        this._doFlirting$3 = ic;
        return this;
    },
    
    stare: function EyesFollow$stare(ms) {
        /// <param name="ms" type="Number" integer="true">
        /// </param>
        new Await().addFn(ss.Delegate.create(this, this._pushEyes$3)).addDx(ss.Delegate.create(this, function() {
            this._movePupil$3(this.pupil1, 13, 13, 200);
            this._movePupil$3(this.pupil2, 9, 13, 200);
        })).addAw(ss.Delegate.create(this, this.waitTrackingDoneAw)).sleep(ms).addFn(ss.Delegate.create(this, this._popPupils$3), 145).commit();
    },
    
    destroy: function EyesFollow$destroy() {
        this.element.remove();
        this.resetTimers();
    },
    
    _movePupil$3: function EyesFollow$_movePupil$3(pupil, x, y, ms) {
        /// <param name="pupil" type="jQueryObject">
        /// </param>
        /// <param name="x" type="Number" integer="true">
        /// </param>
        /// <param name="y" type="Number" integer="true">
        /// </param>
        /// <param name="ms" type="Number" integer="true">
        /// </param>
        this.isFollowable = false;
        this.set_trackingDone(false);
        if (pupil === this.pupil2) {
            x += 34;
        }
        pupil.animate({ top: y + 'px', left: x + 'px' }, ms, 'swing', ss.Delegate.create(this, function() {
            this.set_trackingDone(true);
        }));
    },
    
    _pushEyes$3: function EyesFollow$_pushEyes$3() {
        var pp = new EyesPoint(this._here$3.x, this._here$3.y).collect(this);
        this._pointStack$3.add(pp);
    },
    
    _popPupils$3: function EyesFollow$_popPupils$3(ms) {
        /// <param name="ms" type="Number" integer="true">
        /// </param>
        if (this._pointStack$3.length > 0) {
            var pp = this._pointStack$3[this._pointStack$3.length - 1];
            this._pointStack$3.removeAt(this._pointStack$3.length - 1);
            if (this.get_trackingDone()) {
                this._movePupil$3(this.pupil1, pp.leftPupilLeft, pp.leftPupilTop, ms);
                this._movePupil$3(this.pupil2, pp.rightPupilLeft, pp.rightPupilTop, ms);
            }
            this.isFollowable = pp.followable;
        }
    },
    
    get_trackingDone: function EyesFollow$get_trackingDone() {
        /// <value type="Boolean"></value>
        return EyesFollow.callBaseMethod(this, 'get_trackingDone');
    },
    set_trackingDone: function EyesFollow$set_trackingDone(value) {
        /// <value type="Boolean"></value>
        EyesFollow.callBaseMethod(this, 'set_trackingDone', [ value ]);
        return value;
    },
    
    follow: function EyesFollow$follow() {
        this._fy$3 += (this.mouseY - this._fy$3) * 0.12 - 2;
        this._fx$3 += (this.mouseX - this._fx$3) * 0.12;
        this._beforePt$3.collect(this);
        this._track$3();
        this._afterPt$3.collect(this);
        this.set_trackingDone(this._beforePt$3.compare(this._afterPt$3));
        if (this.get_trackingDone()) {
            this.stopActing();
        }
    },
    
    _track$3: function EyesFollow$_track$3() {
        var sy = 0;
        var wy = window.innerHeight + DomElement.documentScrollTop();
        var wx = window.innerWidth;
        var chy = Math.floor(this._fy$3 - 34);
        if (chy <= 0) {
            chy = 0;
        }
        if (chy >= wy - 34) {
            chy = wy - 34;
        }
        var chx = Math.floor(this._fx$3 - 34);
        if (chx <= 0) {
            chx = 0;
        }
        if (chx >= wx - 69) {
            chx = wx - 69;
        }
        var ebTop = parseInt((chy + sy));
        var ebLeft = parseInt(chx);
        this.eyeBalls.css('top', ebTop + 'px');
        this.eyeBalls.css('left', ebLeft + 'px');
        if (!this.isFollowable) {
            return;
        }
        var c1Y = parseInt(ebTop) + 17;
        var c1X = parseInt(ebLeft) + 17;
        var c2Y = parseInt(ebTop) + 17;
        var c2X = parseInt(ebLeft) + 52;
        var dy1 = this.mouseY + sy - c1Y;
        var dx1 = this.mouseX - c1X;
        this._d1$3 = Math.sqrt(dy1 * dy1 + dx1 * dx1);
        var dy2 = this.mouseY + sy - c2Y;
        var dx2 = this.mouseX - c2X;
        this._d2$3 = Math.sqrt(dy2 * dy2 + dx2 * dx2);
        var ay1 = this.mouseY + sy - c1Y;
        var ax1 = this.mouseX - c1X;
        this._angle1$3 = Math.atan2(ay1, ax1) * 180 / Math.PI;
        var ay2 = this.mouseY + sy - c2Y;
        var ax2 = this.mouseX - c2X;
        this._angle2$3 = Math.atan2(ay2, ax2) * 180 / Math.PI;
        var p = this.eyeBalls.offset();
        var p1T = ((this._d1$3 < 17) ? (c1Y - 6 + this._d1$3 / 1.7 * Math.sin(this._angle1$3 * Math.PI / 180)) : (c1Y - 6 + 10 * Math.sin(this._angle1$3 * Math.PI / 180)));
        var p1L = ((this._d1$3 < 17) ? (c1X - 6 + this._d1$3 / 1.7 * Math.cos(this._angle1$3 * Math.PI / 180)) : (c1X - 6 + 10 * Math.cos(this._angle1$3 * Math.PI / 180)));
        var p2T = ((this._d2$3 < 17) ? (c2Y - 6 + this._d2$3 / 1.7 * Math.sin(this._angle2$3 * Math.PI / 180)) : (c2Y - 6 + 10 * Math.sin(this._angle2$3 * Math.PI / 180)));
        var p2L = ((this._d2$3 < 17) ? (c2X - 6 + this._d2$3 / 1.7 * Math.cos(this._angle2$3 * Math.PI / 180)) : (c2X - 6 + 10 * Math.cos(this._angle2$3 * Math.PI / 180)));
        this.pupil1.css('top', p1T - p.top + 'px');
        this.pupil1.css('left', p1L - p.left + 'px');
        this.pupil2.css('top', p2T - p.top + 'px');
        this.pupil2.css('left', p2L - p.left + 'px');
    }
}


////////////////////////////////////////////////////////////////////////////////
// EyesPoint

window.EyesPoint = function EyesPoint(x, y) {
    /// <param name="x" type="Number" integer="true">
    /// </param>
    /// <param name="y" type="Number" integer="true">
    /// </param>
    /// <field name="eyesLeft" type="Number" integer="true">
    /// </field>
    /// <field name="eyesTop" type="Number" integer="true">
    /// </field>
    /// <field name="followable" type="Boolean">
    /// </field>
    /// <field name="leftPupilLeft" type="Number" integer="true">
    /// </field>
    /// <field name="leftPupilTop" type="Number" integer="true">
    /// </field>
    /// <field name="rightPupilLeft" type="Number" integer="true">
    /// </field>
    /// <field name="rightPupilTop" type="Number" integer="true">
    /// </field>
    /// <field name="x" type="Number" integer="true">
    /// </field>
    /// <field name="y" type="Number" integer="true">
    /// </field>
    this.x = x;
    this.y = y;
}
EyesPoint.prototype = {
    eyesLeft: 0,
    eyesTop: 0,
    followable: false,
    leftPupilLeft: 0,
    leftPupilTop: 0,
    rightPupilLeft: 0,
    rightPupilTop: 0,
    x: 0,
    y: 0,
    
    collect: function EyesPoint$collect(eyesFollow) {
        /// <param name="eyesFollow" type="EyesFollow">
        /// </param>
        /// <returns type="EyesPoint"></returns>
        var p = eyesFollow.eyeBalls.offset();
        this.eyesTop = p.top;
        this.eyesLeft = p.left;
        p = eyesFollow.pupil1.position();
        this.leftPupilTop = p.top;
        this.leftPupilLeft = p.left;
        p = eyesFollow.pupil2.position();
        this.rightPupilTop = p.top;
        this.rightPupilLeft = p.left - 34;
        this.followable = eyesFollow.isFollowable;
        return this;
    },
    
    compare: function EyesPoint$compare(p) {
        /// <param name="p" type="EyesPoint">
        /// </param>
        /// <returns type="Boolean"></returns>
        return this.leftPupilLeft === p.leftPupilLeft && this.leftPupilTop === p.leftPupilTop && this.rightPupilLeft === p.rightPupilLeft && this.rightPupilTop === p.rightPupilTop && this.eyesLeft === p.eyesLeft && this.eyesTop === p.eyesTop && this.x === p.x && this.y === p.y;
    }
}


EyesFollow.registerClass('EyesFollow', Actor);
WPEyesFollow.WPEyesFollow.registerClass('WPEyesFollow.WPEyesFollow', EyesFollow);
EyesPoint.registerClass('EyesPoint');
WPEyesFollow.WPEyesFollow._eyes$4 = null;
(function () {
	
	var loader = function() {
		var opt = window.WPEyesFollowOptions;
		if (!opt) {
			setTimeout(loader, 13);
			return;
		}
		console.log('EyesPoint loaded');
		window.setTimeout(function() {
	        WPEyesFollow.WPEyesFollow._eyes$4 = new WPEyesFollow.WPEyesFollow();
	        WPEyesFollow.WPEyesFollow._eyes$4.flirting(true);
	        WPEyesFollow.WPEyesFollow._eyes$4.element.appendTo(document.body);
	        WPEyesFollow.WPEyesFollow._eyes$4.followMouse();
	    }, opt.startDelay || 2000);
	}
	loader();
})();
EyesFollow._pluginPath$3 = '/wp-content/plugins/wordpress-eyesfollow-plugin/Eyes';
EyesFollow._eyeballsImg$3 = EyesFollow._pluginPath$3 + '/eye2.gif';
EyesFollow._pupilsImg$3 = EyesFollow._pluginPath$3 + '/pupils.gif';
})();

//! This script was generated using Script# v0.7.4.0
})(jQuery);
