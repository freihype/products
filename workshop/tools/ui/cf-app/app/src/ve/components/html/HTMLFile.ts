import { HTMLElement, CSSImport, HTMLParser, CSSFile, HTMLItem, Model, Path, CSSSelector } from './';

export class HTMLFile extends HTMLItem {

    errors: any;
    _styleElem: any;
    _loadedCSS: {};
    url: any;
    fileName: any;
    constructor(fileName) {
        super();
        this.fileName = fileName;
        this.url = fileName;
        this.elementType = 'HTMLFile';
        this._loadedCSS = {};
        this._styleElem = null;
    }

    save(isWorkingCopy) {
        /*
        let deferred;
        const file = system.resource.findResource(this.fileName);

        const text2 = this.getText();
        console.log('HTMLFile::save! ', text2);
        if (file) {
            const text = this.getText();
            deferred = file.setContents(text, isWorkingCopy);
        } else {
            console.error('couldnt find file in resources : ' + this.fileName);
        }
        return deferred;
        */
    }

    getText(context?: any) {
        context = context || {};
        context.indent = 0;
        let s = '';

        this.children.forEach(child => {
            s = s + child.getText(context);
            if (child.elementType == 'HTMLComment') {
                s = s + this._addWS(child._fmLine, child._fmIndent);
            }
        });

        return s;
    }

