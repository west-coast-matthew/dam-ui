---
status: ready
---

# New Installlation Wizard

we need a screen that will collect information for a new instance of this application. we need to collect the following:
* if this is installation if for an organization
* the name of the user or orgganization
* the name of the initial workspace (leave blank for default)
* the name of an initial catalog (optional)
* password for root user

in the final state, the application will make an api call that will determine if this is the initial time the application has been initialized, if that is the case then this new screen is presented to the user, for now we will temporarily add a menu item titled 'initialize' that will link to this.

the information should be presented in an wizard type motion. the title should be 'Initialize new installation'. the experience should feature the name of each step, and a breif 1-2 sentences for each step. additionally we need to add a sprogress indicator for each step. create a component for the progress indicator for re-use. add the new progress indicator component to the mock page that displays form controls. 

upon completion, a confirmation message should be displayed with a cta that will take you to the login screen