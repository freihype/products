### bugs : DeliteWidget: _getchildren::getWidget : creates 'span' elements'!
 
### Sharing context: 

    xideve/manager/ContextManager::onContextLoaded
    

### XBlox - Tab for Scenes

Created at
1.xideve/views/VisualEditor::onSceneBlocksLoaded ( called by ContextManager::onContextReady )
2. forwards to PageEditor::onSceneBlocksLoaded

### VE-XBlox-Editor

#### Structure - Visual

***Widget-Selected***

Shows blocks per widget, one tab per Block-Group: Event(On-Click/OnLoad)

***No Widget-Selected***

Shows blocks per body-node, one tab per Block-Group: Event(On-Click/OnLoad)

#### Structure - Data

1:n Blocks as before
1:1 Block:Group-String, as before

As widgets may dont have a id or unique CSS class, we do attach blocks to a widget 
by extending the widget's common properties for 'blockGroup', therefore allowing us
to target multiple widgets.


 
#### Required Implementations

davinci/ve/widgets/WidgetsToolbar : for Block-Group-Id = Done!

xideve/views/VisualEditor::onWidgetSelectionChanged -> 

    xideve/views/BlocksFileEditor::onWidgetSelectionChanged
    



#### Extensions for BlocksFileEditor

1. Must listen to 'Widget Selected' and then rebuild all Block-Tabs

2. Add a 'Plus' Tab-Button which offers the creation of a new Block-Group (per Event)

    This might be solved in the tab container
    
    


### CSS

Currently:

1. _ContextDocument::_setSourceData {styleSheets['delite_table.css']}
2. _setHeader::->this.loadStyleSheet {styleSheets['delite_table.css']}

3. loadStyleSheets(url):
     
        var newLink = domConstruct.create('link', {
            rel: 'stylesheet',
            type: 'text/css',
            href: url
        });


**The Content Stylesheet **
 
 is being loaded Context::activate2 whereby:
 
 this._contentStyleSheet = require.toUrl("davinci/ve/resources/content.css");
 
 is happening at Context::Constructor!




### Visual - Outline 

davinci/ve/VisualEditorOutline.js

xideve/views/VisualEditor
    
    1:1 xideve/views/OutlineView
        outlineTree: davinci/ui/widgets/OutlineTree
        outlineProvider: editor.getOutline() (from davinci/ve/PageEditor.js returns davinci/ve/VisualEditorOutline")
        outlineProvider: this.outlineModel = this.outlineProvider.getModel(this.currentEditor);


davinci/ve/VisualEditorOutline (ctr as part of outlineview::provider)
- getLabel | getIconClass
- getChildren
- mayHaveChildren

_ToggleTreeNode.js as part of OutlineTRee




### Dropping device variable


Assumptions:

- the dragged block is a custom HTML element <x-script> which maps to xblox/RunScript


#### RunScript members

- 2way Binding
- Target Event : click
- Source Event : onDriverVariableChanged
- Source Event Value Path : item.value
- Source Event Name Path : item.title
- Target Variable: Volume


**Possible Actions (Smart-Input-Dialog)**

#### Set property (One Way)

data

- "Target Property" (an object path), ie: this['label']
- "Target Property Transform Expression": not possible since ve doesnt preserve child nodes

## Wizard Page 1

Select Mode:


### Thoughts about states


1. Delite - Widget must be extended for a data container, holding 'state'

2. a state consists out of:

- style - string (as maximum)
- css class prefix
- a css portion

3. storage possibilities

3.1 as child node(s)
    
    
    <d-button>
    
        <x-state name="test">
            
            <x-prop type="style" value="asdfasdfasdF"/>
            
            <x-prop type="css">
                .cssdf
                
            </x-prop type="css">
            
            <x-prop type="js">
                code
            <x-prop type="js"/>
            
        </x-state>    
        
    </d-button>

4. Management and lifecycle

scenarios:

Functions to implement
- add 
- edit
- remove
- activate
- deactivate

