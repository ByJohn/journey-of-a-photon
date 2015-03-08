$(function() {
	// < IE9
	if(!Modernizr.csstransforms) {
		alert('For the best experience, please use a more modern web browser, like Google Chrome or Mozilla Firefox.');
	}
});


/*------------------- Global variable -------------------*/


var $page = $('#page'),
	fadeSpeed = 500;


/*------------------- View/Page Class Definitions -------------------*/


var PageView = Backbone.View.extend({

	el: '#page',

	options: {},

	initialize: function() {
	},

	//Extend this method to unload content
	unload: function() {
	},

	superRender: function() {
		this.renderPageTemplate(); //Render page template

		this.render(); //Call child function for page-specific rendering
	},

	renderPageTemplate: function(templateIDString) {
		var template = _.template($('#' + this.options.pageTemplate).html());
		this.$el.html(template);
		return template;
	},

	pageReady: function() {
	},

	//Overwrites default method to prevent removal of the #page element. Best not to extend with child classes
	remove: function() {
		this.unload();
		// this.$el.remove(); //Commented out to prevent removal
		this.stopListening();
		this.undelegateEvents(); //Added this to remove all view events
		return this;
	}

});


var ChapterPageView = PageView.extend({

	tangents: [],

	subtitles: [],

	initialize: function() {
		PageView.prototype.initialize.call(this);
		var that = this;

		//Default events are created here so that the event property can be defined by the child instance

		this.events['click button.play'] = function() {
			that.playButtonClicked();
		};

		this.events['click .tangents li'] = function(e) {
			that.tangentButtonClicked(e);
		};

		this.events['click .close-tangent-popup'] = function(e) {
			that.hideTangentBox();
		};
	},

	unload: function() {
		PageView.prototype.unload.call(this);

		this.videoTag.removeEventListener('playing', this.videoPlayEvent, false );
		this.videoTag.removeEventListener('pause', this.videoPauseEvent, false );
		this.videoTag.removeEventListener('ended', this.videoEndEvent.bind(this), false );

		Popcorn.destroy(this.video);

		_.each(this.tangents, function(tangent) {
			tangent.buttonView.remove(); //Removes every tangent button view
		});
	},

	superRender: function() {
		PageView.prototype.superRender.call(this); //Call the super/parent method

		//After render() is called

		this.$tangentPopup = $('.tangent-popup');

		this.setupVideo();
	},

	playButtonClicked: function() {
		var that = this;
		// $('.chapter-title').velocity('fadeOut', { duration: fadeSpeed, complete: function() {
			$('.chapter-title').fadeOut(fadeSpeed, function() {
				that.videoPlay();
			});
		// }});
	},

	pageReady: function() {
		PageView.prototype.pageReady.call(this);
		this.resizeVideo();
	},

	resizeVideo: function() {
		var $videoContainer = $('.video-container'),
			videoHeight = $videoContainer.outerHeight(),
			videoWidth = $videoContainer.outerWidth(),
			windowHeight = $(window).height();
		if(videoHeight > windowHeight) {
			var ratio = videoHeight / windowHeight;
			$videoContainer.css({width: videoWidth / ratio });
		}
	},

	//Sets up up variables, events and other video settings
	setupVideo: function() {
		this.$video = $('.main-video');
		this.videoTag = this.$video[0];
		this.video = Popcorn(this.videoTag);
		this.watching = true; //If true, the video is being watched, so when the tangent box is opened and closed, it will pause and play the video in the background

		this.video.mute(); //Mutes the video while development is underway
		this.video.controls(true);

		//Video events. When adding new events, add the event removal line to the unload method
		this.videoTag.addEventListener('playing', this.videoPlayEvent, false );
		this.videoTag.addEventListener('pause', this.videoPauseEvent, false );
		this.videoTag.addEventListener('ended', this.videoEndEvent.bind(this), false );

		this.queTangents();
		this.queSubtitles();
	},

	queTangents: function() {
		var that = this,
			$tangents = $('.tangents'),
			i = 0;
			
		$tangents.html('<ul></ul>');

		var $tangentsUL = $tangents.find('ul');

		_.each(this.tangents, function(tangent) {
			tangent.buttonView = new TangentButtonView({tangent: tangent, i: i}); //Creates a tangent button view instance
			tangent.revealed = false;
			tangent.html = $('#' + tangent.templateID).html();

			$tangentsUL.append(tangent.buttonView.el); //Adds the tangent button to the <ul>

			//Cues the tangent popup
			that.video.cue(tangent.time, function() {
				if(!tangent.revealed) {
					tangent.revealed = true;
					tangent.buttonView.reveal();
				}
			});

			i++;
		});
	},

	queSubtitles: function() {
		var that = this;
		_.each(this.subtitles, function(subtitle) {
			that.video.subtitle({
				start: subtitle[0],
				end: subtitle[1],
				text: subtitle[2],
				target: 'subtitles'
			});
		});
	},

	videoPlay: function() {
		this.video.play();
	},

	videoPause: function() {
		this.video.pause();
	},

	videoPlayEvent: function(e) {
		$('.page').toggleClass('playing', true);
	},

	//Called when the video is stopped/paused
	videoPauseEvent: function(e) {
		$('.page').toggleClass('playing', false);
	},

	videoEndEvent: function(e) {
		this.videoPauseEvent(e);
		this.watching = false;
	},


	tangentButtonClicked: function(e) {
		var $li = $(e.currentTarget),
			id = $li.attr('data-id')
			tanget = this.tangents[id];

		this.showTangentBox(tanget);
	},

	showTangentBox: function(tangent) {
		if(this.watching) this.video.pause();

		var template = _.template($('#template-tangent-popup-content').html());
		this.$tangentPopup.find('.tangent-popup-content').html(template(tangent));

		this.$tangentPopup.fadeIn(500);
	},

	hideTangentBox: function() {
		var that = this;
		this.$tangentPopup.fadeOut(500, function() {
			if(that.watching) that.video.play();
		});
	}

});


