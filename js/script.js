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

		this.events['click button.play'] = function() {
			that.playButtonClicked();
		};
	},

	unload: function() {
		PageView.prototype.unload.call(this);

		this.videoTag.removeEventListener('playing', this.videoPlayEvent, false );
		this.videoTag.removeEventListener('pause', this.videoPauseEvent, false );

		Popcorn.destroy(this.video);
	},

	superRender: function() {
		PageView.prototype.superRender.call(this); //Call the super/parent method

		//After render() is called

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

		this.videoTag.addEventListener('playing', this.videoPlayEvent, false );
		this.videoTag.addEventListener('pause', this.videoPauseEvent, false );

		this.queTangents();
		this.queSubtitles();
	},

	queTangents: function() {
		var that = this,
			$tagents = $('.tangents');
			
		$tagents.html('<ul></ul>');

		var $tangentsUL = $tagents.find('ul');

		_.each(this.tangents, function(tangent) {
			$tangentsUL.append('<li><img src="images/icon-' + tangent.icon + '.png" alt="' + tangent.moreInfoOn + '" /><span class="text">More info on <span class="topic">' + tangent.moreInfoOn + '</span></span></li>');
		});

		this.video.cue(5, function() {
			console.log('at 5 secs');
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

	videoPauseEvent: function(e) {
		$('.page').toggleClass('playing', false);
	},

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
			moreInfoOn: '"theorised"',
			time: 2,
			icon: 'bulb',
			template: 'tangent-theorised'
		},
		{
			moreInfoOn: 'elementary particles',
			time: 4.5,
			icon: 'particle',
			template: 'tangent-elementary-particles'
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