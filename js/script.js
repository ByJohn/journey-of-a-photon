$(function() {

});



/*------------------- Views/Pages -------------------*/


var TitleScreen = Backbone.View.extend({
	el: '#page',
	render: function() {
		var template = _.template($('#template-title').html());
		this.$el.html(template);
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