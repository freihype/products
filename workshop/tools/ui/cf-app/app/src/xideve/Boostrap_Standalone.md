Checkpoint 1. domReady
Checkpoint 2. bootx
Checkpoint 3. xapp/boot ready
                bootStrap.load().then(function () {
                console.log('   Checkpoint 3.1 xapp/boot load()');
                    bootStrap.start(settings).then(function (ctx) {
                    
boot.js:68 load xapp/boot deps
Checkpoint 3.1 xapp/boot load()
Checkpoint 3.3 xapp/boot->start : delite/register->parse
Checkpoint 4.1 xapp/boot->start : construct managers, init managers
Application.js:84 xapp/Application::start  Object {delegate: null}
Application.js:88 Checkpoint 5 xapp/manager/Application->start, load xblox
Application.js:91    Checkpoint 5.1 xblox component loaded

index.php? 5.2 xapp/boot start
 
index.php? Checkpoint 6. all dependencies loaded
Context.js:487 Checkpoint 7. xapp/manager->init(settings)
Context.js:544 drivers loaded
Context.js:455 Checkpoint 8. xapp/manager->onReady
Context.js:479 - app ready Object {pluginManager: i, application: Object, settings: Object, __events: Object, blockManager: i…}
Context.js:414    Checkpoint 8.1. xapp/manager/context->xblox files loaded
Context.js:396 onSceneBlocksLoaded, wire scope! [i]
Context.js:281 wire scope
Context.js:356 wire scope :  ["On Load"]
Context.js:414    Checkpoint 8.1. xapp/manager/context->xblox files loaded
Context.js:396 onSceneBlocksLoaded, wire scope! [i]
Context.js:281 wire scope
Context.js:356 wire scope :  ["On Load"]
DeviceManager.js:995 connect devices
instance ready!

