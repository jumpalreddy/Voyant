Ext.define('Voyant.util.Toolable', {
	requires: ['Voyant.util.Localization'],
	statics: {
		i18n: {
			maximizeTip: {en: 'Open this tool in a new window'},
			plusTip: {en: 'Click to choose another tool for this panel location (this will replace the current tool).'},
			saveTip: {en: 'Export a URL, an embeddable tool, data or a bibliographic reference.'},
			gearTip: {en: 'Define options for this tool.'},
			helpTip: {en: 'No tool-specific help is currently available. Click this icon to visit the <a href="http://docs.voyant-tools.org/" target="_blank">Voyant Tools Documentation</a> site.'},
			exportTitle: {en: "Export"},
			exportViewUrl: {en: 'a URL for this view (tools and data)'},
			exportViewFieldset: {en: 'Export View (Tools and Data)'},
			exportViewHtmlEmbed: {en: "an HTML snippet for embedding this view in another web page"},
			exportViewHtmlEmbed: {en: "an HTML snippet for embedding this view in another web page"},
			exportViewEmbedTitle: {en: "Embed HTML Snippet"},
			exportViewEmbedMessage: {en: "You can copy and paste the HTML snippet from the box below into another web page. Note that some content management systems (like WordPress) may need a special plugin to handle &lt;iframe&gt; tags."},
			exportBiblioTitle: {en: "Export Bibliographic Reference"},
			exportViewBiblio: {en: "a bibliographic reference for this view"},
			exportGridCurrent: {en: "Export Current Data"},
			exportGridCurrentHtml: {en: "export current data as HTML"},
			exportGridCurrentJson: {en: "export current data as JSON"},
			exportGridCurrentTsv: {en: "export current data as tab separated values (text)"},
			'export': {en: 'Export'},
			exportTitle: {en: 'Export'},
			confirmTitle: {en: 'Confirm'},
			cancelTitle: {en: 'Cancel'},
			exportError: {en: "Export Error"},
			exportNoFunction: {en: "An export function has been defined by is not availble."},
			exportDataHtmlMessage: {en: "Copy the data below, they can be pasted into an HTML page or used as XML."},
			exportDataTsvMessage: {en: "Copy data below, they can be pasted into a spreadsheet or text file."},
			exportDataJsonMessage: {en: "Copy the data below, they can be used in other web-based applications."},
    		exportPng: {en: "export a PNG image of this visualization"},
			exportDataTitle: {en: "Export Data"},
			exportVizTitle: {en: "Export Visualization"},
			exportPngTitle: {en: "Export PNG"},
    		exportSvg: {en: "export the SVG of this visualization"},
			exportPngMessage: {en: "<p>This is a thumbnail of the PNG image, right-click or ctrl-click on the image to save a full-size copy on your hard drive.</p><p>Alternatively, copy the HTML code below.</p>"},
			exportSvgTitle: {en: "Export SVG"},
			exportSvgMessage: {en: "<p>This is a thumbnail of the SVG image, right-click or ctrl-click on the image to save a full-size copy on your hard drive.</p><p>Alternatively, copy the SVG code below.</p>"}
		}
	},
	constructor: function(config) {
		config = config || {};
		var me = this;
		var moreTools = undefined;
		var parent = this.up('component');
		if (config.moreTools) {
			moreTools = [];
			config.moreTools.forEach(function(xtype) {
				 if (xtype && xtype!=this.xtype) {
					moreTools.push(this.getMenuItemFromXtype(xtype));
				 }

			}, this)
		}
		else if (parent && parent.getInitialConfig('moreTools')) {
			moreTools = [];
			 parent.getInitialConfig('moreTools').forEach(function(xtype) {
				 if (xtype && xtype!=this.xtype) {
					moreTools.push(this.getMenuItemFromXtype(xtype));
				 }

			}, this)
		}
		if (moreTools && this.getApplication().getMoreTools) {
			moreTools.push("-");
		}
		if (this.getApplication().getMoreTools) {
			moreTools = moreTools || [];
			var app = this.getApplication();
			var tools = app.getMoreTools();
			tools.forEach(function(category) {
				var categories = [];
				category.items.forEach(function(subcategory) {
					var subcategories = [];
					subcategory.items.forEach(function(xtype) {
						subcategories.push(this.getMenuItemFromXtype(xtype))
					}, this)
					categories.push({
						text: app.localize(subcategory.i18n),
						glyph: subcategory.glyph,
						menu: {items: subcategories}
					})
				}, this);
				moreTools.push({
					text: app.localize(category.i18n),
					glyph: category.glyph,
					menu: {items: categories}
				})
			}, this);
		}			

		var exportItems = undefined;
		var toolsMap = {
//				maximize: {
//					glyph: 'xf08e@FontAwesome',
//					fn: this.maximizeToolClick
//				},
				save: {
					glyph: 'xf08e@FontAwesome',
					fn: this.exportToolClick,
					items: exportItems
				},
				plus: moreTools ? {
					glyph: 'xf17a@FontAwesome',
					items: moreTools
				} : undefined,
				gear: this.showOptionsClick || this.getOptions ? {
					glyph: 'xf205@FontAwesome',
					fn: this.showOptionsClick ? this.showOptionsClick : function(panel) {
						// we're here because the panel hasn't overridden the click function
						Ext.create('Ext.window.Window', {
							title: panel.localize("exportTitle"),
							modal: true,
			            	panel: panel,
							items: {
								xtype: 'form',
								items: panel.getOptions(),
								buttons: [{
					            	text: panel.localize("confirmTitle"),
									glyph: 'xf00c@FontAwesome',
					            	flex: 1,
					            	panel: panel,
					        		handler: function(btn) {
					        			var values = btn.up('form').getValues();
					        			this.setApiParams(values);
					        			var app = this.getApplication();
					        			var corpus = app.getCorpus();
					        			if (corpus) {
					        				app.dispatchEvent("loadedCorpus", this, corpus);
					        			}
					        			else {
					        				this.fireEvent("apiChange", this);
					        			}
					        			btn.up('window').close();
					        		},
					        		scope: panel
					            }, {
					            	text: panel.localize("cancelTitle"),
					                glyph: 'xf00d@FontAwesome',
					        		flex: 1,
					        		handler: function(btn) {
					        			btn.up('window').close();
					        		}
								}]
							},
							bodyPadding: 5
						}).show()
					}
				} : undefined,
				help: {
					glyph: 'xf128@FontAwesome',
					fn: this.helpToolClick
				}
		}
		var tools = [];
		for (var tool in toolsMap) {
			if (config.includeTools && !config.includeTools[tool] || !toolsMap[tool]) {continue}
			tools.push({
				type: tool,
				tooltip: this.localize(tool+"Tip"),
				callback: toolsMap[tool].fn,
				xtype: 'toolmenu',
				glyph: toolsMap[tool].glyph,
				items: toolsMap[tool].items
			})
		}
		Ext.apply(this, {
			tools: tools
		})
		this.on("afterrender", function() {
			var header = this.getHeader();
			if (header) {
				var el = header.getEl();
				el.on("mouseover", function() {
					this.getHeader().getTools().forEach(function(tool) {
						tool.show();
					})
				}, this);
				el.on("mouseout", function() {
					this.getHeader().getTools().forEach(function(tool) {
						if (tool.type!='help' && tool.type.indexOf('collapse')==-1) {tool.hide();}
					})
				}, this);
				header.getTools().forEach(function(tool,i) {
					if (tool.type!='help') {tool.hide();}
				});
			}
		}, this)
	},
	getMenuItemFromXtype: function(xtype) {
		var xt = xtype;
		var config = this.getApplication().getToolConfigFromToolXtype(xtype);
		return Ext.apply(Ext.clone(config), {
			xtype: 'menuitem',
			text: config.title,
			textAlign: 'left',
			handler: function() {this.replacePanel(config.xtype)},
			scope: this
		})
	},
	maximizeToolClick: function(panel) {
		var name = Ext.getClass(panel).getName();
		var parts = name.split(".");
		url = panel.getBaseUrl()+"tool/"+parts[parts.length-1]+"/";
		params = panel.getModifiedApiParams();
		if (!params.corpus && panel.getCorpus && panel.getCorpus()) {
			params.corpus = panel.getCorpus().getId();
		}
		if (params) {url += "?"+Ext.Object.toQueryString(params);}
		panel.openUrl(url);
	},
	exportToolClick: function(panel) {
		var items = [{
	       		xtype: 'radio',
	       		name: 'export',
	       		inputValue: 'url',
	       		boxLabel: "<a href='"+panel.getExportUrl.call(panel)+"' target='_blank'>"+panel.localize('exportViewUrl')+"</a>",
	       		checked: true
		},{
	       xtype: 'fieldset',
	       collapsible: true,
	       collapsed: true,
	       title: panel.localize('exportViewFieldset'),
	       items: [{
	       		xtype: 'radio',
	       		name: 'export',
	       		inputValue: 'embed',
	       		boxLabel: panel.localize('exportViewHtmlEmbed')
	       	},{
	       		xtype: 'radio',
	       		name: 'export',
	       		inputValue: 'biblio',
	       		boxLabel: panel.localize('exportViewBiblio')
	       	}]
		}]
		if (panel.isXType('grid')) {
			items.push({
		       xtype: 'fieldset',
		       collapsible: true,
		       collapsed: true,
		       title: panel.localize('exportGridCurrent'),
	    	   items: [{
		       		xtype: 'radio',
		       		name: 'export',
		       		inputValue: 'gridCurrentHtml',
		       		boxLabel: panel.localize('exportGridCurrentHtml')
	    	   },{
		       		xtype: 'radio',
		       		name: 'export',
		       		inputValue: 'gridCurrentTsv',
		       		boxLabel: panel.localize('exportGridCurrentTsv')
	    	  	},{
		       		xtype: 'radio',
		       		name: 'export',
		       		inputValue: 'gridCurrentJson',
		       		boxLabel: panel.localize('exportGridCurrentJson')
	    	   }]
			})
		}
		if ((!panel.getExportVisualization || panel.getExportVisualization()) && (panel.down("chart") || panel.getTargetEl().dom.querySelector("canvas") || panel.getTargetEl().dom.querySelector("svg"))) {
			var formats = [{
				xtype: 'radio',
				name: 'export',
				inputValue: 'png',
				boxLabel: panel.localize('exportPng')
	    	}];
			if (panel.getTargetEl().dom.querySelector("svg")) {
				formats.push({
					xtype: 'radio',
					name: 'export',
					inputValue: 'svg',
					boxLabel: panel.localize('exportSvg')
				})
			}
			items.push({
			       xtype: 'fieldset',
			       collapsible: true,
			       collapsed: true,
			       title: panel.localize('exportVizTitle'),
		    	   items: formats
	    	});
		}
		Ext.create('Ext.window.Window', {
			title: panel.localize("exportTitle"),
			modal: true,
			items: {
				xtype: 'form',
				items: items,
				buttons: [{
	            	text: panel.localize("exportTitle"),
					glyph: 'xf08e@FontAwesome',
	            	flex: 1,
	            	panel: panel,
	        		handler: function(btn) {
	        			var form = btn.up('form');
	        			var fn = 'export'+Ext.String.capitalize(form.getValues().export);
	        			if (Ext.isFunction(panel[fn])) {
	        				panel[fn].call(panel, panel, form)
	        			}
	        			else {
	        				Ext.Msg.show({
	        				    title: panel.localize('exportError'),
	        				    message: panel.localize('exportNoFunction'),
	        				    buttons: Ext.Msg.OK,
	        				    icon: Ext.Msg.ERROR
	        				});
	        			}
	        			btn.up('window').close();
	        		},
	        		scope: panel
	            }, {
	            	text: panel.localize("cancelTitle"),
	                glyph: 'xf00d@FontAwesome',
	        		flex: 1,
	        		handler: function(btn) {
	        			btn.up('window').close();
	        		}
				}]
			},
			bodyPadding: 5
		}).show()
	},
	exportSvg: function(img) {
		var svg = this.getTargetEl().dom.querySelector("svg");
		if (svg) {
			var html = d3.select(svg)
				.attr("version", 1.1)
				.attr("xmlns", "http://www.w3.org/2000/svg")
				.node().parentNode.innerHTML
			Ext.Msg.show({
			    title: this.localize('exportSvgTitle'),
			    message: '<img src="'+'data:image/svg+xml;base64,'+ btoa(html)+'" style="float: right; max-width: 200px; max-height: 200px; border: thin dotted #ccc;"/>'+this.localize('exportSvgMessage'),
			    buttons: Ext.Msg.OK,
			    icon: Ext.Msg.INFO,
			    prompt: true,
		        multiline: true,
		        value: html
			});		
		}
	},
	exportPngData: function(img) {
		Ext.Msg.show({
		    title: this.localize('exportPngTitle'),
		    message: '<img src="'+img+'" style="float: right; max-width: 200px; max-height: 200px; border: thin dotted #ccc;"/>'+this.localize('exportPngMessage'),
		    buttons: Ext.Msg.OK,
		    icon: Ext.Msg.INFO,
		    prompt: true,
	        multiline: true,
	        value: '<img src="'+img+'" />'
		});		
	},
	exportPng: function() {
		var img;
		var chart = this.down('chart'); // first try finding a chart
		if (chart) {
			return this.exportPngData(this.down('chart').getImage().data);
		}

		var canvas = this.getTargetEl().dom.querySelector("canvas"); // next try finding a canvas
		if (canvas) {
			return this.exportPngData(canvas.toDataURL("image/png"));
		}
		
		
		var svg = this.getTargetEl().dom.querySelector("svg"); // finally try finding an SVG
		if (svg) {
			var html = d3.select(svg)
				.attr("version", 1.1)
				.attr("xmlns", "http://www.w3.org/2000/svg")
				.node().parentNode.innerHTML;
			  img = 'data:image/svg+xml;base64,'+ btoa(html);
			  
			  var canvas = Ext.DomHelper.createDom({tag:'canvas',width: svg.offsetWidth,height:svg.offsetHeight}),
			  context = canvas.getContext("2d"), me=this;
			  
			  var image = new Image;
			  image.src = img;
			  image.panel = this;
			  image.onload = function() {
				  context.drawImage(image, 0, 0);
				  img = canvas.toDataURL("image/png");
				  return this.panel.exportPngData.call(this.panel, img);
			  };
		}
	},
	exportUrl: function() {
		this.openUrl(this.getExportUrl());
	},
	exportEmbed: function() {
		Ext.Msg.show({
		    title: this.localize('exportViewEmbedTitle'),
		    message: this.localize('exportViewEmbedMessage'),
		    buttons: Ext.Msg.OK,
		    icon: Ext.Msg.INFO,
		    prompt: true,
	        multiline: true,
	        value: "<!--	Exported from Voyant Tools: http://voyant-tools.org/.\n"+
	        	"Please note that this is an early version and the API may change.\n"+
	        	"Feel free to change the height and width values below: -->\n"+
	        	"<iframe style='width: 100%; height: 800px' src='"+this.getExportUrl()+"'></iframe>"
		});
	},
	exportBiblio: function() {
		var date = new Date();
		Ext.Msg.show({
		    title: this.localize('exportBiblioTitle'),
		    message: '<fieldset><legend>MLA</legend>'+
	    	'Sinclair, Stéfan and Geoffrey Rockwell. '+(this.isXType('voyantheader') ? '' : '"'+this.localize('title')+'." ')+
	    	'<i>Voyant Tools</i>. '+Ext.Date.format(date,'Y')+'. Web. '+Ext.Date.format(date,'j M Y')+'. &lt;http://voyant-tools.org&gt;.</fieldset>'+
	    	'<br >'+
	    	'<fieldset><legend>Chicago</legend>'+
	    	'Stéfan Sinclair and Geoffrey Rockwell, '+(this.isXType('voyantheader') ? '' : '"'+this.localize('title')+'", ')+
	    	'<i>Voyant Tools</i>, accessed '+Ext.Date.format(date,'F j, Y')+', http://voyant-tools.org.</fieldset>'+
	    	'<br >'+
	    	'<fieldset><legend>APA</legend>'+
	    	'Sinclair, S. &amp; G. Rockwell. ('+Ext.Date.format(date,'Y')+"). "+(this.isXType('voyantheader') ? '' : this.localize('title')+'. ')+
	    	'<i>Voyant Tools</i>. Retrieved '+Ext.Date.format(date,'F j, Y')+', from http://voyant-tools.org</fieldset>',
		    buttons: Ext.Msg.OK,
		    icon: Ext.Msg.INFO
		});
	},
	exportGridCurrentJson: function(grid, form) {
		var store = grid.getStore();
		var fields = store.getFields();
		var value = "<table>\n\t<thead>\n\t\t<tr>\n";
		var visibleColumns = grid.getColumnManager().headerCt.getVisibleGridColumns();
		values = [];
		grid.getStore().each(function(row) {
			var val = {};
			visibleColumns.forEach(function(column) {
				val[column.text] = row.get(column.dataIndex);
			})
			values.push(val);
		});
		Ext.Msg.show({
		    title: this.localize('exportDataTitle'),
		    message: this.localize('exportDataJsonMessage'),
		    buttons: Ext.Msg.OK,
		    icon: Ext.Msg.INFO,
		    prompt: true,
	        multiline: true,
	        value: Ext.encode(values)
		});
	},
	exportGridCurrentTsv: function(grid, form) {
		var store = grid.getStore();
		var fields = store.getFields();
		var visibleColumns = grid.getColumnManager().headerCt.getVisibleGridColumns();
		var fields = [];
		visibleColumns.forEach(function(column) {
			fields.push(column.text);
		})
		var value = fields.join("\t")+"\n";
		grid.getStore().each(function(row) {
			cells = [];
			visibleColumns.forEach(function(column) {
				var val = row.get(column.dataIndex);
				if (Ext.isString(val)) {
					val = val.replace(/\s+/g,' '); // get rid of multiple whitespace (including newlines and tabs)
				}
				cells.push(val)
			})
			value += cells.join("\t")+"\n";
		});
		Ext.Msg.show({
		    title: this.localize('exportDataTitle'),
		    message: this.localize('exportDataTsvMessage'),
		    buttons: Ext.Msg.OK,
		    icon: Ext.Msg.INFO,
		    prompt: true,
	        multiline: true,
	        value: value
		});
	},
	exportGridCurrentHtml: function(grid, form) {
		var store = grid.getStore();
		var fields = store.getFields();
		var value = "<table>\n\t<thead>\n\t\t<tr>\n";
		var visibleColumns = grid.getColumnManager().headerCt.getVisibleGridColumns();
		visibleColumns.forEach(function(column) {
			value+="\t\t\t<td>"+column.text+"</td>\n";
		})
		value+="\t\t</tr>\n\t</thead>\n\t<tbody>\n"
		grid.getStore().each(function(row) {
			value+="\t\t<tr>\n"
			visibleColumns.forEach(function(column) {
				var val = row.get(column.dataIndex);
				if (Ext.isString(val)) {
					val = val.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&lg;')
				}
				value+="\t\t\t<td>"+val+"</td>\n";
			})
			value+="\t\t</tr>\n";
		});
		value+="\t</tbody>\n</table>";
		Ext.Msg.show({
		    title: this.localize('exportDataTitle'),
		    message: this.localize('exportDataHtmlMessage'),
		    buttons: Ext.Msg.OK,
		    icon: Ext.Msg.INFO,
		    prompt: true,
	        multiline: true,
	        value: value
		});
	},
	getExportUrl: function() {
		var api = this.getModifiedApiParams();
		if (this.isXType('voyantheader')) {api.view=Ext.getClassName(this).split(".").pop()}
		return this.getApplication().getBaseUrl()+'?corpus='+this.getApplication().getCorpus().getId()+"&"+Ext.Object.toQueryString(this.getModifiedApiParams());
	},
	helpToolClick: function(panel) {
		var help = panel.localize('help', {default: false}) || panel.localize('helpTip');
		if (help==panel._localizeClass(Ext.ClassManager.get("Voyant.util.Toolable"), "helpTip")) {
			panel.openUrl( "http://docs.voyant-tools.org/");
		}
		else {
			Ext.Msg.alert(panel.localize('title'), help)
		}
	},
	replacePanel: function(xtype) {
		var corpus = this.getApplication().getCorpus();
		var config = this.getInitialConfig();
		var parent;
		if (this.isXType('voyantheader') && this.getApplication().getViewComponent) {
			parent = this.getApplication().getViewComponent();
			parent.removeAll(true);
			var newTool = parent.add({xtype: xtype});
			if (corpus) {
				this.getApplication().dispatchEvent("loadedCorpus", parent, corpus);
			}
		}
		else {
			parent = this.isXType('voyantheader') && this.getApplication().getViewComponent ? this.getApplication().getViewComponent() : this.up("component");
			parent.remove(this, true);
			var newTool = parent.add({xtype: xtype, });
			if (corpus) {
				newTool.fireEvent("loadedCorpus", newTool, corpus)
			}
		}
	}
});

