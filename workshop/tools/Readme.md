# Overview

This is the UI for the factory. It's here to create documentation for processes, assist research, and stream-line small scale production.

Internally this is using templates and generates forms from it. After filling out forms, the data is being saved in Markdown files.
The user can add, modify those templates on system level(admin).

## Template features

1. Expressions (js or custom filtrex/bison based)
2. Shortcodes
2.1 file-ref -> file-picker (support folders), should support various VFSs as github, dropbox, google drive...
2.2 ext-ref -> link picker (support internal pages) 
2.3 table-ref -> table picker/wizard (support templates, inline or ref renderer), should support any data formats, CSV, google sheets,...
2.4 image-ref -> image picker (based on file picker just with extension-mask ), @TODO : re-add image editors
2.5 todo-ref -> ext service picker
2.6 person-ref -> people picker (support google accounts)
2.7 template-ref -> template pciker (inline or as ref)

## 3. Formats
3.1 all supported by https://www.11ty.io/docs/languages/

## 4. Reporting tools
4.1. @TODO : re-investigate : https://opensource.com/business/16/6/top-business-intelligence-reporting-tools

## 5. Storage

- internal user data base : sqlite via TypeORM
- anyting else : json, template & markdown files

## UI

Layout :
1. left - nav - panel
2. main panel (multi-tab)
3. right - property - panel
4. bottom : status messages & notifications

## Tech - stack
