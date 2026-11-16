---
status: ready
---

# Enable User Management

the user management page needs to support the ability to allow admin users to manage users. we need a list displaying users. a top level filter bar that allows us to sort by last name and creation date. additionally we need an 'add user' button.

icon links need to be located next to each user record which will enable us to toggle 'active' status. clicking on a given record will launch an modal that will display user information. clicking the edit icon record next to a record will launch an edit modal, the 'add user' action will utilize that same modal.

we need to establish a user-service service under the ./src/services folder. at this point we will emulate the API interactions for performing user operations. the page should make use of useQuery to inerface with the service. the service shoudl emaulate api calls at this time, introducing an 2-8 second random delay to mock network communication. the effort should make use of the loading and exception components which need to be consistently applied across the application.