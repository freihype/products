# Overview

**brief** : General overview for a PET bottle vending shredder machine

**document scope** : client, vendor, manufacturer

**version** : 0.2

**status** : design & prototyping

**license** : proprietary

## Features of the first revision

* IP55 grade housing and electronics
* sound prove
* auto - suspend/resume
* air filters & ventilation
* auto - reverse
* load capacity : 2 large PET bottles at a time
* transport wheels
* auto-shred when hopper is loaded
* LED & audio feedback
* minimal user interface
* power meter
* service & maintenance interface via USB developer port
* 2 cartridges: one big one for PET, one for the bottle caps/lids.both have wheels and a spring loaded door.
* service-door, chassie, enclosure, cartridge - open|close - sensor

### Optional features

* large touchscreen for network KPIs and shredding profiles
* key lock
* haptic buttons
* remote interface (IoT) for online metering
* plastic scanner
* bar code scanner

![](./draft.png)

|  **Component Name** | **Component Section** | **Component Price/Estimate** | **Production/Duration (hours)** | **Design/Prototyping-Duration (hours)** | **Status** | **Risk** |
| --- | --- | --- | --- | --- | --- | --- |
|  Shredder Box | Shredding | 1450 | 24 | 12 | Solved |  |
|  Coupling | Drive | 120 | 4 | 10 | Design |  |
|  Hopper | Feed | 150 | 6 | 16 | Design |  |
|  Shredder/Motor-Mounts | Framework |  |  |  | Solved |  |
|  Motor | Motor | 560 | 1 | 2 | Solved |  |
|   |  |  |  |  |  |  |
|  Chassie/Enclosure | Framework | 300 | 16 | 24 | Design |  |
|  Panels | Skinning | 200 | 5 | 10 | Solved |  |
|  Ventilation & Airfilter | Framework | 200 | 8 | 16 | Design |  |
|  Segment Joinery | Framework | 150 | 10 | 16 | Solved | Middle |
|  Cartridges | Framework | 200 | 10 | 10 | Design |  |
|  Wheels & mounts | Framework | 100 | 4 | 1 | Design | Middle |
|  Cartridge loaded Sensors | Electronics | 20 | 2 | 1 | Solved |  |
|  Chassie- Sensors | Electronics | 100 | 5 | 10 | Solved |  |
|  Motor Heat Sensors | Electronics | 30 | 2 | 2 | Solved |  |
|  Auto-Reverse | Electronics | 50 | 4 | 2 | Solved |  |
|  Feed - Sensor | Electronics | 50 | 2 | 2 | Solved |  |
|  Cartridges - Full Sensor | Electronics | 20 | 1 |  | Solved |  |
|  LED Feedback | Electronics | 100 | 3 | 5 | Not tested |  |
|  Audio Feedback | Electronics | 10 | 1 | 1 | Solved |  |
|  Suspend/Resume | Electronics | 100 | 3 | 10 | Not impl. |  |
|  Inverter | Electronics | 250 | 2 | 1 | Solved |  |
|   |  |  |  |  |  |  |
|  Control - Board / Fuses/,... | Electronics | 200 | 5 | 1 | Solved |  |
|   |  |  |  |  |  |  |
|  Sourcing,... | Logistics | 150 | 10 |  |  |  |

## References

- [Table Source](https://docs.google.com/spreadsheets/d/1SPyHnEtUMeZ_hL9212lvQF86MP4abl22_4R1H0gXtW0/edit#gid=0)

- [Components Source](https://docs.google.com/spreadsheets/d/1SPyHnEtUMeZ_hL9212lvQF86MP4abl22_4R1H0gXtW0/edit#gid=150475076&range=A1)

- [Drawings](src/components/) | [Renderings](src/renderings)

- [Firmware](src/firmware)

- [Orders](src/orders)

- [Tests](src/tests)

- [Production Parts](src/production)

- [Datasheets](./datasheets)


<hr/>

## Vendor references

[Shredder Test Videos](https://www.morrentrading.com/shredder-s/basis-shredderblok-am2018-200<br/>https://www.morrentrading.com/movies)

[Shredder Pictures](https://www.morrentrading.com/shredder-s/basis-shredderblok-am2018-20)

[Shredder Firmware](https://github.com/plastic-hub/firmware/blob/master/shredder-extrusion/README.md)

<hr/>