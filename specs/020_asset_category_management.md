---
status: completed
---

# Asset Category Management

we need to modify the category management component to support the ability to additionally manage asset buckets as well as categories. categories may contain other categories as children, or asset buckets.


## tasks
* create a new menu item called 'asset management', and a new page for it.
* create a new AssetCategooryManagementPanel instance on that page
* modify the category management and tree control to support the concept of two node types: 'category' and 'asest bucket'. based on the nature of a node, we can eliminate the need to pass in titles and update the reference names based on the type. the tree component will now just acccept an single argument for 'editable' which will enable the ability to edit
* right click operations will display options to add, delete, or modify based on the nature of the node.
* accept an count attribute for nodes representing asset buckets representing the number of assets contained within a given asset bucket. the display label for asset buckets willl append the new count attribute for each node representing an asset bucket. for example the category 'animals' that contains a 'cats' and 'dogs' asset bucket might look as follows:

animals
	-- cats (0)
	-- dogs (234)

* add icons for each node that allow the user to distinguish the nature of the node (either category or asset bucket)