import { CSSElement, CSSFile } from './';
import { Path } from './model/Path';

export class CSSImport extends CSSElement {
    isURL: any;
    cssFile: any;
    constructor() {
        super();
        this.elementType = 'CSSImport';
    }

    getCSSFile() {
        return this.parent;
    }

    setUrl(url) {
        this.url = url;
    }

    visit(visitor) {
        if (!visitor.visit(this)) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].visit(visitor);
            }
            if (this.cssFile) {
                this.cssFile.visit(visitor);
            }
        }
        if (visitor.endVisit) {
            visitor.endVisit(this);
        }
    }

    getText(context) {
        let s = '@import ';
        if (this.isURL) {
            s += 'url("' + this.url + '");';
        } else {
            s += '"' + this.url + '";';
        }

        return s;
    }

    close(includeImports) {
        // the return of the CSSFile model needs to happen in the import instead of the CSSFile
        // if we return it in the CSSFile close we end up returning it twice due of the visit logic
        //ximpl.
        /*
        require('davinci/model/Factory').closeModel(this.cssFile);
        if (this.connection) {
            dojo.disconnect(this.connection);
        }
        delete this.connection;
        */
    }

    load(includeImports) {
        let p = this.parent;
        while (p && !(p.url || p.fileName)) {
            p = p.parent;
        }

        let path = new Path(p.url || p.fileName);
        path = path.getParentPath().append(this.url);
        const myUrl = path.toString();
        // have to use the require or we get a circular dependency
        /*
        this.cssFile = require('davinci/model/Factory').getModel({
            url: myUrl,
            loader: this.parent.loader,
            includeImports: this.parent.includeImports || includeImports
        });
        this.cssFile.relativeURL = this.url;
        */
        //ximpl.
        //this.connection = dojo.connect(this.cssFile, 'onChange', this.parent, 'onChange');
    }
}