var TangentButtonView = Backbone.View.extend({

	options: {
		hoverSpeed: 250,
		slideDownSpeed: 2000
	},

	tagName: 'li',

	//The click event is handled in the PageView because it has direct access to pause the video
	events: {
		'mouseenter': 'openText',
		'mouseleave': 'closeText'
	},

	initialize: function(options) {
		this.tangent = options.tangent;
		this.canAnimateHover = false;

		this.$el.attr('data-id', options.i);
		this.render();
		this.$el.css({display: 'none', bottom: '2em'});
	},

	render: function() {
		this.$el.html('<img src="images/icon-' + this.tangent.icon + '.png" alt="' + this.tangent.moreInfoOn + '" /><span class="text">More info on <span class="topic">' + this.tangent.moreInfoOn + '</span></span>'); //This should be replaced by the template file (already in index.html)
		return this;
	},

	openText: function(customSpeed) {
		if(this.canAnimateHover) {
			var $text = this.$el.find('.text'),
				currentWidth = $text.width(),
				maxWidth = $text.stop(true).css('width', 'auto').width();

			$text.stop(true).css({width: currentWidth}).animate({width: maxWidth}, customSpeed || this.options.hoverSpeed);
		}
	},

	closeText: function(customSpeed) {
		if(this.canAnimateHover) {
			this.$el.find('.text').stop(true).animate({width: 0}, customSpeed || this.options.hoverSpeed);
		}
	},

	reveal: function() {
		var that = this;
		this.$el.css({display: ''}).animate({bottom: 0}, this.options.slideDownSpeed, function() {
			setTimeout(function() {
				that.canAnimateHover = true;
				that.closeText(2000);
			}, 5000)
		});
	}

});


/*------------------- View/Page Instances -------------------*/


var PageTitle = PageView.extend({

	options: {
		pageTemplate: 'template-title'
	},

	events: {
		'click .begin': 'begin'
	},

	render: function() {
		this.addTextShadow();
	},

	pageReady: function() {
		this.applyShadow();
	},

	addTextShadow: function() {
		var titleText = $('.main-title').html();

		$('.main-title').html('<div class="shadow">' + titleText + '</div><div class="top-text">' + titleText + '</div>');

		$('.main-title .shadow .words').html(function (i, html) {
			var chars = $.trim(html).split("");
			return '<span class="real-shadow-text">' + chars.join('</span><span class="real-shadow-text">') + '</span>';
		});

		this.applyShadow();
	},

	applyShadow: function() {
		$.fn.realshadow.reset();

		$('.page-title .real-shadow-text').realshadow({
			type: 'text',
			style: 'flat',
			// length: 40,
			color: '5,5,5',
			// color: '0,0,0'
		});
	},

	begin: function() {
		router.changePage('what-is-a-photon');
	}

});


