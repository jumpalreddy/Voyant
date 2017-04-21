Ext.define('Voyant.util.CategoriesManager', {
	categories: undefined,
	constructor: function(config) {
		config = config || {};
		this.categories = {};
		if (config.categories !== undefined) {
			for (var key in config.categories) {
				var terms = config.categories[key];
				this.addTerms(key, terms);
			}
		}
	},
	getCategories: function() {
		return this.categories;
	},
	getCategory: function(name) {
		return this.categories[name];
	},
	addCategory: function(name) {
		if (this.categories[name] === undefined) {
			this.categories[name] = [];
		}
	},
	removeCategory: function(name) {
		delete this.categories[name];
	},
	addTerm: function(category, term) {
		this.addTerms(category, [term]);
	},
	addTerms: function(category, terms) {
		if (!Ext.isArray(terms)) {
			terms = [terms];
		}
		if (this.categories[category] === undefined) {
			this.addCategory(category);
		}
		for (var i = 0; i < terms.length; i++) {
			var term = terms[i];
			if (this.categories[category].indexOf(term) === -1) {
				this.categories[category].push(term);
			}
		}
	},
	removeTerm: function(category, term) {
		this.removeTerms(category, [term]);
	},
	removeTerms: function(category, terms) {
		if (!Ext.isArray(terms)) {
			terms = [terms];
		}
		if (this.categories[category] !== undefined) {
			for (var i = 0; i < terms.length; i++) {
				var term = terms[i];
				var index = this.categories[category].indexOf(term);
				if (index !== -1) {
					this.categories[category].splice(index, 1);
				}
			}
		}
	},
	getCategoryForTerm: function(term) {
		for (var category in this.categories) {
			if (this.categories[category].indexOf(term) != -1) {
				return category;
			}
		}
		return undefined;
	}
});
