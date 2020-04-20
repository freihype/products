## Hydraulic Power Pack

# Injection Machine Calculations

Clamping force is often calculated in four ways:

### Empirical Formula 1

Clamping force (T) = clamping force constant Kp * product projected area S (CM * CM)

Kp experience value:

PS/PE/PP - 0.32;

ABS - 0.30~0.48;

PA - 0.64~0.72;

POM - 0.64~0.72;

Add glass fiber - 0.64~0.72;

Other engineering plastics - 0.64~0.8;


**For example, a product has a projected area of 410 cm2 and material is PE, calculate clamping force.

Calculated by above formula: P = Kp * S = 0.32 * 410 = 131.2 (T), 150T machine tool should be selected.**




### Empirical Formula 2

350bar*S(cm^2)/1000.

As above, 350*410/1000=143.5T, choose 150T machine.

Above two methods are coarse calculation methods, following are more accurate calculation methods.

Two important factors in calculating clamping force:

1. Projected area (S) is the largest area viewed along mold opening and closing.

2. Determination of cavity pressure (P)

Cavity pressure is affected by following factors

(1) Number and location of gates

(2) Gate size

(3) Wall thickness of product

(4) Viscosity characteristics of plastics used

(5) Injection speed


3.1 Grouping of thermoplastic flow characteristics

Group 1: GPPS HIPS TPS PE-LD PE-LLD PE-MD PE-HD PP-H PP-CO PP-EPDM
Group 2: PA6 PA66 PA11/12 PBT PETP
Group 3: CA CAB CAP CP EVA PEEL PUR/TPU PPVC
Group 4: ABS AAS/ASA SAN MBS PPS PPO-M BDS POM
Group 5: PMMA PC/ABS PC/PBT
Group 6: PC PES PSU PEI PEEK UPVC


3.2 Viscosity grade
Each of above groups of plastics has a viscosity (flow capacity) rating. Relative viscosity grades of each group of plastics are as follows:
Group multiplication constant (K)
Group 1 * 1.0
Group 2 * 1.3～1.35
Group 3 * 1.35～1.45
Group 4 * 1.45～1.55
Group 5 * 1.55～1.70
Group 6 * 1.70～1.90


3.3 Cavity pressure is determined by ratio of wall thickness, flow to wall thickness

Look up table P0•P=P0•K (multiplication constant)


3.4 Determination of clamping force (F)
F=P•S= P0•K•S
For example, part: calculation of clamping force of polycarbonate (PC) lamp holder
As shown in figure is a round PC plastic lamp holder with outer diameter of 220mm, wall thickness range of 1.9-2.1mm, and pin-type center gate design. The longest process for parts is 200mm.
Place where flow resistance of melt is the largest occurs at position where wall thickness is thinnest (1.9 mm), so value of 1.9 mm should be used when calculating required injection pressure.

    Process / wall thickness ratio calculation

Process / wall thickness = longest melt process / thinnest part wall thickness = 200mm / 1.9mm = 105:1

    Application of cavity pressure/wall thickness curve

Relationship between cavity pressure and wall thickness, process/wall thickness ratio is provided. It can be seen from figure that cavity thickness of 1.9mm, cavity pressure of flow/wall thickness ratio of 105:1 is 160Bar. Data is applied to the first group of plastics. For other groups of plastics, we should multiply corresponding multiplication constant K.

    Determination of cavity pressure value of PC

Flow properties of PC belong to viscosity class of sixth group. Compared with the first group, viscosity of PC is 1.7-1.9 times of that, different viscosities are reflected in cavity pressure, so cavity pressure of PC lamp holder should be 160 bar*K (the viscosity grade of PC). P = 160*1.9 bar = 304 bar for safety reasons, we take 1.9 times.

    Projection area value of PC lamp holder

S = π*lamp holder outer diameter 2 / 4 = 3.14* 22*22 / 4 (cm2) = 380cm2

    Clamping force of PC lamp holder

F=P•S=304bar•380cm2=304kg/cm2•380 cm2=115520Kg or 115.5Ton, so 120T can be used.


### Calculated using CAE software (MOLDFLOW, etc.).

Main basis for classification of injection molding machines is clamping force. It is true that large machine has a large clamping force and small machine has a small clamping force. This is traditional idea. It seems that clamping force is main indicator for measuring size of machine. However, as market becomes more and more subdivided, clamping force of machine cannot fully evaluate size of machine, and more and more special machines are beginning to appear.
For example, when I produce thick-walled products, I need a large amount of melt glue and a small clamping force. This is different from design idea of traditional machine. Rigidity of equipment board can be low and clamping force can be small, screw can be thick, screw can be deep, mold opening distance is large, opening and closing speed is slow.
However, when I use thin-walled products, I need high clamping force, a small amount of melting glue, a small opening distance, and a short cycle time. At this time, design is different, rigidity of equipment board is high, clamping force should be high, screw should be small, mold opening distance should be small, opening and closing distance should be fast.
For example, when I made PVC, PA, PS products, screw design has its own characteristics. Production of precision products is very demanding on repeatability of equipment.
Therefore, clamping force is main parameter to measure machine, but when evaluating a machine, it is necessary to look at comprehensive evaluation of other parameters.
