Ext.define('Voyant.panel.DToC.MarkupBase', {
	TAG_SNIPPET_WORD_LENGTH: 10,
	
	savedTags: {}, // saved metadata for tags, organized by document 
	curatedTags: null, // curated tags list
	tagTotals: {}, // tracks tag freq counts for entire corpus
	
	tagStore: Ext.create('Ext.data.JsonStore', {
		fields: [
			{name: 'tagName', allowBlank: false},
			{name: 'label', allowBlank: false},
			{name: 'freq', type: 'int'},
			{name: 'type'}
		],
		sortInfo: {field: 'label', direction: 'ASC'}
    }),
	
	loadAllTags: function() {
//		console.log('loadAllTags');
		
		var currDocIndex = 0;
		
		var me = this;
		function doLoad(index) {
			if (index < me.getCorpus().getDocumentsCount()) {
				currDocIndex++;
				var id = me.getCorpus().getDocument(index).getId();
				me._doLoadTags(id, function() {
					me.updateTagTotals();
					doLoad(currDocIndex);
				});
			} else {
				me.updateTagTotals(true);
				me.getApplication().dispatchEvent('allTagsLoaded', me);
			}
		}
		
		doLoad(currDocIndex);
	},
	
	_doLoadTags: function(docId, callback) {
//		console.log('doLoadTags', docId);
		this._getDocumentXml(docId, function(xml) {
			var tagData = this._parseTags(xml, docId, this.curatedTags);
			this.saveTags(tagData, docId);
			if (callback) callback();
		}.createDelegate(this));
	},
	
	updateTagTotals: function(updateSelections) {
//		var sm = this.getComponent('tags').getSelectionModel();
		var selectedTagRecords = [];
		var data = [];
		for (var tag in this.tagTotals) {
//			var index = this.tagStore.findExact('tagName', tag);
			var match = null;
			this.tagStore.each(function(r) {
				if (r.get('tagName') === tag) {
					match = r;
					return false;
				}
			});
			var tagTotalsEntry = this.tagTotals[tag];
			var freq = tagTotalsEntry.freq || 1;
			if (tag == 'pb' || tag == 'docAuthor') {
//				console.log(tag, match);
			}
			if (match === null) {
				data.push({
					tagName: tag,
					label: tagTotalsEntry.label || tag,
					freq: freq,
					type: tagTotalsEntry.type
				});
			} else {
				var record = match;
				try {
					record.set('freq', freq);
					record.commit();
				} catch (e) {
//					console.log(record, e);
				}
//				if (updateSelections && sm.isSelected(record)) {
//					selectedTagRecords.push(record);
//				}
			}
		}
		this.tagStore.loadData(data, true);
		this.tagStore.sort('label', 'ASC');
//		if (updateSelections && sm.grid) sm.selectRecords(selectedTagRecords);
	},
	
	/**
	 * Converts store data to json that can be loaded by the store.
	 */
	exportTagData: function() {
		var jsonData = [];
		this.tagStore.each(function(rec) {
			var data = rec.data;
			if (data.tagName !== '') {
    			if (data.label === '') {
    			    data.label = data.tagName;
    			}
    			delete data.freq;
    			jsonData.push(data);
			}
		}, this);
		return jsonData;
	},
	
	saveTags: function(data, docId) {
		this.savedTags[docId] = data;

		// add tag freqs to totals
		for (var tagName in data) {
			var tagData = data[tagName];
			if (tagData != null) {
				if (this.tagTotals[tagName] == null) {
					this.tagTotals[tagName] = {
					    freq: tagData.length,
					    label: tagData[0].label,
					    type: tagData[0].type
					};
				} else {
					this.tagTotals[tagName].freq += tagData.length;
				}
			}
		}
	},
	
	showHitsForTags: Ext.emptyFn, // need to override this
	
	clearSelections: function() {
		this.getSelectionModel().deselectAll(true);
	},
	
	_getDocumentXml: function(docId, callback) {
		var params = {
			tool: 'corpus.DocumentTokens',
			corpus: this.getCorpus().getId(),
			docId: docId,
			template: 'docTokensPlusStructure2html',
			outputFormat: 'xml',
			limit: 0
		};
		Ext.Ajax.request({
           url: this.getTromboneUrl(),
           params: params,
           success: function(response, options) {
				if (callback) callback(response.responseXML);
           },
           scope: this
        });
	},
	
	/**
	 * Parses the tags in an xml document and gathers metadata.
	 * @param {Document} xml The xml document.
	 * @param {String} docId The id for the document.
	 * @param {Object} [customTagSet] An object containing a set of tags to look for, in the same format as curatedTags
	 * @returns The tag metadata.
	 */
	_parseTags: function(xml, docId, customTagSet) {
		var docBody = Ext.DomQuery.jsSelect('div[class="document"]', xml)[0];
		
		var shortRe = new RegExp('(([^\\s]+\\s\\s*){'+this.TAG_SNIPPET_WORD_LENGTH+'})(.*)'); // get first X words
		var prevRe = new RegExp('(.*)(\\s([^\\s]+\\s\\s*){'+Math.floor(this.TAG_SNIPPET_WORD_LENGTH/2)+'})'); // get last X words
		var nextRe = new RegExp('(([^\\s]+\\s\\s*){'+Math.floor(this.TAG_SNIPPET_WORD_LENGTH/2)+'})(.*)');
		
		function getText(tag) {
			var text = Ext.isIE ? tag.text : tag.textContent;
			text = text.replace(/\s+/g, ' '); // consolidate whitespace
			var shortText = text.replace(shortRe, "$1");
			return {content: shortText, shortened: shortText.length < text.length};
		}
		
		function getSurroundingText(tag) {
			function getPrevOrNextTag(currTag, isParent, isPrev) {
				if (currTag.nodeType <= 3) {
					var node = isPrev ? currTag.previousSibling : currTag.nextSibling;
					if (node == null) {
						return getPrevOrNextTag(currTag.parentNode, true, isPrev);
					} else if (isParent) {
						return node.nodeType == 3 ? node : (isPrev ? node.lastChild : node.firstChild);
					} else {
						return node;
					}
				} else {
					return null;
				}
			}
			
			function doGet(currTag, dir, currText) {
				var node = getPrevOrNextTag(currTag, false, dir == 'prev');
				if (node != null) {
					var text = Ext.isIE ? node.text : node.textContent;
					if (dir == 'prev') {
						currText = text + currText;
					} else {
						currText += text;
					}
					if (currText.length > 30) return currText;
					else return doGet(node, dir, currText);
				} else {
					return currText;
				}
			}
			
			var prevText = doGet(tag, 'prev', '');
			prevText = prevText.replace(prevRe, "$2");
			var nextText = doGet(tag, 'next', '');
			nextText = nextText.replace(nextRe, "$1"); 
			
			return [prevText, nextText];
		}
		
		function getXPathResults(xpath) {
			try {
//				var result = xml.evaluate(xpath, docBody, null, XPathResult.ANY_TYPE, null);
				var result = Ext.DomQuery.jsSelect(xpath, xml);
				return result;
			} catch(e) {
				return [];
			}
		}
		
		function produceTagData(tags, label) {
			var data = {};
			var tag, nodeName, dataObj, text, surrText;
			for (var i = 0; i < tags.length; i++) {
				tag = tags[i];
				nodeName = tag.nodeName;
				dataObj = {
					docId: docId,
					tagName: nodeName,
					label: label || nodeName,
					tokenId: tag.getAttribute('tokenid'),
					subtype: tag.getAttribute('subtype'),
					type: 't'
				};
				
				text = getText(tag);
				dataObj.text = text.content;
				
				if (text.shortened == false) {
					surrText = getSurroundingText(tag);
					dataObj.prevText = surrText[0];
					dataObj.nextText = surrText[1];
				} else {
					dataObj.text += '&hellip;';
				}
				
				// FIXME temp fix, title not allowed outside of head in html
				// see similar fix in docTokensPlusStructure2html.xsl
				if (nodeName == 'title') {
					dataObj.tagName = 'xmlTitle';
				} else if (nodeName == 'head') {
                    dataObj.tagName = 'xmlHead';
                }
				
				if (data[nodeName] == null) {
					data[nodeName] = [dataObj];
				} else {
					data[nodeName].push(dataObj);
				}
			}

			return data;
		}
		
		var returnData = {};
		if (customTagSet == null) {
			// no curation so parse all tags
			var tags = Ext.DomQuery.jsSelect('*', docBody);
			returnData = produceTagData(tags);
		} else {
			// find hits for curated tags only
			for (var tag in customTagSet) {
				var cTag = customTagSet[tag];
				if (cTag.type == 'x') {
					var data = {};
					var xpath = cTag.tagName;
					var results = getXPathResults(xpath);
					if (results.length > 0) {
						data[xpath] = [];
						var el, dataObj, text, surrText;
						for (var i = 0; i < results.length; i++) {
							var el = results[i];
							dataObj = {
								docId: docId,
								tagName: xpath,
								label: cTag.label,
								tokenId: el.getAttribute('tokenid'),
								subtype: el.getAttribute('subtype'),
								type: 'x'
							};
							
							text = getText(el);
							dataObj.text = text.content;
							
							if (text.shortened == false) {
								surrText = getSurroundingText(el);
								dataObj.prevText = surrText[0];
								dataObj.nextText = surrText[1];
							} else {
								dataObj.text += '&hellip;';
							}
							data[xpath].push(dataObj);
						}
					}
					Ext.apply(returnData, data);
				} else {
					var results = Ext.DomQuery.jsSelect(cTag.tagName, docBody);
					Ext.apply(returnData, produceTagData(results, cTag.label));
				}
			}
		}
		
		// process header
		var head = docBody.querySelectorAll('xmlHead').item(0);
		if (head) {
		    // special handling for TEI docs
			var authors = head.querySelectorAll('author');
			if (authors.length > 0) {
    			var authorsArray = [];
    			for (var i = 0; i < authors.length; i++) {
    				var author = authors.item(i);
    				var authorObj = {};
    				var updateAuthor = false;
    				
    				var forename = author.getElementsByTagName('forename').item(0);
    				var surname = author.getElementsByTagName('surname').item(0);
    				if (forename !== null) {
    				    authorObj.forename = Ext.isIE ? forename.text : forename.textContent;
    				    updateAuthor = true;
    				}
    				if (surname !== null) {
    				    authorObj.surname = Ext.isIE ? surname.text : surname.textContent;
    				    updateAuthor = true;
    				}
    				
    				if (updateAuthor) {
    				    authorsArray.push(authorObj);
    				}
    			}
    			if (authorsArray.length > 0) {
    			    this.getCorpus().getDocument(docId).record.set('author', authorsArray);
    			}
			}
			
			var reader = Ext.getCmp('dtcReader');
			if (reader.currentDocId == docId) {
				reader.setReaderTitle();
			}
		}
		
		if (this.getApplication().useIndex) {
			// find index items
			var dtcIndex = Ext.getCmp('dtcIndex');
			var indexIds = dtcIndex.indexIds;
			var idsToKeep = [];
			for (var id in indexIds) {
			    var hit;
			    try {
			        hit = docBody.querySelectorAll('*[*|id='+id+']').item(0);
			    } catch (e) {
			        if (window.console) {
			            console.log('bad ID', id);
			        }
			    }
				if (hit) {
					idsToKeep.push(id);
					indexIds[id] = {
						tokenId: hit.getAttribute('tokenid'),
						tag: hit.nodeName,
						docId: docId
					};
					
					var text = getText(hit);
					indexIds[id].text = text.content;
					
					if (text.shortened == false) {
						surrText = getSurroundingText(hit);
						indexIds[id].prevText = surrText[0];
						indexIds[id].nextText = surrText[1];
					} else {
						indexIds[id].text += '&hellip;';
					}
				}
			}
			dtcIndex.filterIndex(idsToKeep);
		}
		
		return returnData;
	}
});

