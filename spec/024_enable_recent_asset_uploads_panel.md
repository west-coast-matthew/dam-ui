status: completed

# 024 — enable recent asset uploads panel

## Summary
We need to introduce a new panel on the asset management page that displays summary information for recent upload operations. We can filter by category and recent time window. We default to last 24 hours. The spec for the API project contains a new dto object that represents the payload.

The initial screen should provide high-level summary data. So given the category structure:

```
food
	chinese
	thai
	american
		bbq
art
	graffitti
	fine art

```

If food->american->bbq experienced 2 upload operations in the last 24 hours, we would display:

food->american->bbq (500), which would expand the individual upload events upon click.


If we need to modify the API project, pause and prompt me to continue so I can create a new spec and branch.