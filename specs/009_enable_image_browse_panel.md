---
status: completed
---

# Enable Image Browse Panel

We need to enable the user to browse thumbnails of assets. we support image, video, and pdf assets. we can assume that we will have an thumbnail generated for each asset type. image type assets my appear in landscape or portrait format. pintrest has a desired user experience wil will base this effort on. 

each asset thumbnail should feature 3 versions, a small version, a slightly larger version, and an medium sized preview. because of the possible nature of combintations of portrait and landscape items in a screen, we need to display all items in an flexbox type mode, not in a grid where everything is presented in an equal size grid with equaly spacing. 

# The AssetBrowsePanel component

This will be a top level component that will be embedded within a page definition. data presented in the overall component will oroginate from an API call, however we will delegate all of that interaction to the caller (page).

The layout of the component should be as follows

AssetBrowsePanel
	--> Header panel
	--> Asset display panel
	--> Footer panel

## component lifecyle

we have establishes a series of panels for loading and error states. the main asset display area should use these to indicate current state in the lifecycle

the header and footer panels should appear in a disabled state under data is present in the overall component, the middle display component should reflect the current component state (loading, error, or final state) with the common components for those states

# user interaction 
upon mouseover assset representations will assume a highlitghted border and scale at 10% awknoledging the mouover event. upon selection the component should mount an modal with the largest of the three thumbnailformats/

# external properties
the component will accept the following proerperties, essentially delegating the loading of asset data, and event handlers to that caling component. 

* title
* data (initially null upon loading)
* flags indicating if the component is loadinf, in error state, or if data is present
* event handlers for pagination events

# top filter panel
this should be it's own component. initially this will contain controls to navigation through the current pagination sets. additionall to soft by asset type, defaulting to images.

a sorting effort through be presented.

# botton filter panel
should provide the ability to navigate trough the current pagination set. this should be it's own component


# generatic asset structure


## Tasks
1. Create the top level AssetBrowsePanel component, and all related sub components. These will be created under a parent folder under the top level component's name
2. create a page under the mock section to create an instance of the component, mock the data passed to it and pass in all event handlers. the event handles at this point should just perform console log operations.
3. create a series of grey and black asset thumbnails for the data in both landscape and porttrait formats.

