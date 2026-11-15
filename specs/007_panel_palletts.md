---
status: ready
---

# Panel Palletts

We need to create a new page under the pages/mock directory intended for displaying variations of a new Panel control. This control will be a top level component that will act as an panel. this new page will support the ability to change theme via a drop down as well as all variations of the panel properties. 

the panel will feature the following properties
* and icon in the top right corder which allows the user to delete the panel (optional)
* an additional icon in the top right corner which allow the user to expand and collaspe the panel (optional)
* a title
* a subtitle (optional)
* a column count (optional) property of either 1,2,or 3. by defaulty the panel assumes full width of the parent container, a value of 2 implies there will be two instances of panels at the row level, etc. the parent layout should be responsive, so. defined withs are subject to screen size.
* and optional paen indicating if the panel is draggable as certain dashboards will feature the ability for the use to resize them.

example demo instance can feature the same content such as a chartjs chart and some sample metrics

the url shoud follow the previuos naming convention such as ./mockups/panels