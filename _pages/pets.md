---
title: Pets
layout: default
permalink: /pets/
---
<div class="ty-vendor-plans">
{% for animal in site.howto %}
<div class="ty-grid-list__item">
    <span class="image" >
      <img width="300px" src="{{ animal.image }}" alt="" />
    </span>
    <header class="major">
      <h3><a href="{{ animal.url  | relative_url }}" class="link">{{ animal.title }}</a></h3>
      <p>{{ animal.title }}</p>
    </header>
<div>
  {% endfor %}
</div>

