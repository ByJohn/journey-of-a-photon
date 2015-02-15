$(function() {

});



/*------------------- Views/Pages -------------------*/


var TitleScreen = Backbone.View.extend({

	el: '#page',

	events: {
		'click .begin': 'begin'
	},

	render: function() {
		var template = _.template($('#template-title').html());
		this.$el.html(template);

		var titleText = $('.main-title').html();

		$('.main-title').html('<div class="shadow">' + titleText + '</div><div class="top-text">' + titleText + '</div>');

		$('.main-title .shadow .words').html(function (i, html) {
			var chars = $.trim(html).split("");
			return '<span class="real-shadow-text">' + chars.join('</span><span class="real-shadow-text">') + '</span>';
		});

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
		console.log('begin');
	}

});


/*------------------- Routes -------------------*/


var globalRoutes = [
	//Name, slug/link/route, view
	['home', '', new TitleScreen()]
];


/*------------------- Routing -------------------*/


var Router = Backbone.Router.extend({

	initialize: function() {
		for (var i = 0; i < globalRoutes.length; i++) {
			var route = globalRoutes[i];

			this.route(route[1], route[0], function() {
				route[2].render();
			});
		}
	},

	routes: {} //The routes are dynamically added using the globalRoutes variable

});

var router = new Router();
Backbone.history.start();