---
title: "Machines"
permalink: /machines/
excerpt: "Settings for configuring and customizing the theme."
toc: true
sidebar:
    nav: "docs"
---

### Injection

<div class="ty-vendor-plans">
{% for doc in site.machines %}
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

### Injection

<div class="ty-vendor-plans">
{% for doc in site.machines %}
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