    getDocumentElement(context?: any) {
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].tag == 'html') {
                return this.children[i];
            }
        }

    }

    findElement(id) {
        const documentElement = this.getDocumentElement();
        if (documentElement) {
            return documentElement.findElement(id);
        }
    }

    getMatchingRules(domElement, returnMatchLevels) {

        const visitor = {
            visit(node) {
                if (node.elementType == 'CSSFile') {

                    const m = [];
                    const newRules = node.getMatchingRules(domElement, [], m);

                    for (let i = 0; i < newRules.length; i++) {
                        for (let j = 0; j < this.matchLevels.length; j++) {
                            if (m[i] > this.matchLevels[j]) {
                                this.matchLevels.splice(j, 0, m[i]);
                                this.rules.splice(j, 0, newRules[i]);
                                break;
                            }
                        }
                    }

                    if (this.rules.length == 0) {
                        this.rules = newRules;
                        this.matchLevels = m;
                    }

                    return true;
                }
                return false;
            },
            matchLevels: [],
            rules: []
        };
        this.visit(visitor);
        if (returnMatchLevels) {
            return {
                // tslint:disable-next-line:object-literal-key-quotes
                'rules': visitor.rules,
                // tslint:disable-next-line:object-literal-key-quotes
                'matchLevels': visitor.matchLevels

            };
        } else {
            return visitor.rules;
        }
    }

    getRule(selector) {
        if (!selector) {
            return [];
        }
        const selectors = CSSSelector.parseSelectors(selector);
        const visitor = {
            visit(node) {
                if (node.elementType == 'CSSFile') {
                    const newRules = node.getRule(selectors);
                    this.rules = this.rules.concat(newRules || []);
                    return true;
                }
                return false;
            },
            rules: []
        };
        this.visit(visitor);
        return visitor.rules;
    }

    setText(text, noImport) {
        // clear the singletons in the Factory
        this.visit({
            visit(node) {
                if (node.elementType == 'CSSImport') {
                    node.close();
                }
            }
        });
        // clear cached values
        this.children = [];
        this._styleElem = null;
        //ximpl.
        let result = HTMLParser.parse(text || '', this);
        let formattedHTML = '';
        if (!noImport && result.errors.length == 0) {
            // the input html may have extraneous whitespace which is thrown away by our formatting
            // reparse the html on the source as formatted by us, so positions are correct
            formattedHTML = this.getText();
            this.children = [];
            result = HTMLParser.parse(formattedHTML, this);
        }

        // this.reportPositions();
        this.endOffset = result.endOffset;
        this.errors = result.errors;
        const htmlmodel = this;
        if (!noImport) {
            this.visit({
                visit(node) {
                    if (node.elementType == 'CSSImport') {
                        if (!node.cssFile) {
                            node.load(true);
                            //ximpl.
                            //dojo.connect(node.cssFile, 'onChange', null, dojo.hitch(htmlmodel,
                            //    'onChange'));
                        }
                    }

                }
            });
        }
        this.onChange();
    }

    hasStyleSheet(url) {
        const imports = this.find({ elementType: 'CSSImport' });
        for (let i = 0; i < imports.length; i++) {
            if (imports[i].url == url) { return true; }
        }
        return false;
    }

    addStyleSheet(url, content, dontLoad, beforeChild, loader) {
        let path = new Path(this.url || this.fileName);
        path = path.getParentPath().append(url);
        const absUrl = path.toString();
        // create CSS File model
        // tslint:disable-next-line:indent
		/*
		 * this is redundant, sort of.  the file is loaded once, then cached.. then the import loads the file again.
		 * theres got to be a better way of doing this...  all the loading should happen in the CSSImport class.
		 *
		 */
        if (!dontLoad) {
            // have to use the require or we get a circular dependency
            /*
            this._loadedCSS[absUrl] = require('davinci/model/Factory').getModel({
                url: absUrl,
                includeImports: true,
                loader: loader
            });*/
        }
        if (content) {
            this._loadedCSS[absUrl].setText(content);
        }

        this.onChange();

        // add CSS link to HTML
        //  XXX This isn't yet supported.  Instead, add an "@import" inside of a "<style>" element in
        //  the head.
        //  var link = new HTMLElement('link');
        //  link.addAttribute('rel', 'stylesheet');
        //  link.addAttribute('type', 'text/css');
        //  link.addAttribute('href', url);
        //  this.getDocumentElement().getChildElement('head').addChild(link);
        if (!this._styleElem) {
            const head = this.find({ elementType: 'HTMLElement', tag: 'head' }, true);
            let style = head.getChildElement('style');
            if (!style) {
                style = new HTMLElement('style');
                head.addChild(style);
            }
            this._styleElem = style;
        }
        const css = new CSSImport();
        css.parent = this;
        css.url = url;
        if (beforeChild) {
            this._styleElem.insertBefore(css, beforeChild);
        } else {
            this._styleElem.addChild(css);
        }
        if (!dontLoad) {
            css.load(true);
        }

    }

    close() {
        this.visit({
            visit(node) {
                if (node.elementType == 'CSSImport') {
                    node.close();
                }
            }
        });
        //ximpl.
        //require('davinci/model/Factory').closeModel(this);
    }

    getLabel() {
        return '<>';
    }

    getID() {
        return this.fileName;
    }

    updatePositions(startOffset, delta) {
        new Model(this).updatePositions(this, startOffset, delta);
        this.visit({
            visit(element) {
                if (element.endOffset < startOffset) { return true; }
                if (element.elementType == 'HTMLElement' && element.startTagOffset > startOffset) {
                    element.startTagOffset += delta;
                }
            }
        });
    }
    /*
	 * The PageEditor uses the HTML model as its base model. However,
	 * the visual editor aspect of the PageEditor injects temporary
	 * runtime content into the model which skews offsets. When in
	 * split view we need to correct the model element positions by
	 * removing temporary content length from rendered content length.
	 */
    mapPositions(element) {
        const s = this.getText();
        const et = element.getText();
        const start = s.indexOf(et);
        const end = start + et.lastIndexOf('>') + 1;
        return { startOffset: start, endOffset: end };
    }

    reportPositions() {
        this.visit({
            visit(element) {
                if (element.elementType == 'HTMLElement') {
                    console.log('<' + element.tag + '> ' + element.startOffset + ' -> ' + element.startTagOffset + ' -> ' + element.endOffset);
                } else if (element.elementType == 'HTMLAttribute') {
                    console.log('   ' + element.name + '= ' + element.value + ':: -> ' + element.startOffset + ' -> ' + element.endOffset);
                }
            }
        });
    }

     /**
	 * Mimics `document.evaluate`, which takes an XPath string and returns the
	 * specified element(s).  This is a simplified version, implementing a
	 * simple case and only returning a single element.
	 *
	 * @param  {string} xpath
	 * @return {HTMLElement}
	 */
    evaluate(xpath) {
        if (xpath.charAt(0) !== '/') {
            console.error('invalid XPath string');
            return;
        }

        let elem = this;
        xpath.substr(1).split('/').forEach((path) => {
            const m = path.match(this._RE_XPATH);
            const tag = m[1];
            const idx = m[2];
            let elems;
            elems = elem.children.filter(child => child.tag === tag);
            if (!idx && elems.length > 1) {
                console.error('invalid XPath string; no index specified for multiple elements');
                return;
            }
            elem = idx ? elems[idx - 1] : elems[0];
        }, this);

        return elem;
    }
    _RE_XPATH: RegExp = /(\w+)(?:\[(\d+)\])?/
}