Ext.define('Voyant.panel.DToC.Markup', {
	extend: 'Ext.grid.Panel',
	requires: [],
	mixins: ['Voyant.panel.DToC.MarkupBase', 'Voyant.panel.Panel'],
	alias: 'widget.dtocMarkup',
    config: {
    	corpus: undefined,
    	tokensStore: undefined
    },
    statics: {
    	i18n: {
    		title: {en: "Tags"}
    	},
        api: {
        }
    },
    
    constructor: function(config) {
        this.callParent(arguments);
    	this.mixins['Voyant.panel.Panel'].constructor.apply(this, arguments);
    	this.mixins['Voyant.panel.DToC.MarkupBase'].constructor.apply(this, arguments);

    },
    initComponent: function() {
        var me = this;
        
        me.setTokensStore(Ext.create("Voyant.data.store.Tokens", {
        	stripTags: 'NONE',
        	listeners: {
        		load: function(store, records, success) {
        			console.log(store, records);
        		},
        		scope: me
        	}
        }));
        
        Ext.apply(me, {
    		title: me.localize('title'),
            store : me.tagStore,
    		selModel: Ext.create('Ext.selection.RowModel', {
    			mode: 'MULTI',
                listeners: {
                    selectionchange: {
                    	fn: function(sm, selections) {
                    		this.handleSelections(selections);
                    	},
                    	scope: this
                    }
                }
            }),
            dockedItems: [{
                dock: 'top',
                xtype: 'toolbar',
                items: []
            }],
            hideHeaders: true,
    		columns: [
    		    {header: 'Label', dataIndex: 'label', flex: 1},
    		    {header: 'Freq', dataIndex: 'freq', align: 'right'}
    		]
        });
        
        me.callParent(arguments);
    },
    
    handleSelections: function(selections) {
	    var docIdFilter;
//	    this.getTopToolbar().getComponent('chapterFilter').menu.items.each(function(item) {
//	        if (item.checked) {
//	            docIdFilter = item.initialConfig.docId;
//	            return false;
//	        }
//	        return true;
//	    });
		var tags = [];
		for (var i = 0; i < selections.length; i++) {
			var sel = selections[i].data;
			if (docIdFilter !== undefined) {
			    var tagData = this.savedTags[docIdFilter][sel.tagName];
                if (tagData != null) {
                    tags.push(tagData);
                }
			} else {
    			for (var docId in this.savedTags) {
    				var tagData = this.savedTags[docId][sel.tagName];
    				if (tagData != null) {
    					tags.push(tagData);
    				}
    			}
			}
		}
		this.getApplication().dispatchEvent('tagsSelected', this, tags);
	},
    
	listeners: {
		afterrender: function(container) {
				
		},
		loadedCorpus: function(src, corpus) {
			this.setCorpus(corpus);
//			this.getTokensStore().setCorpus(corpus);
//			this.getTokensStore().load();
			
			this.loadAllTags();
		}
	}
});