// from http://www.sencha.com/forum/showthread.php?281658-add-dropdown-menu-to-panel-tool&p=1054579&viewfull=1#post1054579
// and http://www.sencha.com/forum/showthread.php?281953-Glyphs-in-panel-tool&p=1068934&viewfull=1#post1068934

Ext.define('Voyant.util.ToolMenu', {
    extend: 'Ext.panel.Tool',
    alias: 'widget.toolmenu',
    renderTpl: ['<div class="x-menu-tool-hover">' + '</div>'+
            '<tpl if="glyph">' + 
            '<span id="{id}-toolEl" class="{baseCls}-glyph {childElCls}" role="presentation" style="font-family: {glyphFontFamily}">&#{glyph}</span>' + 
            '<tpl else>' + 
            '<img id="{id}-toolEl" src="{blank}" class="{baseCls}-img {baseCls}-{type}' + '{childElCls}" role="presentation"/>' + 
            '</tpl>'],
    privates: {
        onClick: function() {
            var me = this,
            returnValue = me.callParent(arguments);


            if (returnValue && me.items) {
                if (!me.toolMenu) {
                    me.toolMenu = new Ext.menu.Menu({
                        items: me.items
                    });
                }
                me.toolMenu.showAt(0, 0);
                me.toolMenu.showAt(me.getX() + me.getWidth() - me.toolMenu.getWidth(), me.getY() + me.getHeight() + 10);
            }


            return returnValue;
        },
        onDestroy: function() {
            Ext.destroyMembers(this, 'toolMenu'); //destructor
            this.callParent();
        }
    },   
	initComponent: function() {
	    var me = this;
	    me.callParent(arguments);
	
	    var glyph, glyphParts, glyphFontFamily;
	    glyph = me.glyph || 'xf12e@FontAwesome';
	
	    if (glyph) {
	        if (typeof glyph === 'string') {
	            glyphParts = glyph.split('@');
	            glyph = glyphParts[0];
	            glyphFontFamily = glyphParts[1];
	        } else {
	            glyphFontFamily = 'FontAwesome';
	        }
	
	
	        Ext.applyIf(me.renderData, {
	            baseCls: me.baseCls,
	            blank: Ext.BLANK_IMAGE_URL,
	            type: me.type,
	            glyph: glyph,
	            glyphFontFamily: glyphFontFamily
	        });
	    }
	}

});