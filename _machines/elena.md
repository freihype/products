---
image: /pp/products/elena/media/preview.jpg
category: "injection"
title: "Arbor - injection machine - 'Elena' - Catalonia"
permalink: /machines/elena
tags :
 - v3
 - injection
categories:
  - Injection
  - Machines
sidebar: 
   nav: "machines"
---


<ul class="nav nav-tabs" id="myTab" role="tablist">
  <li class="nav-item">
    <a class="nav-link active" id="overview-tab" data-toggle="tab" href="#overview" role="tab" aria-controls="overview" aria-selected="true">Overview</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" id="build-tab" data-toggle="tab" href="#build" role="tab" aria-controls="build" aria-selected="false">Build</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" id="resources-tab" data-toggle="tab" href="#resources" role="tab" aria-controls="resources" aria-selected="false">Resources</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" id="howtos-tab" data-toggle="tab" href="#howtos" role="tab" aria-controls="howtos" aria-selected="false">Howtos</a>
  </li>

  <li class="nav-item">
    <a class="nav-link" id="media-tab" data-toggle="tab" href="#media" role="tab" aria-controls="media" aria-selected="false">Media</a>
  </li>

  <li class="nav-item">
    <a class="nav-link" id="media-tab" data-toggle="tab" href="#discussion" role="tab" aria-controls="media" aria-selected="false">Discussion</a>
  </li>

</ul>

<div class="tab-content">
  <div class="tab-pane active" id="overview" role="tabpanel" aria-labelledby="overview-tab">
    <div>

    <a href="https://precious-plastic.org/products/products/elena/renderings/perspective.JPG">
        <img src="https://precious-plastic.org/products/products/elena/renderings/perspective.JPG" style="margin:8px; float: left;max-width:50%;max-height: 400px;" />
    </a>

    <span style="font-size: smaller; margin-top: 16px;">
        Perfect for more complicated molds and better production rates as well good quality with high precision. Easy
        to transport and ideal for a educational context and small enterprises.
    </span>

    <div style="display: table-cell;">
        <p><span id="specs" style="padding: 16px">
    <table>
        <tbody>
            <tr>
                <td>Type:
                </td>
                <td>Manual Injection
                </td>
            </tr>        
            <tr>
                <td>Version:
                </td>
                <td>1.3
                </td>
            </tr>
            <tr>
                <td> Status:
                </td>
                <td> Mature
                </td>
            </tr>
            <tr>
            <td> License
                </td>
                <td><a href="https://ohwr.org/cernohl">CERN Open Source Hardware License</a>
            </td>
            </tr>
            <tr>
            <td> Author </td>
                <td>
                 PlasticHub
                </td>
            </tr>
        </tbody>
    </table>
</span></p>

        <a href="">
            <span style="margin: 8px;" class="fa fa-download" />
        </a>
        <a href="">
            <span style="margin: 8px;" class="fa fa-play" />
        </a>
        <a href="">
            <span style="margin: 8px;" class="fa fa-question" />
        </a>

    </div>

</div>

<div style="margin: 8px;clear:both">
    
</div>

<hr />

<div style="padding:16px;text-align: center;font-size: smaller;">
    <h3>Products</h3>
    <div class="ty-vendor-plans">

        <div class="ty-grid-list__item" style="float:left;border-color: #c5c5c5;width: 200px;display: inline-block">
            <a href="https://bazar.preciousplastic.com/moulds/injection-moulds/piranha-clamp/">
                <img height="200px" src="/pp/_machines/assets/clamp.jpeg">
                <br />
                <p style="text-align: center;">Piranha Clamp</p>
            </a>
        </div>
        <div class="ty-grid-list__item" style="float:left;border-color: #c5c5c5;width: 200px;display: inline-block">
            <a href="https://bazar.preciousplastic.com/moulds/injection-moulds/water-cup-mould/">
                <img height="200px" src="/pp/_machines/assets/watercup.jpeg">
                <br />
                <p style="text-align: center;">Water Cup</p>
            </a>
        </div>
        <div class="ty-grid-list__item" style="float:left;border-color: #c5c5c5;width: 200px;display: inline-block">
            <a href="https://bazar.preciousplastic.com/moulds/injection-moulds/hair-comb/">
                <img height="200px" src="/pp/_machines/assets/comb.jpeg">
                <br />
                <p style="text-align: center;">Hair Comb</p>
            </a>
        </div>
    </div>
</div>

  </div>
  <div class="tab-pane active" id="build" role="tabpanel" aria-labelledby="build-tab">
    <h3 id="buildthemachine">Build the machine</h3>
    
  </div>
  <div class="tab-pane" id="resources" role="tabpanel" aria-labelledby="resources-tab">   
<span style="font-size:smaller">

<ul>
<li><a href="https://myhub.autodesk360.com/ue2b6df80/g/shares/SH7f1edQT22b515c761e2cc46804b9803c4c">3D Preview</a></li>
<li><a href="https://github.com/plastic-hub/products/tree/master/products/elena/drawings">Drawings</a></li>
<li><a href="https://github.com/plastic-hub/products/tree/master/products/elena/cad">CAD model</a></li>
<li><a href="https://precious-plastic.org/home/library/machines/arbor-injection-press/">Wiki</a></li>
<li><a href="https://github.com/plastic-hub/products/tree/master/products/elena/">Source files</a></li>
<li><a href="https://davehakkens.nl/community/forums/topic/arbor-press-v14/">Forum</a></li>
<li><a href="https://discord.gg/SN6MT5N">Discord Chat</a></li>
<li><a href="https://precious-plastic.org/products/products/elena/electrics/wiring.png">Electrical wiring</a></li>
</ul>

</span>
  </div>
  <div class="tab-pane" id="howtos" role="tabpanel" aria-labelledby="howtos-tab">
    <h4 id="machinebuilderhowtos">Machine builder howtos</h4>
<div class="ty-vendor-plans">
{% for doc in site.howto %}
  {% if doc.category == "arborinjection" %}
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
  <div class="tab-pane" id="media" role="tabpanel" aria-labelledby="media-tab">
    <h3 id="media">Media</h3>
  </div>

  <div class="tab-pane" id="discussion" role="tabpanel" aria-labelledby="discussion-tab">
    <div id='discourse-comments' style="min-height: 600px;"></div>
    <script type="text/javascript">
      DiscourseEmbed = { discourseUrl: 'https://forum.precious-plastic.org/',
                         discourseEmbedUrl: '{{site.url}}{{page.url}}.html' };
    
      (function() {
        var d = document.createElement('script'); d.type = 'text/javascript'; d.async = true;
        d.src = DiscourseEmbed.discourseUrl + 'javascripts/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(d);
      })();
    </script>
  </div>
</div>