var PageChapter0 = ChapterPageView.extend({

	options: {
		pageTemplate: 'template-prologue'
	},

	tangents: [
		{
			title: '"Theorised"',
			moreInfoOn: '"theorised"',
			time: 0.4,
			icon: 'bulb',
			templateID: 'tangent-theorised'
		},
		{
			title: 'Elementary Particles',
			moreInfoOn: 'elementary particles',
			time: 3,
			icon: 'particle',
			templateID: 'tangent-elementary-particles'
		},
		{
			title: 'The Four Fundamental Forces',
			moreInfoOn: 'the 4 fundamental forces',
			time: 7,
			icon: 'fundamental-force',
			templateID: 'tangent-fundamental-forces'
		},
		{
			title: 'The Double-Slit Experiment',
			moreInfoOn: 'the double-slit experiment',
			time: 15,
			icon: 'double-slit',
			templateID: 'tangent-double-slit'
		},
		{
			title: 'wavelength-frequency correlation',
			moreInfoOn: 'Wavelength-Frequency Correlation',
			time: 37,
			icon: 'wave',
			templateID: 'tangent-wavelength-frequency'
		}
	],

	subtitles: [
		[0.6, 2.2, 'Theorised by Albert Einstein'],
		[2.2, 4.9, 'photons are massless, elementary particles'],
		[4.9, 7, 'sometimes called "tiny packets of light"'],
		[7, 9.2, 'that carry the electromagnetic force'],
		[9.2, 12.1, 'Photons exhibit wave–particle duality'],
		[12.1, 14, 'which means it sometimes behaves like a wave'],
		[14, 16.1, 'and sometimes behaves like a particle'],
		[16.1, 17.2, 'For our purposes'],
		[17.2, 19.3, 'we will imagine our photons as particles'],
		[19.3, 21.5, 'and we can think of electromagnetic waves'],
		[21.5, 23.3, 'as a stream of particles'],
		[23.7, 25.9, 'Although commonly associated only with visible light'],
		[25.9, 27.7, 'they are also the particles involved'],
		[27.7, 30.8, 'with the transmission of the rest of the electromagnetic spectrum'],
		[30.8, 31.3, 'That is'],
		[31.3, 32, 'gamma rays'],
		[32, 32.4, 'x rays'],
		[32.4, 33.1, 'ultraviolet light'],
		[33.1, 33.8, 'infrared light'],
		[33.8, 34.4, 'microwaves'],
		[34.4, 35.5, 'and radio waves'],
		[35.9, 37.1, 'What differentiates these classes'],
		[37.1, 39.2, 'is their wavelength, or frequency'],
		[39.2, 40.1, 'For the most part'],
		[40.1, 43.4, 'we will stick to photons with a wavelength in the visible light range'],
		[43.4, 46.5, 'that\'s about 390 to 700 nanometres'],
		[46.7, 49.2, 'Sometimes called "electromagnetic radiation"'],
		[49.2, 53, 'photons are commonly emitted by natural and man-made processes'],
		[53, 54.7, 'like microwaves from mobile phones'],
		[54.7, 56.1, 'radio waves from radar'],
		[56.1, 58.7, 'and infrared light from warm-blooded organisms'],
		[58.7, 59.6, 'That\'s right'],
		[59.6, 62.6, 'you are emitting photons in the infrared range right now'],
		[62.6, 64, 'unless you\'re dead, of course']
	],

	events: {
	},

	render: function() {
	}

});


/*------------------- Routes -------------------*/

/*
The routes to the different pages. When the webpage is loaded, the correct route is selected using the URL
and the route object creates a new instance of the specific page object (and saves a globally-accessible reference).
This page object instance's superRender method is then called, which prints its template on the page.
*/

var globalRoutes = [
	//Name,  slug/link/route,  view
	['Home', /$/, PageTitle],
	['WhatIsAPhoton', 'what-is-a-photon', PageChapter0]
];


/*------------------- Routing -------------------*/


var Router = Backbone.Router.extend({

	currentPage: null,

	initialize: function() {
		for (var i = 0; i < globalRoutes.length; i++) {
			(function(that){
				var route = globalRoutes[i];

				that.route(route[1], route[0], function(args) {
					var newPage = new route[2](); //Creates a new instance of a specific page object. Its initialize method is called
					that.currentPage = newPage; //Saves a reference to the new page object
					newPage.superRender(); //Calls the page objects render method
				});
			})(this);
		}
	},

	routes: {}, //The routes are dynamically added using the globalRoutes variable

	//Intercepts every route change call
	execute: function(callback, args) {
		var that = this;

		$page.fadeOut(fadeSpeed, function() {
		// $page.velocity('fadeOut', { duration: fadeSpeed, complete: function() {

			if(that.currentPage) {
				that.currentPage.remove();
			}

			$page.html(''); //Clears all page content

			if (callback) callback.apply(that, args); //Applies the default behaviour

			$page.fadeIn(fadeSpeed, function() {
			// $page.velocity('fadeIn', { duration: fadeSpeed, complete: function() {
				if(that.currentPage) that.currentPage.pageReady(); //Calls the currently visible view once it has faded in
			});
		});
	},

	//Shortcut method
	changePage: function(url) {
		this.navigate(url, {trigger: true});
	}

});

var router = new Router();
Backbone.history.start();