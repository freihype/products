# Industrial Scale Injector


## Introduction

It is percieved that in the future there will be a demand for larger scale injection machines designed exclusively for 

recycled plastic. The current (v4) Precious Plastic machines approach a small industrial scale, but to reach a profitable 

production rate for injected products, a bigger, automated machine will be required.


One of the most popular products in the PP catalogue is the Brick. This is currently produced using the v4 extruder into a 

removable mould. Relatively high production rates can theoretically be achieved using multiple moulds, but the process of 

switching moulds over and demoulding the product is labour intensive, meaning that the production cost per product remains 

high.



## Objective

It is proposed that an open-source design should be developed for a large scale injection machine, based on industrial 

principles, which is capable of producing items as large as the brick at high speed with full automation. The development of this project is described herein.


## Baseline Criteria

- Should be able to use 100% recycled HDPE shred as feedstock

- Should be able to produce products roughly equal in size and volume to the PP Brick
 
-- 200x100x150mm 

-- 1kg shot size


- Should produce such a product fully automatically at a profitable rate: Suggested 45 per hour countinuously

- Should be affordable as a community investment and possible to build with a standard machine shop toolset




## Industrial injection machines - existing design principles

Industrial injection machines commonly feature certain design elements which have not yet been fully explored by the PP 

movement. Most importantly these are:

- Hydraulic actuation

- 5 point double toggle clamping

- Heavy duty moulds with cooling and ejection

- Injection screw with Checking Ring set


## Injection machine mechanical overview

[Video - Industrial Injection Machine](https://www.youtube.com/watch?v=a8HQG2PUPik)

Schematics:

- to be added

## Sizing the Machine

### Clamping Force

Machines of this size are measured by tonnage of Clamping Force.

Clamping force refers to the force applied to a mold by the clamping unit. In order to keep the mold closed, this force must oppose the separating force, caused by the injection of molten plastic into the mold. 

The required clamping force can be calculated primarily from the **cavity pressure** inside the mold and the **shot projected area**, on which this pressure is acting.

### Cavity Pressure

HDPE typically requires a cavity pressure of around 800psi at an average wall thickness of 1mm. This is considered to be a sensible minimum wall thickness for recylced products of this size.

### Shot Projected Area

The shot projected area is the cross sectional area occupied by the part, including its runner. For example, our Brick might have a shot area of 10cmx20cm = 200cm2

![Shot area](https://i.pinimg.com/originals/45/93/67/4593679418e8e5e12db66ce29e9bb644.png)


The other variables that affect the clamping force calculation are the **Melt Flow** and the **Depth** of the part.

### Melt Flow

Plastic resins are rated according to their viscosity, and their flow rating is expressed as a Melt Flow Rating (MFR), or Melt Flow Index (MFI). In our case, the Melt Flow Index of 100% recycled HDPE is reported to be approximately 5g/10min, which is slightly higher than virgin HDPE granules (1.4g/10min) but still considered a High FLow material, so for estimation purposes we will use a factor of 1.

### Depth of Part

If the depth of the part is greater than 1 inch, we need to increase the clamping force calculation by 10% or every further inch. So, for a part with a total depth of 150mm ~6 inches, we need to add 50% to our calculation.


## Clamping Force Calculation

The required mold clamping force of a mold can be calculated using the following equation.

F = p×A/1000, 

where, F: Required mold clamping force (tf), p: pressure inside the cavity (kgf/cm2), and A: total projection area (cm2)

Therefore for in our case, assuming a mould pressure of 800psi or 56.2456kgf/cm2 (the bottom end of the pressure range)

F = 56.2456x200/1000 =112.4912 tf

Factoring in the additional 50% for the part depths gives 168.7368 tf. 

Allowing a safety factor of approximately 1.5, a **250 ton** machine should be chosen. 


## Mould Opening Stroke

The other significant specification of an injection machine is the Mould Opening Stroke.

The length of stroke required by the moving platten must be at least 3x the depth of the part in order to allow ejection. 

In our case, 150mm x 3 = **450mm**


Together, the required Clamping Force and Mould Opening Stroke dictate the geometry of the Clamping Mechanism. The Mechanical Advantage of the clamping mechanism can be calculated as a ratio. Then the appropriate hydraulic cylinder and power unit can be sized.

## Sizing- Summary

To inject an object similar in size and volume to the PP Brick, an injection machine would require a **clamping force of 250 tons and a mould opening stroke of 450mm**

These will form the basis of the development going forward.

---

# Injection Machine Parts

![Moulding Machine Parts](https://github.com/plastic-hub/products/blob/master/projects/industrial-injector/The-main-components-of-injection-molding-machine.png.jpg)

[Clamping Mechanism] and [Clamping Hydraulic Cylinder]

[Platens] and [Tie Rods]

[Injector Screw and Barrel]

[Screw Drive Mechanism]

[Injection Hydraulics]

[Hydraulic Power Unit]

[Control Unit] and [Electrical System]



