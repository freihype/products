---
title: Howtos
layout: default
permalink: /howtos/
---

<div class="container-fluid">

<h1>General</h1>

<h1>Extrusion</h1>

<div class="ty-vendor-plans">
{% for doc in site. howto %}
  {% if doc. category == "extrusion" %}

    <div class="ty-grid-list__item">
        <span class="image" >
          <img width="300px" src="{{ doc.image }}" alt="" />
        </span>
        <header class="major">
          <h3>
            <a href="{{ doc.url  | relative_url }}" class="link">{{ doc.title }}</a>
          </h3>
        </header>
    </div>

  {% endif %}
{% endfor %}
</div>
</div>
