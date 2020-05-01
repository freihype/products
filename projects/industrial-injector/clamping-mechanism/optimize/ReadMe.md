# Clamping mechanism optimization


![5 point double toggle clamping mechanism](https://github.com/plastic-hub/products/blob/master/projects/industrial-injector/clamping-mechanism/optimize/double-toggle-clamping-mechanism.png)

To analyse and optimize the link lengths of a 5 point double toggle clamping mechanism, a genetic algorithm can be used.

A machine learning tool to visualise and execute this process is proposed herein

Objective: To dynamicaly model and visualize a 5 point double toggle mechanism based on user input dimensions and to calculate optimum link lengths for given combinations of parameters



Language: Python - Anaconda distribution (which includes lots of modules and jupyter notebooks)

Development environment: [Jupyter notebooks](https://jupyter.org/)

Presentation: Standalone web-based app via Jupiter notebooks Viola


## Dependent modules:

### sklearn

classical machine learning algorithms and scientific Python packages: (numpy, scipy, sympy, matplotlib).
    
- [numpy](https://github.com/numpy/numpy) -  library for the Python programming language, adding support for large, multi-dimensional arrays and matrices, along with a large collection of high-level mathematical functions to operate on these arrays

- [scipy](https://github.com/scipy/scipy) -  contains modules for [optimization](https://docs.scipy.org/doc/scipy/reference/optimize.html), linear algebra, integration, interpolation, special functions, FFT, signal and image processing, ODE solvers and other tasks

- [sympy](https://github.com/sympy/sympy) -library for symbolic mathematics- algebra system (CAS). Includes galgebra and LaTeX for algebraic expressions in symbolic form, [PyDy](https://github.com/pydy/pydy) multibody dynamics library; and Cadabra - Tensor algebra. Depends on mpmath.

- [matplotLib](https://github.com/matplotlib/matplotlib) - visualization - plotter (matplotlib.pyplot), animation (matplotlib.animation)


[Cheat sheet for matplotlib](https://s3.amazonaws.com/assets.datacamp.com/blog_assets/Python_Matplotlib_Cheat_Sheet.pdf)


## Candidate modules


[Pyslvs](https://github.com/KmolYuan/Pyslvs-UI) - planar linkage mechanism simulation and mechanical synthesis system

[Mechplot](https://github.com/jlblancoc/mechplot) - MATLAB plotter for mechanisms - adapt?

[SciPy Differential evolution](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.differential_evolution.html)

[Tensorflow](https://github.com/tensorflow/tensorflow) - machine learning

[SolveSpace](http://solvespace.com/index.pl) -Parametric 2D and 3D modelling for CAD


## Research

[Example of Four Bar Mechanism with PyDy](https://github.com/pydy/pydy/blob/master/examples/four_bar_linkage/four_bar_linkage_with_motion_constrained_link.ipynb)

[Mechanism as an object](http://firsttimeprogrammer.blogspot.com/2015/02/crankshaft-connecting-rod-and-piston.html)

[Machine learning in Python step by step](https://machinelearningmastery.com/machine-learning-in-python-step-by-step/)

[Evolutionary Algorithm for the Theo Jansen Walking Mechanism](https://stackoverflow.com/questions/6573415/evolutionary-algorithm-for-the-theo-jansen-walking-mechanism)

[Setting up for mechanical engineering in Python](https://andypi.co.uk/2018/08/14/python-for-mechanical-engineers-rail-brake-distance-calculations/)

Another [Simple 4 bar toggle linkage with matplotlib](https://github.com/Rod-Persky/Simple-Four-Bar)

[Rigid Body Dynamics with SymPy (Full Lecture)](https://www.youtube.com/watch?v=r4piIKV4sDw)



## Reference

[Key Design Parameters and Optimisation approach (Academic paper, free pdf download)](https://link.springer.com/article/10.1007/s12008-014-0245-0?shared-article-renderer)

[Optimisation approach for synthesis of 5 point double toggle mechanism- (Academic Paper- paywall)](https://link.springer.com/article/10.1007/s12008-014-0245-0?shared-article-renderer)

[Study on improvements of the five-point double-toggle mould clamping mechanism (Academic paper- free pdf download)](Study on improvements of the five-point double-toggle mould clamping mechanism)

[Linkages in Python- study](https://x.st/linkages/)

[Linkages web app](https://x.st/linkages/web/)



### Create development environment:

Download and install Anaconda (includes Python)

Open Anaconda, create a new environment, then in the Home tab open Jupyter Notebooks. Finally open a new notebook which opens in your web browser.
Note- I had to [download SQLite](https://www.sqlite.org/download.html) and place it in the DLLs folder to get Notebooks to run

## Flow


Intialize environment and display -GUI display and input for variables; Plot standard 5 point double toggle mechanism; set governing equations

  
- Step 1. Input the machine specifications and constraints (desired input/output ratio, force, stroke length, fitness value etc)

- Step 2. Generate an initial population and evaluate the goal function('fitness value'). A binary population is generated randomly. It must be transferred into real numbers before the goal function is calculated. 

- Step 3. Perform coding and decoding. (Binary)

- Step 4. Perform reproduction.  The chromosome is reproduced in the next generation based on the value of its goal function. A greater value of the goal function corresponds to a larger area of the roulette wheel associated with the chromosome, and a greater probability of reproduction of the chromosome.

- Step 5. Perform crossover. These two chromosomes, which are randomly selected from the reproduced chromosomes,
exchange their genes with each other. 

- Step 6. Perform mutation. Mutation is a process by which a binary population is randomly, and the characteristic, which is
the selected binary population, is randomly changed from 0 to 1, or from 1 to 0. 

- Step 7. Define the stopping rule. Since the GA follows the uninterrupted competition and propagation unless a stopping
rule is activated, a stopping rule terminates the calculation when the goal function meets a set level. If the stopping rule
is not satisfied, repeat Step 3. Display outcomes in GUI with optimized dimensions


Some of these functions can be handled by sklearn, but others could be done with Tensorflow??
