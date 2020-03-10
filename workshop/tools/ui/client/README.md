## KPI - Test App for BigTest

### Brief Summary

- this is a simple React/Typescript application from a standard boilerplate, providing standard npm run commands, eg: start & build
- this application is consumed as iframe by the BigTest [session recorder KPI test](file:///~/dev/cluster/bigtest/bigtest.server/src/bigtest/java/com/compuware/apm/bigtest/kpi/jsagent/JSAgentSessionRecorderKPITest.java)

- it can be used stand-alone for the development of the session recorder

### Overview & Flow

![Overview](./docs/overview.png)

1. The BigTest - KPI tests consists out of a Java file which then runs a JSP page. This very Java file runs currently 2 KPI tests, specified via url parameter, eg: kpi.jsp?test=AgentTime
2. The JSP page then loads this application via iframe and uses URL parameters to select the KPIs to run, as well other paramaters to set certain behaviour as 'autoRun'
3. After this KPI application did run the tests, it sends the results back to the JSP (kpi.js) which then forwards the results back to BigTest framework
4. the kpi.js Javascript file uses a library called postmate which enables iframe messaging between this app and the JSP page.
5. The actual validation of the test results happens in kpi.js

### The KPI test validation in kpi.js

Currently we have 2 basic KPIs in place: AgentTime & AgentMemory. (Both currently run only under Chrome). All KPIs will be validated as follow : 

1. Run KPI - test **without** agent and store result
2. Run KPI - test **with** agent and store result
3. Compare results and return true if the difference doesn't exceed the budget (threshold). If does exceed the budget, it reports it as a failed test back to JSP

### Involved files and locations

**Cluster** : ~/dev/cluster/bigtest/bigtest.server/src/bigtest/java/com/compuware/apm/bigtest/kpi/jsagent/JSAgentSessionRecorderKPITest.java

**JSP and kpi.js** :
~/dev/js-agent-world/com.compuware.apm.testapps.jsagentworld.tests/src/main/webapp/testframework/tests/plugin/sessionrecorder/kpi.jsp

### Usage stand-alone

#### Installation

```js
    # git clone this repo && yarn && yarn start
```

#### Run in browser

Open in browser : http://localhost:8081/?view=kpi&selected=AgentTime&dryRun=true&bigTest=true&profile=tiny

- This will select the AgentTime KPI
- bigTest = true will auto run the KPI
- dryRun = true will make a dry run of the KPI (needed to warm up JIT)
- profile = tiny (there is tiny, small, medium) will select the KPIs profile. Currently this is the amount of HTML content to process

### Usage big-test development

1. Update this sources
2. Run yarn build
3. Run ./gradlew publishToMavenLocal -x generateAngular2 in js-agent-world
4. Re-run BigTest with `com.compuware.apm.bigtest.kpi.jsagent.JSAgentSessionRecorderKPITest`

Alternativly: use Tomcat which serves the kpi.jsp. See [here](https://dev-wiki.dynatrace.org/pages/viewpage.action?spaceKey=DEV&title=JSAgentWorld) for more.

### NPM commands

- **build** : yarn build

- **start** : standard web pack dev server with HMR


### References 

- [Wiki JS-Agent-World](https://dev-wiki.dynatrace.org/display/DEV/JSAgentWorld)
- [JS-Agent-World Repo](https://bitbucket.lab.dynatrace.org/projects/TAPP/repos/js-agent-world/browse)

