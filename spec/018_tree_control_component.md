---
status: completed
---

# Tree Control Component

we need to establish a tree control component to display entities that have a hierarchy. 
this component should accept a generic structure as a parameter as an property, so it performs no interaction internally, and instead the act of retrieving data is delegated to the parent component. event handlers for events such as node selection are passed in as event handlers.

the json structure passed in representing the data will contain an id, display label, and optional description, which will appear upon a node mouseover.

the component will optionaly allow the user to edit labels in line. 

by default the first level should be displayed, with the rest collapsed. scrool support functionality should be implemented. users should have the ability to expand and drill through the tree structure.

the component will accept an optional property which will allow the user to performa. right click operation, and elect to expand the selected node and all children.

## component properties
* json structure representing the tree
* event handler for label editing, if present then we support the ability to inline edit labels
* node selection event handler 
* flags to override default state and 'expand all'
* optional flag to enable the expansion of a selected node and all children

## tasks
* create a new TreeControlComponent
* create a new mock page for customer components, and add this new component definition to it for demonstration purposes.