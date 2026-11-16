---
status: ready
---

# Application Status Component

create a new panel component called application status, it will list application dependencies, for now these will be mariadb, storage config location, storage space usage. mock the api call. storage space should also reflect total space and used percentage statuses should use color coding (red or green) to indicate health, exception for the storage space, which will turn yellow when 80% thredhold is met. this will need to live on the main application dashboard.