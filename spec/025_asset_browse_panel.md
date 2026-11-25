status: completed

# 025 — asset browse panel

We need to add a new panel to the asset page where we enable the user to browse assets. We will need to support the ability to maximize and minimize this window, these should be icons in the panel title bar. Maximize operation will minimize/collapse the left menu (if expanded) and then that panel will assume full screen width.

This will be a tabbed panel with an initial tab named 'browse'. Browse features a tree menu for category selection, where items are displayed on the right. 

The second tab will be titled 'recents' that show most frequently recent categories based on browsing (i.e. image is viewed). Will need to track user behavior only on the client, so zustand need to come into play for local storage.

The search tab would be a third tab, which should support search operations such as date added, and image tags.

When a category, subcategory, etc. is selected we need to display the assets for that category. this will involve pagination, where the user can control the page size and position. If we need to update the api project for this, then let me know, pause and I will create a branch in that project for this effort. 

Assets are displayed as either 'list' or 'gallery'. list displays items as list items, supporting the ability to double click an item and view an asset preview via modal, and the gallery view will feature a pintrest type browse experience where the user can also click for a preview.
