/*
* By John Evans
* www.johnevans.co
*/

$(function() {
	// < IE9
	if(!Modernizr.csstransforms || !Modernizr.video) {
		alert('For the best experience, please use a more modern web browser, like Google Chrome or Mozilla Firefox.');
	}
});


/*------------------- Global Variables -------------------*/


var globalOptions = {
	$page: $('#page'),
	fadeSpeed: 500
};


/*------------------- Audio Player -------------------*/


var music = {

	$player: $('audio#music'),

	maxVolume: 0.2,

	initialize: function() {
		this.player = this.$player[0];
	},

	/* --- Basic start-stop controls --- */

	play: function() {
		this.player.play();
		return this;
	},

	pause: function() {
		this.player.pause();
		return this;
	},

	isPaused: function() {
		return this.player.paused;
	},

	/* --- Tracking --- */

	goTo: function(seconds) {
		if(this.player.readyState> 4) this.player.currentTime = seconds;
		else //console.log('Audio not ready');
		return this;
	},

	goToStart: function() {
		this.goTo(0);
		return this;
	},

	/* --- Volume --- */

	setVolume: function(val) {
		if(val > this.getMaxVolume()) val = this.getMaxVolume();

		this.player.volume = val;
		return this;
	},

	getVolume: function() {
		return this.player.volume;
	},

	/* --- Max volume --- */

	setMaxVolume: function(val) {
		this.maxVolume = val;
		if(this.getVolume() > val) this.fadeTo(val, 1000);
		return this;
	},

	getMaxVolume: function() {
		return this.maxVolume;
	},

	/* --- Fade controls --- */

	fadeTo: function(volume, speed, callback) {
		var vol = volume;
		if(vol > this.getMaxVolume()) vol = this.getMaxVolume();

		this.$player.animate({volume: vol}, speed, function() {
			if(typeof(callback) == 'function') callback();
		});
	},

	fadeIn: function(speed, callback) {
		this.fadeTo(this.getMaxVolume(), speed, function() {
			if(typeof(callback) == 'function') callback();
		});
	},

	fadeOut: function(speed, callback) {
		this.fadeTo(0, speed, function() {
			if(typeof(callback) == 'function') callback();
		});
	},

	/* --- Change song --- */

	changeSong: function(newSong) {
		var currentlyPlaying = !this.isPaused();

		this.player.src = 'audio/' + newSong + '.mp3';

		if(currentlyPlaying) this.play();

		return this;
	},

	changeSongSmooth: function(newSong, callback) {
		var fadeSpeed = 1000,
			that = this;
		this.fadeOut(fadeSpeed, function() {
			that.changeSong(newSong);
			that.fadeIn(fadeSpeed, function() {
				if(typeof(callback) == 'function') callback();
			});
		});
	}

};
music.initialize();


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

		if(this.options.music){
			if(music.isPaused()) {
				music.changeSong(this.options.music)
					.setVolume(0)
					.goToStart()
					.play()
					.fadeIn(2000);
			}
			else {
				music.changeSongSmooth(this.options.music);
			}
		}
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

		this.events['click button.replay'] = function() {
			that.replayButtonClicked();
		};

		this.events['click button.next'] = function() {
			that.nextButtonClicked();
		};

		this.events['click .tangent-items li'] = function(e) {
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
		this.$endVideo = $('.end-video');

		this.setupVideo();
	},

	playButtonClicked: function() {
		var that = this;
		// $('.chapter-title').velocity('fadeOut', { duration: globalOptions.fadeSpeed, complete: function() {
			$('.chapter-title').fadeOut(globalOptions.fadeSpeed, function() {
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

		// this.video.mute(); //Mutes the video while development is underway
		// this.video.controls(true);

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
		var $tangentsEndUL = $('.end-tangents ul');

		_.each(this.tangents, function(tangent) {
			tangent.buttonView = new TangentButtonView({tangent: tangent, i: i}); //Creates a tangent button view instance
			tangent.revealed = false;
			tangent.html = $('#' + tangent.templateID).html();

			$tangentsUL.append(tangent.buttonView.el); //Adds the tangent button to the <ul>

			$tangentsEndUL.append('<li data-id="' + i + '"><img src="images/icon-' + tangent.icon + '.png" alt="' + tangent.title + '" /><div class="title">' + tangent.title + '</div></li>'); //Adds the tangent end button to the end <ul>

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
		var that = this;
		this.video.pause();
		this.watching = false;
		this.$endVideo.delay(1000).fadeIn(globalOptions.fadeSpeed, function() {
			that.video.pause();
		});
	},

	replayButtonClicked: function() {
		this.watching = true;
		this.video.currentTime(0);
		this.video.play();
		this.$endVideo.delay(100).fadeOut(globalOptions.fadeSpeed);
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

		this.$tangentPopup.fadeIn(globalOptions.fadeSpeed);
	},

	hideTangentBox: function() {
		var that = this;
		this.$tangentPopup.fadeOut(globalOptions.fadeSpeed, function() {
			if(that.watching) that.video.play();
		});
	},


	nextButtonClicked: function() {
		router.changePage(this.options.nextPage);
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
		pageTemplate: 'template-title',
		// music: 'Hogan_Grip_-_04_-_Interlude_-_Reading_The_Greens'
		music: 'Chris_Zabriskie_-_08_-_Cylinder_Eight'
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


var PagePrologue = ChapterPageView.extend({

	options: {
		pageTemplate: 'template-prologue',
		music: 'Atomic Sight',
		nextPage: 'birth'
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
			title: 'Wavelength & Frequency',
			moreInfoOn: 'wavelength & frequency',
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


var PageBirth = ChapterPageView.extend({

	options: {
		pageTemplate: 'template-birth',
		music: 'Chris_Zabriskie_-_02_-_Cylinder_Two',
		nextPage: 'journey'
	},

	tangents: [
		{
			title: 'The Power of the Sun',
			moreInfoOn: 'the power of the sun',
			time: 32,
			icon: 'sun-power',
			templateID: 'tangent-sun-power'
		},
		{
			title: 'Visible Light',
			moreInfoOn: 'visible light',
			time: 68,
			icon: 'eye',
			templateID: 'tangent-visible-light'
		},
	],

	subtitles: [
		[0.2, 4, 'The sun is a huge sphere of gas, mostly made up of hydrogen'],
		[4, 8.5, 'Hydrogen also makes up 75% of the mass of the entire universe'],
		[8.5, 11.1, 'the remaining quarter is filled mostly by helium'],
		[11.5, 12.8, ' and then there\'s everything else'],
		[13, 18, 'The sun\'s diameter is 1,391,600 km wide'],
		[18, 20.6, 'about 109 times that of the Earth'],
		[20.9, 24.2, 'It also weights 333,000 times as much'],
		[24.8, 26.4, 'It is made up of three main layers'],
		[26.4, 30, 'the core, the radiative zone and the convection zone'],
		[30, 32.1, 'Its huge gravity pulls its mass inwards'],
		[32.1, 35.6, 'creating a vast amount of pressure at its core'],
		[35.6, 38.5, 'This immense pressure causes nuclear fusion to occur'],
		[38.5, 41.4, 'which produces helium, heat and photons'],
		[41.4, 44.9, 'The photons are usually of a high frequency, like gamma rays'],
		[44.9, 46.6, 'as they make their way to the surface'],
		[46.6, 50.5, 'However, they only get to move slightly before they are absorbed by an atom'],
		[50.5, 55, 'and then re-emitted with slightly less energy, so their frequency is decreased'],
		[55, 58.2, 'Although the photons are travelling at the speed of light between collisions'],
		[58.2, 61.1, 'due to the sun\'s density, their journey to the surface can take'],
		[61.1, 64.4, '10,000 to 100,000 years'],
		[64.4, 67.9, 'As they reach the surface of the sun, their frequency, or wavelength'],
		[67.9, 70.9, 'has decreased to now be within the visible light range'],
		[70.9, 74.2, 'The sun also emits a decent amount of infra-red radiation'],
		[74.2, 76.5, 'as well as other frequencies'],
		[76.5, 78.5, 'Now set free into the vacuum of space'],
		[78.5, 80, 'the next leg of their journey begins']
	],

	events: {
	},

	render: function() {
	}

});


var PageJourney = ChapterPageView.extend({

	options: {
		pageTemplate: 'template-journey',
		music: 'Chris_Zabriskie_-_03_-_Cylinder_Three',
		nextPage: 'destination'
	},

	tangents: [
		{
			title: 'The Speed of Light',
			moreInfoOn: 'the speed of light',
			time: 2,
			icon: 'wave',
			templateID: 'tangent-speed-of-light'
		},
		{
			title: 'c',
			moreInfoOn: 'c',
			time: 4.2,
			icon: 'c',
			templateID: 'tangent-c'
		},
	],

	subtitles: [
		[0.5, 3.6, 'Like anything with no mass, photons travel at the speed of light'],
		[3.6, 5, 'also called "c"'],
		[5, 7.9, 'which is about 300 million meters per second'],
		[7.9, 11.2, 'or 671 million miles per hour'],
		[11.2, 12.5, 'At this incredible speed'],
		[12.5, 15.9, 'a photon could travel around the Earth 7 times in 1 second'],
		[15.9, 19.3, 'and is 200,000 times faster than a bullet'],
		[19.3, 20.9, 'But on a galactic scale'],
		[20.9, 23.5, 'this universal speed limit is rather slow']
	],

	events: {
		'click .zoom-in' : 'zoomInClicked',
		'click .zoom-out' : 'zoomOutClicked',
		'click .journey-play' : 'journeyPlayClicked',
		'mousedown .time-slider' : 'timeSliderMouseDown',
		'mouseup .time-slider' : 'timeSliderMouseUp',
		'mousedown .journey-box .space' : 'spaceMouseDown',
		'mouseup .journey-box .space' : 'spaceMouseUp',
		'mousemove' : 'mouseMove',
		'mousewheel .space': 'mouseScroll',
		'DOMMouseScroll .space': 'mouseScroll'
	},

	space: {

		time: 0,
		timeGap: 500,
		maxTime: 500000, //It takes light, on average, 8 minutes 20 seconds (500 seconds) to reach earth
		paused: true,

		draggingSlider: false,

		draggingContainer: {
			mouseDown: false,
			mouseX: null,
			scrollLeft: null
		},

		currentZoomLevel: 0,
		zoomLevels: [
			100,
			500,
			1000,
			1500,
			2000,
			2500,
			3000,
			4000,
			5000,
			6000,
			7000,
			8000,
			9000,
			10000,
			15000,
			20000,
			30000,
			40000,
			50000,
			100000
		],

		reset: function() {
			var that = this;

			//Gets DOM elements
			this.$journeyBox = $('.journey-box');
			this.$container = $('.journey-box .container');
			this.$space = $('.journey-box .space');
			this.$spacePadding = $('.journey-box .space .padding');
			this.$light = $('.journey-box .body.light');
			this.$sun = $('.journey-box .body.sun');
			this.$play = $('.journey-box .journey-play');
			this.$timeSlider = $('.journey-box .time-slider');
			this.$zoomValue = $('.journey-box .zoom-value');
			this.$timeValue = $('.journey-box .time-value');
			this.$distanceValue = $('.journey-box .ruler .number.km');
			this.$lightDistanceValue = $('.journey-box .ruler .number.light-value');
			this.$lightDistanceMeasure = $('.journey-box .ruler .measure.light-measure');

			//Resets values
			this.setZoomLevel(0);
			this.time = 0;
			this.removeTimer();

			this.timer = setInterval(function() {
				that.tick();
			}, that.timeGap);

			this.play();
		},


		getZoomLevel: function() {
			return this.currentZoomLevel;
		},

		setZoomLevel: function(level, position) {
			position = typeof position !== 'undefined' ? position : ({
				mouseX: this.$container.outerWidth() / 2,
				spaceX: this.pixelsToSpaceUnits(this.$journeyBox.outerWidth() / 2)
			});

			var previousLevel = this.getZoomLevel();
			var currentXPos = position.spaceX;

			level = clamp(level, 0, this.zoomLevels.length - 1);

			this.$space.css('width', this.zoomLevels[level] + '%');

			this.currentZoomLevel = level;


			this.$zoomValue.html(this.zoomLevels[this.getZoomLevel()] + '%');
			this.$distanceValue.html( numberWithCommas(parseInt(149500000 / (this.zoomLevels[this.getZoomLevel()] / 100))) );

			var lightDistanceValue = 8.3 / (this.zoomLevels[this.getZoomLevel()] / 100),
				lightDistanceMeasure = 'Light minutes';

			if(lightDistanceValue < 1) {
				lightDistanceValue = Math.round((lightDistanceValue * 60) * 10) / 10;
				lightDistanceMeasure = 'Light seconds';
				if(lightDistanceValue == 1) lightDistanceMeasure = lightDistanceMeasure.substring(0, lightDistanceMeasure.length - 1); //Remove last ("s") character
			}

			this.$lightDistanceValue.html( Math.round(lightDistanceValue * 10) / 10 );
			this.$lightDistanceMeasure.html( lightDistanceMeasure );


			this.$journeyBox.attr('data-zoom-level', this.getZoomLevel());

			if(this.getZoomLevel() > 0) this.$journeyBox.addClass('zoomed-in');
			else this.$journeyBox.removeClass('zoomed-in');

			var levelChange = (this.zoomLevels[this.getZoomLevel()] / this.zoomLevels[previousLevel]);
			//this.scrollTo(this.$space.find('.venus').position().left + (this.$space.find('.venus').outerWidth() / 2) );
			
			this.scrollTo( ( currentXPos + (0) ) * levelChange - (this.getPaddingLeft() * 1), position.mouseX );
		},

		zoomIn: function(position) {
			this.setZoomLevel(this.getZoomLevel() + 1, position);
		},

		zoomOut: function(position) {
			this.setZoomLevel(this.getZoomLevel() - 1, position);
		},


		//Returns the generated left value of the space padding layer (auto-generated value because margin is left to "0 auto")
		getPaddingLeft: function() {
			return parseInt(this.$spacePadding.css('marginLeft').replace('px', ''));	
		},

		pixelsToSpaceUnits: function(x) {
			return x + this.$container.scrollLeft();
		},

		//Scrolls to a position so that it is in the centre of the view
		scrollTo: function(xPos, focusX) {
			focusX = typeof focusX !== 'undefined' ? focusX : ( this.$container.outerWidth() / 2 );

			var newScrollLeft = xPos - focusX + this.getPaddingLeft();

			// console.log('xPos:', xPos, 'newScrollLeft:', newScrollLeft);

			this.$container.stop(true).animate({
				scrollLeft: newScrollLeft
			}, 0);
		},


		removeTimer: function() {
			clearInterval(this.timer);
			delete this.timer;
		},

		play: function() {
			this.paused = false;
			this.$journeyBox.addClass('playing');
		},

		pause: function() {
			this.paused = true;
			this.$journeyBox.removeClass('playing');
		},

		togglePlay: function() {
			if(this.paused) this.play();
			else this.pause();
		},

		tick: function() {
			if(!this.paused && this.time < this.maxTime && !this.draggingSlider) {
				this.time += this.timeGap;
				this.updateSlider();
				this.updateTimeView();
				this.updateLight();
			}
		},

		updateSlider: function() {
			this.$timeSlider.val(Math.round(this.time / 1000) * 2);
		},

		updateTimeView: function() {
			var timeInSeconds = Math.round(this.time / 1000);
			var minutes = Math.floor(timeInSeconds / 60);
			var seconds = timeInSeconds - minutes * 60;

			this.$timeValue.html(('0'  + minutes).slice(-2)+':'+('0' + seconds).slice(-2));
		},

		updateLight: function() {
			this.$light.css('width', map(
				this.time,
				0,
				this.maxTime,
				0.930213904, //The percentage width of the sun
				200 //The percentage width at which it reaches earth
			) + '%');
		},


		setTimeFromSlider: function() {
			this.time = (parseInt(this.$timeSlider.val(), 10) / 2) * 1000;
			this.updateTimeView();
			this.updateLight();
		},

		timeSliderMouseDown: function() {
			this.draggingSlider = true;
			this.$journeyBox.addClass('dragging-slider');
		},

		timeSliderMouseUp: function() {
			this.draggingSlider = false;
			this.$journeyBox.removeClass('dragging-slider');
			this.setTimeFromSlider();
		},

		spaceMouseDown: function(e) {
			this.draggingContainer.mouseDown = true;
			this.$journeyBox.addClass('dragging-space');
			this.draggingContainer.mouseX = e.clientX;
			this.draggingContainer.scrollLeft = this.$container.scrollLeft();
		},

		spaceMouseUp: function(e) {
			this.draggingContainer.mouseDown = false;
			this.$journeyBox.removeClass('dragging-space');
		},

		mouseMove: function(e) {
			if(this.draggingSlider) {
				this.setTimeFromSlider();
			}
			if(this.draggingContainer.mouseDown){
				this.$container.scrollLeft(this.draggingContainer.scrollLeft + (this.draggingContainer.mouseX - e.clientX));
				// console.log(this.$container.scrollLeft(), this.draggingContainer.mouseX, e.clientX);
			}
			// console.log('MouseX:', e.originalEvent.clientX, 'paddingX:', this.pixelsToSpaceUnits(e.originalEvent.clientX));
		},


		mouseScroll: function(e) {
			var position = {
				mouseX: e.clientX || e.originalEvent.clientX,
				spaceX: this.pixelsToSpaceUnits(e.clientX || e.originalEvent.clientX),
			};

			if(e.originalEvent.detail > 0 || e.originalEvent.wheelDelta < 0) {
				//Out
				this.zoomOut(position);
				// console.log('position', e.clientX, 'scrollLeft', this.$container.scrollLeft());
			} else {
				//In
				//this.scrollTo(this.$space.find('.venus').position().left + (this.$space.find('.venus').outerWidth() / 2) );
				this.zoomIn(position);
				// this.scrollTo(this.pixelsToSpaceUnits(position));
			}
		}

	},

	initialize: function() {
		ChapterPageView.prototype.initialize.call(this);

		this.space.parentView = this;
	},

	render: function() {
	},

	pageReady: function() {
		ChapterPageView.prototype.pageReady.call(this);
	},

	videoEndEvent: function(e) {
		ChapterPageView.prototype.videoEndEvent.call(this);

		this.space.reset();
	},

	unload: function() {
		ChapterPageView.prototype.unload.call(this);

		this.space.removeTimer();
	},


	zoomInClicked: function(e) {
		this.space.zoomIn();
	},

	zoomOutClicked: function(e) {
		this.space.zoomOut();
	},


	journeyPlayClicked: function(e) {
		this.space.togglePlay();
	},

	timeSliderMouseDown: function(e) {
		this.space.timeSliderMouseDown();
	},

	timeSliderMouseUp: function(e) {
		this.space.timeSliderMouseUp();
	},

	spaceMouseDown: function(e) {
		this.space.spaceMouseDown(e);
	},

	spaceMouseUp: function(e) {
		this.space.spaceMouseUp(e);
	},

	mouseMove: function(e) {
		this.space.mouseMove(e);
	},

	mouseScroll: function(e) {
		this.space.mouseScroll(e);
	}

});


var PageDestination = ChapterPageView.extend({

	options: {
		pageTemplate: 'template-destination',
		music: 'Chris_Zabriskie_-_06_-_Cylinder_Six',
		nextPage: ''
	},

	tangents: [
		{
			title: 'Ozone',
			moreInfoOn: 'ozone',
			time: 11.7,
			icon: 'ozone',
			templateID: 'tangent-ozone'
		},
		{
			title: 'Why is the Sky Blue?',
			moreInfoOn: 'the blue sky',
			time: 15,
			icon: 'sky',
			templateID: 'tangent-blue-sky'
		},
		{
			title: 'Sources & Credits',
			moreInfoOn: 'sources',
			time: 999,
			icon: 'credits',
			templateID: 'tangent-sources'
		},
	],

	subtitles: [
		[0.5, 4.1, 'Light from the sun is made up of photons of many different frequencies'],
		[4.1, 8, 'most of which are in the visible light and infra-red bands'],
		[8, 11.7, 'The Earth\'s atmosphere blocks almost all of the dangerous frequencies produced'],
		[11.7, 13.6, 'only letting visible light through'],
		[13.6, 15.3, 'These visible colours, all together'],
		[15.3, 17.3, 'appear as white light'],
		[17.3, 19.4, 'This white light then hits objects'],
		[19.4, 23.1, 'whose surface absorbs some light frequencies, but reflect others'],
		[23.1, 25.3, 'The reflected photons then enter the eye'],
		[25.3, 26.4, 'smash into the retina'],
		[26.4, 29.8, 'and their energy is converted into electrical impulses'],
		[29.8, 33.6, 'which then get sent to the brain in order to process the image'],
		[33.6, 36, 'From the core of a star to the back of an eye'],
		[36, 38.2, 'over 150 million km'],
		[38.2, 40.3, 'and after 100,000 years'],
		[40.3, 42.1, 'the journey of a photon is over']
	],

	events: {
	},

	render: function() {
	}

});


var PageEnd = ChapterPageView.extend({

	options: {
		pageTemplate: 'template-end',
		music: 'Chris_Zabriskie_-_01_-_The_Temperature_of_the_Air_on_the_Bow_of_the_Kaleetan',
		nextPage: ''
	},

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
	//Name/ID,  slug/link/route,  view
	['Home', /$/, PageTitle],
	['WhatIsAPhoton', 'what-is-a-photon', PagePrologue],
	['Birth', 'birth', PageBirth],
	['Journey', 'journey', PageJourney],
	['Destination', 'destination', PageDestination]
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

		globalOptions.$page.fadeOut(globalOptions.fadeSpeed, function() {
		// globalOptions.$page.velocity('fadeOut', { duration: globalOptions.fadeSpeed, complete: function() {

			if(that.currentPage) {
				that.currentPage.remove();
			}

			globalOptions.$page.html(''); //Clears all page content

			if (callback) callback.apply(that, args); //Applies the default behaviour

			globalOptions.$page.fadeIn(globalOptions.fadeSpeed, function() {
			// globalOptions.$page.velocity('fadeIn', { duration: globalOptions.fadeSpeed, complete: function() {
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


/*------------------- Utility Functions -------------------*/


function clamp(num, min, max) {
	return Math.min(Math.max(num, min), max);
}

//Based on http://stackoverflow.com/a/23202637/528423
function map(value, in_min , in_max , out_min , out_max ) {
	return ( value - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
}

//Source: http://stackoverflow.com/a/2901298/528423
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}