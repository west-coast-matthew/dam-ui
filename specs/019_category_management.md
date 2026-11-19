---
status: ready
---

# Category Management


we need to support the ability to manage categories. 

the relationship between categories is an hierachy, where a category may constain sub categories. it makes sense to present these in a tree control

# the category management component (CategyManagementPanel)

we need to use the new tree component to present data. we need to support the ability to manage categories via this control. edit operations will be performed within the context of a single transaction, where a changes are saved in bulk via a save button, we also need an cta button which will allow use to cancel any pending changes

## tasks
* create a mock service to locate categories for the selected current workspace. as with other mock services, mock a 3-5 second deplay
* use useQuery in the new component to call the mock service
* modify the tree control to reflect the loading component until the property is updated with data returned from the service
* modify the tree component to support an optional ability right click to add a new child category for an existing node. this property will need to accept the popup menu item as well. for this instance it would read 'new category'
* add a new menu item to the left called 'categories' which will link to a new page featuring the new CategyManagementPanel 
* the act of perfoming an 'add' operation will present a popup model which will collect a title and optional description
* in a similar manner, implement the ability to accept on the tree component to perform an delete operation, with a custom message for the menu item called 'delete category', which should prompt for the destructive operation
* add an optional property that will support the ability to drap and drop nodes which will be used to modify the tree structure

