# Clamping Mechanism

High tonnage machines, such as is proposed, cannot operate with a simple in-line hydraulic cylinder, so a toggle mechanism is used.

The most efficient and reliable is the 5 point double toggle.

![Photo](https://github.com/plastic-hub/products/blob/master/projects/industrial-injector/clamping-mechanism/unname-twin-toggle-clamp.gif)



## 5 point double toggle mechanism

![Toggle clamp iso](https://github.com/plastic-hub/products/blob/master/projects/industrial-injector/clamping-mechanism/Construction-of-Clamping-Unit.jpg)

The 5 point double toggle mechanism is used on high-tonnage machines

[Video -Toggle Clamp Mechanism](https://www.youtube.com/watch?v=w0k1a_s6GWk)

![Toggle clamp diagram](https://github.com/plastic-hub/products/blob/master/projects/industrial-injector/clamping-mechanism/clamping.gif)


## Design of a clamping mechanism

The challenge of designing a high tonnage toggle clamp is to be able to calculate the ratio of input and output forces. This is called the Mechanical Advantage. This ratio allows an appropriate hydraulic cylinder and power supply to be selected.

The geometry of the 5 point clamping mechanism is complex, but can be represented algebraically. 

Mathematical modelling is discussed in the key paper, [Study on improvements of the five-point double-toggle mould clamping mechanism (2004)](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.828.9042&rep=rep1&type=pdf)

In a subsequent study, [Key design parameters and optimal design of a five-point double-toggle clamping mechanism (2011) ](https://doi.org/10.1016/j.apm.2011.03.001), an optimization approach is suggested:

In order to calculate optimum link lengths between the 5 points, the algebraic relationship may be subjected to a genetic algorithm in order to rapidly determine the most efficient link geometry for a given set of input values including clamping force and mould opening stroke.

The paper outlines the flow of a machine learning algorithm which can achieve this objective. Injection machine manufacturers appear to develop their own applications of this approach and their optimization algorithms are not in the public domain.

The algebraic relationship is very clearly laid out in the [Kinematic calculation analysis of micro injection molding machine with double-toggle clamping mechanism based on MATLAB (2012)](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.876.19&rep=rep1&type=pdf) 



## Design approaches
  
  # Copy-cat design
  
It may be possible to find an existing desgin and copy the geometry directly.

  To be added  
  
  
  # Machine Learning algorithms
  
  If no suitable design can be found to copy, we will need to determine our own optimal geometry. 
  
  This might be ahieved using a [Genetic Algorithm](https://en.wikipedia.org/wiki/Genetic_algorithm) 
  
  [Video- Genetic Algorithms (full lecture)](https://www.youtube.com/watch?v=lpD38NxTOnk) 
  
  This method will produce an optimal design through a mathematical process of evolution. This involves 'breeding' and testing large numbers of configuations of the defined variables (link lengths, in this case), requiring a large amount of computing power, but a tiny fraction of what would be require to attempt to test *all* possible confgurations ('brute force'). Machine learning has been demonstrated to be extremely effective in solving this type of complex problem involving multiple variables.
  
    
  The most promising candidate for a machine learning environment identified so far appears to be Tensorflow 2.0
  
  [TensorFlow in 5 Min](https://www.youtube.com/watch?v=2FmcHiLCwTU&list=PL2-dafEMk2A7EEME489DsI468AB0wQsMV)
  
  Tensors are higher order numbers, having more than one dimension. The relationships between link lengths in a 5 point double toggle clamping mechanism can potentially be represented as tensors.
  
  There is potential for existing Tensorflow machine learning tools to be copy/pasted and adapted for this application, as youtube hero [Suraj Raval](https://www.youtube.com/channel/UCWN3xxRkmTPmbKwht9FuE5A) has done here to [build an automated trading bot](https://www.youtube.com/watch?v=HhqhFbwiaig)
  

  
  
