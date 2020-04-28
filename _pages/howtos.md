---
title: Howtos
layout: default
permalink: /howtos/
breadcrumbs: true
layout : single
author: false
---


<div class="">

<h1>General</h1>
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

<h3>Extrusion</h3>

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

<h3>Sheetpress</h3>

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
<h3>Injection</h3>

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

</div>
