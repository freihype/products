---
title: Howtos
layout: default
permalink: /howtos/
toc: true
sidebar:
  nav: "docs"
---

<div class="container-fluid">

<h1>General</h1>

<h3>Extrusion</h3>

<div class="ty-vendor-plans">
{% for doc in site.howto %}
  {% if doc.category == "extrusion" %}
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
