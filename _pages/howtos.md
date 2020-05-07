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
