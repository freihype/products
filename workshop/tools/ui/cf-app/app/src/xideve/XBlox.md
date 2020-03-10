### XBlox - Tab for Scenes

Created at
1.xideve/views/VisualEditor::onSceneBlocksLoaded ( called by ContextManager::onContextReady )
2. forwards to PageEditor::onSceneBlocksLoaded

### Scene Blox - Activation/Run 

***The trace***

1. Blox @ loading: xideve/views/VisualEditor::onSceneBlocksLoaded ( called by ContextManager::onContextReady )
2. at this point, 'widgets' should be fully loaded and their _targetBlock should be ready

***Modes***

1. There is IDE mode
2. There is run-time mode

***Algorithm***

Entry : xideve/manager/ContextManager::onSceneBlocksLoaded(evt) where evt is a struct:
        
        {
            context: context,
            appContext: appContext,
            appSettings: appSettings,
            ctx: thiz.ctx,
            global: global,
            document: doc,
            blockScopes: scopes
        };

other useful places:

    context.widgetHash contains all registered widgets

Pseudo: 
    
    each(scope in scopes)
        each(block in scope)
            let widget : getWidget(block)
                wire(widget,block)

***Extra required impl. in IDE mode ***

- unwire widget
- rewire widget


