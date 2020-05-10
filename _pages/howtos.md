---
title: Howtos
layout: default
permalink: /howto/
breadcrumbs: true
layout : single
author: false
sidebar: 
   nav: "howto"
---

<ul class="nav nav-tabs" id="myTab" role="tablist">
  <li class="nav-item">
    <a class="nav-link active" id="home-tab" data-toggle="tab" href="#home" role="tab" aria-controls="home" aria-selected="true">Home</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" id="profile-tab" data-toggle="tab" href="#profile" role="tab" aria-controls="profile" aria-selected="false">Profile</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" id="messages-tab" data-toggle="tab" href="#messages" role="tab" aria-controls="messages" aria-selected="false">Messages</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" id="settings-tab" data-toggle="tab" href="#settings" role="tab" aria-controls="settings" aria-selected="false">Settings</a>
  </li>
</ul>

<div class="tab-content">
  <div class="tab-pane active" id="home" role="tabpanel" aria-labelledby="home-tab">...</div>
  <div class="tab-pane" id="profile" role="tabpanel" aria-labelledby="profile-tab">...</div>
  <div class="tab-pane" id="messages" role="tabpanel" aria-labelledby="messages-tab">messages</div>
  <div class="tab-pane" id="settings" role="tabpanel" aria-labelledby="settings-tab">...</div>
</div>


### General

<div class="ty-vendor-plans">
{% for doc in site.howto %}
  {% if doc.category == "general" %}
    <div class="ty-grid-list__item">
       <a href="{{ doc.url  | relative_url }}" class="link">
        <span class="image" >
          <img class="cover" src="{{ doc.image }}" alt="" />
        </span>
        <header class="major">
            {{ doc.title }}
       </header>
      </a>
    </div>
  {% endif %}
{% endfor %}
</div>

<hr/>

### Electrics
<div class="ty-vendor-plans">
{% for doc in site.howto %}
  {% if doc.category == "electric" %}
    <div class="ty-grid-list__item">
       <a href="{{ doc.url  | relative_url }}" class="link">
        <span class="image" >
          <img class="cover" src="{{ doc.image }}" alt="" />
        </span>
        <header class="major">
            {{ doc.title }}
       </header>
      </a>
    </div>
  {% endif %}
{% endfor %}
</div>

<hr/>


### Shredder
<div class="ty-vendor-plans">
{% for doc in site.howto %}
  {% if doc.category == "shredder" %}
    <div class="ty-grid-list__item">
       <a href="{{ doc.url  | relative_url }}" class="link">
        <span class="image" >
          <img class="cover" src="{{ doc.image }}" alt="" />
        </span>
        <header class="major">
            {{ doc.title }}
       </header>
      </a>
    </div>
  {% endif %}
{% endfor %}
</div>

<hr/>

### Extrusion

<div class="ty-vendor-plans">
{% for doc in site.howto %}
  {% if doc.category == "extrusion" %}
    <div class="ty-grid-list__item">
       <a href="{{ doc.url  | relative_url }}" class="link">
        <span class="image" >
          <img class="cover" src="{{ doc.image }}" alt="" />
        </span>
        <header class="major">
            {{ doc.title }}
       </header>
      </a>
    </div>
  {% endif %}
{% endfor %}
</div>

<hr/>

### Sheetpress

<div class="ty-vendor-plans">
{% for doc in site.howto %}
  {% if doc.category == "sheetpress" %}
    <div class="ty-grid-list__item">
       <a href="{{ doc.url  | relative_url }}" class="link">
        <span class="image" >
          <img class="cover" src="{{ doc.image }}" alt="" />
        </span>
        <header class="major">
            {{ doc.title }}
       </header>
      </a>
    </div>
  {% endif %}
{% endfor %}
</div>
<hr/>

### Injection

<div class="ty-vendor-plans">
{% for doc in site.howto %}
  {% if doc.category == "injection" %}
    <div class="ty-grid-list__item">
      <a href="{{ doc.url  | relative_url }}" class="link">
        <span class="image" >
          <img class="cover" src="{{ doc.image }}" alt="" />
        </span>
        <header class="major">
            {{ doc.title }}
       </header>
      </a>
    </div>
  {% endif %}
{% endfor %}
</div>
