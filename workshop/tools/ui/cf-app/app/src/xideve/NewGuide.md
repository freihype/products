Style Change:

this.subscribe("/davinci/ui/styleValuesChange", this._stylePropertiesChange);
    davinci/ve/PageEditor.js:429
        davinci/ve/VisualEditor.js : 215

client/src/lib/davinci/ve/widgets/Cascade.js:123

Save:

_ContextInterface:onContentChange 227
    _WorkbenchMisc
        PageEditor:save
            VisualEditor:setContent
            
Save widget props:

    davinci/ve/_Widget:getData
    
Widget / SubWidget population

    davinci/ve/DeliteWidget:_getChildren

    davinci/ve/widget::getWidget()!
     
    Modify-Command : davinci/ve/widget
        _ContextWidgets:attach
            widget.attach() -> populates the actual nodes
    //srcElement.addText(node.innerHTML);

davinci/ve/_Widget:createWidget !!!!
    
Widget Creation


Outline Grid View :: getLabel

davinci/RunTime :: getSiteConfigData

davinci/ve/DeliteWidget/_getChildrenData will collect all children



________________________________________

widget prop change:
 identify: true
 
widget created from palette:
  identify: true
  no_id: true

widget copy action
    identify: false


