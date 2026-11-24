status: completed

# 023 — implement basic asset management

We need to add UI elements in order to manage assets. This is for both single and bulk upload operations.

We will start by creating the new component AssetEntryPanelComponent and adding that to the asset page.


The new control will feature two columns initially: the left will be a tree displaying the current category structure, the rightmost column will feature a drag and drop area for files, and standard input fields for an asset (title, description). A confirmation panel should swipe in after the cta button 'continue' where the user can review and provide a final confirmation before the action proceeds.

We need to create a new component to represent an 'awaiting response' state, almost similar to the current loading component. This will be used when a call is submitted, which is the case here, especially when performing large uploads.

