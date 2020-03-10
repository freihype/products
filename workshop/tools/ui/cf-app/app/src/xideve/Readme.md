### Widget Creation


### Smart Input Activation

1. davinci/ve/tools/CreateTool::_select
1.2. davinci/ve/tools/SelectTool.js::onDblClick => this._context.select(widget, null, true);


### Widget Creation : Position/Size
1. davinci/ve/tools/CreateTool
2. davinci/ve/widget.js

### When coming in through Dnd: this will be the order of execution:

1. davinci/ve/tools/CreateTool::_create

        dojo.withDoc(this._context.getDocument(), function(){
            w = Widget.createWidget(this._data,this._userData,args.parent);
        }, this); 
        
2. davinci/ve/widget::createWidget(widgetData,userData,parent)

At this point the most important things happen:

- instance the wrapper widget: "DijitWidget/ObjectWidget/DeliteWidget"
- transfer args/properties to the new scene's Dom element, using userData and meta-data


### When coming in through Dnd of a xblox script onto a delite widget:

1. davinci/ve/_Widget::addChild


### When deleting xblox/RunScript 

1. davinci/ve/_Widget::addChild


### When deleting xblox/RunScript from Delite-Widget

1. davinci/ve/commands/RemoveCommand::excecute

1.1. getParent happens in davinci/ve/_Widget.js (actually "davinci.ve.DeliteWidget")
1.2. then further _ContexWidgets::detach will be called;
1.3. then parent::removeChild (delite/Button) will be called with the xblox/RunScript as child arg


xideve/manager/WidgetManager::renderBlockWidget will be called for a xblox/RunScript

Notices:

1. dragging from device onto delite seems fine
2. dragging from behaviour library seems wrong


### Modifying attributes: 

davinci/ve/_Widget

### Widget style changes: 

davinci/ve/PageEditor::_stylePropertiesChange
davinci/ve/PageEditor::_visualChanged

